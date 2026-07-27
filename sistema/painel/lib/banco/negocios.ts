// ============================================================================
//  NEGÓCIOS — dados do tenant (nome, cores). Usado pra brandar o painel com o
//  negócio do usuário logado (multi-tenant). Isolado por negocio_id.
// ============================================================================

import { queryUm } from "./db";

export type NegocioMarca = {
  nome: string;
  corPrimaria: string | null;
  corDestaque: string | null;
};

export async function carregarMarca(negocioId: string): Promise<NegocioMarca | null> {
  const n = await queryUm<{ nome: string; cor_primaria: string | null; cor_destaque: string | null }>(
    "select nome, cor_primaria, cor_destaque from negocios where id = $1",
    [negocioId],
  );
  if (!n) return null;
  return { nome: n.nome, corPrimaria: n.cor_primaria, corDestaque: n.cor_destaque };
}
