// ============================================================================
//  WEBHOOK DO WHATSAPP — a porta de entrada do atendimento.
//   GET  -> validação do webhook (o Meta chama uma vez pra confirmar o token).
//   POST -> chega mensagem do cliente. Fluxo:
//            1. identifica o negócio (multi-tenant) e o cliente
//            2. se for áudio, transcreve (a dona pediu: ouve áudio, responde texto)
//            3. carrega histórico -> IA responde -> envia de volta
//            4. salva a conversa; se fechou pedido, cai na fila de aprovação
//
//  Responde 200 rápido pro Meta e processa; erros não derrubam o webhook
//  (senão o Meta fica reenviando). O Meta REENVIA quando não recebe 200 a
//  tempo — por isso deduplicamos pelo id da mensagem (idempotência).
// ============================================================================

import { NextRequest, after } from "next/server";
import { responder } from "@/lib/ia/cerebro";
import { carregarTenant } from "@/lib/ia/tenant";
import { enviarTexto, baixarMidia } from "@/lib/whatsapp/api";
import { transcrever } from "@/lib/whatsapp/transcrever";
import {
  acharOuCriarCliente,
  carregarHistorico,
  salvarMensagem,
  registrarPedido,
  marcarWebhookNovo,
} from "@/lib/banco/conversas";
import { queryUm } from "@/lib/banco/db";
import crypto from "node:crypto";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// Valida a assinatura do Meta (X-Hub-Signature-256 = HMAC do corpo com o App Secret).
// Se APP_SECRET não estiver setado ainda, não bloqueia (fase inicial de setup).
function assinaturaValida(req: NextRequest, corpoBruto: string): boolean {
  if (!APP_SECRET) return true;
  const recebida = req.headers.get("x-hub-signature-256") || "";
  const esperada = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(corpoBruto).digest("hex");
  return (
    recebida.length === esperada.length &&
    crypto.timingSafeEqual(Buffer.from(recebida), Buffer.from(esperada))
  );
}

// O loop da IA (+ transcrição de áudio) pode passar de 10s. No Vercel: Hobby
// limita a 60s, Pro deixa subir. `after()` mantém o processamento vivo depois
// da resposta 200 (sem ele o serverless mata o trabalho e a msg se perde).
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// --- Validação do webhook (Meta chama com hub.challenge) ---
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

// --- Recebe mensagens ---
export async function POST(req: NextRequest) {
  // Lê o corpo CRU (pra validar a assinatura do Meta antes de confiar nele).
  const corpoBruto = await req.text();
  if (!assinaturaValida(req, corpoBruto)) {
    return new Response("invalid signature", { status: 401 });
  }
  let corpo: WebhookPayload;
  try {
    corpo = JSON.parse(corpoBruto) as WebhookPayload;
  } catch {
    return new Response("bad request", { status: 400 });
  }

  // Responde 200 na hora (o Meta reenvia se demorar) e processa DEPOIS da resposta.
  // `after` mantém o trabalho vivo no Vercel serverless — sem ele, o processamento
  // seria morto quando a função retorna e a mensagem do cliente se perderia.
  after(async () => {
    try {
      await processar(corpo);
    } catch (e) {
      console.error("[whatsapp] erro ao processar:", e);
    }
  });
  return new Response("ok", { status: 200 });
}

async function processar(corpo: WebhookPayload) {
  for (const entry of corpo.entry ?? []) {
    for (const ch of entry.changes ?? []) {
      const valor = ch.value;
      const msg = valor?.messages?.[0];
      if (!msg) continue; // status/entrega, ignora

      // Idempotência: se o Meta reenviou a MESMA mensagem, ignora (não responde 2x).
      if (msg.id && !(await marcarWebhookNovo(msg.id))) continue;

      const phoneNumberId = valor.metadata?.phone_number_id;
      const negocioId = await resolverNegocio(phoneNumberId);
      if (!negocioId) {
        console.error("[whatsapp] número não mapeado a nenhum negócio:", phoneNumberId);
        continue;
      }

      const telefone = msg.from;
      const nomePerfil = valor.contacts?.[0]?.profile?.name;
      const clienteId = await acharOuCriarCliente(negocioId, telefone, nomePerfil);

      // Extrai o texto (ou transcreve o áudio).
      const texto = await extrairTexto(msg);
      if (!texto) continue;

      await salvarMensagem(negocioId, clienteId, "user", texto);
      const historico = await carregarHistorico(negocioId, clienteId);

      // Carrega o cardápio/persona DESTE negócio (multi-tenant).
      const tenant = await carregarTenant(negocioId);
      const resp = await responder(historico, tenant);

      await enviarTexto(telefone, resp.texto);
      await salvarMensagem(negocioId, clienteId, "assistant", resp.texto);

      if (resp.pedidoRegistrado) {
        await registrarPedido(negocioId, clienteId, resp.pedidoRegistrado);
      }
      // resp.precisaHumano: o painel já mostra pela conversa; marcação fina depois.
    }
  }
}

// Texto puro, ou áudio transcrito. Outros tipos: pede pra escrever.
async function extrairTexto(msg: WhatsAppMessage): Promise<string | null> {
  if (msg.type === "text") return msg.text?.body ?? null;
  if (msg.type === "audio" && msg.audio?.id) {
    const bin = await baixarMidia(msg.audio.id);
    return transcrever(bin);
  }
  return "[cliente mandou uma mídia que não é texto nem áudio]";
}

// Multi-tenant: mapeia o phone_number_id (do Meta) pro negócio.
// Guardado em negocios.config->>whatsapp_phone_id. Fallback: negócio padrão por env.
async function resolverNegocio(phoneNumberId?: string): Promise<string | null> {
  if (phoneNumberId) {
    const n = await queryUm<{ id: string }>(
      "select id from negocios where config->>'whatsapp_phone_id' = $1 and ativo = true",
      [phoneNumberId],
    );
    if (n) return n.id;
  }
  return process.env.NEGOCIO_PADRAO_ID ?? null;
}

// --- Tipos mínimos do payload do WhatsApp (só o que a gente usa) ---
type WhatsAppMessage = {
  id?: string;
  from: string;
  type: string;
  text?: { body: string };
  audio?: { id: string };
};
type WebhookPayload = {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: { profile?: { name?: string } }[];
        messages?: WhatsAppMessage[];
      };
    }[];
  }[];
};
