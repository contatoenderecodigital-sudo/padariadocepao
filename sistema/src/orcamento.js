// ============================================================================
//  MOTOR DE ORÇAMENTO — Padaria Doce Pão
//  A peça mais importante do sistema. Recebe o que o cliente quer e devolve a
//  conta FECHADA, com os preços reais da Doce Pão (dados/catalogo.json).
//
//  REGRA DE OURO: a IA NUNCA calcula preço. A IA só entende o que o cliente
//  quer e chama este motor. Aqui é código puro — não erra soma, não alucina,
//  custo zero de token. É o que impede a IA de cotar 100 salgados por R$ 80.
// ============================================================================

const fs = require('fs');
const path = require('path');

const catalogo   = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dados', 'catalogo.json'), 'utf8'));
const rendimento = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dados', 'rendimento.json'), 'utf8'));

const brl = (n) => 'R$ ' + n.toFixed(2)
  .replace('.', ',')
  .replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, '.'); // separador de milhar antes da vírgula decimal

// ---------------------------------------------------------------------------
//  Tabela de preços achatada: nome normalizado -> { preco, rotulo, categoria }
//  Monta uma vez, na carga. É por aqui que o motor acha o preço de qualquer item.
// ---------------------------------------------------------------------------
function montarPrecos() {
  const p = {};
  const add = (chave, preco, rotulo, categoria) => { p[chave] = { preco, rotulo, categoria }; };

  add('salgado frito',  catalogo.salgados.frito.preco,  'Salgado frito',  'salgado');
  add('salgado assado', catalogo.salgados.assado.preco, 'Salgado assado', 'salgado');

  for (const d of catalogo.doces.itens) {
    add(d.nome, d.preco, d.nome.charAt(0).toUpperCase() + d.nome.slice(1), 'doce');
  }

  for (const f of catalogo.bolos_recheados.faixas) {
    // um representante por faixa; qualquer sabor da faixa custa igual
    add('bolo recheado ' + f.faixa.toLowerCase(), f.preco, `Bolo recheado (faixa ${f.faixa})`, 'bolo_recheado');
    for (const s of f.sabores) add('bolo ' + s, f.preco, `Bolo ${s}`, 'bolo_recheado');
  }

  for (const b of catalogo.bolos_caseiros.itens) {
    add('bolo caseiro ' + b.nome, b.preco, `Bolo caseiro ${b.nome}`, 'bolo_caseiro');
  }

  add('pizza inteira', catalogo.pizza.inteira.preco, 'Pizza inteira', 'pizza');
  add('pizza meia',    catalogo.pizza.meia.preco,    'Pizza meia',    'pizza');

  return p;
}
const PRECOS = montarPrecos();

// ---------------------------------------------------------------------------
//  cotarPorItens — o caminho SÓLIDO e sempre confiável.
//  Cliente (ou IA) diz exatamente o que quer: [{item, qtd}]. Soma direta.
//  Não depende de nenhum chute de rendimento.
//
//  ex: cotarPorItens([{item:'salgado assado', qtd:100}, {item:'brigadeiro', qtd:50}])
// ---------------------------------------------------------------------------
function cotarPorItens(pedido) {
  const linhas = [];
  const avisos = [];
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

// ---------------------------------------------------------------------------
//  sugerirPorPessoas — o caminho de CONVENIÊNCIA (usa rendimento).
//  Cliente diz "festa pra 50 pessoas, quero salgado e doce". O motor SUGERE
//  as quantidades pela tabela de rendimento e já cota.
//
//  ⚠️ Depende dos números de rendimento.json. Enquanto eles forem chute
//  (confirmar:true), o resultado sai marcado como ESTIMATIVA.
// ---------------------------------------------------------------------------
function sugerirPorPessoas(pessoas, quer = { salgado: true, doce: true, bolo: false }) {
  const n = Number(pessoas) || 0;
  const pedido = [];
  const notas = [];
  let estimativa = false;

  if (quer.salgado) {
    const r = rendimento.salgado_por_pessoa;
    let qtd = Math.round(n * r.valor);
    const min = rendimento.regras_encomenda.quantidade_minima_salgado;
    if (min.valor && qtd < min.valor) { qtd = min.valor; notas.push(`Salgado ajustado pro mínimo de ${min.valor}.`); }
    pedido.push({ item: 'salgado assado', qtd });
    if (r.confirmar) { estimativa = true; notas.push(`Salgado: ${r.valor}/pessoa é estimativa — confirmar com a dona.`); }
  }

  if (quer.doce) {
    const r = rendimento.doce_por_pessoa;
    pedido.push({ item: 'brigadeiro', qtd: Math.round(n * r.valor) });
    if (r.confirmar) { estimativa = true; notas.push(`Doce: ${r.valor}/pessoa é estimativa — confirmar com a dona.`); }
  }

  if (quer.bolo) {
    const r = rendimento.bolo_recheado_serve;
    const qtd = Math.max(1, Math.ceil(n / r.valor));
    pedido.push({ item: 'bolo recheado a', qtd });
    if (r.confirmar) { estimativa = true; notas.push(`Bolo: 1 serve ~${r.valor} pessoas é estimativa — confirmar com a dona.`); }
  }

  const cotacao = cotarPorItens(pedido);
  return { pessoas: n, estimativa, notas, ...cotacao };
}

// ---------------------------------------------------------------------------
//  Formatação de cupom / mensagem de orçamento (texto puro, pronto pro zap)
// ---------------------------------------------------------------------------
function formatarOrcamento(cotacao, { titulo = 'Orçamento Doce Pão' } = {}) {
  const L = [];
  L.push(titulo);
  L.push('─'.repeat(32));
  for (const l of cotacao.linhas) {
    L.push(`${l.qtd}x ${l.item}`);
    L.push(`     ${l.qtd} × ${brl(l.unit)} = ${brl(l.subtotal)}`);
  }
  L.push('─'.repeat(32));
  L.push(`TOTAL: ${brl(cotacao.total)}`);
  if (cotacao.estimativa) L.push('\n⚠️ Quantidades são estimativa (rendimento a confirmar).');
  if (cotacao.avisos?.length) L.push('\n' + cotacao.avisos.join('\n'));
  if (cotacao.notas?.length)  L.push('\n' + cotacao.notas.join('\n'));
  return L.join('\n');
}

module.exports = { cotarPorItens, sugerirPorPessoas, formatarOrcamento, PRECOS, brl };
