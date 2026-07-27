import Shell from "@/components/Shell";
import Atendimentos from "@/components/Atendimentos";
import { CONVERSAS_MOCK, PEDIDOS_MOCK } from "@/lib/mock";

// Passa pelo Shell (portao de login): sempre por requisicao.
export const dynamic = "force-dynamic";

export default function Page() {
  const fila = PEDIDOS_MOCK.filter((p) => p.status === "confirmado").length;
  return (
    <Shell ativo="/atendimentos" filaCount={fila}>
      <Atendimentos conversas={CONVERSAS_MOCK} />
    </Shell>
  );
}
