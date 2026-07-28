"use client";

// Atendimentos estilo WeChat/Digisac: três painéis flutuantes (lista · chat ·
// info do contato), fundo suave, avatares, balões com avatar ao lado, acento
// verde (cor do tenant). Conversas REAIS do banco.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Conversa } from "@/lib/tipos";

// --- Avatares: iniciais + cor determinística a partir do nome ---
const CORES = ["#5b8c7b", "#c58a3d", "#7a6cae", "#4a7ba6", "#a85b52", "#6f9b52", "#b0713e", "#8a5a86"];
function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
}
function corDoNome(nome: string) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return CORES[h % CORES.length];
}
function Avatar({ nome, tam = 42 }: { nome: string; tam?: number }) {
  return (
    <div
      className="shrink-0 rounded-2xl grid place-items-center text-white font-semibold select-none"
      style={{ width: tam, height: tam, background: corDoNome(nome), fontSize: tam * 0.34 }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </div>
  );
}
// Avatar da IA (o "atendente" da padaria)
function AvatarIA({ tam = 30 }: { tam?: number }) {
  return (
    <div
      className="shrink-0 rounded-xl grid place-items-center text-white select-none bg-wa"
      style={{ width: tam, height: tam }}
      aria-hidden="true"
    >
      <svg width={tam * 0.6} height={tam * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="7" width="16" height="12" rx="3" />
        <path d="M9 7V4h6v3M9 12h.01M15 12h.01M9 16h6" />
      </svg>
    </div>
  );
}

function seloTxt(estado: Conversa["estado"]) {
  if (estado === "ia") return { txt: "IA atendendo", dot: "bg-wa", cls: "text-[color:var(--brand-wa)]" };
  if (estado === "precisa_humano") return { txt: "Precisa de você", dot: "bg-dourado", cls: "text-[color:#8a6d12]" };
  return { txt: "Resolvido", dot: "bg-ink-soft/40", cls: "text-ink-soft" };
}

function Balao({ de, texto, hora, nome }: Conversa["mensagens"][number] & { nome: string }) {
  if (de === "cliente") {
    return (
      <div className="flex items-end gap-2 justify-start">
        <Avatar nome={nome} tam={30} />
        <div className="max-w-[70%] rounded-2xl rounded-bl-md bg-white text-ink px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-line shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {texto}
          <div className="text-[10px] mt-1 text-ink-soft/50 text-right">{hora}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2 justify-end">
      <div className="max-w-[70%] rounded-2xl rounded-br-md bg-wa text-white px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-line shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
        {de === "equipe" && <div className="text-[10px] uppercase tracking-wider text-white/70 mb-0.5">Equipe</div>}
        {texto}
        <div className="text-[10px] mt-1 text-white/70 text-right">{hora}</div>
      </div>
      <AvatarIA tam={30} />
    </div>
  );
}

export default function Atendimentos({ conversas }: { conversas: Conversa[] }) {
  const [busca, setBusca] = useState("");
  const [ativaId, setAtivaId] = useState<string | undefined>(conversas[0]?.id);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return conversas;
    return conversas.filter((c) => c.clienteNome.toLowerCase().includes(q) || c.previa.toLowerCase().includes(q));
  }, [busca, conversas]);

  const ativa = conversas.find((c) => c.id === ativaId) ?? filtradas[0] ?? conversas[0];

  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [ativa?.id]);

  const s = ativa ? seloTxt(ativa.estado) : null;

  return (
    <div className="px-8 py-7">
      <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">Atendimentos</div>
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold text-vinho mt-1 mb-5">
        O WhatsApp de vocês, atendendo sozinho
      </h1>

      {/* três painéis flutuantes sobre fundo suave */}
      <div className="rounded-3xl p-3 bg-[color-mix(in_srgb,var(--brand-vinho)_6%,#eef1f4)]">
        <div className="grid grid-cols-[300px_1fr_270px] gap-3 h-[620px]">
          {/* ---------- lista ---------- */}
          <div className="bg-white rounded-2xl shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="p-3">
              <div className="relative">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar"
                  className="w-full bg-[#f3f4f7] rounded-xl pl-9 pr-3 py-2 text-[13px] text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-wa/25"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2">
              {filtradas.length === 0 && (
                <div className="px-3 py-10 text-[13px] text-ink-soft/70 text-center">
                  {conversas.length === 0 ? "Nenhuma conversa ainda." : "Nada encontrado."}
                </div>
              )}
              {filtradas.map((c) => {
                const on = c.id === ativa?.id;
                const cs = seloTxt(c.estado);
                return (
                  <button
                    key={c.id}
                    onClick={() => setAtivaId(c.id)}
                    className={"w-full text-left px-2.5 py-2.5 rounded-xl flex gap-3 transition-colors mb-0.5 " + (on ? "bg-wa/10" : "hover:bg-[#f3f4f7]")}
                  >
                    <Avatar nome={c.clienteNome} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink text-[13px] truncate">{c.clienteNome}</span>
                        <span className="text-[10px] text-ink-soft/60 shrink-0">{c.ultimaHora}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[12px] text-ink-soft truncate">{c.previa}</span>
                        {c.naoLidas > 0 && (
                          <span className="text-[10px] min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-wa text-white font-bold shrink-0">
                            {c.naoLidas}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={"w-1.5 h-1.5 rounded-full " + cs.dot} />
                        <span className={"text-[10px] " + cs.cls}>{cs.txt}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------- chat ---------- */}
          <div className="bg-white rounded-2xl shadow-sm flex flex-col min-h-0 overflow-hidden">
            {!ativa ? (
              <div className="flex-1 grid place-items-center text-[13px] text-ink-soft/70">Selecione uma conversa.</div>
            ) : (
              <>
                <div className="px-5 h-14 border-b border-line/70 flex items-center">
                  <span className="font-semibold text-ink">{ativa.clienteNome}</span>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0 bg-[#f7f8fa]">
                  <div className="self-center text-[10px] text-ink-soft/50 bg-black/[0.04] rounded-full px-2.5 py-0.5">Hoje</div>
                  {ativa.mensagens.map((m, i) => (
                    <Balao key={i} {...m} nome={ativa.clienteNome} />
                  ))}
                  <div ref={fim} />
                </div>
                <div className="px-4 py-3 border-t border-line/70">
                  <div className="flex items-center gap-2 bg-[#f3f4f7] rounded-xl px-3 py-2">
                    <span className="w-2 h-2 rounded-full bg-wa inline-block animate-pulse" />
                    <span className="text-[12px] text-ink-soft flex-1">
                      A IA está cuidando desta conversa. Vocês só entram se quiserem.
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ---------- info do contato ---------- */}
          <div className="bg-white rounded-2xl shadow-sm flex flex-col min-h-0 overflow-hidden">
            {!ativa ? (
              <div className="flex-1" />
            ) : (
              <div className="p-5 overflow-y-auto min-h-0">
                <div className="flex flex-col items-center text-center pb-4 border-b border-line/70">
                  <Avatar nome={ativa.clienteNome} tam={72} />
                  <div className="font-[family-name:var(--font-serif)] text-lg font-bold text-vinho mt-3">
                    {ativa.clienteNome}
                  </div>
                  <div className="text-xs text-ink-soft">{ativa.clienteTelefone}</div>
                  {s && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[11px]">
                      <span className={"w-1.5 h-1.5 rounded-full " + s.dot} />
                      <span className={s.cls}>{s.txt}</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-soft/60">Telefone</div>
                    <div className="text-ink">{ativa.clienteTelefone}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-soft/60">Mensagens na conversa</div>
                    <div className="text-ink">{ativa.mensagens.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-soft/60">Canal</div>
                    <div className="text-ink flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-wa inline-block" /> WhatsApp
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-cream2/60 border border-line/70 px-3 py-3 text-xs text-ink-soft leading-relaxed">
                  A IA responde 24h com a voz da padaria e monta o orçamento. Quando precisa de
                  gente de verdade, ela passa pra equipe, nunca inventa.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
