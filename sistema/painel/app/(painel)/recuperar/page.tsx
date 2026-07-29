import Recuperar from "@/components/Recuperar";
import { carregarParados, carregarStatsRecuperacao } from "@/lib/dados";
import { lerSessao } from "@/lib/auth";
import { nomeNegocioAtual } from "@/lib/negocio";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await lerSessao();
  const [parados, stats] = await Promise.all([
    carregarParados(sessao?.negocioId),
    carregarStatsRecuperacao(sessao?.negocioId),
  ]);
  const nomeNegocio = await nomeNegocioAtual("");
  return (
    <Recuperar
      parados={parados}
      nomeNegocio={nomeNegocio}
      agora={Date.now()}
      stats={stats}
    />
  );
}
