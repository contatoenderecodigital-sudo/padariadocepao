import Shell from "@/components/Shell";
import Recuperar from "@/components/Recuperar";
import { carregarFilaAprovacao, carregarParados } from "@/lib/dados";
import { lerSessao } from "@/lib/auth";

// Passa pelo Shell (portao de login): sempre por requisicao.
export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await lerSessao();
  const [parados, fila] = await Promise.all([
    carregarParados(sessao?.negocioId),
    carregarFilaAprovacao(sessao?.negocioId),
  ]);
  let nomeNegocio = "";
  if (sessao) {
    const { carregarMarca } = await import("@/lib/banco/negocios");
    nomeNegocio = (await carregarMarca(sessao.negocioId))?.nome ?? "";
  }
  return (
    <Shell ativo="/recuperar" filaCount={fila.length}>
      <Recuperar parados={parados} nomeNegocio={nomeNegocio} />
    </Shell>
  );
}
