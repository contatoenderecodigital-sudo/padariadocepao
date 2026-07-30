// Fila de aprovação (pedidos 'confirmado') pro auto-update do painel.

import { lerSessao } from "@/lib/auth";
import { carregarFilaAprovacao } from "@/lib/dados";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessao = await lerSessao();
  const fila = await carregarFilaAprovacao(sessao?.negocioId);
  return Response.json(fila);
}
