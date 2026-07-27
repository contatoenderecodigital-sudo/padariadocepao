// Diagnóstico: confirma que date/timestamp vêm como STRING (não Date), que era
// a causa do 500 (e.split is not a function) ao renderizar pedidos. Temporário.
import { NextResponse } from "next/server";
import { queryUm } from "@/lib/banco/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await queryUm<{ retirada_data: unknown; criado_em: unknown }>(
      "select retirada_data, criado_em from pedidos where retirada_data is not null limit 1",
    );
    // simula o que o painel faz: .split() na data (crashava se fosse Date)
    let splitOk = false;
    try {
      String((r?.retirada_data as string) ?? "").split("-");
      splitOk = typeof r?.retirada_data === "string";
    } catch {
      splitOk = false;
    }
    return NextResponse.json({
      ok: true,
      retirada_data: r?.retirada_data ?? null,
      tipo_retirada: typeof r?.retirada_data, // esperado: "string"
      tipo_criado: typeof r?.criado_em, // esperado: "string"
      split_funciona: splitOk, // esperado: true
    });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: e instanceof Error ? e.message : String(e) });
  }
}
