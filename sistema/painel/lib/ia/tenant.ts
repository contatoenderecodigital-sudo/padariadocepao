// ============================================================================
//  TENANT — carrega a persona + o cardápio (motor de orçamento) de um negócio
//  a partir do banco (negocios.config). É o que faz a IA falar com o cardápio
//  e as regras de CADA padaria. Sem cardápio no banco, cai no padrão (Doce Pão).
// ============================================================================

import { queryUm } from "../banco/db";
import { criarMotor, motorPadrao, type Produto, type Rendimento } from "./orcamento";
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

const CATEGORIA: Record<string, string> = {
  salgados: "salgado", doces: "doce", bolos: "bolo", tortas: "torta", paes: "pao",
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

  // Sem cardápio próprio no banco → motor padrão (Doce Pão).
  if (!cfg.cardapio) return { persona, motor: motorPadrao, avisoDoDia };

  // Achata o cardápio do config numa lista de produtos.
  const produtos: Produto[] = [];
  for (const [grupo, itens] of Object.entries(cfg.cardapio)) {
    const categoria = CATEGORIA[grupo] || grupo;
    for (const it of itens || []) produtos.push({ nome: it.nome, preco: it.preco, categoria });
  }

  const r = cfg.rendimento || {};
  const rendimento: Rendimento = {
    salgadoPorPessoa: r.salgado_por_pessoa,
    docePorPessoa: r.doce_por_pessoa,
    // se tem "cento_serve_pessoas", o negócio vende por cento (100 un/produto)
    unidadePorProduto: r.cento_serve_pessoas ? 100 : 1,
    confirmar: true,
  };

  return { persona, motor: criarMotor(produtos, rendimento), avisoDoDia };
}
