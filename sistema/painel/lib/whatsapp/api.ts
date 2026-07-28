// ============================================================================
//  WHATSAPP (Meta Cloud API) — enviar mensagem e baixar áudio.
//  O webhook recebe; estas funções respondem e buscam mídia.
// ============================================================================

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const BASE = "https://graph.facebook.com/v21.0";

// Brasil: o wa_id do WhatsApp costuma vir SEM o 9º dígito do celular
// (55 + DDD + 8 dígitos = 12), mas pra ENVIAR o número precisa do 9
// (55 + DDD + 9 + 8 = 13). Aqui a gente adiciona o 9 quando falta.
function normalizarBR(numero: string): string {
  const n = numero.replace(/\D/g, "");
  if (n.startsWith("55") && n.length === 12) {
    return n.slice(0, 4) + "9" + n.slice(4);
  }
  return n;
}

// Manda um texto de volta pro cliente.
export async function enviarTexto(para: string, texto: string): Promise<void> {
  if (!TOKEN || !PHONE_ID) throw new Error("Faltam WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID");
  const destino = normalizarBR(para);
  console.log(`[whatsapp] enviando para ${destino} (recebido: ${para})`);
  const r = await fetch(`${BASE}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: destino,
      type: "text",
      text: { body: texto },
    }),
  });
  if (!r.ok) throw new Error(`Falha ao enviar WhatsApp: ${r.status} ${await r.text()}`);
}

// Baixa o binário de um áudio pelo media_id (pra transcrever).
export async function baixarMidia(mediaId: string): Promise<ArrayBuffer> {
  if (!TOKEN) throw new Error("Falta WHATSAPP_TOKEN");
  // 1) pega a URL temporária da mídia
  const meta = await fetch(`${BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!meta.ok) throw new Error(`Falha ao achar mídia: ${meta.status}`);
  const { url } = (await meta.json()) as { url: string };
  // 2) baixa o binário (precisa do mesmo token)
  const bin = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!bin.ok) throw new Error(`Falha ao baixar mídia: ${bin.status}`);
  return bin.arrayBuffer();
}
