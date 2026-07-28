import PedidosDoDia from "@/components/PedidosDoDia";
import { PEDIDOS_MOCK } from "@/lib/mock";

// Painel de producao por departamento (a visao da cozinha).
export const dynamic = "force-dynamic";

export default function Page() {
  return <PedidosDoDia pedidos={PEDIDOS_MOCK} />;
}
