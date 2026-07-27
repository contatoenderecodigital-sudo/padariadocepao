// ============================================================================
//  CÉREBRO DA IA — o atendimento que conversa no WhatsApp.
//  Claude + tool use: ele conversa com a voz da Doce Pão e, pra qualquer conta,
//  chama a ferramenta de orçamento (código puro). Sabe quando chamar humano.
//
//  Modelo: Haiku 4.5 por padrão (decisão de CUSTO — atendimento é alto volume).
//  Trocável por env MODELO_IA se quiser testar com modelo melhor.
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";
import { montarSystemPrompt, DOCE_PAO, type ConfigNegocio } from "./persona";
import {
  cotarPorItens,
  sugerirPorPessoas,
  formatarOrcamento,
  cardapioResumo,
} from "./orcamento";

const MODELO = process.env.MODELO_IA || "claude-haiku-4-5";

// As ferramentas que a IA pode chamar. Descrição prescritiva (quando usar).
const FERRAMENTAS: Anthropic.Tool[] = [
  {
    name: "montar_orcamento",
    description:
      "Calcula o preço de uma encomenda. USE SEMPRE que precisar de um valor ou quantidade — nunca calcule de cabeça. Dois modos: 'itens' (o cliente disse o que quer, ex: 100 salgados assados) ou 'pessoas' (o cliente disse 'pra 50 pessoas' e você sugere a quantidade).",
    input_schema: {
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
  {
    name: "chamar_humano",
    description:
      "Passa a conversa pra equipe da padaria. USE quando: o cliente pede algo fora do cardápio ou muito específico (bolo de vários andares, decoração especial), está indeciso e precisa de conselho de verdade, ou você não sabe a resposta com certeza. Melhor passar do que inventar.",
    input_schema: {
      type: "object",
      properties: {
        motivo: { type: "string", description: "Por que está passando pra equipe (curto)." },
      },
      required: ["motivo"],
    },
  },
  {
    name: "registrar_pedido",
    description:
      "Registra o pedido pra equipe aprovar. USE só depois que o cliente confirmou o orçamento E informou o dia/hora da retirada.",
    input_schema: {
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
];

// Resultado de um turno da IA.
export type RespostaIA = {
  texto: string; // o que mandar de volta pro cliente
  precisaHumano: boolean; // se true, entra na fila de "precisa de você" do painel
  pedidoRegistrado: null | {
    itens: { item: string; qtd: number }[];
    retiradaData: string;
    retiradaHora?: string;
    observacoes?: string;
    clienteNome?: string;
    totalCentavos: number;
  };
};

export type Mensagem = Anthropic.MessageParam;

// Executa uma ferramenta e devolve o texto do resultado (o que a IA "vê").
function executarFerramenta(
  nome: string,
  input: Record<string, unknown>,
  estado: { precisaHumano: boolean; pedido: RespostaIA["pedidoRegistrado"] },
): string {
  if (nome === "montar_orcamento") {
    if (input.modo === "itens") {
      const c = cotarPorItens((input.itens as { item: string; qtd: number }[]) || []);
      return formatarOrcamento(c);
    }
    const c = sugerirPorPessoas(
      Number(input.pessoas) || 0,
      (input.quer as { salgado?: boolean; doce?: boolean; bolo?: boolean }) || { salgado: true, doce: true },
    );
    return formatarOrcamento(c, `Orçamento — festa ${input.pessoas} pessoas`);
  }

  if (nome === "chamar_humano") {
    estado.precisaHumano = true;
    return "OK, marquei pra equipe assumir esta conversa. Avise o cliente com carinho que já já respondem.";
  }

  if (nome === "registrar_pedido") {
    const itens = (input.itens as { item: string; qtd: number }[]) || [];
    const c = cotarPorItens(itens);
    estado.pedido = {
      itens,
      retiradaData: String(input.retirada_data || ""),
      retiradaHora: input.retirada_hora ? String(input.retirada_hora) : undefined,
      observacoes: input.observacoes ? String(input.observacoes) : undefined,
      clienteNome: input.cliente_nome ? String(input.cliente_nome) : undefined,
      totalCentavos: Math.round(c.total * 100),
    };
    return `Pedido registrado! Total ${formatarOrcamento(c).match(/Total: (.+)/)?.[1] ?? ""}. Já aparece pra equipe aprovar. Avise o cliente que o pedido foi anotado e que a equipe confirma.`;
  }

  return "Ferramenta desconhecida.";
}

// O turno principal: recebe o histórico + a mensagem nova, devolve a resposta.
export async function responder(
  historico: Mensagem[],
  cfg: ConfigNegocio = DOCE_PAO,
): Promise<RespostaIA> {
  const client = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente
  const system = montarSystemPrompt(cfg, cardapioResumo());

  const estado = { precisaHumano: false, pedido: null as RespostaIA["pedidoRegistrado"] };
  const messages: Mensagem[] = [...historico];

  // Loop de tool use: chama Claude, executa ferramentas, repete até resposta final.
  for (let i = 0; i < 6; i++) {
    const resp = await client.messages.create({
      model: MODELO,
      max_tokens: 1024,
      system,
      messages,
      tools: FERRAMENTAS,
    });

    if (resp.stop_reason !== "tool_use") {
      const texto = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { texto, precisaHumano: estado.precisaHumano, pedidoRegistrado: estado.pedido };
    }

    // Executa cada ferramenta pedida e devolve os resultados.
    messages.push({ role: "assistant", content: resp.content });
    const resultados: Anthropic.ToolResultBlockParam[] = [];
    for (const bloco of resp.content) {
      if (bloco.type === "tool_use") {
        const saida = executarFerramenta(bloco.name, bloco.input as Record<string, unknown>, estado);
        resultados.push({ type: "tool_result", tool_use_id: bloco.id, content: saida });
      }
    }
    messages.push({ role: "user", content: resultados });
  }

  // Se estourou o loop (raro), devolve algo seguro.
  return {
    texto: "Deixa eu chamar alguém da equipe pra te ajudar com isso 😊",
    precisaHumano: true,
    pedidoRegistrado: estado.pedido,
  };
}
