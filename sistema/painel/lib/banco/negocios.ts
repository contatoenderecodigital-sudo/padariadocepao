// ============================================================================
//  NEGÓCIOS — dados do tenant (nome, cores). Usado pra brandar o painel com o
//  negócio do usuário logado (multi-tenant). Isolado por negocio_id.
// ============================================================================

import { query, queryUm } from "./db";

// Mapeia o WhatsApp conectado (Embedded Signup) pro tenant: grava phone_id,
// waba_id, token, numero/perfil e a hora da conexao no config. O webhook usa
// whatsapp_phone_id pra rotear as mensagens desse numero pra este negocio.
export async function salvarWhatsappTenant(
  negocioId: string,
  dados: {
    phoneId: string;
    wabaId: string;
    token: string;
    numero?: string | null;
    perfil?: string | null;
    conectadoEm?: string;
  },
): Promise<void> {
  await query(
    `update negocios set config = coalesce(config, '{}'::jsonb) || jsonb_build_object(
       'whatsapp_phone_id', $2::text,
       'whatsapp_waba_id', $3::text,
       'whatsapp_token', $4::text,
       'whatsapp_numero', $5::text,
       'whatsapp_perfil', $6::text,
       'whatsapp_conectado_em', $7::text,
       'ia_ativa', true
     ) where id = $1`,
    [
      negocioId,
      dados.phoneId,
      dados.wabaId,
      dados.token,
      dados.numero ?? null,
      dados.perfil ?? null,
      dados.conectadoEm ?? new Date().toISOString(),
    ],
  );
}

// Liga/desliga a resposta automatica da IA (sem desconectar o numero).
export async function definirIaAtiva(negocioId: string, ativa: boolean): Promise<void> {
  await query(
    `update negocios set config = coalesce(config, '{}'::jsonb) || jsonb_build_object('ia_ativa', $2::boolean)
     where id = $1`,
    [negocioId, ativa],
  );
}

// Desconecta o WhatsApp: limpa as chaves do config (o numero deixa de rotear).
export async function desconectarWhatsapp(negocioId: string): Promise<void> {
  await query(
    `update negocios set config = config
       - 'whatsapp_phone_id' - 'whatsapp_waba_id' - 'whatsapp_token'
       - 'whatsapp_numero' - 'whatsapp_perfil' - 'whatsapp_conectado_em'
     where id = $1`,
    [negocioId],
  );
}

// Estado da conexao pro painel: conectado?, numero, perfil, IA ligada, quando
// conectou e quantas respostas a IA enviou hoje.
export type ConexaoWhatsapp = {
  conectado: boolean;
  phoneId: string | null;
  numero: string | null;
  perfil: string | null;
  iaAtiva: boolean;
  conectadoEm: string | null;
  mensagensHoje: number;
  problema?: boolean; // conexao caiu (alerta vermelho). Deteccao de queda: futuro.
};
export async function carregarConexao(negocioId: string): Promise<ConexaoWhatsapp> {
  const n = await queryUm<{
    phone_id: string | null;
    numero: string | null;
    perfil: string | null;
    conectado_em: string | null;
    ia_ativa: boolean;
  }>(
    `select config->>'whatsapp_phone_id' as phone_id,
            config->>'whatsapp_numero' as numero,
            config->>'whatsapp_perfil' as perfil,
            config->>'whatsapp_conectado_em' as conectado_em,
            coalesce((config->>'ia_ativa')::boolean, true) as ia_ativa
       from negocios where id = $1`,
    [negocioId],
  );
  const conectado = Boolean(n?.phone_id);
  let mensagensHoje = 0;
  if (conectado) {
    const c = await queryUm<{ c: number }>(
      `select count(*)::int as c from mensagens
        where negocio_id = $1 and papel = 'assistant' and criado_em >= current_date`,
      [negocioId],
    );
    mensagensHoje = c?.c ?? 0;
  }
  return {
    conectado,
    phoneId: n?.phone_id ?? null,
    numero: n?.numero ?? null,
    perfil: n?.perfil ?? null,
    iaAtiva: n?.ia_ativa ?? true,
    conectadoEm: n?.conectado_em ?? null,
    mensagensHoje,
  };
}

// Credenciais do WhatsApp DESTE negocio (salvas pelo Embedded Signup no config).
// O webhook usa isso pra responder pelo numero conectado do cliente, nao pelo
// token global. Se o negocio ainda nao conectou, volta null e cai no env.
export type CredsWhatsapp = { phoneId: string | null; token: string | null; iaAtiva: boolean };
export async function carregarCredsWhatsapp(negocioId: string): Promise<CredsWhatsapp> {
  const n = await queryUm<{ phone_id: string | null; token: string | null; ia_ativa: boolean }>(
    `select config->>'whatsapp_phone_id' as phone_id, config->>'whatsapp_token' as token,
            coalesce((config->>'ia_ativa')::boolean, true) as ia_ativa
       from negocios where id = $1`,
    [negocioId],
  );
  return { phoneId: n?.phone_id ?? null, token: n?.token ?? null, iaAtiva: n?.ia_ativa ?? true };
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
