import { METRICAS_MOCK as M } from "@/lib/mock";
import { nomeNegocioAtual } from "@/lib/negocio";
import { NumberTicker } from "@/components/ui/number-ticker";

function Card({
  destaque = false,
  valor,
  rotulo,
  sub,
}: {
  destaque?: boolean;
  valor: React.ReactNode;
  rotulo: string;
  sub?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl p-6 border " +
        (destaque
          ? "glass-strong text-white border-transparent"
          : "glass")
      }
    >
      <div
        className={
          "font-title text-4xl font-bold leading-none " +
          (destaque ? "text-grad-dourado" : "text-cream")
        }
      >
        {valor}
      </div>
      <div className={"text-sm font-medium mt-2 " + (destaque ? "text-white" : "text-cream")}>
        {rotulo}
      </div>
      {sub && (
        <div className={"text-xs mt-1 " + (destaque ? "text-white/70" : "text-cream/70")}>{sub}</div>
      )}
    </div>
  );
}

// Passa pelo Shell (portao de login): sempre por requisicao.
export const dynamic = "force-dynamic";

export default async function Page() {
  const maxDia = Math.max(...M.porDia.map((d) => d.pedidos));
  const nome = await nomeNegocioAtual();

  return (
      <div className="px-8 py-7">
        <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">
          Números do mês
        </div>
        <h1 className="font-title text-3xl font-bold text-cream mt-1">
          O que a {nome} ganhou este mês
        </h1>
        <p className="text-sm text-cream/70 mt-1 mb-6 max-w-2xl">
          Não é achismo. É o resultado em número: tempo de volta, pedidos atendidos e dinheiro que
          voltou pro caixa.
        </p>

        {/* linha de destaque */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            destaque
            valor={<NumberTicker value={M.horasEconomizadas} suffix="h" />}
            rotulo="de volta pra vocês"
            sub="tempo que a equipe não gastou digitando no WhatsApp"
          />
          <Card
            destaque
            valor={<NumberTicker value={M.valorRecuperadoCentavos / 100} prefix="R$ " decimals={2} />}
            rotulo="em orçamentos recuperados"
            sub={`${M.orcamentosRecuperados} clientes que iam sumir e voltaram`}
          />
          <Card
            destaque
            valor={<NumberTicker value={M.faturamentoWhatsappCentavos / 100} prefix="R$ " decimals={2} />}
            rotulo="faturados pelo WhatsApp"
            sub="pedidos que entraram pelo atendimento"
          />
        </div>

        {/* segunda linha */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Card valor={<NumberTicker value={M.atendimentosMes} />} rotulo="atendimentos" sub="no mês" />
          <Card
            valor={<NumberTicker value={M.atendimentosForaHorario} />}
            rotulo="fora do horário"
            sub="madrugada, domingo, feriado. A IA atendeu"
          />
          <Card valor={<NumberTicker value={M.pedidosNoDia} />} rotulo="pedidos hoje" />
          <Card valor={<NumberTicker value={M.orcamentosRecuperados} />} rotulo="recuperados" sub="este mês" />
        </div>

        {/* gráfico de barrinhas por dia */}
        <div className="mt-8 glass rounded-2xl p-6">
          <div className="text-sm font-semibold text-cream mb-1">Pedidos por dia da semana</div>
          <div className="text-xs text-cream/70 mb-5">
            O pico é sexta e sábado. O atendimento aguenta o movimento sem ninguém travar.
          </div>
          <div className="flex items-end gap-3" style={{ height: "180px" }}>
            {M.porDia.map((d) => (
              <div key={d.dia} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <div className="text-xs font-semibold text-cream">{d.pedidos}</div>
                <div
                  className="grad-dourado w-full rounded-t-md min-h-[4px]"
                  style={{ height: `${Math.round((d.pedidos / maxDia) * 120)}px` }}
                />
                <div className="text-xs text-cream/70">{d.dia}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
