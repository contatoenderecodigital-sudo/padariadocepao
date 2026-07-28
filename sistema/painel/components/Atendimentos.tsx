"use client";

// A JOIA — a IA atendendo no WhatsApp, com cara de WhatsApp de verdade:
// busca, avatares, balões, tique de entregue, fundo texturizado. Coeso com a
// marca do tenant (cores por CSS var). Real: puxa as conversas do banco.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Conversa } from "@/lib/tipos";

// --- Avatares: iniciais + cor determinística a partir do nome ---
const CORES = ["#6e1f30", "#2f5d50", "#bb921f", "#8a5a2b", "#3a6ea5", "#9c4722", "#5b7c5a", "#7a4a7a"];
function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
}
function corDoNome(nome: string) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return CORES[h % CORES.length];
}
function Avatar({ nome, tam = 44 }: { nome: string; tam?: number }) {
  return (
    <div
      className="shrink-0 rounded-full grid place-items-center text-white font-semibold"
      style={{ width: tam, height: tam, background: corDoNome(nome), fontSize: tam * 0.36 }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </div>
  );
}

function selo(estado: Conversa["estado"]) {
  if (estado === "ia") return { txt: "IA atendendo", cls: "bg-wa/12 text-[color:var(--brand-wa)] border-wa/30" };
  if (estado === "precisa_humano")
    return { txt: "Precisa de você", cls: "bg-dourado/15 text-[color:#8a6d12] border-dourado/40" };
  return { txt: "Resolvido", cls: "bg-cream2 text-ink-soft border-line" };
}

// Tique duplo de "entregue" (estilo WhatsApp) pras mensagens da IA.
function Tique() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="inline-block ml-1 -mb-0.5">
      <path d="M1 5.5 4 8.5 9.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 8.5 12 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Balao({ de, texto, hora }: Conversa["mensagens"][number]) {
  const meu = de !== "cliente";
  if (de === "cliente") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[76%] rounded-2xl rounded-tl-sm bg-white text-ink px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line shadow-sm">
          {texto}
          <div className="text-[10px] mt-1 text-ink-soft/55 text-right">{hora}</div>
        </div>
      </div>
    );
  }
  const bolha = de === "ia" ? "bg-wa text-white" : "bg-vinho text-white";
  return (
    <div className="flex justify-end">
      <div className={"max-w-[76%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line shadow-sm " + bolha}>
        {de === "equipe" && <div className="text-[10px] uppercase tracking-wider text-white/70 mb-0.5">Equipe</div>}
        {texto}
        <div className="text-[10px] mt-1 text-white/70 text-right flex items-center justify-end">
          {hora}
          {de === "ia" && <Tique />}
        </div>
      </div>
    </div>
  );
}

export default function Atendimentos({ conversas }: { conversas: Conversa[] }) {
  const [busca, setBusca] = useState("");
  const [ativaId, setAtivaId] = useState<string | undefined>(conversas[0]?.id);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return conversas;
    return conversas.filter(
      (c) => c.clienteNome.toLowerCase().includes(q) || c.previa.toLowerCase().includes(q),
    );
  }, [busca, conversas]);

  const ativa = conversas.find((c) => c.id === ativaId) ?? filtradas[0] ?? conversas[0];

  // Auto-scroll pra última mensagem ao trocar de conversa.
  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [ativa?.id]);

  return (
    <div className="px-8 py-7">
      <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">Atendimentos</div>
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold text-vinho mt-1">
        O WhatsApp de vocês, atendendo sozinho
      </h1>
      <p className="text-sm text-ink-soft mt-1 mb-6 max-w-2xl">
        A IA responde com a voz da padaria, 24 horas. Quando o cliente precisa de gente de verdade,
        ela chama vocês, nunca inventa.
      </p>

      <div className="grid grid-cols-[340px_1fr] gap-5 h-[600px] rounded-2xl overflow-hidden border border-line shadow-sm">
        {/* ------- lista de conversas ------- */}
        <div className="bg-white flex flex-col border-r border-line min-h-0">
          <div className="px-4 pt-4 pb-3 border-b border-line">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-vinho">Conversas</span>
              <span className="text-[11px] text-ink-soft bg-cream2 rounded-full px-2 py-0.5">
                {conversas.length}
              </span>
            </div>
            <div className="relative">
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar conversa"
                className="w-full bg-cream2/70 rounded-full pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-wa/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {filtradas.length === 0 && (
              <div className="px-4 py-10 text-sm text-ink-soft/80 text-center">
                {conversas.length === 0
                  ? "Nenhuma conversa ainda. Quando um cliente chamar no WhatsApp, aparece aqui."
                  : "Nada encontrado."}
              </div>
            )}
            {filtradas.map((c) => {
              const s = selo(c.estado);
              const on = c.id === ativa?.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setAtivaId(c.id)}
                  className={
                    "w-full text-left px-3 py-3 flex gap-3 border-b border-line/60 transition-colors " +
                    (on ? "bg-cream2" : "hover:bg-cream")
                  }
                >
                  <Avatar nome={c.clienteNome} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink text-sm truncate">{c.clienteNome}</span>
                      <span className="text-[11px] text-ink-soft/70 shrink-0">{c.ultimaHora}</span>
                    </div>
                    <div className="text-xs text-ink-soft truncate mt-0.5">{c.previa}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={"text-[10px] px-2 py-0.5 rounded-full border " + s.cls}>{s.txt}</span>
                      {c.naoLidas > 0 && (
                        <span className="text-[10px] min-w-4 h-4 px-1 grid place-items-center rounded-full bg-wa text-white font-bold">
                          {c.naoLidas}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------- conversa aberta ------- */}
        <div className="flex flex-col min-h-0 min-w-0">
          {!ativa ? (
            <div className="flex-1 grid place-items-center text-sm text-ink-soft px-6 text-center bg-cream2/40">
              Selecione uma conversa à esquerda.
            </div>
          ) : (
            <>
              {/* cabeçalho do chat */}
              <div className="px-5 py-2.5 border-b border-line bg-white flex items-center gap-3">
                <Avatar nome={ativa.clienteNome} tam={40} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink truncate">{ativa.clienteNome}</div>
                  <div className="text-xs text-ink-soft truncate">{ativa.clienteTelefone}</div>
                </div>
                <span className={"text-[11px] px-2.5 py-1 rounded-full border shrink-0 " + selo(ativa.estado).cls}>
                  {selo(ativa.estado).txt}
                </span>
              </div>

              {/* mensagens (fundo texturizado tipo WhatsApp) */}
              <div
                className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2 min-h-0"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(110,31,48,0.035) 1px, transparent 1px) 0 0 / 20px 20px, var(--color-cream)",
                }}
              >
                {ativa.mensagens.map((m, i) => (
                  <Balao key={i} {...m} />
                ))}
                <div ref={fim} />
              </div>

              {/* rodapé de status */}
              {ativa.estado === "precisa_humano" ? (
                <div className="px-5 py-3 border-t border-line bg-dourado/10 text-sm text-[color:#8a6d12] flex items-center gap-2">
                  👋 A IA passou pra vocês. É só responder aqui que o cliente recebe no WhatsApp.
                </div>
              ) : (
                <div className="px-5 py-3 border-t border-line bg-white text-sm text-ink-soft flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-wa inline-block animate-pulse" />
                  A IA está cuidando desta conversa. Vocês só entram se quiserem.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
