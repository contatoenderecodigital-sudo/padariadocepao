// ============================================================================
//  FILA DE IMPRESSÃO (lado servidor) — o que a ponte na padaria consome.
//  A ponte NÃO fala com o Postgres direto (não expor o banco). Ela chama a
//  API /api/fila, que usa estas funções. Isolamento por negocio_id.
// ============================================================================

import { query } from "./db";

export type JobImpressao = {
  filaId: string;
  pedido: {
    id: string;
    clienteNome: string;
    clienteTelefone: string;
    retiradaData: string | null;
    retiradaHora: string | null;
    pessoas: number | null;
    totalCentavos: number;
    observacoes: string | null;
    itens: { produto: string; categoria: string; qtd: number }[];
  };
};

// Jobs pendentes de um negócio, já com o pedido montado pro cupom.
export async function jobsPendentes(negocioId: string): Promise<JobImpressao[]> {
  const linhas = await query<{
    fila_id: string;
    pedido_id: string;
    cliente_nome: string | null;
    cliente_telefone: string | null;
    retirada_data: string | null;
    retirada_hora: string | null;
    pessoas: number | null;
    total_centavos: number;
    observacoes: string | null;
    itens: { produto: string; categoria: string | null; qtd: number }[] | null;
  }>(
    `select f.id as fila_id, p.id as pedido_id,
            c.nome as cliente_nome, c.telefone as cliente_telefone,
            p.retirada_data, p.retirada_hora, p.pessoas, p.total_centavos, p.observacoes,
            coalesce(
              (select json_agg(json_build_object('produto', i.produto, 'categoria', i.categoria, 'qtd', i.qtd))
               from pedido_itens i where i.pedido_id = p.id),
              '[]'::json) as itens
       from fila_impressao f
       join pedidos p on p.id = f.pedido_id
       left join clientes c on c.id = p.cliente_id
      where f.negocio_id = $1 and f.status = 'pendente'
      order by f.criado_em asc
      limit 20`,
    [negocioId],
  );

  return linhas.map((l) => ({
    filaId: l.fila_id,
    pedido: {
      id: l.pedido_id,
      clienteNome: l.cliente_nome || "-",
      clienteTelefone: l.cliente_telefone || "",
      retiradaData: l.retirada_data,
      retiradaHora: l.retirada_hora ? l.retirada_hora.slice(0, 5) : null,
      pessoas: l.pessoas,
      totalCentavos: l.total_centavos,
      observacoes: l.observacoes,
      itens: (l.itens ?? []).map((i) => ({
        produto: i.produto,
        categoria: i.categoria || "",
        qtd: i.qtd,
      })),
    },
  }));
}

// A ponte confirma que imprimiu (ou falhou). Marca a fila e o pedido.
export async function marcarImpresso(
  negocioId: string,
  filaId: string,
  ok: boolean,
  cupomTexto?: string,
  erro?: string,
): Promise<void> {
  if (ok) {
    await query(
      `update fila_impressao set status = 'impresso', impresso_em = now(), cupom_texto = $3
         where id = $1 and negocio_id = $2`,
      [filaId, negocioId, cupomTexto ?? null],
    );
    await query(
      `update pedidos set status = 'impresso', impresso_em = now()
         where id = (select pedido_id from fila_impressao where id = $1) and negocio_id = $2`,
      [filaId, negocioId],
    );
  } else {
    await query(
      `update fila_impressao set status = 'erro', tentativas = tentativas + 1, erro_msg = $3
         where id = $1 and negocio_id = $2`,
      [filaId, negocioId, (erro ?? "").slice(0, 300)],
    );
  }
}
