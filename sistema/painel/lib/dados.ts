// ============================================================================
//  FONTE DE DADOS — decide entre banco real e mock.
//  Com banco configurado, lê do banco escopado pelo negocioId (do login).
//  Sem banco, cai no mock — o painel sempre abre, mesmo em demo.
//  As telas não sabem a diferença: recebem sempre o tipo `Pedido`.
// ============================================================================

import { bancoConfigurado } from "./banco/db";
import { PEDIDOS_MOCK } from "./mock";
import type { Pedido } from "./tipos";

export async function carregarFilaAprovacao(negocioId?: string): Promise<Pedido[]> {
  if (!bancoConfigurado || !negocioId) {
    return PEDIDOS_MOCK.filter((p) => p.status === "confirmado");
  }
  const { listarFilaAprovacao } = await import("./banco/pedidos");
  return listarFilaAprovacao(negocioId);
}

export async function carregarParados(negocioId?: string): Promise<Pedido[]> {
  if (!bancoConfigurado || !negocioId) {
    return PEDIDOS_MOCK.filter((p) => p.status === "orcado");
  }
  const { listarParados } = await import("./banco/pedidos");
  return listarParados(negocioId);
}

export async function carregarConversas(negocioId?: string) {
  if (!bancoConfigurado || !negocioId) {
    const { CONVERSAS_MOCK } = await import("./mock");
    return CONVERSAS_MOCK;
  }
  const { listarConversas } = await import("./banco/atendimentos");
  return listarConversas(negocioId);
}
