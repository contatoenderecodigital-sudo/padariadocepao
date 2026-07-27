import Shell from "@/components/Shell";
import { CLUBE_MOCK, PEDIDOS_MOCK } from "@/lib/mock";
import { brl } from "@/lib/tipos";

// Clube de selos: o número do WhatsApp é a carteirinha. Sem app, sem senha.
// Passa pelo Shell (portao de login): sempre por requisicao.
export const dynamic = "force-dynamic";

export default function Page() {
  const fila = PEDIDOS_MOCK.filter((p) => p.status === "confirmado").length;
  const ordenados = [...CLUBE_MOCK].sort((a, b) => b.selos - a.selos);

  return (
    <Shell ativo="/clube" filaCount={fila}>
      <div className="px-8 py-7">
        <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">
          Clube Doce Pão
        </div>
        <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold text-vinho mt-1">
          Os clientes que voltam sempre
        </h1>
        <p className="text-sm text-ink-soft mt-1 mb-6 max-w-2xl">
          O número do WhatsApp já é a carteirinha — sem app, sem senha, sem cartãozinho pra guardar.
          A cada compra, um selo. Juntou, ganha o prêmio.
        </p>

        <div className="flex flex-col gap-3">
          {ordenados.map((m) => {
            const quase = m.selos >= m.metaSelos - 1;
            return (
              <div
                key={m.telefone}
                className={
                  "bg-white border rounded-2xl px-5 py-4 flex items-center gap-5 " +
                  (quase ? "border-dourado shadow-sm" : "border-line")
                }
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-vinho">{m.nome}</span>
                    {quase && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-dourado/15 text-[color:#8a6d12] border border-dourado/40 font-semibold">
                        1 selo do prêmio!
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-soft mt-0.5">
                    {m.telefone} · última compra {m.ultimaCompra} · {brl(m.totalGasto)} no total
                  </div>
                </div>

                {/* selos */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {Array.from({ length: m.metaSelos }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        "w-5 h-5 rounded-full grid place-items-center text-[10px] " +
                        (i < m.selos
                          ? "bg-dourado text-vinho-d font-bold"
                          : "bg-cream2 border border-line text-transparent")
                      }
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-vinho tabular-nums">
                    {m.selos}/{m.metaSelos}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
