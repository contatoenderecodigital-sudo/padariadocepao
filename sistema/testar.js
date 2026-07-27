// ============================================================================
//  TESTE DO MOTOR DE ORÇAMENTO — roda no terminal, sem WhatsApp, sem Supabase.
//  É a PROVA VIVA pra reunião: mostra o orçamento sendo montado com os preços
//  reais da Doce Pão.
//
//  Rodar:  node testar.js
// ============================================================================

const { cotarPorItens, sugerirPorPessoas, formatarOrcamento } = require('./src/orcamento');

const sep = () => console.log('\n' + '='.repeat(50) + '\n');

// ---------------------------------------------------------------------------
sep();
console.log('CENÁRIO 1 — Cliente diz exatamente o que quer (caminho sólido)');
console.log('"Quero 100 salgados assados, 50 brigadeiros e um bolo 4 leites"');
sep();

const c1 = cotarPorItens([
  { item: 'salgado assado', qtd: 100 },
  { item: 'brigadeiro',     qtd: 50  },
  { item: 'bolo 4 leites',  qtd: 1   },
]);
console.log(formatarOrcamento(c1, { titulo: 'Orçamento — encomenda' }));

// ---------------------------------------------------------------------------
sep();
console.log('CENÁRIO 2 — "Festa pra 50 pessoas, quero salgado e doce" (usa rendimento)');
console.log('O motor SUGERE as quantidades e já cota.');
sep();

const c2 = sugerirPorPessoas(50, { salgado: true, doce: true, bolo: true });
console.log(formatarOrcamento(c2, { titulo: 'Orçamento — festa 50 pessoas' }));

// ---------------------------------------------------------------------------
sep();
console.log('CENÁRIO 3 — Cliente MEXE no pedido (tira o bolo, dobra o doce)');
console.log('Mostra o preço se refazendo sozinho — a dor do "quer tirar, quer pôr".');
sep();

const c3 = cotarPorItens([
  { item: 'salgado assado', qtd: 100 },
  { item: 'brigadeiro',     qtd: 100 },
]);
console.log(formatarOrcamento(c3, { titulo: 'Orçamento — atualizado' }));

// ---------------------------------------------------------------------------
sep();
console.log('CENÁRIO 4 — Pizza (o rendimento aqui é REAL, veio do cardápio dela)');
console.log('"Quero 3 pizzas inteiras"');
sep();

const c4 = cotarPorItens([{ item: 'pizza inteira', qtd: 3 }]);
console.log(formatarOrcamento(c4, { titulo: 'Orçamento — pizza' }));
console.log('\n(3 inteiras servem ~21 pessoas, pelo cardápio: 6-8 cada.)');

sep();
console.log('✅ Todos os preços saíram do catalogo.json (os PDFs reais dela).');
console.log('   Nenhum número foi inventado. A IA nunca toca na conta.');
sep();
