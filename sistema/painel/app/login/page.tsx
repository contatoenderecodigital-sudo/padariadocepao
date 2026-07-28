"use client";

// Login em split-screen premium: vitrine vinho (aurora + logo + valor) na
// esquerda, formulario creme limpo na direita. Coerente com o painel.

import { useActionState, useState } from "react";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { entrar } from "./acao";

const GRAO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")";

export default function Login() {
  const [erro, acao, pendente] = useActionState(entrar, null);
  const [verSenha, setVerSenha] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-cream text-ink">
      {/* ---------- VITRINE (esquerda / topo no mobile) ---------- */}
      <div
        className="relative overflow-hidden lg:w-[55%] flex flex-col items-center justify-center text-white px-8 py-10 lg:py-16"
        style={{ background: "linear-gradient(160deg,#491020,#6e1f30)" }}
      >
        {/* blobs de luz (aurora) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px 420px at 18% 22%, rgba(231,207,148,0.26), transparent 60%), radial-gradient(620px 520px at 85% 82%, rgba(181,96,26,0.22), transparent 60%)",
          }}
        />
        {/* grao sutil */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.045]" style={{ backgroundImage: GRAO }} />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <Image
            src="/logo.png"
            alt=""
            width={110}
            height={110}
            priority
            className="w-20 h-20 lg:w-[110px] lg:h-[110px] rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          />
          <div className="font-title text-3xl lg:text-[40px] font-bold mt-5 leading-none">Padaria Aroma</div>
          <p className="text-cream/75 text-base lg:text-lg mt-4 leading-relaxed">
            O atendimento que trabalha sozinho pela sua padaria.
          </p>

          {/* mockup flutuante de um card do painel (so no desktop) */}
          <div className="hidden lg:block w-full mt-12">
            <div className="glass rounded-2xl p-5 text-left">
              <div className="t-label text-dourado-l">Pedido novo</div>
              <div className="font-semibold text-cream mt-1.5">Maria de Souza</div>
              <div className="text-cream/60 text-sm mt-0.5">100x Salgado assado · 50x Brigadeiro</div>
              <div className="flex items-center justify-between mt-3">
                <span className="t-money text-xl text-grad-dourado">R$ 234,40</span>
                <span className="chip-marca text-[11px] font-semibold px-2.5 py-1 rounded-full">Aprovar</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute bottom-5 z-10 text-[11px] text-white/40">Endereço Digital</div>
      </div>

      {/* ---------- FORMULARIO (direita / abaixo no mobile) ---------- */}
      <div className="lg:w-[45%] flex items-center justify-center px-6 py-12 lg:py-0">
        <form action={acao} className="w-full max-w-sm">
          <h1 className="text-[26px] font-bold text-vinho tracking-tight-apple">Bem-vindo de volta</h1>
          <p className="text-ink-soft mt-1.5 mb-8">Acesse o painel da sua padaria</p>

          {/* e-mail */}
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">E-mail</span>
            <div className="relative mt-1.5">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/50" />
              <input
                name="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="voce@padaria.com"
                className="w-full rounded-xl border border-line bg-white pl-10 pr-3 py-3 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:border-cobre focus:ring-2 focus:ring-cobre/20 transition"
              />
            </div>
          </label>

          {/* senha */}
          <label className="block mt-4">
            <span className="text-sm font-medium text-ink-soft">Senha</span>
            <div className="relative mt-1.5">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/50" />
              <input
                name="senha"
                type={verSenha ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="********"
                className="w-full rounded-xl border border-line bg-white pl-10 pr-10 py-3 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:border-cobre focus:ring-2 focus:ring-cobre/20 transition"
              />
              <button
                type="button"
                onClick={() => setVerSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft/50 hover:text-ink-soft transition-colors"
                aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {verSenha ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <div className="text-right mt-2">
            <button type="button" className="text-xs text-cobre hover:underline">
              Esqueceu a senha?
            </button>
          </div>

          {erro ? <div className="text-sm text-red-600 mt-3">{erro}</div> : null}

          <button
            type="submit"
            disabled={pendente}
            className="btn-cobre press w-full mt-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-default"
          >
            {pendente ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>

          <div className="text-center text-[11px] text-ink-soft/45 mt-10">Endereço Digital</div>
        </form>
      </div>
    </div>
  );
}
