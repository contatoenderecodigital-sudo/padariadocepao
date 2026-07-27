"use client";

// Tela de login do painel. Simples: e-mail + senha, com a marca da Doce Pão.

import { useActionState } from "react";
import { entrar } from "./acao";

export default function Login() {
  const [erro, acao, pendente] = useActionState(entrar, null);

  return (
    <div className="min-h-screen grid place-items-center bg-cream text-ink px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-[family-name:var(--font-serif)] text-3xl font-bold text-vinho">
            Endereço Digital
          </div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold mt-1">
            Painel de atendimento
          </div>
        </div>

        <form action={acao} className="bg-white border border-line rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-soft">E-mail</span>
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="rounded-lg border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-vinho"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-soft">Senha</span>
            <input
              name="senha"
              type="password"
              required
              className="rounded-lg border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-vinho"
            />
          </label>

          {erro ? <div className="text-sm text-red-600">{erro}</div> : null}

          <button
            type="submit"
            disabled={pendente}
            className="mt-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-vinho hover:brightness-110 transition disabled:opacity-60"
          >
            {pendente ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="text-center text-[11px] text-ink-soft/60 mt-6">Endereço Digital</div>
      </div>
    </div>
  );
}
