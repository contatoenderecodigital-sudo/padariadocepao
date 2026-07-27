-- ============================================================================
--  SEED — Doce Pão como negócio piloto + pedidos fake pra demo.
--  Rodar DEPOIS do schema.sql. Popula o painel pra mostrar na reunião.
--  (Os dados de cliente aqui são fictícios.)
-- ============================================================================

-- Negócio #1 — Doce Pão
insert into negocios (id, slug, nome, cidade, whatsapp, cor_primaria, cor_destaque, config)
values (
  '11111111-1111-1111-1111-111111111111',
  'docepao',
  'Padaria Doce Pão',
  'Xanxerê, SC',
  '5549999990000',
  '#6e1f30',
  '#bb921f',
  '{"rendimento_a_confirmar": true}'::jsonb
)
on conflict (slug) do nothing;

-- Clientes fictícios
insert into clientes (id, negocio_id, telefone, nome, selos) values
  ('c0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','5549991111111','Maria de Souza', 3),
  ('c0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','5549992222222','João Pereira',   7),
  ('c0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','5549993333333','Ana Beatriz',    1),
  ('c0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','5549994444444','Carlos Menezes', 5)
on conflict (negocio_id, telefone) do nothing;

-- Pedidos em vários estados, pra o painel mostrar a fila viva
-- 1) CONFIRMADO (aguardando aprovação da equipe) — festa de aniversário
insert into pedidos (id, negocio_id, cliente_id, status, retirada_data, retirada_hora, pessoas, total_centavos, observacoes, confirmado_em)
values ('d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000001',
  'confirmado', current_date + 2, '14:00', 20, 23440, 'Festa de aniversário. Cliente pediu pra caprichar no brigadeiro.', now())
on conflict (id) do nothing;
insert into pedido_itens (pedido_id, produto, categoria, qtd, unit_centavos, subtotal_centavos) values
  ('d0000000-0000-0000-0000-000000000001','Salgado assado','salgado',100,125,12500),
  ('d0000000-0000-0000-0000-000000000001','Brigadeiro','doce',50,125,6250),
  ('d0000000-0000-0000-0000-000000000001','Bolo 4 leites','bolo_recheado',1,4690,4690)
on conflict do nothing;

-- 2) CONFIRMADO — encomenda simples
insert into pedidos (id, negocio_id, cliente_id, status, retirada_data, retirada_hora, pessoas, total_centavos, observacoes, confirmado_em)
values ('d0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000002',
  'confirmado', current_date + 1, '09:30', null, 36000, 'Retirar de manhã cedo.', now())
on conflict (id) do nothing;
insert into pedido_itens (pedido_id, produto, categoria, qtd, unit_centavos, subtotal_centavos) values
  ('d0000000-0000-0000-0000-000000000002','Pizza inteira','pizza',3,12000,36000)
on conflict do nothing;

-- 3) ORCADO (esperando o cliente confirmar) — candidato à recuperação
insert into pedidos (id, negocio_id, cliente_id, status, retirada_data, pessoas, total_centavos, observacoes, orcado_em)
values ('d0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000003',
  'orcado', current_date + 5, 30, 50000, 'Cliente falou que ia ver com o marido.', now() - interval '1 day')
on conflict (id) do nothing;
insert into pedido_itens (pedido_id, produto, categoria, qtd, unit_centavos, subtotal_centavos) values
  ('d0000000-0000-0000-0000-000000000003','Salgado assado','salgado',300,125,37500),
  ('d0000000-0000-0000-0000-000000000003','Brigadeiro','doce',100,125,12500)
on conflict do nothing;

-- 4) APROVADO (já foi pra impressão) — pra visão "pedidos do dia"
insert into pedidos (id, negocio_id, cliente_id, status, retirada_data, retirada_hora, total_centavos, observacoes, confirmado_em, aprovado_em)
values ('d0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000004',
  'aprovado', current_date, '16:00', 8125, 'Sem observações.', now() - interval '2 hours', now() - interval '1 hour')
on conflict (id) do nothing;
insert into pedido_itens (pedido_id, produto, categoria, qtd, unit_centavos, subtotal_centavos) values
  ('d0000000-0000-0000-0000-000000000004','Salgado frito','salgado',50,100,5000),
  ('d0000000-0000-0000-0000-000000000004','Trufa','doce',25,225,5625)
on conflict do nothing;
