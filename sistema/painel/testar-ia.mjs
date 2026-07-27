// ============================================================================
//  TESTAR A IA NO TERMINAL — converse com a "Doce Pão" antes do WhatsApp.
//
//  Rodar:  ANTHROPIC_API_KEY=sua_chave  node testar-ia.mjs
//  (ou põe a chave no .env.local e roda com: node --env-file=.env.local testar-ia.mjs)
//
//  Você digita como se fosse o cliente. Ela responde. Digite "sair" pra encerrar.
// ============================================================================

import readline from "node:readline";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Habilita importar os arquivos .ts do projeto direto (via tsx/loader).
// Se der erro de loader, rode com: npx tsx testar-ia.mjs
let responder;
try {
  ({ responder } = await import("./lib/ia/cerebro.ts"));
} catch {
  console.error(
    "\n⚠️  Não consegui carregar o cérebro em .ts direto.\n" +
      "   Rode assim:  npx tsx testar-ia.mjs\n" +
      "   (o tsx entende TypeScript sem precisar compilar)\n",
  );
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("\n⚠️  Falta a OPENAI_API_KEY. Rode assim:\n" +
    "   OPENAI_API_KEY=sk-... npx tsx testar-ia.mjs\n");
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const pergunta = (q) => new Promise((r) => rl.question(q, r));

const historico = [];

console.log("\n🍞 Doce Pão — atendimento de teste. Digite como cliente. ('sair' encerra)\n");

while (true) {
  const msg = await pergunta("\x1b[36mCliente:\x1b[0m ");
  if (msg.trim().toLowerCase() === "sair") break;

  historico.push({ role: "user", content: msg });

  process.stdout.write("\x1b[90m(pensando...)\x1b[0m\r");
  const resp = await responder(historico);
  process.stdout.write("                    \r");

  console.log(`\x1b[32mDoce Pão:\x1b[0m ${resp.texto}`);
  if (resp.precisaHumano) console.log("   \x1b[33m↳ [passou pra equipe: cairia na fila do painel]\x1b[0m");
  if (resp.pedidoRegistrado)
    console.log(`   \x1b[35m↳ [pedido registrado: R$ ${(resp.pedidoRegistrado.totalCentavos / 100).toFixed(2)} — iria pra aprovação]\x1b[0m`);
  console.log("");

  historico.push({ role: "assistant", content: resp.texto });
}

rl.close();
console.log("\nAté! 🍞\n");
