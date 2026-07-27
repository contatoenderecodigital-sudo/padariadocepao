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
