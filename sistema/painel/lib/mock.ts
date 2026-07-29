// Dados fake pra DEMO — o painel roda sem Supabase configurado.
// Quando o Supabase entrar, esta camada é trocada por queries reais
// (mesma forma de dados, então as telas não mudam).

import type { Pedido, Conversa, MembroClube } from "./tipos";

// datas relativas a "hoje" pra demo nunca ficar velha
const hoje = new Date();
const maisDias = (d: number) => {
  const x = new Date(hoje);
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

export const PEDIDOS_MOCK: Pedido[] = [
  {
    id: "d1",
    clienteNome: "Maria de Souza",
    clienteTelefone: "(49) 9 9111-1111",
    status: "confirmado",
    retiradaData: maisDias(2),
    retiradaHora: "14:00",
    pessoas: 20,
    totalCentavos: 23440,
    observacoes: "Festa de aniversário. Cliente pediu pra caprichar no brigadeiro.",
    criadoEm: new Date(hoje.getTime() - 1000 * 60 * 12).toISOString(),
    itens: [
      { produto: "Salgado assado", categoria: "salgado", qtd: 100, unitCentavos: 125, subtotalCentavos: 12500 },
      { produto: "Brigadeiro", categoria: "doce", qtd: 50, unitCentavos: 125, subtotalCentavos: 6250 },
      { produto: "Bolo 4 leites", categoria: "bolo_recheado", qtd: 1, unitCentavos: 4690, subtotalCentavos: 4690 },
    ],
  },
  {
    id: "d2",
    clienteNome: "João Pereira",
    clienteTelefone: "(49) 9 9222-2222",
    status: "confirmado",
    retiradaData: maisDias(1),
    retiradaHora: "09:30",
    pessoas: null,
    totalCentavos: 36000,
    observacoes: "Retirar de manhã cedo.",
    criadoEm: new Date(hoje.getTime() - 1000 * 60 * 40).toISOString(),
    itens: [
      { produto: "Pizza inteira", categoria: "pizza", qtd: 3, unitCentavos: 12000, subtotalCentavos: 36000 },
    ],
  },
  {
    id: "d3",
    clienteNome: "Carlos Menezes",
    clienteTelefone: "(49) 9 9444-4444",
    status: "confirmado",
    retiradaData: maisDias(0),
    retiradaHora: "16:00",
    pessoas: null,
    totalCentavos: 10625,
    observacoes: null,
    criadoEm: new Date(hoje.getTime() - 1000 * 60 * 3).toISOString(),
    itens: [
      { produto: "Salgado frito", categoria: "salgado", qtd: 50, unitCentavos: 100, subtotalCentavos: 5000 },
      { produto: "Coxinha", categoria: "salgado", qtd: 30, unitCentavos: 100, subtotalCentavos: 3000 },
      { produto: "Trufa de morango", categoria: "doce", qtd: 12, unitCentavos: 225, subtotalCentavos: 2700 },
    ],
  },
];

// candidatos à recuperação (orçamento parado, cliente sumiu sem confirmar).
// Idades variadas de propósito, pra a tela mostrar a urgência por cor
// (1 dia dourado, alguns dias cobre, 7+ dias vermelho) e ordenar por prioridade.
const horas = (h: number) => new Date(hoje.getTime() - 1000 * 60 * 60 * h).toISOString();
export const ORCAMENTOS_PARADOS_MOCK: Pedido[] = [
  {
    // 8 dias parado, retirada sem data, cobrança automática já foi e o cliente
    // até visualizou, mas não respondeu. Prioridade máxima (vermelho).
    id: "o3",
    clienteNome: "Fernanda Costa",
    clienteTelefone: "(49) 9 9888-1234",
    status: "orcado",
    retiradaData: null,
    retiradaHora: null,
    pessoas: 120,
    totalCentavos: 124000,
    observacoes: "Casamento. Pediu bolo de 3 andares com decoração especial.",
    criadoEm: horas(8 * 24),
    cobrancaEm: horas(6 * 24),
    clienteViuEm: horas(5 * 24),
    itens: [
      { produto: "Bolo 3 andares", categoria: "bolo_recheado", qtd: 1, unitCentavos: 98000, subtotalCentavos: 98000 },
      { produto: "Salgado assado", categoria: "salgado", qtd: 200, unitCentavos: 130, subtotalCentavos: 26000 },
    ],
  },
  {
    // 3 dias parado, retirada AMANHÃ. Urgência real alta apesar da cor cobre.
    id: "o2",
    clienteNome: "Roberto Lima",
    clienteTelefone: "(49) 9 9555-7788",
    status: "orcado",
    retiradaData: maisDias(1),
    retiradaHora: "08:00",
    pessoas: null,
    totalCentavos: 18000,
    observacoes: "Café da firma. Pediu orçamento e sumiu.",
    criadoEm: horas(3 * 24 + 2),
    itens: [
      { produto: "Salgado assado", categoria: "salgado", qtd: 100, unitCentavos: 125, subtotalCentavos: 12500 },
      { produto: "Mini pizza", categoria: "salgado", qtd: 20, unitCentavos: 275, subtotalCentavos: 5500 },
    ],
  },
  {
    // ~1 dia parado, cobrança automática já disparou. Atenção (dourado).
    id: "o1",
    clienteNome: "Ana Beatriz",
    clienteTelefone: "(49) 9 9333-3333",
    status: "orcado",
    retiradaData: maisDias(5),
    retiradaHora: null,
    pessoas: 30,
    totalCentavos: 50000,
    observacoes: "Falou que ia ver com o marido.",
    criadoEm: horas(26),
    cobrancaEm: horas(2),
    itens: [
      { produto: "Salgado assado", categoria: "salgado", qtd: 300, unitCentavos: 125, subtotalCentavos: 37500 },
      { produto: "Brigadeiro", categoria: "doce", qtd: 100, unitCentavos: 125, subtotalCentavos: 12500 },
    ],
  },
  {
    // 5 horas parado, ainda não cobrado. Recém-parado (dourado).
    id: "o4",
    clienteNome: "Marcos Vinícius",
    clienteTelefone: "(49) 9 9222-4646",
    status: "orcado",
    retiradaData: maisDias(3),
    retiradaHora: "15:00",
    pessoas: null,
    totalCentavos: 9600,
    observacoes: null,
    criadoEm: horas(5),
    itens: [
      { produto: "Coxinha", categoria: "salgado", qtd: 60, unitCentavos: 100, subtotalCentavos: 6000 },
      { produto: "Trufa de morango", categoria: "doce", qtd: 16, unitCentavos: 225, subtotalCentavos: 3600 },
    ],
  },
];

// ---------------------------------------------------------------------------
//  ATENDIMENTOS — conversas da IA no WhatsApp (a joia da demo)
// ---------------------------------------------------------------------------
export const CONVERSAS_MOCK: Conversa[] = [
  {
    id: "conv1",
    clienteNome: "Maria de Souza",
    clienteTelefone: "(49) 9 9111-1111",
    ultimaHora: "10:42",
    previa: "Fechado! Deixei seu pedido pra sábado às 14h 😊",
    estado: "ia",
    naoLidas: 0,
    mensagens: [
      { de: "cliente", texto: "Oi, bom dia! Vcs fazem salgado pra festa?", hora: "10:31" },
      { de: "ia", texto: "Bom dia! 😊 Fazemos sim! Salgado assado sai R$ 1,25 e frito R$ 1,00 a unidade. É pra quantas pessoas a festa?", hora: "10:31" },
      { de: "cliente", texto: "umas 20 pessoas, dia 18 (sabado)", hora: "10:38" },
      { de: "ia", texto: "Perfeito! Pra 20 pessoas eu sugiro uns 200 salgados. Quer só salgado ou coloco uns docinhos também? Nosso brigadeiro sai R$ 1,25 🍫", hora: "10:38" },
      { de: "cliente", texto: "poe 100 salgado assado, 50 brigadeiro e um bolo de 4 leites", hora: "10:40" },
      { de: "ia", texto: "Fechou! Ficou assim:\n\n100× Salgado assado — R$ 125,00\n50× Brigadeiro — R$ 62,50\n1× Bolo 4 leites — R$ 46,90\n\n*Total: R$ 234,40* (paga na retirada)\nRetirada sábado 18/07 às 14h. Confirma pra mim? 😊", hora: "10:41" },
      { de: "cliente", texto: "isso, pode confirmar", hora: "10:42" },
      { de: "ia", texto: "Fechado! Deixei seu pedido pra sábado às 14h 😊 Qualquer coisa é só chamar!", hora: "10:42" },
    ],
  },
  {
    id: "conv2",
    clienteNome: "Ana Beatriz",
    clienteTelefone: "(49) 9 9333-3333",
    ultimaHora: "10:15",
    previa: "Queria um bolo bem diferente, consegue me ajudar a escolher?",
    estado: "precisa_humano",
    naoLidas: 1,
    mensagens: [
      { de: "cliente", texto: "oi, queria encomendar um bolo pra um casamento", hora: "10:10" },
      { de: "ia", texto: "Que lindo! 💍 Temos bolos recheados a partir de R$ 46,90. Você já tem um sabor em mente?", hora: "10:11" },
      { de: "cliente", texto: "queria um bolo bem diferente, de 3 andares, com uma decoração especial. consegue me ajudar a escolher?", hora: "10:15" },
      { de: "ia", texto: "Esse é um pedido especial, que a nossa equipe adora fazer com carinho. Vou chamar alguém da nossa equipe pra montar isso com você certinho, tá? Já já te respondem 😊", hora: "10:15" },
    ],
  },
  {
    id: "conv3",
    clienteNome: "João Pereira",
    clienteTelefone: "(49) 9 9222-2222",
    ultimaHora: "09:28",
    previa: "Que horas vocês abrem amanhã?",
    estado: "resolvido",
    naoLidas: 0,
    mensagens: [
      { de: "cliente", texto: "que horas abre amanha?", hora: "09:27" },
      { de: "ia", texto: "Abrimos às 6h30 da manhã! ☀️ Te espero por aqui.", hora: "09:28" },
    ],
  },
  {
    id: "conv4",
    clienteNome: "Cliente novo",
    clienteTelefone: "(49) 9 9777-7777",
    ultimaHora: "02:14",
    previa: "vcs tem pão de queijo de manhã?",
    estado: "resolvido",
    naoLidas: 0,
    mensagens: [
      { de: "cliente", texto: "vcs tem pão de queijo de manhã?", hora: "02:13" },
      { de: "ia", texto: "Temos sim, quentinho todo dia! 🧀 A partir das 6h30. Aparece que vale a pena 😉", hora: "02:14" },
    ],
  },
];

// ---------------------------------------------------------------------------
//  CLUBE — membros e selos
// ---------------------------------------------------------------------------
export const CLUBE_MOCK: MembroClube[] = [
  { nome: "João Pereira", telefone: "(49) 9 9222-2222", selos: 7, metaSelos: 10, totalGasto: 48900, ultimaCompra: "há 2 dias" },
  { nome: "Carlos Menezes", telefone: "(49) 9 9444-4444", selos: 5, metaSelos: 10, totalGasto: 31200, ultimaCompra: "há 5 dias" },
  { nome: "Maria de Souza", telefone: "(49) 9 9111-1111", selos: 3, metaSelos: 10, totalGasto: 23440, ultimaCompra: "hoje" },
  { nome: "Ana Beatriz", telefone: "(49) 9 9333-3333", selos: 1, metaSelos: 10, totalGasto: 5000, ultimaCompra: "há 1 semana" },
  { nome: "Pedro Alves", telefone: "(49) 9 9555-5555", selos: 9, metaSelos: 10, totalGasto: 67800, ultimaCompra: "ontem" },
];

// ---------------------------------------------------------------------------
//  NÚMEROS — métricas do mês (pra o dashboard de resultado)
// ---------------------------------------------------------------------------
export const METRICAS_MOCK = {
  horasEconomizadas: 96,
  atendimentosMes: 1240,
  atendimentosForaHorario: 312, // de madrugada / fechado
  faturamentoWhatsappCentavos: 1847000,
  orcamentosRecuperados: 14,
  valorRecuperadoCentavos: 386000,
  pedidosNoDia: 23,
  // volume por dia da semana (pra um gráfico de barrinhas)
  porDia: [
    { dia: "Seg", pedidos: 28 },
    { dia: "Ter", pedidos: 24 },
    { dia: "Qua", pedidos: 31 },
    { dia: "Qui", pedidos: 35 },
    { dia: "Sex", pedidos: 52 },
    { dia: "Sáb", pedidos: 68 },
    { dia: "Dom", pedidos: 19 },
  ],
};
