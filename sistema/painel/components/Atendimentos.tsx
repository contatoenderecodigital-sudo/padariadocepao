"use client";

// A JOIA: mostra a IA atendendo no WhatsApp com a voz da Doce Pão.
// Lista de conversas à esquerda, conversa aberta à direita (estilo WhatsApp).
// Demonstra: IA responde 24h, monta orçamento, e PUXA humano quando precisa.

import { useState } from "react";
import type { Conversa } from "@/lib/tipos";

function selo(estado: Conversa["estado"]) {
  if (estado === "ia")
    return { txt: "IA atendendo", cls: "bg-wa/12 text-[color:var(--brand-wa)] border-wa/30" };
  if (estado === "precisa_humano")
    return { txt: "Precisa de você", cls: "bg-dourado/15 text-[color:#8a6d12] border-dourado/40" };
  return { txt: "Resolvido", cls: "bg-cream2 text-ink-soft border-line" };
}

function Balao({ de, texto, hora }: Conversa["mensagens"][number]) {
  const meu = de !== "cliente"; // IA/equipe à direita
  const bolha =
    de === "cliente"
      ? "bg-white border border-line text-ink"
      : de === "ia"
        ? "bg-wa text-white"
        : "bg-vinho text-white";
  return (
    <div className={"flex " + (meu ? "justify-end" : "justify-start")}>
      <div className={"max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line shadow-sm " + bolha}>
        {de === "equipe" && (
          <div className="text-[10px] uppercase tracking-wider text-white/70 mb-0.5">Equipe</div>
        )}
        {texto}
        <div className={"text-[10px] mt-1 " + (meu ? "text-white/70" : "text-ink-soft/60")}>{hora}</div>
      </div>
    </div>
  );
}

export default function Atendimentos({ conversas }: { conversas: Conversa[] }) {
  const [ativa, setAtiva] = useState(conversas[0]);

  return (
    <div className="px-8 py-7">
      <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">
        Atendimentos
      </div>
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold text-vinho mt-1">
        O WhatsApp de vocês, atendendo sozinho
      </h1>
      <p className="text-sm text-ink-soft mt-1 mb-6 max-w-2xl">
        A IA responde com a voz da Doce Pão, 24 horas. Quando o cliente precisa de gente de verdade,
        ela chama vocês — nunca inventa.
      </p>

      <div className="grid grid-cols-[320px_1fr] gap-5 h-[560px]">
        {/* lista de conversas */}
        <div className="bg-white border border-line rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-line text-sm font-semibold text-vinho">
            Conversas
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversas.map((c) => {
              const s = selo(c.estado);
              const on = c.id === ativa.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setAtiva(c)}
                  className={
                    "w-full text-left px-4 py-3 border-b border-line/70 transition-colors " +
                    (on ? "bg-cream2" : "hover:bg-cream")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink text-sm truncate">{c.clienteNome}</span>
                    <span className="text-[11px] text-ink-soft/70 shrink-0">{c.ultimaHora}</span>
                  </div>
                  <div className="text-xs text-ink-soft truncate mt-0.5">{c.previa}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={"text-[10px] px-2 py-0.5 rounded-full border " + s.cls}>
                      {s.txt}
                    </span>
                    {c.naoLidas > 0 && (
                      <span className="text-[10px] w-4 h-4 grid place-items-center rounded-full bg-dourado text-vinho-d font-bold">
                        {c.naoLidas}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* conversa aberta */}
        <div className="bg-cream2/50 border border-line rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-line bg-white flex items-center justify-between">
            <div>
              <div className="font-semibold text-vinho">{ativa.clienteNome}</div>
              <div className="text-xs text-ink-soft">{ativa.clienteTelefone}</div>
            </div>
            <span className={"text-[11px] px-2.5 py-1 rounded-full border " + selo(ativa.estado).cls}>
              {selo(ativa.estado).txt}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
            {ativa.mensagens.map((m, i) => (
              <Balao key={i} {...m} />
            ))}
          </div>

          {ativa.estado === "precisa_humano" ? (
            <div className="px-5 py-3 border-t border-line bg-dourado/10 text-sm text-[color:#8a6d12] flex items-center gap-2">
              👋 A IA passou pra vocês. É só responder aqui que o cliente recebe no WhatsApp.
            </div>
          ) : (
            <div className="px-5 py-3 border-t border-line bg-white text-sm text-ink-soft flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-wa inline-block" />
              A IA está cuidando desta conversa. Vocês só entram se quiserem.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
