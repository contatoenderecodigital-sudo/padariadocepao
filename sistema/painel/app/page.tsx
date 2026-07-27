import Shell from "@/components/Shell";
import FilaAprovacao from "@/components/FilaAprovacao";
import { carregarFilaAprovacao } from "@/lib/dados";
import { aprovarPedido, recusarPedido } from "./acoes";

// Sempre fresco: a fila muda a cada pedido que chega do WhatsApp.
export const dynamic = "force-dynamic";

export default async function Home() {
  const fila = await carregarFilaAprovacao();
  return (
    <Shell ativo="/" filaCount={fila.length}>
      <FilaAprovacao inicial={fila} aprovar={aprovarPedido} recusar={recusarPedido} />
    </Shell>
  );
}
