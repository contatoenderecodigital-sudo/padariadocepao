"use client";

// Navegação da sidebar (client): marca o item ativo pela rota atual, sem
// depender de prop vinda do servidor — assim o Shell fica no layout e não
// re-renderiza a cada troca de aba (navegação mais lisa).

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };

const ITENS: Item[] = [
  { href: "/", label: "Aprovação", icon: "bell" },
  { href: "/dia", label: "Pedidos do dia", icon: "order" },
  { href: "/atendimentos", label: "Atendimentos", icon: "chat" },
  { href: "/recuperar", label: "Recuperar", icon: "restore" },
  { href: "/numeros", label: "Números", icon: "chart" },
];

// Ícone via CSS mask: pinta o SVG com a cor do texto (currentColor).
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

export default function SidebarNav({ filaCount = 0 }: { filaCount?: number }) {
  const path = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
      {ITENS.map((it) => {
        const on = path === it.href;
        const badge = it.href === "/" ? filaCount : 0;
        return (
          <Link
            key={it.href}
            href={it.href}
            prefetch
            className={
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors " +
              (on ? "bg-white/12 text-white font-medium" : "text-white/70 hover:bg-white/6 hover:text-white")
            }
          >
            {on && (
              <span className="grad-dourado absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full" />
            )}
            <span className="leading-none opacity-90">
              <Icone nome={it.icon} />
            </span>
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
  );
}
