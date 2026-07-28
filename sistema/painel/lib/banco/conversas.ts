// ============================================================================
//  PERSISTÊNCIA DA CONVERSA — a memória do atendimento (Postgres puro).
//  O webhook é stateless: a cada mensagem, carrega o histórico do cliente,
//  a IA responde, salva o novo turno. Pedido confirmado vira linha em `pedidos`
//  (status 'confirmado') e cai na fila de aprovação do painel.
//
//  Isolamento multi-tenant: TODA query filtra por negocio_id.
// ============================================================================

import { query, queryUm } from "./db";
import type { Mensagem, RespostaIA } from "../ia/cerebro";

const LIMITE_HISTORICO = 20; // últimas N mensagens que a IA enxerga

// Acha o cliente pelo telefone; cria se for a primeira vez.
export async function acharOuCriarCliente(
  negocioId: string,
  telefone: string,
  nome?: string,
): Promise<string> {
  const existe = await queryUm<{ id: string }>(
    "select id from clientes where negocio_id = $1 and telefone = $2",
    [negocioId, telefone],
  );
  if (existe) return existe.id;

  const novo = await queryUm<{ id: string }>(
    "insert into clientes (negocio_id, telefone, nome) values ($1, $2, $3) returning id",
    [negocioId, telefone, nome ?? null],
  );
  if (!novo) throw new Error("Falha ao criar cliente");
  return novo.id;
}

// Últimas mensagens do cliente, no formato que a IA espera (ordem cronológica).
export async function carregarHistorico(
  negocioId: string,
  clienteId: string,
): Promise<Mensagem[]> {
  const linhas = await query<{ papel: "user" | "assistant"; conteudo: string }>(
    `select papel, conteudo from mensagens
       where negocio_id = $1 and cliente_id = $2
       order by criado_em desc limit $3`,
    [negocioId, clienteId, LIMITE_HISTORICO],
  );
  return linhas.reverse().map((m) => ({ role: m.papel, content: m.conteudo }));
}

// Grava um turno da conversa.
export async function salvarMensagem(
  negocioId: string,
  clienteId: string,
  papel: "user" | "assistant",
  conteudo: string,
): Promise<void> {
  await query(
    "insert into mensagens (negocio_id, cliente_id, papel, conteudo) values ($1, $2, $3, $4)",
    [negocioId, clienteId, papel, conteudo],
  );
}

// Idempotência: registra o wamid; retorna false se já tinha sido processado.
export async function marcarWebhookNovo(wamid: string): Promise<boolean> {
  const linhas = await query<{ wamid: string }>(
    "insert into webhook_recebidos (wamid) values ($1) on conflict (wamid) do nothing returning wamid",
    [wamid],
  );
  return linhas.length > 0; // 0 = já existia (mensagem repetida do Meta)
}

// Registra o pedido que a IA fechou: cabeçalho em `pedidos` + itens.
// Entra como 'confirmado' → aparece na fila de APROVAÇÃO da equipe no painel.
export async function registrarPedido(
  negocioId: string,
  clienteId: string,
  pedido: NonNullable<RespostaIA["pedidoRegistrado"]>,
): Promise<string> {
  // usa as linhas já calculadas pelo motor do tenant (não recalcula com cardápio errado)
  const linhas = pedido.linhas;

  const ped = await queryUm<{ id: string }>(
    `insert into pedidos
       (negocio_id, cliente_id, status, retirada_data, retirada_hora, total_centavos, observacoes, confirmado_em)
     values ($1, $2, 'confirmado', $3, $4, $5, $6, now())
     returning id`,
    [
      negocioId,
      clienteId,
      parseDataRetirada(pedido.retiradaData),
      pedido.retiradaHora ?? null,
      pedido.totalCentavos,
      pedido.observacoes ?? null,
    ],
  );
  if (!ped) throw new Error("Falha ao registrar pedido");

  for (const l of linhas) {
    await query(
      `insert into pedido_itens (pedido_id, produto, categoria, qtd, unit_centavos, subtotal_centavos)
       values ($1, $2, $3, $4, $5, $6)`,
      [ped.id, l.item, l.categoria, l.qtd, Math.round(l.unit * 100), Math.round(l.subtotal * 100)],
    );
  }
  return ped.id;
}

// A IA guarda a data como texto livre ("sábado 25/07"). Tenta virar YYYY-MM-DD;
// se não der, deixa null (a equipe confirma o dia na aprovação).
function parseDataRetirada(texto: string): string | null {
  const m = texto.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (!m) return null;
  const dia = m[1].padStart(2, "0");
  const mes = m[2].padStart(2, "0");
  const ano = m[3] ? (m[3].length === 2 ? "20" + m[3] : m[3]) : String(new Date().getFullYear());
  return `${ano}-${mes}-${dia}`;
}
