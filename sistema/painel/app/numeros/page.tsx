import Shell from "@/components/Shell";
import { METRICAS_MOCK as M, PEDIDOS_MOCK } from "@/lib/mock";
import { brl } from "@/lib/tipos";
import { nomeNegocioAtual } from "@/lib/negocio";

function Card({
  destaque = false,
  valor,
  rotulo,
  sub,
}: {
  destaque?: boolean;
  valor: string;
  rotulo: string;
  sub?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl p-6 border " +
        (destaque
          ? "grad-vinho text-white border-transparent shadow-lg"
          : "glass")
      }
    >
      <div
        className={
          "font-title text-4xl font-bold leading-none " +
          (destaque ? "text-grad-dourado" : "text-vinho")
        }
      >
        {valor}
      </div>
      <div className={"text-sm font-medium mt-2 " + (destaque ? "text-white" : "text-ink")}>
        {rotulo}
      </div>
      {sub && (
        <div className={"text-xs mt-1 " + (destaque ? "text-white/70" : "text-ink-soft")}>{sub}</div>
      )}
    </div>
  );
}

// Passa pelo Shell (portao de login): sempre por requisicao.
export const dynamic = "force-dynamic";

export default async function Page() {
  const fila = PEDIDOS_MOCK.filter((p) => p.status === "confirmado").length;
  const maxDia = Math.max(...M.porDia.map((d) => d.pedidos));
  const nome = await nomeNegocioAtual();

  return (
    <Shell ativo="/numeros" filaCount={fila}>
      <div className="px-8 py-7">
        <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">
          Números do mês
        </div>
        <h1 className="font-title text-3xl font-bold text-vinho mt-1">
          O que a {nome} ganhou este mês
        </h1>
        <p className="text-sm text-ink-soft mt-1 mb-6 max-w-2xl">
          Não é achismo. É o resultado em número: tempo de volta, pedidos atendidos e dinheiro que
          voltou pro caixa.
        </p>

        {/* linha de destaque */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            destaque
            valor={`${M.horasEconomizadas}h`}
            rotulo="de volta pra vocês"
            sub="tempo que a equipe não gastou digitando no WhatsApp"
          />
          <Card
            destaque
            valor={brl(M.valorRecuperadoCentavos)}
            rotulo="em orçamentos recuperados"
            sub={`${M.orcamentosRecuperados} clientes que iam sumir e voltaram`}
          />
          <Card
            destaque
            valor={brl(M.faturamentoWhatsappCentavos)}
            rotulo="faturados pelo WhatsApp"
            sub="pedidos que entraram pelo atendimento"
          />
        </div>

        {/* segunda linha */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Card valor={String(M.atendimentosMes)} rotulo="atendimentos" sub="no mês" />
          <Card
            valor={String(M.atendimentosForaHorario)}
            rotulo="fora do horário"
            sub="madrugada, domingo, feriado — a IA atendeu"
          />
          <Card valor={String(M.pedidosNoDia)} rotulo="pedidos hoje" />
          <Card valor={String(M.orcamentosRecuperados)} rotulo="recuperados" sub="este mês" />
        </div>

        {/* gráfico de barrinhas por dia */}
        <div className="mt-8 glass rounded-2xl p-6">
          <div className="text-sm font-semibold text-vinho mb-1">Pedidos por dia da semana</div>
          <div className="text-xs text-ink-soft mb-5">
            O pico é sexta e sábado — o atendimento aguenta o movimento sem ninguém travar.
          </div>
          <div className="flex items-end gap-3" style={{ height: "180px" }}>
            {M.porDia.map((d) => (
              <div key={d.dia} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <div className="text-xs font-semibold text-vinho">{d.pedidos}</div>
                <div
                  className="grad-dourado w-full rounded-t-md min-h-[4px]"
                  style={{ height: `${Math.round((d.pedidos / maxDia) * 120)}px` }}
                />
                <div className="text-xs text-ink-soft">{d.dia}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
