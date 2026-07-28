import Shell from "@/components/Shell";
import Atendimentos from "@/components/Atendimentos";
import { carregarConversas, carregarFilaAprovacao } from "@/lib/dados";
import { lerSessao } from "@/lib/auth";

// Passa pelo Shell (portao de login): sempre por requisicao.
export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await lerSessao();
  const [conversas, fila] = await Promise.all([
    carregarConversas(sessao?.negocioId),
    carregarFilaAprovacao(sessao?.negocioId),
  ]);
  return (
    <Shell ativo="/atendimentos" filaCount={fila.length}>
      <Atendimentos conversas={conversas} />
    </Shell>
  );
}
