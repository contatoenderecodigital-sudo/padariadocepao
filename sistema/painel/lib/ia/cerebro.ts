// ============================================================================
//  CÉREBRO DA IA — o atendimento que conversa no WhatsApp.
//  Padrão OpenAI (function calling): conversa com a voz da Doce Pão e, pra
//  qualquer conta, chama a ferramenta de orçamento (código puro). Sabe quando
//  chamar humano.
//
//  Modelo: GPT-4o-mini por padrão (CUSTO + tool use confiável — atendimento é
//  alto volume). Trocável por env MODELO_IA.
//  Portabilidade: OPENAI_BASE_URL permite apontar pra outro provedor compatível
//  (Gemini, DeepSeek, OpenRouter...) sem reescrever nada.
// ============================================================================

import OpenAI from "openai";
import { montarSystemPrompt, DOCE_PAO, type ConfigNegocio } from "./persona";
import { motorPadrao, formatarOrcamento, brl, type Motor, type LinhaCotacao } from "./orcamento";

const MODELO = process.env.MODELO_IA || "gpt-4o-mini";

// Um tenant = a persona (voz/regras) + o motor de orçamento (cardápio) do negócio.
// avisoDoDia: "cérebro temporário" do dia (já filtrado: só vem preenchido se for de hoje).
export type Tenant = { persona: ConfigNegocio; motor: Motor; avisoDoDia?: string | null };

// As ferramentas que a IA pode chamar (formato OpenAI). Descrição prescritiva.
const FERRAMENTAS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "montar_orcamento",
      description:
        "Calcula o preço de uma encomenda. USE SEMPRE que precisar de um valor ou quantidade, nunca calcule de cabeça. Dois modos: 'itens' (o cliente disse o que quer, ex: 100 salgados assados) ou 'pessoas' (o cliente disse 'pra 50 pessoas' e você sugere a quantidade).",
      parameters: {
        type: "object",
        properties: {
          modo: { type: "string", enum: ["itens", "pessoas"] },
          itens: {
            type: "array",
            description: "Usado no modo 'itens'. Lista do que o cliente quer.",
            items: {
              type: "object",
              properties: {
                item: {
                  type: "string",
                  description:
                    "Nome do item como no cardápio: 'salgado assado', 'salgado frito', 'brigadeiro', 'trufa', 'bolo 4 leites', 'pizza inteira', etc.",
                },
                qtd: { type: "number" },
              },
              required: ["item", "qtd"],
            },
          },
          pessoas: { type: "number", description: "Usado no modo 'pessoas'." },
          quer: {
            type: "object",
            description: "Usado no modo 'pessoas': o que incluir na sugestão.",
            properties: {
              salgado: { type: "boolean" },
              doce: { type: "boolean" },
              bolo: { type: "boolean" },
            },
          },
        },
        required: ["modo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "chamar_humano",
      description:
        "Passa a conversa pra equipe da padaria. USE quando: o cliente pede algo fora do cardápio ou muito específico (bolo de vários andares, decoração especial), está indeciso e precisa de conselho de verdade, ou você não sabe a resposta com certeza. Melhor passar do que inventar.",
      parameters: {
        type: "object",
        properties: {
          motivo: { type: "string", description: "Por que está passando pra equipe (curto)." },
        },
        required: ["motivo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "registrar_pedido",
      description:
        "Registra o pedido pra equipe aprovar. USE só depois que o cliente confirmou o orçamento E informou o dia/hora da retirada.",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string" },
          itens: {
            type: "array",
            items: {
              type: "object",
              properties: { item: { type: "string" }, qtd: { type: "number" } },
              required: ["item", "qtd"],
            },
          },
          retirada_data: { type: "string", description: "Dia da retirada, ex: 'sábado 25/07'." },
          retirada_hora: { type: "string", description: "Hora, ex: '14:00'." },
          observacoes: { type: "string" },
        },
        required: ["itens", "retirada_data"],
      },
    },
  },
];

// Resultado de um turno da IA.
export type RespostaIA = {
  texto: string; // o que mandar de volta pro cliente
  precisaHumano: boolean; // se true, entra na fila de "precisa de você" do painel
  pedidoRegistrado: null | {
    itens: { item: string; qtd: number }[];
    linhas: LinhaCotacao[]; // já calculado pelo motor do tenant (pro banco não recalcular)
    retiradaData: string;
    retiradaHora?: string;
    observacoes?: string;
    clienteNome?: string;
    totalCentavos: number;
  };
};

// Formato simples de mensagem (desacoplado do SDK) — o que a persistência usa.
export type Mensagem = { role: "user" | "assistant"; content: string };

// Executa uma ferramenta e devolve o texto do resultado (o que a IA "vê").
// Usa o MOTOR do tenant (cardápio da padaria certa).
function executarFerramenta(
  nome: string,
  input: Record<string, unknown>,
  estado: { precisaHumano: boolean; pedido: RespostaIA["pedidoRegistrado"] },
  motor: Motor,
): string {
  if (nome === "montar_orcamento") {
    if (input.modo === "itens") {
      const c = motor.cotarPorItens((input.itens as { item: string; qtd: number }[]) || []);
      return formatarOrcamento(c);
    }
    const c = motor.sugerirPorPessoas(
      Number(input.pessoas) || 0,
      (input.quer as { salgado?: boolean; doce?: boolean; bolo?: boolean }) || { salgado: true, doce: true },
    );
    return formatarOrcamento(c, `Orçamento da festa de ${input.pessoas} pessoas`);
  }

  if (nome === "chamar_humano") {
    estado.precisaHumano = true;
    return "OK, marquei pra equipe assumir esta conversa. Avise o cliente com carinho que já já respondem.";
  }

  if (nome === "registrar_pedido") {
    const itens = (input.itens as { item: string; qtd: number }[]) || [];
    const c = motor.cotarPorItens(itens);
    estado.pedido = {
      itens,
      linhas: c.linhas,
      retiradaData: String(input.retirada_data || ""),
      retiradaHora: input.retirada_hora ? String(input.retirada_hora) : undefined,
      observacoes: input.observacoes ? String(input.observacoes) : undefined,
      clienteNome: input.cliente_nome ? String(input.cliente_nome) : undefined,
      totalCentavos: Math.round(c.total * 100),
    };
    const itensFmt = c.linhas
      .map((l) => `${l.item}: ${l.qtd} un x ${brl(l.unit)} = ${brl(l.subtotal)}`)
      .join("\n");
    return `Pedido salvo pra equipe. Envie o resumo no formato de FECHAMENTO DE PEDIDO usando EXATAMENTE estas linhas e este total, sem recalcular nada de cabeça:\n${itensFmt}\nTotal: ${brl(c.total)}\nMantenha o formato (asteriscos de negrito, sem linha em branco dentro do resumo).`;
  }

  return "Ferramenta desconhecida.";
}

// O turno principal: recebe o histórico + a mensagem nova, devolve a resposta.
// `tenant` traz a persona + o cardápio da padaria certa (multi-tenant).
export async function responder(
  historico: Mensagem[],
  tenant: Tenant = { persona: DOCE_PAO, motor: motorPadrao },
): Promise<RespostaIA> {
  // Lê OPENAI_API_KEY do ambiente. OPENAI_BASE_URL (opcional) aponta pra outro
  // provedor compatível (Gemini/DeepSeek/OpenRouter) sem mudar código.
  const client = new OpenAI({ baseURL: process.env.OPENAI_BASE_URL || undefined });
  const hojeBR = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  const system =
    montarSystemPrompt(tenant.persona, tenant.motor.cardapioResumo(), tenant.avisoDoDia) +
    `\n\n# DATA DE HOJE\nHoje é ${hojeBR} (fuso de Brasília). Use isso pra completar o ANO das datas de retirada: se o cliente disser só o dia e o mês (ex: 05/05) e essa data ainda não passou este ano, use o ano atual. Data sempre no formato DD/MM/AAAA.`;

  const estado = { precisaHumano: false, pedido: null as RespostaIA["pedidoRegistrado"] };
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...historico.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Loop de tool use: chama o modelo, executa ferramentas, repete até resposta final.
  for (let i = 0; i < 6; i++) {
    const resp = await client.chat.completions.create({
      model: MODELO,
      max_tokens: 350, // resposta de WhatsApp é curta; corta desperdício de token
      temperature: 0.4, // menos "criatividade" = segue mais as regras (usar a ferramenta)
      messages,
      tools: FERRAMENTAS,
    });

    const msg = resp.choices[0]?.message;
    if (!msg) break;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return {
        texto: (msg.content || "").trim(),
        precisaHumano: estado.precisaHumano,
        pedidoRegistrado: estado.pedido,
      };
    }

    // Executa cada ferramenta pedida e devolve os resultados.
    messages.push({ role: "assistant", content: msg.content, tool_calls: msg.tool_calls });
    for (const tc of msg.tool_calls) {
      if (tc.type !== "function") continue;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch {
        args = {};
      }
      const saida = executarFerramenta(tc.function.name, args, estado, tenant.motor);
      messages.push({ role: "tool", tool_call_id: tc.id, content: saida });
    }
  }

  // Se estourou o loop (raro), devolve algo seguro.
  return {
    texto: "Deixa eu chamar alguém da equipe pra te ajudar com isso.",
    precisaHumano: true,
    pedidoRegistrado: estado.pedido,
  };
}
