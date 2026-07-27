import Shell from "@/components/Shell";
import FilaAprovacao from "@/components/FilaAprovacao";
import { carregarFilaAprovacao } from "@/lib/dados";
import { lerSessao } from "@/lib/auth";
import { aprovarPedido, recusarPedido } from "./acoes";

// Sempre fresco: a fila muda a cada pedido que chega do WhatsApp.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Escopa pelo negócio do usuário logado (isolamento multi-tenant).
  const sessao = await lerSessao();
  const fila = await carregarFilaAprovacao(sessao?.negocioId);
  return (
    <Shell ativo="/" filaCount={fila.length}>
      <FilaAprovacao inicial={fila} aprovar={aprovarPedido} recusar={recusarPedido} />
    </Shell>
  );
}
