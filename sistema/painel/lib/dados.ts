// ============================================================================
//  FONTE DE DADOS — decide entre banco real e mock.
//  Com Supabase configurado (chaves no .env.local), lê do banco.
//  Sem chaves, cai no mock — o painel sempre abre, mesmo em demo.
//  As telas não sabem a diferença: recebem sempre o tipo `Pedido`.
// ============================================================================

import { bancoConfigurado } from "./banco/db";
import { PEDIDOS_MOCK } from "./mock";
import type { Pedido } from "./tipos";

export async function carregarFilaAprovacao(): Promise<Pedido[]> {
  if (!bancoConfigurado) {
    return PEDIDOS_MOCK.filter((p) => p.status === "confirmado");
  }
  const { listarFilaAprovacao } = await import("./banco/pedidos");
  return listarFilaAprovacao();
}
