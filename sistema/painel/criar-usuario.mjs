// ============================================================================
//  CRIAR USUÁRIO DO PAINEL — gera o hash bcrypt e insere no banco.
//
//  Rodar (com DATABASE_URL no ambiente ou no .env.local):
//    node --env-file=.env.local criar-usuario.mjs email@doce.com senha123 "Dona Maria"
//
//  O negócio usado é o NEGOCIO_PADRAO_ID do .env (Doce Pão por padrão).
// ============================================================================

import pg from "pg";
import bcrypt from "bcryptjs";

const [email, senha, nome] = process.argv.slice(2);
if (!email || !senha) {
  console.error('Uso: node criar-usuario.mjs email senha "Nome"');
  process.exit(1);
}
if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  console.error("Falta DATABASE_URL no ambiente. Rode com: node --env-file=.env.local criar-usuario.mjs ...");
  process.exit(1);
}
const negocioId = process.env.NEGOCIO_PADRAO_ID || "11111111-1111-1111-1111-111111111111";

const hash = await bcrypt.hash(senha, 10);
const db = new pg.Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {});

try {
  await db.query(
    `insert into usuarios (negocio_id, email, senha_hash, nome, papel)
     values ($1, $2, $3, $4, 'dono')
     on conflict (email) do update set senha_hash = excluded.senha_hash, nome = excluded.nome`,
    [negocioId, email.trim().toLowerCase(), hash, nome || null],
  );
  console.log(`✅ Usuário ${email} criado/atualizado no negócio ${negocioId}.`);
} catch (e) {
  console.error("Falha:", e.message);
  process.exit(1);
} finally {
  await db.end();
}
