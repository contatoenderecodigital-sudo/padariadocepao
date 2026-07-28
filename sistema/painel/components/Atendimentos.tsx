"use client";

// Atendimentos — extraído da referência WeChat: fundo lavanda suave, três
// painéis flutuantes com sombra difusa, avatares quadrados-arredondados,
// balões com avatar ao lado, área de digitação com ícones, painel de contato.
// Conversas REAIS do banco. Acento verde = cor do tenant.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Conversa } from "@/lib/tipos";

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
// Avatar quadrado-arredondado (estilo WeChat)
function Avatar({ nome, tam = 40, raio = 12 }: { nome: string; tam?: number; raio?: number }) {
  return (
    <div
      className="shrink-0 grid place-items-center text-white font-semibold select-none"
      style={{ width: tam, height: tam, borderRadius: raio, background: corDoNome(nome), fontSize: tam * 0.34 }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </div>
  );
}
function AvatarIA({ tam = 32 }: { tam?: number }) {
  return (
    <div className="shrink-0 grid place-items-center text-white select-none bg-wa" style={{ width: tam, height: tam, borderRadius: 10 }} aria-hidden="true">
      <svg width={tam * 0.58} height={tam * 0.58} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="16" height="11" rx="3" /><path d="M12 8V4M9 13h.01M15 13h.01M9.5 16.5h5" /><path d="M12 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
    </div>
  );
}

function estadoInfo(estado: Conversa["estado"]) {
  if (estado === "ia") return { txt: "IA atendendo", dot: "bg-wa", cls: "text-[color:var(--brand-wa)]" };
  if (estado === "precisa_humano") return { txt: "Precisa de você", dot: "bg-dourado", cls: "text-[color:#8a6d12]" };
  return { txt: "Resolvido", dot: "bg-ink-soft/40", cls: "text-ink-soft" };
}

function Balao({
  de, texto, hora, primeiro,
}: Conversa["mensagens"][number] & { primeiro: boolean }) {
  const margem = primeiro ? "mt-2.5" : "mt-1";
  if (de === "cliente") {
    return (
      <div className={"flex justify-start " + margem}>
        <div className="max-w-[62%] rounded-[14px] rounded-tl-[4px] bg-white text-ink pl-3.5 pr-2 py-2 text-[13.5px] leading-[1.45] whitespace-pre-line shadow-[0_1px_1.5px_rgba(0,0,0,0.10)]">
          {texto}
          <span className="text-[10px] text-ink-soft/35 ml-1.5 float-right relative top-[7px]">{hora}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={"flex justify-end " + margem}>
      <div className="max-w-[62%] rounded-[14px] rounded-tr-[4px] bg-wa text-white pl-3.5 pr-2 py-2 text-[13.5px] leading-[1.45] whitespace-pre-line shadow-[0_1px_2px_rgba(20,110,60,0.22)]">
        {de === "equipe" && <div className="text-[10px] uppercase tracking-wider text-white/70 mb-0.5">Equipe</div>}
        {texto}
        <span className="text-[10px] text-white/55 ml-1.5 float-right relative top-[7px]">{hora}</span>
      </div>
    </div>
  );
}

// ícone genérico da barra de digitação
function IconBtn({ children }: { children: React.ReactNode }) {
  return <button className="text-ink-soft/55 hover:text-ink-soft transition-colors" tabIndex={-1}>{children}</button>;
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

  const info = ativa ? estadoInfo(ativa.estado) : null;
  const SOMBRA = "0 10px 34px rgba(60,70,120,0.10)";

  return (
    <div className="px-6 py-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold mb-3">Atendimentos</div>

      {/* fundo lavanda suave com os painéis flutuando */}
      <div className="rounded-[26px] p-4" style={{ background: "linear-gradient(135deg,#eaedf6,#e6e9f3)" }}>
        <div className="grid grid-cols-[300px_1fr_268px] gap-4 h-[640px]">
          {/* ---------- lista ---------- */}
          <div className="bg-white rounded-[18px] flex flex-col min-h-0 overflow-hidden" style={{ boxShadow: SOMBRA }}>
            <div className="p-3 flex items-center gap-2">
              <div className="relative flex-1">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/45" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar"
                  className="w-full bg-[#f1f2f6] rounded-[10px] pl-9 pr-3 py-2 text-[13px] text-ink placeholder:text-ink-soft/45 focus:outline-none focus:ring-2 focus:ring-wa/25"
                />
              </div>
              <button className="w-9 h-9 rounded-[10px] bg-[#f1f2f6] grid place-items-center text-ink-soft/70 hover:bg-[#e9eaf0] transition-colors" tabIndex={-1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2">
              {filtradas.length === 0 && (
                <div className="px-3 py-10 text-[13px] text-ink-soft/60 text-center">
                  {conversas.length === 0 ? "Nenhuma conversa ainda." : "Nada encontrado."}
                </div>
              )}
              {filtradas.map((c) => {
                const on = c.id === ativa?.id;
                const ci = estadoInfo(c.estado);
                return (
                  <button
                    key={c.id}
                    onClick={() => setAtivaId(c.id)}
                    className={"w-full text-left px-2.5 py-2.5 rounded-[12px] flex gap-2.5 transition-colors mb-0.5 " + (on ? "bg-wa" : "hover:bg-[#f5f6f9]")}
                  >
                    <Avatar nome={c.clienteNome} tam={44} raio={12} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={"font-semibold text-[13.5px] truncate " + (on ? "text-white" : "text-ink")}>{c.clienteNome}</span>
                        <span className={"text-[10px] shrink-0 " + (on ? "text-white/70" : "text-ink-soft/55")}>{c.ultimaHora}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className={"text-[12px] truncate " + (on ? "text-white/85" : "text-ink-soft/90")}>{c.previa}</span>
                        {c.naoLidas > 0 && (
                          <span className={"text-[10px] min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full font-bold shrink-0 " + (on ? "bg-white text-wa" : "bg-[#f24e4e] text-white")}>
                            {c.naoLidas}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={"w-1.5 h-1.5 rounded-full " + (on ? "bg-white/80" : ci.dot)} />
                        <span className={"text-[10px] " + (on ? "text-white/85" : ci.cls)}>{ci.txt}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------- chat ---------- */}
          <div className="bg-white rounded-[18px] flex flex-col min-h-0 overflow-hidden" style={{ boxShadow: SOMBRA }}>
            {!ativa ? (
              <div className="flex-1 grid place-items-center text-[13px] text-ink-soft/60">Selecione uma conversa.</div>
            ) : (
              <>
                <div className="px-4 h-[60px] border-b border-line/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar nome={ativa.clienteNome} tam={40} raio={13} />
                    <div className="leading-tight">
                      <div className="font-semibold text-ink text-[14.5px]">{ativa.clienteNome}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-ink-soft/55 mt-0.5">
                        <span className={"w-1.5 h-1.5 rounded-full " + (info?.dot ?? "bg-wa")} />
                        {info?.txt}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-ink-soft/45">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15.5 5A9.5 9.5 0 0 1 19 8.5M14 9a4 4 0 0 1 1 1M4.5 3h3l1.5 5-2 1a12 12 0 0 0 6 6l1-2 5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 2.5 5a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="13" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3" strokeLinejoin="round" /></svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h.01M12 12h.01M19 12h.01" /></svg>
                  </div>
                </div>

                <div
                  className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3.5 min-h-0"
                  style={{
                    backgroundColor: "#efe9e1",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cg fill='none' stroke='%236b5a3e' stroke-opacity='0.06' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='24' cy='28' r='8'/%3E%3Cpath d='M66 20l7 7-7 7-7-7z'/%3E%3Cpath d='M104 34h14M111 27v14'/%3E%3Cpath d='M28 80q9-11 20 0'/%3E%3Ccircle cx='104' cy='96' r='7'/%3E%3Cpath d='M16 110h16M16 118h10'/%3E%3Cpath d='M120 118l5-6 5 6'/%3E%3C/g%3E%3C/svg%3E\")",
                    backgroundSize: "140px 140px",
                  }}
                >
                  <div className="self-center text-[10px] text-ink-soft/60 bg-white/80 backdrop-blur rounded-full px-3 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">Hoje</div>
                  {ativa.mensagens.map((m, i) => {
                    const ant = ativa.mensagens[i - 1];
                    const primeiro = !ant || ant.de !== m.de;
                    return <Balao key={i} {...m} primeiro={primeiro} />;
                  })}
                  <div ref={fim} />
                </div>

                <div className="border-t border-line/60 bg-white px-3 py-2.5 flex items-center gap-2">
                  <IconBtn><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M8 14a4 4 0 0 0 8 0M9 9h.01M15 9h.01" strokeLinecap="round" /></svg></IconBtn>
                  <IconBtn><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m21 15-5-5L5 21M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" strokeLinejoin="round" /></svg></IconBtn>
                  <div className="flex-1 min-w-0 flex items-center gap-2 rounded-full bg-[#f1f2f6] px-4 py-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-wa inline-block animate-pulse shrink-0" />
                    <span className="text-[12.5px] text-ink-soft/70 truncate">A IA está respondendo — toque para assumir a conversa</span>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-wa grid place-items-center text-white shrink-0 hover:brightness-105 transition" tabIndex={-1}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ---------- info do contato ---------- */}
          <div className="bg-white rounded-[18px] flex flex-col min-h-0 overflow-hidden" style={{ boxShadow: SOMBRA }}>
            {!ativa ? (
              <div className="flex-1" />
            ) : (
              <div className="p-5 overflow-y-auto min-h-0">
                <div className="flex flex-col items-center text-center pb-4">
                  <Avatar nome={ativa.clienteNome} tam={68} raio={18} />
                  <div className="font-semibold text-ink text-[15px] mt-3">{ativa.clienteNome}</div>
                  <div className="text-xs text-ink-soft/70 mt-0.5">{ativa.clienteTelefone}</div>
                  {info && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] bg-[#f1f2f6] rounded-full px-2.5 py-1">
                      <span className={"w-1.5 h-1.5 rounded-full " + info.dot} />
                      <span className={info.cls}>{info.txt}</span>
                    </span>
                  )}
                </div>

                <div className="border-t border-line/60 pt-4 space-y-3.5">
                  {[
                    ["Telefone", ativa.clienteTelefone],
                    ["Canal", "WhatsApp"],
                    ["Mensagens", String(ativa.mensagens.length)],
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-ink-soft/55">{label}</span>
                      <span className="text-[13px] text-ink font-medium text-right truncate">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[14px] p-4 text-white" style={{ background: "linear-gradient(135deg,var(--color-wa),color-mix(in srgb,var(--color-wa) 78%,#000))" }}>
                  <div className="text-[11px] uppercase tracking-wider text-white/75">Atendimento</div>
                  <div className="text-sm font-medium mt-1 leading-snug">
                    A IA responde 24h com a voz da padaria e monta o orçamento sozinha.
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button className="w-full py-2.5 rounded-[12px] border border-wa/40 text-wa text-[13px] font-semibold hover:bg-wa/[0.06] transition flex items-center justify-center gap-2" tabIndex={-1}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v7M10 10.5V6a2 2 0 0 0-4 0v8a8 8 0 0 0 8 8h1a8 8 0 0 0 8-8v-1a2 2 0 0 0-4 0" /></svg>
                    Assumir conversa
                  </button>
                  <button className="w-full py-2.5 rounded-[12px] bg-[#f1f2f6] text-ink-soft text-[13px] font-medium hover:bg-[#e9eaf0] transition flex items-center justify-center gap-2" tabIndex={-1}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" /><path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" /></svg>
                    Ver pedidos do cliente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
