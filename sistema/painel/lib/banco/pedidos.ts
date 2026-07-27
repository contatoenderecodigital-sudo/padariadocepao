// ============================================================================
//  PEDIDOS (lado do painel) — lê a fila de aprovação e muda status (Postgres puro).
//  Mapeia as linhas pro tipo `Pedido` que as telas já usam.
//  Sem banco configurado, o painel cai no mock (ver lib/dados.ts).
//  Isolamento: toda query filtra por negocio_id.
// ============================================================================

import { query } from "./db";
import type { Pedido, PedidoStatus, ItemPedido } from "../tipos";

const NEGOCIO = process.env.NEGOCIO_PADRAO_ID ?? "";

type LinhaFila = {
  id: string;
  status: PedidoStatus;
  retirada_data: string | null;
  retirada_hora: string | null;
  pessoas: number | null;
  total_centavos: number;
  observacoes: string | null;
  criado_em: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  itens: ItemBruto[] | null;
};
type ItemBruto = {
  produto: string;
  categoria: string | null;
  qtd: number;
  unit_centavos: number;
  subtotal_centavos: number;
};

function mapear(l: LinhaFila): Pedido {
  return {
    id: l.id,
    clienteNome: l.cliente_nome || "Cliente",
    clienteTelefone: l.cliente_telefone || "",
    status: l.status,
    retiradaData: l.retirada_data,
    retiradaHora: l.retirada_hora ? l.retirada_hora.slice(0, 5) : null,
    pessoas: l.pessoas,
    totalCentavos: l.total_centavos,
    observacoes: l.observacoes,
    criadoEm: l.criado_em,
    itens: (l.itens ?? []).map(
      (i): ItemPedido => ({
        produto: i.produto,
        categoria: i.categoria || "",
        qtd: i.qtd,
        unitCentavos: i.unit_centavos,
        subtotalCentavos: i.subtotal_centavos,
      }),
    ),
  };
}

// Fila de aprovação: pedidos 'confirmado' com seus itens e o cliente.
// Os itens vêm agregados em JSON (um SELECT só, sem N+1).
export async function listarFilaAprovacao(): Promise<Pedido[]> {
  const linhas = await query<LinhaFila>(
    `select p.id, p.status, p.retirada_data, p.retirada_hora, p.pessoas,
            p.total_centavos, p.observacoes, p.criado_em,
            c.nome as cliente_nome, c.telefone as cliente_telefone,
            coalesce(
              (select json_agg(json_build_object(
                 'produto', i.produto, 'categoria', i.categoria, 'qtd', i.qtd,
                 'unit_centavos', i.unit_centavos, 'subtotal_centavos', i.subtotal_centavos))
               from pedido_itens i where i.pedido_id = p.id),
              '[]'::json) as itens
       from pedidos p
       left join clientes c on c.id = p.cliente_id
      where p.negocio_id = $1 and p.status = 'confirmado'
      order by p.criado_em asc`,
    [NEGOCIO],
  );
  return linhas.map(mapear);
}

// Muda o status de um pedido. 'aprovado' dispara o trigger da fila de impressão.
export async function mudarStatus(pedidoId: string, status: PedidoStatus): Promise<void> {
  const carimbo =
    status === "confirmado" ? ", confirmado_em = now()" : "";
  await query(
    `update pedidos set status = $1${carimbo} where id = $2 and negocio_id = $3`,
    [status, pedidoId, NEGOCIO],
  );
}
