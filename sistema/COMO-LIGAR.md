# Sistema Doce Pão — como ligar (Vercel + Supabase)

O sistema inteiro já está construído. O que falta é **plugar as chaves** e **subir**.
Nada aqui inventa preço, nada perde pedido, cada equipe recebe só o seu papel.

## As 3 peças

```
   Cliente no WhatsApp
          │
          ▼
   [ webhook ]  ── painel/app/api/whatsapp/route.ts   (roda no Vercel)
          │        recebe msg, transcreve áudio, chama a IA, responde
          ▼
   [ IA cérebro ] ── painel/lib/ia/*   (Claude Haiku + motor de orçamento)
          │        nunca calcula preço de cabeça; chama a ferramenta
          ▼
   [ PostgreSQL ] ── pedido vira 'confirmado'   (banco GERENCIADO do Supabase)
          │           backup automático + patches por conta deles
          ▼
   [ painel ] ── a equipe faz login e aprova (painel/app/*)   (Vercel)
          │        aprovou → status 'aprovado' → fila de impressão
          ▼
   [ ponte ] ── sistema/ponte/imprimir.mjs   (roda NA PADARIA, no caixa)
                puxa a fila pela API HTTPS e imprime
                1 ticket por estação + master no caixa
```

## Passo a passo

### 1. Banco (Supabase) — 10 min
1. Cria um projeto em supabase.com. Pra ter **backup diário de verdade**, plano **Pro** (~US$25/mês).
2. No **SQL Editor**, cola e roda `banco/schema.sql` (tabelas + trigger + usuarios).
3. Cola e roda `banco/seed.sql` (Doce Pão como negócio #1).
4. Em **Project Settings → Database → Connection string**, copia a do **"Transaction pooler"**
   (porta **6543** — é a certa pro Vercel). Essa vai no `DATABASE_URL`.

### 2. Painel + IA (Vercel) — 15 min
1. Copia `painel/.env.example` pra `painel/.env.local` e preenche:
   - `DATABASE_URL` (o pooler do passo 1)
   - `ANTHROPIC_API_KEY` (console.anthropic.com)
   - `SESSION_SECRET` (gera com `openssl rand -hex 32`)
   - `PONTE_TOKEN` (inventa um token — a ponte vai usar o mesmo)
   - `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
2. **Cria teu login** do painel (com o `.env.local` já preenchido):
   `node --env-file=.env.local criar-usuario.mjs voce@docepao.com suaSenha "Seu Nome"`
3. Testa a IA no terminal: `node --env-file=.env.local testar-ia.mjs`
4. Sobe na Vercel: conecta o repositório (raiz do deploy = `painel/`), cola as MESMAS
   variáveis em **Settings → Environment Variables**, deploy. HTTPS vem pronto.
5. No painel do Meta (WhatsApp), aponta o webhook pra:
   `https://SEU-APP.vercel.app/api/whatsapp` e usa o mesmo `WHATSAPP_VERIFY_TOKEN`.

### 3. Backup (o ponto que você levantou) — 0 min
No Supabase **Pro é automático**: backup diário + ponto de restauração. Nada a configurar.
👉 Boa prática: uma vez, baixa um backup e confere que restaura. Backup que ninguém olhou dá medo.

### 4. Ponte de impressão (na padaria) — 15 min
1. No mini-PC/Raspberry do caixa: instala Node, copia a pasta `ponte/`.
   (Não precisa `npm install` — a ponte usa só o Node puro.)
2. Copia `.env.example` pra `.env`, preenche:
   - `API_URL` (o domínio do Vercel) e `PONTE_TOKEN` (o MESMO do painel)
   - `IMPRESSORA_HOST` (o IP da impressora, acha no roteador)
3. Testa sem papel: `MODO_TESTE=1 node teste.mjs` (mostra os cupons no console).
4. Liga de verdade: `node --env-file=.env imprimir.mjs`
   (deixa rodando com pm2 ou serviço do sistema).

## O que ainda depende da dona (config real)

Estão como **placeholder** no código, marcados com ⚠️. Trocar quando ela confirmar:
- **Rendimento** (`painel/lib/ia/dados/rendimento.json`): salgado/doce por pessoa, bolo serve quantos.
  (Pizza já está confirmada pelo cardápio dela: inteira serve 6–8.)
- **Horário de funcionamento** (`painel/lib/ia/persona.ts` → `DOCE_PAO.horario`).
- **Prazo mínimo de encomenda** e **se cobra sinal** (mesmo arquivo).
- **Conversas reais** dela pra afinar o tom da IA.

## O que já está pronto e testado
- Motor de orçamento (preços reais dos PDFs) — a IA nunca erra conta.
- Cérebro da IA com as ferramentas (orçamento, chamar humano, registrar pedido).
- Webhook com transcrição de áudio (ouve áudio, responde texto) + **idempotência** (Meta reenvia → não duplica).
- Painel com **login** próprio (bcrypt), ligado ao Postgres (fallback pra demo sem chave).
- Ponte de impressão por **API HTTPS** (banco nunca exposto): ticket por estação + master no caixa, com corte. **Testado.**
- **Backup automático** (Supabase) — a preocupação que puxou tudo isso.
