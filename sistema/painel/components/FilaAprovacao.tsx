"use client";

// A TELA-ESTRELA. A fila de pedidos esperando aprovação da equipe.
// Cada pedido é um card: cliente, retirada, itens, total, observação.
// Aprovar -> some com animação e "vai pra cozinha". Recusar -> some.
//
// Anima otimista (some na hora) e grava no banco por trás via Server Action.

import { useState } from "react";
import type { Pedido } from "@/lib/tipos";
import { brl } from "@/lib/tipos";
import CupomPreview from "./CupomPreview";

function formataData(iso: string | null) {
  if (!iso) return null;
  const [a, m, d] = iso.split("-");
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const dt = new Date(Number(a), Number(m) - 1, Number(d));
  return `${dias[dt.getDay()]} ${d}/${m}`;
}

function CardPedido({
  pedido,
  onAprovar,
  onRecusar,
  onVerCupom,
  saindo,
}: {
  pedido: Pedido;
  onAprovar: (id: string) => void;
  onRecusar: (id: string) => void;
  onVerCupom: (p: Pedido) => void;
  saindo: boolean;
}) {
  const data = formataData(pedido.retiradaData);
  return (
    <div
      className={
        "glass rounded-[18px] overflow-hidden flex flex-col " +
        (saindo ? "card-out" : "")
      }
    >
      {/* Cabeçalho: cliente + retirada */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-white/10">
        <div className="min-w-0">
          <div className="tracking-tight-apple text-[19px] font-semibold text-cream truncate">
            {pedido.clienteNome}
          </div>
          <div className="text-[13px] text-cream/55 mt-1">{pedido.clienteTelefone}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-[0.15em] text-cream/45">Retirada</div>
          <div className="text-sm font-semibold text-cream mt-0.5">
            {data ?? "-"}{pedido.retiradaHora ? ` · ${pedido.retiradaHora}` : ""}
          </div>
          {pedido.pessoas ? (
            <span
              className="inline-block mt-2 text-[11px] font-semibold text-dourado px-2.5 py-0.5 rounded-full"
              style={{ background: "rgba(231,207,148,0.15)" }}
            >
              festa de {pedido.pessoas} pessoas
            </span>
          ) : null}
        </div>
      </div>

      {/* Corpo: itens */}
      <div className="px-6 py-4 flex-1 flex flex-col">
        <ul className="flex flex-col">
          {pedido.itens.map((it, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4 py-2 text-[14px]">
              <span className="text-cream/90 min-w-0">
                <span className="font-semibold text-cream">{it.qtd}×</span> {it.produto}
              </span>
              <span className="text-cream/65 tabular-nums shrink-0">
                {brl(it.subtotalCentavos)}
              </span>
            </li>
          ))}
        </ul>
        {pedido.observacoes ? (
          <div
            className="mt-3 flex items-start gap-2 text-[13px] text-cream/75 rounded-[10px] px-3 py-2.5 leading-relaxed"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <svg className="mt-[3px] shrink-0 text-dourado" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v12H8l-4 4V4Z" /><path d="M8 9h8M8 12.5h5" /></svg>
            <span><span className="font-semibold text-dourado">Obs:</span> {pedido.observacoes}</span>
          </div>
        ) : null}
      </div>

      {/* Rodapé: total + ações */}
      <div className="px-6 py-4 border-t border-white/10 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-cream/45">Total</div>
          <div className="font-title text-[26px] font-bold leading-none mt-1 text-grad-dourado">
            {brl(pedido.totalCentavos)}
          </div>
          <div className="text-[11px] text-cream/55 mt-1.5">pagamento na retirada</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onVerCupom(pedido)}
            className="btn-cobre press px-3.5 py-2 text-sm font-semibold"
          >
            Ver cupom
          </button>
          <button
            onClick={() => onRecusar(pedido.id)}
            className="btn-vermelho press px-3.5 py-2 text-sm font-semibold"
          >
            Recusar
          </button>
          <button
            onClick={() => onAprovar(pedido.id)}
            className="btn-verde press px-4 py-2 text-sm font-semibold"
          >
            Aprovar e imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FilaAprovacao({
  inicial,
  aprovar,
  recusar,
  nomeNegocio = "",
}: {
  inicial: Pedido[];
  aprovar?: (id: string) => Promise<{ ok: boolean }>;
  recusar?: (id: string) => Promise<{ ok: boolean }>;
  nomeNegocio?: string;
}) {
  const [fila, setFila] = useState(inicial);
  const [saindo, setSaindo] = useState<Record<string, boolean>>({});
  const [ultimo, setUltimo] = useState<{ nome: string; acao: "aprovado" | "recusado" } | null>(null);
  const [cupom, setCupom] = useState<Pedido | null>(null);

  function resolver(id: string, acao: "aprovado" | "recusado") {
    const p = fila.find((x) => x.id === id);
    setSaindo((s) => ({ ...s, [id]: true }));
    setUltimo(p ? { nome: p.clienteNome, acao } : null);
    // grava no banco por trás (se as ações vierem plugadas)
    const acaoServidor = acao === "aprovado" ? aprovar : recusar;
    acaoServidor?.(id).catch((e) => console.error("falha ao gravar:", e));
    setTimeout(() => {
      setFila((f) => f.filter((x) => x.id !== id));
      setSaindo((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    }, 320);
  }

  return (
    <div className="px-8 py-7">
      {/* cabeçalho */}
      <div className="flex items-end justify-between gap-4 mb-1">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">
            Fila de aprovação
          </div>
          <h1 className="font-title text-3xl font-bold text-cream mt-1">
            {fila.length > 0
              ? `${fila.length} pedido${fila.length > 1 ? "s" : ""} esperando você`
              : "Tudo aprovado 🎉"}
          </h1>
        </div>
      </div>
      <p className="text-sm text-cream/70 mb-6 max-w-xl">
        Chegaram pelo WhatsApp. Aprovou, sai impresso na cozinha na hora. Nenhum entra sem você.
      </p>

      {/* aviso do último resolvido */}
      {ultimo ? (
        <div
          className={
            "mb-5 text-sm rounded-lg px-4 py-2.5 border " +
            (ultimo.acao === "aprovado"
              ? "bg-cobre/15 border-cobre/40 text-[color:var(--brand-cobre-l)]"
              : "bg-white/[0.06] border-white/12 text-cream/70")
          }
        >
          {ultimo.acao === "aprovado" ? (
            <>Pedido de <b>{ultimo.nome}</b> aprovado, saiu na impressora da cozinha. 🖨️</>
          ) : (
            <>Pedido de <b>{ultimo.nome}</b> recusado.</>
          )}
        </div>
      ) : null}

      {/* grid de cards */}
      {fila.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {fila.map((p) => (
            <CardPedido
              key={p.id}
              pedido={p}
              saindo={!!saindo[p.id]}
              onAprovar={(id) => resolver(id, "aprovado")}
              onRecusar={(id) => resolver(id, "recusado")}
              onVerCupom={setCupom}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/12 glass-soft px-8 py-16 text-center">
          <div className="text-4xl mb-3">☕</div>
          <div className="tracking-tight-apple text-xl font-bold text-cream">
            Fila vazia
          </div>
          <p className="text-sm text-cream/70 mt-1">
            Quando um cliente fechar pedido no WhatsApp, ele aparece aqui.
          </p>
        </div>
      )}

      {cupom ? (
        <CupomPreview pedido={cupom} nomeNegocio={nomeNegocio} onClose={() => setCupom(null)} />
      ) : null}
    </div>
  );
}
