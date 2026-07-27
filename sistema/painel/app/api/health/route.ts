// Diagnóstico: testa a conexão com o banco DE DENTRO do Vercel e devolve o erro
// real se falhar. Rota pública temporária só pra debug.
import { NextResponse } from "next/server";
import { queryUm } from "@/lib/banco/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  try {
    const r = await queryUm<{ n: string }>("select count(*)::text as n from negocios");
    return NextResponse.json({
      ok: true,
      negocios: r?.n ?? "?",
      ms: Date.now() - t0,
      temDatabaseUrl: Boolean(process.env.DATABASE_URL),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      erro: e instanceof Error ? e.message : String(e),
      ms: Date.now() - t0,
      temDatabaseUrl: Boolean(process.env.DATABASE_URL),
    });
  }
}
