import Shell from "@/components/Shell";
import Recuperar from "@/components/Recuperar";
import { ORCAMENTOS_PARADOS_MOCK, PEDIDOS_MOCK } from "@/lib/mock";

// Passa pelo Shell (portao de login): sempre por requisicao.
export const dynamic = "force-dynamic";

export default function Page() {
  const fila = PEDIDOS_MOCK.filter((p) => p.status === "confirmado").length;
  return (
    <Shell ativo="/recuperar" filaCount={fila}>
      <Recuperar parados={ORCAMENTOS_PARADOS_MOCK} />
    </Shell>
  );
}
