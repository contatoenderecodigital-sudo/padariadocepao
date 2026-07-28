// Shell do painel: sidebar de navegação + área de conteúdo.
// Server Component — também é o portão de sessão: sem login, manda pro /login.
// (No modo demo, sem banco configurado, não exige login — pra mostrar sem chave.)

import Link from "next/link";
import { redirect } from "next/navigation";
import { bancoConfigurado } from "@/lib/banco/db";
import { lerSessao } from "@/lib/auth";
import { sair } from "@/app/login/acao";

type Item = { href: string; label: string; icon: string; badge?: number };

const ITENS: Item[] = [
  { href: "/", label: "Aprovação", icon: "bell" },
  { href: "/dia", label: "Pedidos do dia", icon: "order" },
  { href: "/atendimentos", label: "Atendimentos", icon: "chat" },
  { href: "/recuperar", label: "Recuperar", icon: "restore" },
  { href: "/numeros", label: "Números", icon: "chart" },
];

// Ícone via CSS mask: usa o SVG como máscara e pinta com a cor do texto
// (currentColor). Assim qualquer SVG baixado herda a cor da sidebar, seja
// ele de traço ou preenchido.
function Icone({ nome }: { nome: string }) {
  const url = `url(/icones/${nome}.svg)`;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 18,
        height: 18,
        backgroundColor: "currentColor",
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

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

  // Só o NOME vem do tenant logado. A PALETA é fixa (marca vinho+dourado+cobre):
  // a "regra da casa" é a mesma pra todo tenant; muda o nome (a Meta vê "Aroma").
  let nomeNegocio = "Doce Pão";
  if (sessao) {
    const { carregarMarcaCache } = await import("@/lib/banco/negocios");
    const marca = await carregarMarcaCache(sessao.negocioId);
    if (marca?.nome) nomeNegocio = marca.nome;
  }

  return (
    <div className="min-h-screen flex app-mesh text-ink">
      {/* Sidebar — material fosco da marca (estilo Apple) */}
      <aside
        className="w-60 shrink-0 text-white flex flex-col"
        style={{
          background: "linear-gradient(180deg, var(--brand-vinho-d), var(--brand-vinho))",
          borderRight: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div className="px-6 py-6 border-b border-white/10">
          <div className="font-title text-2xl font-bold leading-tight">
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
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors " +
                  (on
                    ? "bg-white/12 text-white font-medium"
                    : "text-white/70 hover:bg-white/6 hover:text-white")
                }
              >
                {on && (
                  <span className="grad-dourado absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full" />
                )}
                <span className="leading-none opacity-90"><Icone nome={it.icon} /></span>
                <span className="flex-1">{it.label}</span>
                {badge ? (
                  <span className="grad-dourado min-w-5 h-5 px-1.5 rounded-full text-vinho-d text-xs font-bold grid place-items-center">
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
