// ============================================================================
//  NEGÓCIOS — dados do tenant (nome, cores). Usado pra brandar o painel com o
//  negócio do usuário logado (multi-tenant). Isolado por negocio_id.
// ============================================================================

import { query, queryUm } from "./db";

// Mapeia o WhatsApp conectado (Embedded Signup) pro tenant: grava phone_id,
// waba_id e o token do negocio no config. O webhook usa whatsapp_phone_id pra
// rotear as mensagens desse numero pra este negocio.
export async function salvarWhatsappTenant(
  negocioId: string,
  dados: { phoneId: string; wabaId: string; token: string },
): Promise<void> {
  await query(
    `update negocios set config = coalesce(config, '{}'::jsonb) || jsonb_build_object(
       'whatsapp_phone_id', $2::text,
       'whatsapp_waba_id', $3::text,
       'whatsapp_token', $4::text
     ) where id = $1`,
    [negocioId, dados.phoneId, dados.wabaId, dados.token],
  );
}

// Credenciais do WhatsApp DESTE negocio (salvas pelo Embedded Signup no config).
// O webhook usa isso pra responder pelo numero conectado do cliente, nao pelo
// token global. Se o negocio ainda nao conectou, volta null e cai no env.
export type CredsWhatsapp = { phoneId: string | null; token: string | null };
export async function carregarCredsWhatsapp(negocioId: string): Promise<CredsWhatsapp> {
  const n = await queryUm<{ phone_id: string | null; token: string | null }>(
    `select config->>'whatsapp_phone_id' as phone_id, config->>'whatsapp_token' as token
       from negocios where id = $1`,
    [negocioId],
  );
  return { phoneId: n?.phone_id ?? null, token: n?.token ?? null };
}

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
