// ============================================================================
//  ESC/POS — monta os cupons e vira comando de impressora térmica.
//
//  A impressora é "burra": ela só imprime o que mandam e corta onde mandam.
//  A INTELIGÊNCIA é aqui: um pedido vira VÁRIOS tickets —
//    · um por ESTAÇÃO (a equipe de doce recebe só o doce; a de salgado só o salgado)
//    · um MASTER no caixa com o pedido inteiro + cliente + retirada
//  Entre cada um, um corte de guilhotina. Assim cada equipe pega o seu papel.
// ============================================================================

// --- Comandos crus ESC/POS ---
const ESC = "\x1B";
const GS = "\x1D";
const INIT = ESC + "@"; // reinicia a impressora
const CORTE = GS + "V" + "\x42" + "\x00"; // corte parcial (guilhotina)
const NEGRITO_ON = ESC + "E" + "\x01";
const NEGRITO_OFF = ESC + "E" + "\x00";
const CENTRO = ESC + "a" + "\x01";
const ESQUERDA = ESC + "a" + "\x00";
const DUPLO_ON = GS + "!" + "\x11"; // largura+altura dobradas
const DUPLO_OFF = GS + "!" + "\x00";

// Mapa categoria -> estação (equipe que produz). Configurável por negócio depois.
// Na Doce Pão: doce e bolos vão pra confeitaria; salgado/pizza pra cozinha salgada.
const ESTACOES = {
  doce: "CONFEITARIA",
  bolo_recheado: "CONFEITARIA",
  bolo_caseiro: "CONFEITARIA",
  salgado: "SALGADOS",
  pizza: "SALGADOS",
};
const ESTACAO_PADRAO = "PRODUCAO";

// Acentos podem sair tortos em impressora térmica; tira acento por segurança.
function semAcento(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

function linha(c = "-", n = 42) {
  return c.repeat(n) + "\n";
}

// Cabeçalho comum de qualquer ticket.
function cabecalho(titulo, pedido) {
  let t = INIT + CENTRO + NEGRITO_ON + DUPLO_ON;
  t += semAcento(titulo) + "\n";
  t += DUPLO_OFF + NEGRITO_OFF;
  t += semAcento("Doce Pao") + "\n";
  t += ESQUERDA + linha("=");
  t += NEGRITO_ON + semAcento("CLIENTE: " + (pedido.clienteNome || "-")) + "\n" + NEGRITO_OFF;
  if (pedido.clienteTelefone) t += semAcento("Fone: " + pedido.clienteTelefone) + "\n";
  const quando = [pedido.retiradaData, pedido.retiradaHora].filter(Boolean).join(" ");
  t += NEGRITO_ON + DUPLO_ON + semAcento("RETIRADA: " + (quando || "a confirmar")) + "\n" + DUPLO_OFF + NEGRITO_OFF;
  if (pedido.pessoas) t += semAcento("Festa: " + pedido.pessoas + " pessoas") + "\n";
  t += "Pedido #" + String(pedido.id).slice(0, 8) + "\n";
  t += linha("=");
  return t;
}

// Lista de itens (usada nos tickets de estação e no master).
function listaItens(itens) {
  let t = "";
  for (const it of itens) {
    const qtd = String(it.qtd).padEnd(4);
    t += NEGRITO_ON + qtd + "x " + NEGRITO_OFF + semAcento(it.produto) + "\n";
  }
  return t;
}

// Monta TODOS os tickets de um pedido (estações + master), já com corte entre eles.
// Retorna a string ESC/POS pronta pra jogar na impressora.
export function montarCupons(pedido) {
  const itens = pedido.itens || [];

  // agrupa itens por estação
  const porEstacao = {};
  for (const it of itens) {
    const est = ESTACOES[it.categoria] || ESTACAO_PADRAO;
    (porEstacao[est] ||= []).push(it);
  }

  let saida = "";

  // 1) um ticket por estação (só o que aquela equipe produz)
  for (const [estacao, lista] of Object.entries(porEstacao)) {
    saida += cabecalho("== " + estacao + " ==", pedido);
    saida += listaItens(lista);
    if (pedido.observacoes) {
      saida += linha("-");
      saida += NEGRITO_ON + "OBS:\n" + NEGRITO_OFF + semAcento(pedido.observacoes) + "\n";
    }
    saida += linha("-");
    saida += CENTRO + semAcento("Producao " + estacao) + "\n" + ESQUERDA;
    saida += "\n\n" + CORTE;
  }

  // 2) master no caixa: pedido inteiro + total + pagamento
  saida += cabecalho("*** CAIXA ***", pedido);
  saida += listaItens(itens);
  saida += linha("-");
  if (typeof pedido.totalCentavos === "number") {
    const total = "R$ " + (pedido.totalCentavos / 100).toFixed(2).replace(".", ",");
    saida += NEGRITO_ON + DUPLO_ON + "TOTAL: " + total + "\n" + DUPLO_OFF + NEGRITO_OFF;
  }
  saida += "Pagamento na RETIRADA\n";
  if (pedido.observacoes) {
    saida += linha("-");
    saida += NEGRITO_ON + "OBS:\n" + NEGRITO_OFF + semAcento(pedido.observacoes) + "\n";
  }
  saida += "\n\n" + CORTE;

  return saida;
}
