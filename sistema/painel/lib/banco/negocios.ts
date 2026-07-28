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

// Cache em memória (TTL curto) — evita bater no banco a CADA troca de aba.
// A instância serverless fica quente entre navegações, então quase toda
// navegação lê daqui em vez de ir ao Supabase. Nome muda? some em <2min.
const _cacheMarca = new Map<string, { marca: NegocioMarca | null; exp: number }>();
export async function carregarMarcaCache(negocioId: string): Promise<NegocioMarca | null> {
  const agora = Date.now();
  const hit = _cacheMarca.get(negocioId);
  if (hit && hit.exp > agora) return hit.marca;
  const marca = await carregarMarca(negocioId);
  _cacheMarca.set(negocioId, { marca, exp: agora + 120_000 });
  return marca;
}
