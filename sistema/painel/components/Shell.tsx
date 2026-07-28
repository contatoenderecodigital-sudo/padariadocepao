// Shell do painel: sidebar de navegação + área de conteúdo.
// Server Component — também é o portão de sessão: sem login, manda pro /login.
// Fica no LAYOUT do grupo (painel), então a sidebar não re-renderiza a cada
// troca de aba: só o conteúdo troca. A navegação da sidebar é client (usePathname).

import Image from "next/image";
import { redirect } from "next/navigation";
import { bancoConfigurado } from "@/lib/banco/db";
import { lerSessao } from "@/lib/auth";
import { sair } from "@/app/login/acao";
import SidebarNav from "@/components/SidebarNav";

export default async function Shell({
  children,
  filaCount = 0,
}: {
  children: React.ReactNode;
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
    <div className="min-h-screen flex app-mesh text-cream">
      {/* Sidebar — material fosco da marca (estilo Apple) */}
      <aside
        className="w-60 shrink-0 text-white flex flex-col"
        style={{
          background: "linear-gradient(180deg, var(--brand-vinho-d), var(--brand-vinho))",
          borderRight: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt=""
            width={48}
            height={48}
            className="w-12 h-12 shrink-0 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
            priority
          />
          <div className="min-w-0">
            <div className="font-title text-lg font-bold leading-tight truncate">{nomeNegocio}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-dourado-l mt-0.5">Painel</div>
          </div>
        </div>

        <SidebarNav filaCount={filaCount} />

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
