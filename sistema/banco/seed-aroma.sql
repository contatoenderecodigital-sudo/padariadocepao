-- ============================================================================
--  SEED DEMO — "Padaria Aroma" (tenant FICTÍCIO pra vídeo da análise da Meta).
--  NADA de dado real da Doce Pão. Negócio isolado por negocio_id próprio.
--  Rodar DEPOIS do schema.sql (no SQL Editor do Supabase).
--
--  Login de demo do painel:  demo@aroma.com  /  aroma123
-- ============================================================================

-- Negócio de demonstração (id próprio, isolado)
insert into negocios (id, slug, nome, cidade, whatsapp, cor_primaria, cor_destaque, config)
values (
  '22222222-2222-2222-2222-222222222222',
  'aroma',
  'Padaria Aroma',
  'São Paulo, SP',
  '5511999990000',
  '#2f5d50',   -- verde (identidade própria, diferente da Doce Pão)
  '#c9a227',
  '{
    "demo": true,
    "persona": {
      "horario": "Seg a Sáb 6h30 às 20h, Dom 6h30 às 12h",
      "prazoMinimoDias": 2,
      "cobraSinal": false
    },
    "rendimento": {
      "salgado_por_pessoa": 7,
      "doce_por_pessoa": 3,
      "cento_serve_pessoas": 15
    },
    "cardapio": {
      "salgados": [
        {"nome": "Cento de salgado assado", "preco": 130.00},
        {"nome": "Cento de salgado frito", "preco": 120.00},
        {"nome": "Cento de coxinha", "preco": 120.00}
      ],
      "doces": [
        {"nome": "Cento de brigadeiro", "preco": 90.00},
        {"nome": "Sonho", "preco": 6.00}
      ],
      "bolos": [
        {"nome": "Bolo caseiro", "preco": 35.00},
        {"nome": "Bolo recheado", "preco": 55.00}
      ],
      "tortas": [
        {"nome": "Torta salgada", "preco": 60.00},
        {"nome": "Cheesecake", "preco": 65.00}
      ],
      "paes": [
        {"nome": "Pão francês (kg)", "preco": 14.90}
      ]
    }
  }'::jsonb
)
on conflict (slug) do nothing;

-- Usuário de login do painel (senha bcrypt de 'aroma123')
insert into usuarios (negocio_id, email, senha_hash, nome, papel)
values (
  '22222222-2222-2222-2222-222222222222',
  'demo@aroma.com',
  '$2b$10$WiFIXlxxY/B1XlThOdT81uxSlX0APkx/AE3LwCkasOpDaOdDzwLeu',
  'Equipe Aroma (demo)',
  'dono'
)
on conflict (email) do nothing;

-- Clientes FICTÍCIOS (nomes inventados, nenhum real)
insert into clientes (id, negocio_id, telefone, nome, selos) values
  ('a0000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','5511990001111','Joana Ribeiro',   6),
  ('a0000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','5511990002222','Marcos Andrade',  2),
  ('a0000000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','5511990003333','Bianca Costa',    9)
on conflict (negocio_id, telefone) do nothing;

-- 1) CONFIRMADO (aguardando aprovação) — festa
insert into pedidos (id, negocio_id, cliente_id, status, retirada_data, retirada_hora, pessoas, total_centavos, observacoes, confirmado_em)
values ('a1000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','a0000000-0000-0000-0000-000000000001',
  'confirmado', current_date + 3, '15:00', 30, 41000, 'Festa de aniversario. Caprichar nos doces.', now())
on conflict (id) do nothing;
insert into pedido_itens (pedido_id, produto, categoria, qtd, unit_centavos, subtotal_centavos) values
  ('a1000000-0000-0000-0000-000000000001','Cento de salgado assado','salgado',2,13000,26000),
  ('a1000000-0000-0000-0000-000000000001','Cento de brigadeiro','doce',1,9000,9000),
  ('a1000000-0000-0000-0000-000000000001','Bolo recheado','bolo',1,5500,5500),
  ('a1000000-0000-0000-0000-000000000001','Cheesecake','torta',1,6500,6500)
on conflict do nothing;

-- 2) CONFIRMADO — encomenda simples
insert into pedidos (id, negocio_id, cliente_id, status, retirada_data, retirada_hora, total_centavos, observacoes, confirmado_em)
values ('a1000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','a0000000-0000-0000-0000-000000000002',
  'confirmado', current_date + 1, '08:30', 12000, 'Retirar cedo.', now())
on conflict (id) do nothing;
insert into pedido_itens (pedido_id, produto, categoria, qtd, unit_centavos, subtotal_centavos) values
  ('a1000000-0000-0000-0000-000000000002','Cento de coxinha','salgado',1,12000,12000)
on conflict do nothing;

-- 3) ORCADO (parado, esperando confirmar) — pra DEMO de recuperação
insert into pedidos (id, negocio_id, cliente_id, status, retirada_data, pessoas, total_centavos, observacoes, orcado_em)
values ('a1000000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','a0000000-0000-0000-0000-000000000003',
  'orcado', current_date + 6, 40, 61000, 'Cliente disse que ia confirmar depois.', now() - interval '1 day')
on conflict (id) do nothing;
insert into pedido_itens (pedido_id, produto, categoria, qtd, unit_centavos, subtotal_centavos) values
  ('a1000000-0000-0000-0000-000000000003','Cento de salgado frito','salgado',3,12000,36000),
  ('a1000000-0000-0000-0000-000000000003','Cento de brigadeiro','doce',2,9000,18000),
  ('a1000000-0000-0000-0000-000000000003','Torta salgada','torta',1,6000,6000),
  ('a1000000-0000-0000-0000-000000000003','Bolo recheado','bolo',1,5500,5500)
on conflict do nothing;
