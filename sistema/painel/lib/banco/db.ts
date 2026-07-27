// ============================================================================
//  CONEXÃO COM O POSTGRES (Supabase gerenciado) — driver pg, pool reaproveitado.
//
//  O app conecta como UM usuário do banco. O isolamento entre clientes
//  (multi-tenant) é feito no código: TODA query filtra por negocio_id.
//
//  ⚠️ NO VERCEL (serverless) use a string do CONNECTION POOLER do Supabase
//  (porta 6543, modo "Transaction"), NÃO a conexão direta (5432). O pooler
//  aguenta as muitas conexões curtas do serverless; a direta estoura.
//  Ex: DATABASE_URL=postgres://postgres.xxxx:senha@aws-0-...pooler.supabase.com:6543/postgres
// ============================================================================

import { Pool, types, type QueryResultRow } from "pg";

// ⚠️ IMPORTANTE: por padrão o pg converte date/timestamp em objeto Date do JS.
// O painel trata data como TEXTO ("YYYY-MM-DD") e faz .split()/.slice() nela.
// Então forçamos date/timestamp a virem como STRING crua (evita "e.split is not
// a function" ao renderizar pedidos reais).
types.setTypeParser(1082, (v) => v); // date        -> "2026-07-28"
types.setTypeParser(1114, (v) => v); // timestamp   -> string crua
types.setTypeParser(1184, (v) => v); // timestamptz -> string crua

// Está configurado? (o painel cai no mock se não houver banco — bom pra demo.)
export const bancoConfigurado = Boolean(
  process.env.DATABASE_URL || process.env.PGHOST || process.env.PGDATABASE,
);

// Um pool por processo. Reusado entre requisições (Next mantém o módulo vivo).
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function criarPool(): Pool {
  const cfg = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {}; // pega PGHOST/PGPORT/... do ambiente automaticamente
  // Supabase exige SSL. PGSSL=0 desliga (só pra Postgres local sem SSL).
  const ssl = process.env.PGSSL === "0" ? undefined : { rejectUnauthorized: false };
  // No serverless, poucas conexões por instância (o pooler do Supabase agrega).
  const max = Number(process.env.PG_POOL_MAX || 3);
  return new Pool({ ...cfg, ssl, max, idleTimeoutMillis: 30_000, allowExitOnIdle: true } as never);
}

export function pool(): Pool {
  if (!bancoConfigurado) {
    throw new Error("Banco não configurado: defina DATABASE_URL (ou PGHOST/PGDATABASE) no .env");
  }
  if (!global.__pgPool) global.__pgPool = criarPool();
  return global.__pgPool;
}

// Atalho de query tipada. Uso: const linhas = await query<Tipo>('select ...', [x])
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const r = await pool().query<T>(sql, params as never[]);
  return r.rows;
}

// Query que espera 0 ou 1 linha.
export async function queryUm<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const linhas = await query<T>(sql, params);
  return linhas[0] ?? null;
}
