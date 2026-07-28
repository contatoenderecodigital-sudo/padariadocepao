// Tipos do domínio do painel. Espelham o schema do banco (banco/schema.sql).

export type PedidoStatus =
  | "aberto"
  | "orcado"
  | "confirmado"
  | "aprovado"
  | "impresso"
  | "recusado"
  | "cancelado";

export type ItemPedido = {
  produto: string;
  categoria: string;
  qtd: number;
  unitCentavos: number;
  subtotalCentavos: number;
};

export type FormaPagamento = "pix" | "dinheiro" | "cartao" | "pago";

// Historico do cliente REGISTRADO PELO SISTEMA (a partir do inicio do uso).
// NUNCA representa o relacionamento real com a padaria. Vem do banco; ausente
// enquanto nao houver dados (ai a UI mostra estado vazio honesto).
export type HistoricoCliente = {
  pedidosSistema: number; // qtd de pedidos ja feitos pela plataforma
  totalRegistradoCentavos: number; // soma gasta pela plataforma
  primeiroPedidoEm: string | null; // ISO do 1o pedido no sistema
  naoRetirados: number; // pedidos registrados nao retirados/nao confirmados
};

export type Pedido = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  status: PedidoStatus;
  retiradaData: string | null; // ISO date
  retiradaHora: string | null; // HH:MM
  pessoas: number | null;
  totalCentavos: number;
  observacoes: string | null;
  itens: ItemPedido[];
  criadoEm: string; // ISO
  // Preparados para dados reais do banco (opcionais):
  formaPagamento?: FormaPagamento | null;
  historicoCliente?: HistoricoCliente | null;
};

export type Mensagem = {
  de: "cliente" | "ia" | "equipe";
  texto: string;
  hora: string; // HH:MM
};

export type Conversa = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  ultimaHora: string;
  previa: string;
  estado: "ia" | "precisa_humano" | "resolvido";
  naoLidas: number;
  mensagens: Mensagem[];
};

export type MembroClube = {
  nome: string;
  telefone: string;
  selos: number;
  metaSelos: number;
  totalGasto: number; // centavos
  ultimaCompra: string; // "há 3 dias"
};

export const brl = (centavos: number) =>
  "R$ " +
  (centavos / 100)
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, ".");

// Telefone no padrao brasileiro: 5511990001111 -> +55 (11) 99000-1111
export function formatarTelefoneBR(tel: string): string {
  const n = tel.replace(/\D/g, "");
  const d = n.startsWith("55") ? n.slice(2) : n;
  if (d.length < 10) return tel;
  const ddd = d.slice(0, 2);
  const num = d.slice(2);
  return `+55 (${ddd}) ${num.slice(0, -4)}-${num.slice(-4)}`;
}

// Link pra abrir a conversa no WhatsApp.
export function linkWhatsapp(tel: string): string {
  let n = tel.replace(/\D/g, "");
  if (!n.startsWith("55")) n = "55" + n;
  return `https://wa.me/${n}`;
}

// ISO -> "jul/2026" (mes/ano curto).
export function mesAno(iso: string): string {
  const [a, m] = iso.split("-").map(Number);
  const mm = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${mm[m - 1]}/${a}`;
}
