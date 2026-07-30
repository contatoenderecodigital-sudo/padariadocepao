// ============================================================================
//  TENANT — carrega a persona + o cardápio (motor de orçamento) de um negócio
//  a partir do banco (negocios.config). É o que faz a IA falar com o cardápio
//  e as regras de CADA padaria. Sem cardápio no banco, cai no padrão (Doce Pão).
// ============================================================================

import { queryUm } from "../banco/db";
import { motorPadrao } from "./orcamento";
import { DOCE_PAO, type ConfigNegocio } from "./persona";
import { ehHojeBR } from "../aviso";
import type { Tenant } from "./cerebro";

type ConfigDB = {
  persona?: { horario?: string; prazoMinimoDias?: number; cobraSinal?: boolean };
  rendimento?: { salgado_por_pessoa?: number; doce_por_pessoa?: number; cento_serve_pessoas?: number };
  cardapio?: Record<string, { nome: string; preco: number }[]>;
  aviso_do_dia?: string;
  aviso_atualizado_em?: string;
};

export async function carregarTenant(negocioId: string): Promise<Tenant> {
  const n = await queryUm<{ nome: string; cidade: string | null; config: ConfigDB | null }>(
    "select nome, cidade, config from negocios where id = $1",
    [negocioId],
  );
  if (!n) return { persona: DOCE_PAO, motor: motorPadrao };

  const cfg = n.config || {};
  const persona: ConfigNegocio = {
    nome: n.nome,
    cidade: n.cidade || DOCE_PAO.cidade,
    horario: cfg.persona?.horario || DOCE_PAO.horario,
    endereco: DOCE_PAO.endereco,
    prazoMinimoDias: cfg.persona?.prazoMinimoDias ?? 2,
    cobraSinal: cfg.persona?.cobraSinal ?? false,
  };

  // Aviso do dia: só entra se foi escrito HOJE (senão expira sozinho).
  const avisoDoDia = ehHojeBR(cfg.aviso_atualizado_em) ? cfg.aviso_do_dia ?? null : null;

  // Preço e rendimento vêm SEMPRE do catalogo.json (Doce Pão, por unidade),
  // ignorando qualquer cardápio salvo no banco. Isso evita dado bugado de seed
  // antigo (ex: "cento a R$130") gerar orçamento errado. Cardápio próprio por
  // tenant volta quando existir outro negócio real com tabela própria.
  return { persona, motor: motorPadrao, avisoDoDia };
}
