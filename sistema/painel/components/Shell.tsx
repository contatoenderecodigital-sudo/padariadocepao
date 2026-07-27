// Shell do painel: sidebar de navegação + área de conteúdo.
// Server Component — também é o portão de sessão: sem login, manda pro /login.
// (No modo demo, sem banco configurado, não exige login — pra mostrar sem chave.)

import Link from "next/link";
import { redirect } from "next/navigation";
import { bancoConfigurado } from "@/lib/banco/db";
import { lerSessao } from "@/lib/auth";
import { sair } from "@/app/login/acao";

// Ajusta uma cor hex pra mais escura (fator<1) ou mais clara (mistura com branco).
function ajustar(hex: string, fator: number, paraBranco: boolean): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  if (paraBranco) {
    r = Math.round(r + (255 - r) * fator);
    g = Math.round(g + (255 - g) * fator);
    b = Math.round(b + (255 - b) * fator);
  } else {
    r = Math.round(r * fator);
    g = Math.round(g * fator);
    b = Math.round(b * fator);
  }
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
const escurecer = (hex: string, f: number) => ajustar(hex, f, false);
const clarear = (hex: string, f: number) => ajustar(hex, f, true);

type Item = { href: string; label: string; icon: string; badge?: number };

const ITENS: Item[] = [
  { href: "/", label: "Aprovação", icon: "🔔" },
  { href: "/dia", label: "Pedidos do dia", icon: "🍞" },
  { href: "/atendimentos", label: "Atendimentos", icon: "💬" },
  { href: "/recuperar", label: "Recuperar", icon: "↩️" },
  { href: "/clube", label: "Clube", icon: "⭐" },
  { href: "/numeros", label: "Números", icon: "📊" },
];

export default async function Shell({
  children,
  ativo = "/",
  filaCount = 0,
}: {
  children: React.ReactNode;
  ativo?: string;
  filaCount?: number;
}) {
  // Portão de sessão: com banco configurado, exige login.
  const sessao = bancoConfigurado ? await lerSessao() : null;
  if (bancoConfigurado && !sessao) redirect("/login");

  // Marca o painel com o NOME e as CORES do negócio logado (multi-tenant).
  let nomeNegocio = "Doce Pão";
  let tema: React.CSSProperties = {};
  if (sessao) {
    const { carregarMarca } = await import("@/lib/banco/negocios");
    const marca = await carregarMarca(sessao.negocioId);
    if (marca?.nome) nomeNegocio = marca.nome;
    if (marca?.corPrimaria || marca?.corDestaque) {
      const prim = marca.corPrimaria || "#6e1f30";
      const dest = marca.corDestaque || "#bb921f";
      // sobrescreve as variáveis da marca -> recolore o painel inteiro
      tema = {
        ["--brand-vinho" as string]: prim,
        ["--brand-vinho-d" as string]: escurecer(prim, 0.7),
        ["--brand-dourado" as string]: dest,
        ["--brand-dourado-l" as string]: clarear(dest, 0.6),
      };
    }
  }

  return (
    <div className="min-h-screen flex bg-cream text-ink" style={tema}>
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-vinho text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="font-[family-name:var(--font-serif)] text-xl font-bold leading-tight">
            {nomeNegocio}
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-dourado-l mt-1">
            Painel
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {ITENS.map((it) => {
            const on = it.href === ativo;
            const badge = it.href === "/" ? filaCount : it.badge;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors " +
                  (on
                    ? "bg-white/12 text-white font-medium"
                    : "text-white/70 hover:bg-white/6 hover:text-white")
                }
              >
                <span className="text-base leading-none">{it.icon}</span>
                <span className="flex-1">{it.label}</span>
                {badge ? (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-dourado text-vinho-d text-xs font-bold grid place-items-center">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          {sessao ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-white/80 truncate">{sessao.nome}</div>
                <div className="text-[10px] text-white/40">Endereço Digital</div>
              </div>
              <form action={sair}>
                <button
                  type="submit"
                  className="text-[11px] text-white/60 hover:text-white border border-white/15 rounded-md px-2 py-1 transition-colors"
                >
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <div className="text-[11px] text-white/45">Endereço Digital · demo</div>
          )}
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
