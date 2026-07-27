# Padaria Doce Pão — sistema

Atendimento 24h no WhatsApp por IA, com orçamento automático, aprovação da equipe
e impressão por estação. Produto multi-tenant (Doce Pão é o cliente #1).

## Deploy na Vercel
- **Root Directory:** `sistema/painel`
- Variáveis de ambiente: ver `sistema/painel/.env.example`
- Banco: PostgreSQL do Supabase (usar a conexão do **pooler**, porta 6543)

## Como ligar (passo a passo)
Ver **[`sistema/COMO-LIGAR.md`](sistema/COMO-LIGAR.md)**.

## Arquitetura / auditoria
Ver **[`sistema/ARQUITETURA.md`](sistema/ARQUITETURA.md)**.

## Estrutura
- `sistema/painel/` — app Next.js (painel + webhook + IA). Roda na Vercel.
- `sistema/banco/` — schema e seed do PostgreSQL (rodar no Supabase).
- `sistema/ponte/` — ponte de impressão (roda na padaria, no PC do caixa).
