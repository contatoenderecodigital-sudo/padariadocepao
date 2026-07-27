// ============================================================================
//  PONTE DE IMPRESSÃO — roda DENTRO da padaria (mini-PC no caixa ou Raspberry).
//
//  Por que aqui e não na nuvem: a impressora está atrás do roteador da loja;
//  a nuvem não alcança ela. A ponte fica na rede local, PUXA os pedidos
//  aprovados do painel (por HTTPS, autenticada por token — o banco nunca fica
//  exposto) e imprime na impressora local.
//
//  Internet caiu? Os pedidos ficam na fila do servidor e imprimem quando voltar.
//  Nada se perde.
//
//  Rodar:  node --env-file=.env imprimir.mjs
// ============================================================================

import net from "node:net";
import { montarCupons } from "./esc-pos.mjs";

const API = process.env.API_URL; // ex: https://painel.docepao.com.br
const TOKEN = process.env.PONTE_TOKEN;
const IMPRESSORA_HOST = process.env.IMPRESSORA_HOST; // ex: 192.168.0.50
const IMPRESSORA_PORTA = Number(process.env.IMPRESSORA_PORTA || 9100);
const INTERVALO = Number(process.env.INTERVALO_MS || 4000);
const MODO_TESTE = process.env.MODO_TESTE === "1"; // imprime no console

if (!API || !TOKEN) {
  console.error("Faltam API_URL e PONTE_TOKEN no ambiente (.env).");
  process.exit(1);
}

const cab = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

// Manda os bytes ESC/POS pra impressora (TCP porta 9100 — padrão de rede).
function enviarParaImpressora(dados) {
  if (MODO_TESTE || !IMPRESSORA_HOST) {
    console.log("\n----- [MODO TESTE] cupom que iria pra impressora -----");
    console.log(dados.replace(/\x1B|\x1D/g, "").replace(/[\x00-\x08]/g, ""));
    console.log("----- fim do cupom -----\n");
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const sock = net.createConnection(IMPRESSORA_PORTA, IMPRESSORA_HOST, () => {
      sock.write(Buffer.from(dados, "binary"), () => sock.end());
    });
    sock.on("error", reject);
    sock.on("close", resolve);
  });
}

// Uma passada: puxa os pendentes da API, imprime, confirma de volta.
async function rodada() {
  let jobs = [];
  try {
    const r = await fetch(`${API}/api/fila`, { headers: cab });
    if (!r.ok) {
      console.error("Erro ao ler fila:", r.status);
      return;
    }
    ({ jobs } = await r.json());
  } catch (e) {
    console.error("Sem conexão com o painel:", e.message); // internet caiu — tenta na próxima
    return;
  }
  if (!jobs?.length) return;

  for (const job of jobs) {
    try {
      const cupom = montarCupons(job.pedido);
      await enviarParaImpressora(cupom);
      await fetch(`${API}/api/fila`, {
        method: "POST",
        headers: cab,
        body: JSON.stringify({ filaId: job.filaId, ok: true, cupomTexto: cupom }),
      });
      console.log(`[ok] pedido ${String(job.pedido.id).slice(0, 8)} impresso (${job.pedido.clienteNome})`);
    } catch (e) {
      console.error(`[erro] job ${job.filaId}:`, e.message);
      await fetch(`${API}/api/fila`, {
        method: "POST",
        headers: cab,
        body: JSON.stringify({ filaId: job.filaId, ok: false, erro: String(e.message) }),
      }).catch(() => {});
    }
  }
}

// Loop principal. Simples e robusto: erra numa rodada, tenta na próxima.
console.log(
  `Ponte de impressao Doce Pao ativa. ${MODO_TESTE || !IMPRESSORA_HOST ? "(MODO TESTE — console)" : `impressora ${IMPRESSORA_HOST}:${IMPRESSORA_PORTA}`}`,
);
async function loop() {
  try {
    await rodada();
  } catch (e) {
    console.error("Erro na rodada:", e.message);
  }
  setTimeout(loop, INTERVALO);
}
loop();
