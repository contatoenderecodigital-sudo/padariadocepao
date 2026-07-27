"use client";

// Preview do cupom da cozinha — mostra na tela como os tickets sairiam na
// impressora: 1 por estação (CONFEITARIA / SALGADOS) + o MASTER do caixa.
// Serve pro vídeo/demo sem precisar de impressora física.

import type { Pedido } from "@/lib/tipos";
import { brl } from "@/lib/tipos";

// Mapeia a categoria do item -> estação que produz.
function estacaoDe(categoria: string): string {
  const c = categoria.toLowerCase();
  if (c.startsWith("salgado") || c.includes("pizza")) return "SALGADOS";
  if (c.startsWith("doce") || c.startsWith("bolo") || c.includes("torta") || c.includes("brigadeiro"))
    return "CONFEITARIA";
  return "PRODUÇÃO";
}

function formataData(iso: string | null) {
  if (!iso) return "a confirmar";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function Ticket({ titulo, pedido, itens, master }: {
  titulo: string;
  pedido: Pedido;
  itens: Pedido["itens"];
  master?: boolean;
}) {
  return (
    <div className="bg-white text-black font-mono text-[12px] leading-tight w-[280px] shrink-0 rounded-sm shadow-md border border-line px-4 py-3">
      <div className="text-center font-bold text-[15px]">{titulo}</div>
      <div className="text-center">Padaria Aroma</div>
      <div className="border-t border-dashed border-black/40 my-1.5" />
      <div className="font-bold">CLIENTE: {pedido.clienteNome}</div>
      <div>Fone: {pedido.clienteTelefone}</div>
      <div className="font-bold text-[13px]">
        RETIRADA: {formataData(pedido.retiradaData)} {pedido.retiradaHora ? `· ${pedido.retiradaHora}` : ""}
      </div>
      {pedido.pessoas ? <div>Festa: {pedido.pessoas} pessoas</div> : null}
      <div>Pedido #{pedido.id.slice(0, 8)}</div>
      <div className="border-t border-dashed border-black/40 my-1.5" />
      {itens.map((it, i) => (
        <div key={i} className="flex justify-between gap-2">
          <span><b>{it.qtd}x</b> {it.produto}</span>
          {master ? <span>{brl(it.subtotalCentavos)}</span> : null}
        </div>
      ))}
      <div className="border-t border-dashed border-black/40 my-1.5" />
      {master ? (
        <>
          <div className="font-bold text-[14px]">TOTAL: {brl(pedido.totalCentavos)}</div>
          <div>Pagamento na RETIRADA</div>
        </>
      ) : (
        <div className="text-center">Produção {titulo.replace(/[=*]/g, "").trim()}</div>
      )}
      {pedido.observacoes ? (
        <>
          <div className="border-t border-dashed border-black/40 my-1.5" />
          <div><b>OBS:</b> {pedido.observacoes}</div>
        </>
      ) : null}
      <div className="text-center text-black/40 mt-2">— — — ✂ — — —</div>
    </div>
  );
}

export default function CupomPreview({ pedido, onClose }: { pedido: Pedido; onClose: () => void }) {
  // agrupa por estação
  const porEstacao: Record<string, Pedido["itens"]> = {};
  for (const it of pedido.itens) {
    const e = estacaoDe(it.categoria);
    (porEstacao[e] ||= []).push(it);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-cream2 rounded-2xl border border-line shadow-xl max-w-full max-h-full overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-dourado font-semibold">
              Cupom da cozinha
            </div>
            <h3 className="font-[family-name:var(--font-serif)] text-xl font-bold text-vinho">
              Sai 1 ticket por estação + o master do caixa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm text-ink-soft border border-line hover:bg-white transition-colors"
          >
            Fechar
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {Object.entries(porEstacao).map(([estacao, itens]) => (
            <Ticket key={estacao} titulo={`== ${estacao} ==`} pedido={pedido} itens={itens} />
          ))}
          <Ticket titulo="*** CAIXA ***" pedido={pedido} itens={pedido.itens} master />
        </div>
      </div>
    </div>
  );
}
