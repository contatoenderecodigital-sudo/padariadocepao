// Teste do gerador de cupom — sem impressora, sem banco.
// Roda: node teste.mjs   (mostra os tickets como sairiam, já separados por estação)
import { montarCupons } from "./esc-pos.mjs";

const pedido = {
  id: "d1a2b3c4-0000",
  clienteNome: "Maria de Souza",
  clienteTelefone: "5549991111111",
  retiradaData: "2026-07-28",
  retiradaHora: "14:00",
  pessoas: 20,
  totalCentavos: 23440,
  observacoes: "Festa de aniversario. Caprichar no brigadeiro.",
  itens: [
    { produto: "Salgado assado", categoria: "salgado", qtd: 100 },
    { produto: "Brigadeiro", categoria: "doce", qtd: 50 },
    { produto: "Bolo 4 leites", categoria: "bolo_recheado", qtd: 1 },
    { produto: "Pizza inteira", categoria: "pizza", qtd: 2 },
  ],
};

// Tira os comandos ESC/POS pra ler no terminal (a impressora entende os comandos).
const cru = montarCupons(pedido);
const legivel = cru
  .replace(/\x1B@/g, "")
  .replace(/\x1B[Ea]./g, "")
  .replace(/\x1D!./g, "")
  .replace(/\x1DV\x42\x00/g, "\n\n========== ✂️  CORTE ==========\n\n")
  .replace(/[\x00-\x08\x0E-\x1F]/g, "");

console.log(legivel);
