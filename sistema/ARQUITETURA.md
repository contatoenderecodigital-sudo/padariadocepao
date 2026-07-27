# Doce Pão — Arquitetura & Auditoria do Sistema

> Documento pra **outro agente/dev auditar**: o que existe, como se liga, o que roda
> onde, o que está pronto e o que falta. Se for revisar a estrutura, comece por aqui.
>
> **Stack decidido:** **Vercel** (painel + webhook) + **Supabase** (PostgreSQL gerenciado,
> backup automático) + ponte on-site. O app usa o driver `pg` direto contra o Postgres do
> Supabase (via connection pooler) — não usa supabase-js/Auth/RLS; isolamento é no código.
>
> Companheiro deste doc: **`COMO-LIGAR.md`** (passo a passo pra subir).

---

## 1. O que o sistema faz (escopo fechado com o cliente)

Padaria Doce Pão (Xanxerê-SC), primeiro cliente pagante de um produto **multi-tenant**.
- Atendimento **24h no WhatsApp** por IA: entende texto e **áudio** (transcreve, responde em texto).
- IA monta **orçamento** de encomenda. **Nunca calcula preço de cabeça** — chama um motor em código.
- Pedido fechado entra numa **fila de aprovação**; a equipe faz login e aprova/recusa no painel.
- Aprovado → **imprime na padaria**: 1 ticket por **estação** (confeitaria, salgados) + 1 **master no caixa**.
- Pagamento **só na retirada** (sem gateway). Sem delivery. Sem Instagram.
- Clube de selos (chave = telefone). Recuperação de orçamento parado.

---

## 2. As 3 peças e ONDE cada uma roda

```
  Cliente (WhatsApp)
        │  msg (texto/áudio)
        ▼
 ┌─────────────────────────────────────────┐
 │  VERCEL  (serverless — painel/)          │
 │  · webhook  app/api/whatsapp/route.ts    │  ← after() processa após o 200 · maxDuration
 │  · IA       lib/ia/*  (Claude Haiku)     │  ← orçamento em código, tool use
 │  · painel   app/*  (login, aprovação…)   │  ← equipe faz login e aprova/recusa
 │  · API fila app/api/fila/route.ts        │  ← a ponte consome (token)
 │      (HTTPS pronto · deploy nativo Next)  │
 └───────────────┬─────────────────────────┘
                 │ pg via CONNECTION POOLER (porta 6543, transaction)
                 ▼
 ┌─────────────────────────────────────────┐
 │  SUPABASE (PostgreSQL gerenciado)        │  ← banco/schema.sql
 │  negocios, usuarios, clientes, pedidos,  │
 │  itens, fila_impressao, conversas,       │
 │  mensagens, webhook_recebidos            │
 │  Backup: AUTOMÁTICO (plano Pro)          │
 └───────────────┬─────────────────────────┘
                 │ a ponte puxa por API HTTPS (NÃO toca o banco direto)
                 ▼
 ┌─────────────────────────────────────────┐
 │  PADARIA (PC do caixa / Raspberry)       │  ← ponte/ (Node puro, sem deps)
 │  · imprimir.mjs  fetch /api/fila         │
 │  · esc-pos.mjs   monta tickets/estação   │
 │        │ TCP :9100                        │
 │        ▼                                  │
 │   Impressora térmica PCFort E200M (caixa)│
 └─────────────────────────────────────────┘
```

**Isolamento multi-tenant:** feito **no código** (toda query filtra por `negocio_id`), não por RLS. O app conecta como um único usuário Postgres; a ponte não toca o banco — fala por uma **API HTTPS autenticada por token**.

**Regra de ouro da impressão:** a nuvem NÃO alcança a impressora (atrás do roteador da loja). Por isso a **ponte roda dentro da padaria** e puxa da API. Internet caiu → pedidos ficam `pendente` e imprimem quando voltar. Nada se perde.

---

## 3. Por que Vercel + Supabase

Decisão do Sandro (após considerar o aaPanel): **Vercel + Supabase**. Motivos e trade-offs:
- **Backup automático:** o maior motivo. O Supabase (Pro) faz backup diário + ponto de restauração sozinho — a preocupação nº1 do Sandro, sem virar tarefa dele.
- **Entregar sem virar sysadmin:** deploy nativo do Next, HTTPS pronto, banco gerenciado/patchado por eles. Menos superfície pra errar (com 1 cliente pagante esperando).
- **Custo:** ~US$25/mês fixo (Supabase Pro) que segura MUITAS padarias (multi-tenant no mesmo projeto). Vercel Hobby cobre 1 loja; Pro se precisar.
- **Serverless (o que exige cuidado, já feito):** o webhook usa **`after()`** pra processar depois do 200 (senão o serverless mata o trabalho); `maxDuration=60`. E o `pg` conecta pelo **connection pooler** do Supabase (porta 6543), não pela conexão direta — senão estoura conexão no serverless.
- **Supabase como Postgres gerenciado, não a pilha inteira:** usamos o driver `pg` direto (não supabase-js/Auth/RLS). Login é próprio (bcrypt + cookie). RLS fica como endurecimento futuro (defesa em profundidade) quando escalar.

**O que NÃO roda na nuvem (e não deve):** a **ponte de impressão** (on-site, de propósito).

---

## 4. Mapa dos arquivos (o que auditar)

### `painel/` — Next.js (Vercel)
| Arquivo | Papel | Status |
|---|---|---|
| `lib/ia/orcamento.ts` | Motor de orçamento (preços reais dos PDFs). IA nunca calcula, chama isto. | ✅ testado |
| `lib/ia/persona.ts` | System prompt (voz, regras). ⚠️ `horario`/`prazoMinimoDias`/`cobraSinal` = PLACEHOLDER. | ⚠️ falta config real |
| `lib/ia/cerebro.ts` | Claude Haiku 4.5 + tool use (montar_orcamento, chamar_humano, registrar_pedido). | ✅ compila |
| `lib/ia/dados/*.json` | catalogo + rendimento. | ⚠️ rendimento é chute |
| `lib/banco/db.ts` | Pool `pg` + helpers `query`/`queryUm`. `bancoConfigurado` decide real vs mock. | ✅ |
| `lib/banco/conversas.ts` | Cliente, histórico, salva msg, idempotência (`marcarWebhookNovo`), registra pedido. | ✅ compila |
| `lib/banco/pedidos.ts` | Lê fila de aprovação (JSON agregado, sem N+1), muda status. | ✅ compila |
| `lib/banco/fila.ts` | Jobs de impressão pendentes + marcar impresso/erro (a API da ponte usa). | ✅ compila |
| `lib/auth.ts` | Login: bcrypt + cookie HMAC. `autenticar`/`criarSessao`/`lerSessao`. | ✅ |
| `lib/dados.ts` | Escolhe banco real vs mock. | ✅ |
| `lib/whatsapp/api.ts` | Envia texto, baixa mídia (Meta Graph v21). | ✅ compila |
| `lib/whatsapp/transcrever.ts` | STT (Whisper OpenAI/Groq, trocável por env). | ⚠️ provider a definir |
| `app/api/whatsapp/route.ts` | Webhook GET (verificação) + POST. `after()` + **idempotência** por wamid. | ✅ |
| `app/api/fila/route.ts` | API que a ponte consome (GET jobs / POST impresso), auth por `PONTE_TOKEN`. | ✅ |
| `app/login/*` | Tela de login + ações entrar/sair. | ✅ |
| `app/acoes.ts` | Server Actions aprovar/recusar. | ✅ |
| `app/page.tsx` | Fila de aprovação, ligada ao banco. | ✅ |
| `components/Shell.tsx` | Layout + **portão de sessão** (sem login → /login; demo sem banco não exige). | ✅ |
| `app/{atendimentos,numeros,recuperar,dia,clube}/page.tsx` | Telas ainda em mock. | ⚠️ só aprovação está no banco |
| `criar-usuario.mjs` | Cria/atualiza usuário do painel (gera hash bcrypt). | ✅ |
| `testar-ia.mjs` | CLI pra conversar com a IA no terminal. | ✅ |
| `.env.example` | Todas as chaves. | ✅ |

### `banco/` — PostgreSQL (Supabase)
| Arquivo | Papel | Status |
|---|---|---|
| `schema.sql` | Tabelas + trigger (aprovado→fila). Roda no SQL Editor do Supabase. Inclui `usuarios`, `mensagens`, `webhook_recebidos`. | ✅ |
| `seed.sql` | Doce Pão como negócio #1 + dados fake. | ✅ |
| `backup.sh` | pg_dump manual (opcional — o Supabase Pro já faz backup automático). | ✅ extra |

### `ponte/` — roda na padaria (Node puro, sem deps)
| Arquivo | Papel | Status |
|---|---|---|
| `esc-pos.mjs` | Tickets por estação + master, ESC/POS, corte. | ✅ testado |
| `imprimir.mjs` | Loop: `fetch /api/fila`, imprime (TCP :9100), confirma. | ✅ |
| `teste.mjs` | Roda o gerador sem impressora/API. | ✅ |
| `.env.example` | API_URL + token + IP da impressora. | ✅ |

---

## 5. Fluxo de dados (state machine do pedido)

```
aberto → orcado → confirmado → aprovado → impresso
                       │            │
                  (fila de      (trigger cria
                  aprovação     fila_impressao;
                  no painel)    ponte imprime)
                       └→ recusado / cancelado
```
- `mensagens`: cada turno (user/assistant). Webhook **stateless** reconstrói o histórico daqui (últimas 20).
- `webhook_recebidos`: guarda o wamid → **idempotência** (Meta reenvia, não processa 2x).
- `fila_impressao`: `pendente → impresso | erro`. Criada pelo trigger `on_pedido_aprovado`.
- **Isolamento:** todas as queries filtram `negocio_id` (no código).

---

## 6. Checklist pra auditor — o que verificar / o que falta

**GAPS a fechar antes do ar:**
- [ ] **Cron de recuperação** de orçamento parado (a tela existe, o disparo não). No aaPanel = cron chamando uma rota/rotina.
- [ ] **Provider de STT** escolhido e chave (`STT_PROVIDER`/`STT_API_KEY`). Sem isso, áudio vira placeholder.
- [ ] **Telas** além da aprovação (atendimentos/números/recuperar/dia/clube) ainda em **mock** — ligar ao banco.
- [ ] **"Pronto"** (cozinha marca pronto → avisa cliente) — não construído.
- [ ] **Testar o restore** do backup uma vez (senão não é backup).

**JÁ RESOLVIDO:**
- [x] Idempotência do webhook (dedupe por wamid).
- [x] Login do painel (bcrypt + sessão assinada).
- [x] Isolamento por negocio_id no código.
- [x] Ponte via API HTTPS (banco não exposto).
- [x] Backup automático (Supabase Pro).
- [x] Serverless: `after()` + `maxDuration` + pooler do Supabase.

**Config que depende da dona (troca dados, não código):**
- [ ] Rendimento real → `rendimento.json`. Horário/prazo/sinal → `persona.ts`. Conversas reais pra afinar tom.

**Chaves/infra (Sandro):**
- [ ] Projeto Supabase (Pro pra backup), `schema.sql` + `seed.sql` no SQL Editor, usuário do painel criado.
- [ ] Deploy do painel na Vercel (raiz = `painel/`) + env vars. Usar o `DATABASE_URL` do **pooler** (6543).
- [ ] Webhook apontado no Meta + `WHATSAPP_VERIFY_TOKEN`.
- [ ] WhatsApp via **Coexistence** (QR code, NÃO migração direta — senão perde o app).
- [ ] Ponte no PC do caixa + IP da impressora + `PONTE_TOKEN` igual ao do painel.

**Decisões já tomadas (não reabrir):**
- Modelo IA = **Haiku 4.5** (custo; trocável por env). Hospedagem = **Vercel + Supabase** (backup automático).
- Impressora no **caixa** (não na cozinha). Pagamento **na retirada**. Sem delivery/Instagram.

---

## 7. Premissas que EU assumi (confirmar se batem com o que você testou)

- **Isolamento por código, não RLS:** toda query filtra `negocio_id`. Se algum caminho novo esquecer o filtro, vaza entre tenants — **é o ponto nº 1 a auditar** em qualquer query nova.
- **Ponte não acessa o banco:** só a API `/api/fila` (token). Não abrir a porta 5432 pra fora.
- **STT separado do Claude:** a Messages API não recebe áudio nativo; Whisper transcreve antes. Áudio direto pro Claude **não funciona**.
- **Mapa categoria→estação** hardcoded em `esc-pos.mjs` (`ESTACOES`): confeitaria=doce+bolos, salgados=salgado+pizza. Ajustar se a dona separa diferente.
- **Multi-tenant já preparado**, mas pra 1 cliente o `NEGOCIO_PADRAO_ID` (env) basta; o webhook também resolve por `phone_number_id`.
- **Prompt caching / resumo de histórico** (economia de token) planejados, ainda não implementados — hoje reenvia as últimas 20 msgs cruas. Funciona, dá pra otimizar custo depois.
