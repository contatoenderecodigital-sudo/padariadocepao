"use client";

// Orçamentos parados (cliente sumiu sem confirmar). O sistema cobra sozinho,
// mas aqui a equipe vê e pode disparar na hora. É o "dinheiro que evapora".

import { useState } from "react";
import type { Pedido } from "@/lib/tipos";
import { brl } from "@/lib/tipos";

export default function Recuperar({ parados }: { parados: Pedido[] }) {
  const [cobrados, setCobrados] = useState<Record<string, boolean>>({});
  const total = parados.reduce((s, p) => s + p.totalCentavos, 0);

  return (
    <div className="px-8 py-7">
      <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">
        Recuperar orçamento
      </div>
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold text-vinho mt-1">
        Clientes que sumiram sem confirmar
      </h1>
      <p className="text-sm text-ink-soft mt-1 mb-6 max-w-2xl">
        O sistema cobra sozinho, na hora certa. Mas se quiser dar um empurrãozinho, é um toque.
        É dinheiro que hoje ia embora sem ninguém perceber.
      </p>

      <div className="mb-5 inline-flex items-center gap-3 bg-vinho text-white rounded-xl px-5 py-3">
        <span className="font-[family-name:var(--font-serif)] text-2xl font-bold text-dourado-l">
          {brl(total)}
        </span>
        <span className="text-sm text-white/85">parados, esperando um "sim"</span>
      </div>

      <div className="flex flex-col gap-4">
        {parados.map((p) => {
          const cobrado = cobrados[p.id];
          return (
            <div
              key={p.id}
              className="bg-white border border-line rounded-2xl p-5 flex items-center justify-between gap-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--font-serif)] text-lg font-bold text-vinho">
                    {p.clienteNome}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-cream2 text-ink-soft border border-line">
                    parado há 1 dia
                  </span>
                </div>
                <div className="text-sm text-ink-soft mt-1">
                  {p.itens.map((i) => `${i.qtd}× ${i.produto}`).join(" · ")}
                </div>
                {p.observacoes && (
                  <div className="text-xs text-ink-soft/80 italic mt-1">"{p.observacoes}"</div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="font-[family-name:var(--font-serif)] text-xl font-bold text-vinho">
                  {brl(p.totalCentavos)}
                </div>
                {cobrado ? (
                  <div className="mt-2 text-sm text-[color:var(--brand-wa)] font-medium">
                    ✓ Cobrança enviada
                  </div>
                ) : (
                  <button
                    onClick={() => setCobrados((c) => ({ ...c, [p.id]: true }))}
                    className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-wa hover:brightness-95 transition shadow-sm"
                  >
                    Cobrar de volta
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-sm text-ink-soft bg-cream2/60 border border-line rounded-xl px-5 py-4 max-w-2xl">
        <b className="text-vinho">Como a cobrança automática funciona:</b> o sistema manda sozinho
        uma mensagem gentil no WhatsApp — <i>"Oi! Seu orçamento pro dia 20 ainda está de pé. Quer
        confirmar?"</i> — sem vocês levantarem um dedo.
      </div>
    </div>
  );
}
