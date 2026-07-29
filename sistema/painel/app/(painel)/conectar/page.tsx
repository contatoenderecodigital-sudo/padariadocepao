import ConectarWhatsApp from "@/components/ConectarWhatsApp";
import { nomeNegocioAtual } from "@/lib/negocio";

export const dynamic = "force-dynamic";

export default async function Page() {
  const nome = await nomeNegocioAtual();
  return (
    <div className="px-8 py-7 min-h-screen">
      <div className="text-[11px] uppercase tracking-[0.2em] text-dourado font-semibold">Conectar</div>
      <h1 className="font-title text-3xl font-bold text-cream mt-1">Conectar o WhatsApp</h1>
      <p className="text-sm text-cream/60 mt-1 mb-8 max-w-2xl">
        Conecte o número de {nome} ao atendimento com IA. Você autoriza pela própria Meta e pronto:
        a IA começa a responder as mensagens desse número.
      </p>

      <div className="glass rounded-[20px] p-8 max-w-xl">
        <ol className="space-y-2.5 text-sm text-cream/75 mb-7">
          <li className="flex gap-3">
            <span className="grad-cobre shrink-0 w-6 h-6 rounded-full grid place-items-center text-white text-[12px] font-bold">1</span>
            Clique em Conectar WhatsApp.
          </li>
          <li className="flex gap-3">
            <span className="grad-cobre shrink-0 w-6 h-6 rounded-full grid place-items-center text-white text-[12px] font-bold">2</span>
            Faça login na Meta e escolha o número da padaria.
          </li>
          <li className="flex gap-3">
            <span className="grad-cobre shrink-0 w-6 h-6 rounded-full grid place-items-center text-white text-[12px] font-bold">3</span>
            Autorize. A IA passa a atender neste número na hora.
          </li>
        </ol>
        <ConectarWhatsApp />
      </div>
    </div>
  );
}
