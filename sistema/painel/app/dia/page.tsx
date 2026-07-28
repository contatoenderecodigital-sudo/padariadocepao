import Shell from "@/components/Shell";
import { PEDIDOS_MOCK } from "@/lib/mock";
import { brl } from "@/lib/tipos";

// Pedidos aprovados do dia, em ordem de hora de retirada. A visão da cozinha.
// Passa pelo Shell (portao de login): sempre por requisicao.
export const dynamic = "force-dynamic";

export default function Page() {
  const fila = PEDIDOS_MOCK.filter((p) => p.status === "confirmado").length;

  // pra demo: mostra os confirmados como se já estivessem aprovados pro dia
  const doDia = [...PEDIDOS_MOCK]
    .filter((p) => p.retiradaHora)
    .sort((a, b) => (a.retiradaHora ?? "").localeCompare(b.retiradaHora ?? ""));

  return (
    <Shell ativo="/dia" filaCount={fila}>
      <div className="px-8 py-7">
        <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">
          Pedidos do dia
        </div>
        <h1 className="font-title text-3xl font-bold text-vinho mt-1">
          O que a cozinha produz hoje
        </h1>
        <p className="text-sm text-ink-soft mt-1 mb-6 max-w-2xl">
          Em ordem de horário de retirada. Cada pedido já saiu impresso na cozinha quando foi
          aprovado — esta é a visão de acompanhamento.
        </p>

        <div className="flex flex-col gap-3">
          {doDia.map((p) => (
            <div
              key={p.id}
              className="glass rounded-2xl px-5 py-4 flex items-center gap-5"
            >
              {/* hora */}
              <div className="w-20 shrink-0 text-center">
                <div className="tracking-tight-apple text-2xl font-bold text-vinho leading-none">
                  {p.retiradaHora}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-ink-soft/60 mt-1">
                  retirada
                </div>
              </div>

              <div className="w-px self-stretch bg-line" />

              {/* cliente + itens */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-vinho">{p.clienteNome}</div>
                <div className="text-sm text-ink-soft mt-0.5">
                  {p.itens.map((i) => `${i.qtd}× ${i.produto}`).join(" · ")}
                </div>
                {p.observacoes && (
                  <div className="text-xs text-ink-soft/80 italic mt-1">"{p.observacoes}"</div>
                )}
              </div>

              {/* total */}
              <div className="text-right shrink-0">
                <div className="font-semibold text-vinho tabular-nums">{brl(p.totalCentavos)}</div>
                <div className="text-[11px] text-ink-soft mt-0.5">na retirada</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
