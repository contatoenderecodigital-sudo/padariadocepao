# Sistema Doce Pão — núcleo (fase 1)

O motor do atendimento 24h + orçamento + aprovação + impressão. Construído de
trás pra frente: **o miolo primeiro, o WhatsApp por último** (é só o cano de
entrada). Assim dá pra testar tudo hoje, no terminal, sem depender da Meta.

## O que JÁ funciona (rodável agora)

```
node testar.js
```

Mostra o **motor de orçamento** calculando com os preços REAIS da Doce Pão
(extraídos dos 5 PDFs dela). Cenários: encomenda direta, festa por nº de
pessoas, cliente mexendo no pedido, e pizza.

## Estrutura

```
sistema/
├── dados/
│   ├── catalogo.json      # PREÇOS reais (dos PDFs). Fonte única de preço.
│   └── rendimento.json    # quanto serve por pessoa. CHUTES até a dona confirmar.
├── src/
│   └── orcamento.js       # O MOTOR. IA nunca calcula preço — chama isto.
├── banco/
│   └── schema.sql         # Supabase: clientes, pedidos (máquina de estados),
│                          #   itens, fila de impressão, conversas.
├── testar.js              # prova viva pro terminal / reunião
└── README.md
```

## As 3 regras de arquitetura (não negociáveis)

1. **A IA nunca toca na conta.** Ela entende o que o cliente quer e chama o
   motor (`orcamento.js`). Código não erra soma nem alucina preço. Isso também
   zera o custo de token do cálculo.
2. **Dinheiro é sempre inteiro (centavos).** No banco, `*_centavos int`. Nunca
   `float` pra dinheiro.
3. **O humano é puxado, não empurrado.** O pedido cai numa fila (`status`), a
   equipe abre quando quer. O sistema não cutuca a dona.

## O fluxo completo (quando tudo estiver ligado)

```
Cliente no WhatsApp
   → IA entende, chama o motor, monta orçamento
   → pedido salvo: status 'orcado'
   → cliente confirma → 'confirmado'
   → equipe aprova no painel → 'aprovado'
        ↑ (gatilho no banco cria linha em fila_impressao)
   → agente na padaria lê a fila → imprime na PCFort E200M → 'impresso'
```

## Falta pra fase 1 ficar 100% (depende da dona)

Tudo marcado `confirmar:true` em `rendimento.json`:
- [ ] salgado por pessoa (chute: 10)
- [ ] doce por pessoa (chute: 4)
- [ ] bolo recheado serve quantas pessoas (chute: 20)
- [ ] regras de encomenda: mínimo, antecedência, alteração, sinal
- [ ] horário de funcionamento (não temos)

> Trocar o valor no JSON — **não mexe em código**. O motor lê de lá.

## Próximas fases (ainda não construídas)

- **Ponte de impressão** (Node na padaria): lê `fila_impressao`, manda ESC/POS
  pra porta 9100 da PCFort. Testável com a impressora na bancada do Sandro.
- **Cérebro da IA**: prompt com voz da Doce Pão + ferramentas (chamar o motor,
  salvar pedido). Testável no terminal antes do WhatsApp.
- **Painel de aprovação** (web): equipe aprova/recusa.
- **Webhook WhatsApp** (Coexistence): o último pedaço.

## Impressora confirmada

PCFort **E200M** — 80mm, **USB + LAN (Ethernet)**, **ESC/POS**, guilhotina.
Mesma que a padaria já tem. Sandro compra uma igual (~R$ 267), configura IP
fixo e testa em casa antes de instalar na cozinha.
