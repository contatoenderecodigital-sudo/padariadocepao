"use client";

// Preview dos cupons da cozinha: 1 ticket por estacao + o master do caixa.
// Modal premium (glass escuro) com tickets em papel serrilhado. A IMPRESSAO
// de verdade (window.print) sai preto e branco, mono, bobina estreita, sem
// nenhum efeito visual (ver @media print no globals.css).

import { useState } from "react";
import type { Pedido } from "@/lib/tipos";
import { brl, formatarTelefoneBR } from "@/lib/tipos";
import { deptoDe, deptoInfo, type DeptoId } from "@/lib/departamentos";
import { X, Printer } from "lucide-react";

function fmtData(iso: string | null) {
  if (!iso) return "a confirmar";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

// icone SVG por estacao (mesmos da tela de producao) + caixa pro master.
function EstacaoIcone({ id, size = 13 }: { id: DeptoId | "caixa"; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    padaria: <path d="M4 13c0-3 3-5 8-5s8 2 8 5c0 2-2 3-2 3H6s-2-1-2-3ZM7 16v3M12 16v3M17 16v3" />,
    salgados: <path d="M12 3c3 3 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9Z" />,
    confeitaria: <path d="M6 21v-6h12v6M8 15v-3a4 4 0 0 1 8 0v3M12 8V5M10.5 5h3" />,
    bolos: <path d="M4 20h16v-6H4v6ZM6 14v-3a6 6 0 0 1 12 0v3M12 8V4M10.5 4.5h3" />,
    caixa: <path d="M4 7h16v13H4zM4 7l2-3h12l2 3M9 12h6" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {paths[id]}
    </svg>
  );
}

type Badge = { nome: string; cor: string; id: DeptoId | "caixa" };

function Ticket({
  badge,
  itens,
  pedido,
  nomeNegocio,
  master,
  hide,
  onImprimir,
}: {
  badge: Badge;
  itens: Pedido["itens"];
  pedido: Pedido;
  nomeNegocio: string;
  master?: boolean;
  hide?: boolean;
  onImprimir: () => void;
}) {
  return (
    <div className={"flex flex-col items-center gap-2.5 shrink-0 " + (hide ? "hide-print" : "")}>
      <div
        className="cupom-ticket w-[248px] rounded-t-[10px] px-4 pt-4 pb-5 font-mono text-[12px] leading-tight text-black"
        style={{ background: "#fdfbf7", boxShadow: "0 12px 34px rgba(0,0,0,0.4)" }}
      >
        <div className="flex justify-center mb-2">
          <span
            className="cupom-badge inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
            style={{ background: badge.cor }}
          >
            <EstacaoIcone id={badge.id} /> {badge.nome}
          </span>
        </div>
        <div className="text-center font-bold text-[13px]">{nomeNegocio || "Padaria"}</div>
        <div className="border-t border-dashed border-black/30 my-1.5" />
        <div className="font-bold">CLIENTE: {pedido.clienteNome}</div>
        <div>Fone: {formatarTelefoneBR(pedido.clienteTelefone)}</div>
        <div className="font-bold text-[12.5px]">
          RETIRADA: {fmtData(pedido.retiradaData)}
          {pedido.retiradaHora ? ` - ${pedido.retiradaHora}` : ""}
        </div>
        {pedido.pessoas ? <div>Festa: {pedido.pessoas} pessoas</div> : null}
        <div>Pedido #{pedido.id.slice(0, 8)}</div>
        <div className="border-t border-dashed border-black/30 my-1.5" />
        {itens.map((it, i) => (
          <div key={i} className="flex justify-between gap-2">
            <span>
              <b>{it.qtd}x</b> {it.produto}
            </span>
            {master ? <span>{brl(it.subtotalCentavos)}</span> : null}
          </div>
        ))}
        <div className="border-t border-dashed border-black/30 my-1.5" />
        {master ? (
          <>
            <div className="font-bold text-[13.5px]">TOTAL: {brl(pedido.totalCentavos)}</div>
            <div>Pagamento na RETIRADA</div>
          </>
        ) : (
          <div className="text-center">Producao {badge.nome}</div>
        )}
        {pedido.observacoes ? (
          <>
            <div className="border-t border-dashed border-black/30 my-1.5" />
            <div>
              <b>OBS:</b> {pedido.observacoes}
            </div>
          </>
        ) : null}
      </div>
      <button onClick={onImprimir} className="no-print btn-cobre press inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold">
        <Printer size={13} /> Imprimir
      </button>
    </div>
  );
}

export default function CupomPreview({
  pedido,
  nomeNegocio = "",
  onClose,
}: {
  pedido: Pedido;
  nomeNegocio?: string;
  onClose: () => void;
}) {
  const [soId, setSoId] = useState<string | null>(null);

  // agrupa itens por estacao
  const porDepto = {} as Record<DeptoId, Pedido["itens"]>;
  for (const it of pedido.itens) {
    const d = deptoDe(it);
    (porDepto[d] ||= []).push(it);
  }

  type TicketData = { key: string; badge: Badge; itens: Pedido["itens"]; master?: boolean };
  const tickets: TicketData[] = (Object.keys(porDepto) as DeptoId[]).map((id) => {
    const info = deptoInfo(id);
    return { key: id, badge: { nome: info.nome, cor: info.cor, id }, itens: porDepto[id] };
  });
  tickets.push({
    key: "caixa",
    badge: { nome: "Caixa", cor: "#6e1f30", id: "caixa" },
    itens: pedido.itens,
    master: true,
  });

  function imprimir(id?: string) {
    setSoId(id ?? null);
    setTimeout(() => {
      window.print();
      setSoId(null);
    }, 60);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="rounded-[20px] max-w-full max-h-full overflow-hidden flex flex-col"
        style={{
          background: "rgba(73,16,32,0.85)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* cabecalho */}
        <div className="no-print flex items-start justify-between gap-6 px-6 pt-5 pb-4 border-b border-white/10">
          <div>
            <div className="t-label text-dourado">Cupom da cozinha</div>
            <h3 className="t-h2 text-cream mt-1">Um ticket por estacao, mais o do caixa</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-full text-cream/60 hover:text-cream hover:bg-white/10 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* tickets */}
        <div className="overflow-auto px-6 py-6">
          <div className="cupons-print flex gap-6 items-start">
            {tickets.map((t) => (
              <Ticket
                key={t.key}
                badge={t.badge}
                itens={t.itens}
                pedido={pedido}
                nomeNegocio={nomeNegocio}
                master={t.master}
                hide={soId !== null && soId !== t.key}
                onImprimir={() => imprimir(t.key)}
              />
            ))}
          </div>
        </div>

        {/* acoes */}
        <div className="no-print flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-sm text-cream/70 border border-white/15 hover:bg-white/10 transition-colors">
            Fechar
          </button>
          <button onClick={() => imprimir()} className="btn-cobre press inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold">
            <Printer size={15} /> Imprimir todos
          </button>
        </div>
      </div>
    </div>
  );
}
