-- ============================================================================
--  BANCO — Painel de Atendimento (multi-tenant)  ·  PostgreSQL puro (aaPanel)
--
--  PRODUTO reutilizável. Cada padaria/negócio é um "negócio" (tenant).
--  Doce Pão é o negócio #1 (piloto). O isolamento entre clientes é feito
--  NO CÓDIGO (toda query filtra por negocio_id) — não por RLS.
--  O app conecta como um único usuário do Postgres; nada é exposto direto.
--
--  Rodar no banco criado pelo aaPanel:  psql -U usuario -d docepao -f schema.sql
-- ============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
--  NEGÓCIOS (tenants) — cada linha é um cliente do produto
-- ---------------------------------------------------------------------------
create table if not exists negocios (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,          -- 'docepao'
  nome         text not null,                 -- 'Padaria Doce Pão'
  cidade       text,
  whatsapp     text,                          -- número do WhatsApp Business
  cor_primaria text default '#6e1f30',        -- vinho (Doce Pão)
  cor_destaque text default '#bb921f',        -- dourado
  config       jsonb not null default '{}'::jsonb,  -- cardápio/rendimento/regras por cliente
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  USUÁRIOS — quem entra no painel (login próprio, sem serviço externo).
--  Senha guardada como hash bcrypt (nunca em texto). papel: 'dono' | 'equipe'.
-- ---------------------------------------------------------------------------
create table if not exists usuarios (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocios(id) on delete cascade,
  email       text unique not null,
  senha_hash  text not null,
  nome        text,
  papel       text not null default 'equipe',
  criado_em   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  CLIENTES — a chave é o TELEFONE (é a carteirinha do clube também)
-- ---------------------------------------------------------------------------
create table if not exists clientes (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocios(id) on delete cascade,
  telefone    text not null,                 -- '5549999991234'
  nome        text,
  aniversario date,
  selos       int  not null default 0,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (negocio_id, telefone)
);

-- ---------------------------------------------------------------------------
--  PEDIDOS — a máquina de estados que resolve o "confirma, cancela, meio aberto"
-- ---------------------------------------------------------------------------
--  aberto → orcado → confirmado → aprovado → impresso  (+ recusado / cancelado)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'pedido_status') then
    create type pedido_status as enum
      ('aberto','orcado','confirmado','aprovado','impresso','recusado','cancelado');
  end if;
end $$;

create table if not exists pedidos (
  id            uuid primary key default gen_random_uuid(),
  negocio_id    uuid not null references negocios(id) on delete cascade,
  cliente_id    uuid references clientes(id) on delete set null,
  status        pedido_status not null default 'aberto',
  retirada_data date,
  retirada_hora time,
  pessoas       int,
  total_centavos int not null default 0,      -- dinheiro SEMPRE inteiro (centavos), nunca float
  observacoes   text,
  criado_em     timestamptz not null default now(),
  orcado_em     timestamptz,
  confirmado_em timestamptz,
  aprovado_em   timestamptz,
  impresso_em   timestamptz,
  cobrado_em    timestamptz,                  -- última cobrança de confirmação
  cobrancas     int not null default 0
);

create index if not exists idx_pedidos_negocio_status on pedidos(negocio_id, status);
create index if not exists idx_pedidos_cliente         on pedidos(cliente_id);
create index if not exists idx_pedidos_retirada        on pedidos(negocio_id, retirada_data);

-- ---------------------------------------------------------------------------
--  ITENS — preço GRAVADO no momento (snapshot); reajuste futuro não altera pedido antigo
-- ---------------------------------------------------------------------------
create table if not exists pedido_itens (
  id             uuid primary key default gen_random_uuid(),
  pedido_id      uuid not null references pedidos(id) on delete cascade,
  produto        text not null,
  categoria      text,
  qtd            int  not null,
  unit_centavos  int  not null,
  subtotal_centavos int not null
);

create index if not exists idx_itens_pedido on pedido_itens(pedido_id);

-- ---------------------------------------------------------------------------
--  FILA DE IMPRESSÃO — a ponte na padaria lê daqui (via API HTTPS, não direto).
--  Pedido aprovado → linha 'pendente'. Ponte imprime → 'impresso'.
--  Internet caiu? Fica pendente e imprime ao voltar. Nada se perde.
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'impressao_status') then
    create type impressao_status as enum ('pendente','impresso','erro');
  end if;
end $$;

create table if not exists fila_impressao (
  id           uuid primary key default gen_random_uuid(),
  negocio_id   uuid not null references negocios(id) on delete cascade,
  pedido_id    uuid not null references pedidos(id) on delete cascade,
  status       impressao_status not null default 'pendente',
  cupom_texto  text,
  tentativas   int not null default 0,
  criado_em    timestamptz not null default now(),
  impresso_em  timestamptz,
  erro_msg     text
);

create index if not exists idx_fila_negocio_status on fila_impressao(negocio_id, status);

-- ---------------------------------------------------------------------------
--  CONVERSAS — resumo (custo de IA + "quer igual da última vez?")
-- ---------------------------------------------------------------------------
create table if not exists conversas (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocios(id) on delete cascade,
  cliente_id  uuid references clientes(id) on delete set null,
  resumo      text,
  mensagens   int not null default 0,
  ativa       boolean not null default true,
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_conversas_negocio on conversas(negocio_id);

-- ---------------------------------------------------------------------------
--  MENSAGENS — o histórico cru da conversa (o webhook é stateless: a IA
--  reconstrói o contexto lendo as últimas mensagens deste cliente daqui).
-- ---------------------------------------------------------------------------
create table if not exists mensagens (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocios(id) on delete cascade,
  cliente_id  uuid not null references clientes(id) on delete cascade,
  papel       text not null,                 -- 'user' | 'assistant'
  conteudo    text not null,
  criado_em   timestamptz not null default now()
);

create index if not exists idx_mensagens_cliente on mensagens(negocio_id, cliente_id, criado_em);

-- ---------------------------------------------------------------------------
--  WEBHOOK_RECEBIDOS — idempotência: o Meta REENVIA se não recebe 200 a tempo.
--  Guardamos o id da mensagem (wamid) pra NUNCA processar a mesma 2x
--  (senão vira resposta/pedido duplicado). Limpeza periódica opcional.
-- ---------------------------------------------------------------------------
create table if not exists webhook_recebidos (
  wamid       text primary key,              -- id único da mensagem do WhatsApp
  criado_em   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  gatilho: pedido → 'aprovado' cria a linha na fila de impressão
-- ---------------------------------------------------------------------------
create or replace function on_pedido_aprovado() returns trigger as $$
begin
  if new.status = 'aprovado' and (old.status is distinct from 'aprovado') then
    insert into fila_impressao (negocio_id, pedido_id) values (new.negocio_id, new.id);
    new.aprovado_em := now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pedido_aprovado on pedidos;
create trigger trg_pedido_aprovado
  before update on pedidos
  for each row execute function on_pedido_aprovado();

-- ===========================================================================
--  ISOLAMENTO ENTRE CLIENTES: feito NO CÓDIGO (não há RLS aqui).
--  Toda query do app filtra por negocio_id. O app conecta com UM usuário
--  Postgres e nunca expõe o banco direto — a ponte fala por API HTTPS.
--  Se um dia quiser defesa em profundidade, dá pra ligar RLS depois.
-- ===========================================================================
