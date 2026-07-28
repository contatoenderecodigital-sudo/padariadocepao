"use client";

// Orçamentos parados (cliente sumiu sem confirmar). O sistema cobra sozinho,
// mas aqui a equipe vê e pode disparar na hora. É o "dinheiro que evapora".

import { useState } from "react";
import type { Pedido } from "@/lib/tipos";
import { brl } from "@/lib/tipos";

function dataBr(iso: string | null) {
  if (!iso) return "combinado";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function Recuperar({ parados, nomeNegocio = "" }: { parados: Pedido[]; nomeNegocio?: string }) {
  const [cobrados, setCobrados] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<Pedido | null>(null);
  const total = parados.reduce((s, p) => s + p.totalCentavos, 0);

  return (
    <div className="px-8 py-7">
      <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">
        Recuperar orçamento
      </div>
      <h1 className="font-title text-3xl font-bold text-vinho mt-1">
        Clientes que sumiram sem confirmar
      </h1>
      <p className="text-sm text-ink-soft mt-1 mb-6 max-w-2xl">
        O sistema cobra sozinho, na hora certa. Mas se quiser dar um empurrãozinho, é um toque.
        É dinheiro que hoje ia embora sem ninguém perceber.
      </p>

      <div className="mb-5 inline-flex items-center gap-3 grad-vinho text-white rounded-xl px-5 py-3">
        <span className="font-title text-2xl font-bold text-grad-dourado">
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
              className="glass rounded-2xl p-5 flex items-center justify-between gap-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="tracking-tight-apple text-lg font-bold text-vinho">
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
                <div className="tracking-tight-apple text-xl font-bold text-vinho">
                  {brl(p.totalCentavos)}
                </div>
                {cobrado ? (
                  <div className="mt-2 text-sm text-[color:var(--brand-cobre-d)] font-medium">
                    ✓ Cobrança enviada
                  </div>
                ) : (
                  <button
                    onClick={() => setPreview(p)}
                    className="mt-2 btn-cobre press px-4 py-2 text-sm font-semibold transition"
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
        uma mensagem gentil no WhatsApp, <i>"Oi! Seu orçamento pro dia 20 ainda está de pé. Quer
        confirmar?"</i>, sem vocês levantarem um dedo.
      </div>

      {/* Preview do TEMPLATE (fora da janela de 24h, via whatsapp_business_messaging) */}
      {preview ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="glass rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[11px] uppercase tracking-wider text-dourado font-semibold">
              Template aprovado · fora da janela de 24h
            </div>
            <h3 className="tracking-tight-apple text-lg font-bold text-vinho mt-1 mb-4">
              Mensagem que vai pro WhatsApp de {preview.clienteNome}
            </h3>

            {/* balão estilo WhatsApp */}
            <div className="bg-[#f4e8d6] border border-line/60 rounded-xl rounded-tl-sm px-4 py-3 text-sm text-ink leading-relaxed">
              Oi {preview.clienteNome.split(" ")[0]}! 😊 Seu orçamento da {nomeNegocio || "padaria"} pro dia{" "}
              <b>{dataBr(preview.retiradaData)}</b> ainda está de pé, no valor de{" "}
              <b>{brl(preview.totalCentavos)}</b>. Quer confirmar? É só responder aqui 🙏
            </div>

            <div className="text-[11px] text-ink-soft/70 mt-2">
              Enviado como <b>template</b> (mensagem iniciada pela empresa fora das 24h).
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setPreview(null)}
                className="px-3.5 py-2 rounded-lg text-sm text-ink-soft border border-line hover:bg-cream2 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setCobrados((c) => ({ ...c, [preview.id]: true }));
                  setPreview(null);
                }}
                className="btn-cobre press px-4 py-2 text-sm font-semibold transition"
              >
                Enviar template
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
