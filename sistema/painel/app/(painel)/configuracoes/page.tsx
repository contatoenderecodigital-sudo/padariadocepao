import AvisoDoDia from "@/components/AvisoDoDia";
import { lerSessao } from "@/lib/auth";
import { bancoConfigurado } from "@/lib/banco/db";
import { carregarAvisoDoDia } from "@/lib/banco/negocios";
import { ehHojeBR } from "@/lib/aviso";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessao = await lerSessao();

  let texto: string | null = null;
  let atualizadoEm: string | null = null;
  if (bancoConfigurado && sessao?.negocioId) {
    const a = await carregarAvisoDoDia(sessao.negocioId);
    texto = a.texto;
    atualizadoEm = a.atualizadoEm;
  } else {
    // Modo demo (sem banco): exemplo preenchido pra mostrar a feature.
    texto = "Hoje o pão francês vai só até as 18h. Amanhã cedo tem fresquinho de novo.";
    atualizadoEm = new Date().toISOString();
  }
  const ativoHoje = ehHojeBR(atualizadoEm);

  return (
    <div className="px-8 py-7">
      <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">Configurações</div>
      <h1 className="font-title text-3xl font-bold text-cream mt-1">Configurações</h1>
      <p className="text-sm text-cream/60 mt-1 mb-8 max-w-2xl">
        Ajustes do atendimento. Comece pelo aviso do dia, o jeito rápido de a IA saber as novidades de hoje.
      </p>

      <AvisoDoDia texto={texto} atualizadoEm={atualizadoEm} ativoHoje={ativoHoje} />
    </div>
  );
}
