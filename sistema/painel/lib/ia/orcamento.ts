// ============================================================================
//  MOTOR DE ORÇAMENTO (TypeScript) — a peça que a IA chama pra calcular.
//  Porte do sistema/src/orcamento.js. Preços reais dos PDFs da Doce Pão.
//
//  A IA NUNCA calcula preço — ela chama cotarPorItens/sugerirPorPessoas.
//  Código puro: não erra soma, não alucina, custo zero de token.
// ============================================================================

import catalogo from "./dados/catalogo.json";
import rendimento from "./dados/rendimento.json";

export const brl = (n: number) =>
  "R$ " +
  n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, ".");

export type LinhaCotacao = {
  item: string;
  categoria: string;
  qtd: number;
  unit: number;
  subtotal: number;
};

export type Cotacao = {
  linhas: LinhaCotacao[];
  avisos: string[];
  notas?: string[];
  estimativa?: boolean;
  pessoas?: number;
  total: number;
};

type RefPreco = { preco: number; rotulo: string; categoria: string };

// Tabela de preços achatada: nome normalizado -> preço. Montada uma vez.
function montarPrecos(): Record<string, RefPreco> {
  const p: Record<string, RefPreco> = {};
  const add = (chave: string, preco: number, rotulo: string, categoria: string) => {
    p[chave] = { preco, rotulo, categoria };
  };

  add("salgado frito", catalogo.salgados.frito.preco, "Salgado frito", "salgado");
  add("salgado assado", catalogo.salgados.assado.preco, "Salgado assado", "salgado");

  for (const d of catalogo.doces.itens) {
    add(d.nome, d.preco, d.nome.charAt(0).toUpperCase() + d.nome.slice(1), "doce");
  }

  for (const f of catalogo.bolos_recheados.faixas) {
    add("bolo recheado " + f.faixa.toLowerCase(), f.preco, `Bolo recheado (faixa ${f.faixa})`, "bolo_recheado");
    for (const s of f.sabores) add("bolo " + s, f.preco, `Bolo ${s}`, "bolo_recheado");
  }

  for (const b of catalogo.bolos_caseiros.itens) {
    add("bolo caseiro " + b.nome, b.preco, `Bolo caseiro ${b.nome}`, "bolo_caseiro");
  }

  add("pizza inteira", catalogo.pizza.inteira.preco, "Pizza inteira", "pizza");
  add("pizza meia", catalogo.pizza.meia.preco, "Pizza meia", "pizza");

  return p;
}
const PRECOS = montarPrecos();

// Caminho SÓLIDO: cliente diz exatamente o que quer. Soma direta.
export function cotarPorItens(pedido: { item: string; qtd: number }[]): Cotacao {
  const linhas: LinhaCotacao[] = [];
  const avisos: string[] = [];
  let total = 0;

  for (const { item, qtd } of pedido) {
    const chave = String(item).trim().toLowerCase();
    const ref = PRECOS[chave];
    if (!ref) {
      avisos.push(`Não achei "${item}" no cardápio — conferir com a equipe.`);
      continue;
    }
    const q = Number(qtd) || 0;
    const subtotal = ref.preco * q;
    total += subtotal;
    linhas.push({ item: ref.rotulo, categoria: ref.categoria, qtd: q, unit: ref.preco, subtotal });
  }

  return { linhas, avisos, total };
}

// Caminho de CONVENIÊNCIA: "festa pra 50 pessoas". Usa rendimento (chutes até a dona confirmar).
export function sugerirPorPessoas(
  pessoas: number,
  quer: { salgado?: boolean; doce?: boolean; bolo?: boolean } = { salgado: true, doce: true },
): Cotacao {
  const n = Number(pessoas) || 0;
  const pedido: { item: string; qtd: number }[] = [];
  const notas: string[] = [];
  let estimativa = false;

  if (quer.salgado) {
    const r = rendimento.salgado_por_pessoa;
    let qtd = Math.round(n * r.valor);
    const min = rendimento.regras_encomenda.quantidade_minima_salgado;
    if (min.valor && qtd < min.valor) {
      qtd = min.valor;
      notas.push(`Salgado ajustado pro mínimo de ${min.valor}.`);
    }
    pedido.push({ item: "salgado assado", qtd });
    if (r.confirmar) {
      estimativa = true;
      notas.push(`Salgado: ${r.valor}/pessoa é estimativa — confirmar com a dona.`);
    }
  }

  if (quer.doce) {
    const r = rendimento.doce_por_pessoa;
    pedido.push({ item: "brigadeiro", qtd: Math.round(n * r.valor) });
    if (r.confirmar) {
      estimativa = true;
      notas.push(`Doce: ${r.valor}/pessoa é estimativa — confirmar com a dona.`);
    }
  }

  if (quer.bolo) {
    const r = rendimento.bolo_recheado_serve;
    const qtd = Math.max(1, Math.ceil(n / r.valor));
    pedido.push({ item: "bolo recheado a", qtd });
    if (r.confirmar) {
      estimativa = true;
      notas.push(`Bolo: 1 serve ~${r.valor} pessoas é estimativa — confirmar com a dona.`);
    }
  }

  const cotacao = cotarPorItens(pedido);
  return { pessoas: n, estimativa, notas, ...cotacao };
}

// Texto do orçamento pronto pro WhatsApp.
export function formatarOrcamento(c: Cotacao, titulo = "Orçamento Doce Pão"): string {
  const L: string[] = [];
  L.push(titulo);
  L.push("─".repeat(28));
  for (const l of c.linhas) {
    L.push(`${l.qtd}x ${l.item} — ${brl(l.subtotal)}`);
  }
  L.push("─".repeat(28));
  L.push(`*Total: ${brl(c.total)}*`);
  L.push("(paga na retirada)");
  if (c.estimativa) L.push("\n⚠️ Quantidades são estimativa (rendimento a confirmar).");
  if (c.avisos?.length) L.push("\n" + c.avisos.join("\n"));
  return L.join("\n");
}

// Resumo curto do cardápio pra colocar no system prompt (a IA usa como referência).
export function cardapioResumo(): string {
  return `Salgados: frito ${brl(catalogo.salgados.frito.preco)}, assado ${brl(catalogo.salgados.assado.preco)} (por unidade).
Doces: brigadeiro/beijinho a partir de ${brl(1.25)}; trufas ${brl(2.25)}.
Bolos recheados: ${brl(46.9)} a ${brl(55.9)}. Bolos caseiros: ${brl(30.9)} a ${brl(35.9)}.
Pizza de forma: inteira ${brl(120)} (serve 6 a 8 pessoas), meia ${brl(60)} (serve até 4).`;
}
