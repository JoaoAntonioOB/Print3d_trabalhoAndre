-- Histórico de demonstração (fictício): pedidos entregues e alguns cancelados nos 5 meses anteriores,
-- para o dashboard mostrar a evolução das vendas. As datas são relativas ao mês atual.

INSERT INTO pedidos (cliente_id, descricao, material, peso_gramas, valor, prazo, status, criado_em, atualizado_em)
SELECT c.id, v.descricao, v.material, v.peso, v.valor,
       (date_trunc('month', now()) - v.meses_atras * interval '1 month' + (v.dia - 1) * interval '1 day')::date + 9,
       v.status,
       date_trunc('month', now()) - v.meses_atras * interval '1 month' + (v.dia - 1) * interval '1 day' + interval '10 hour',
       date_trunc('month', now()) - v.meses_atras * interval '1 month' + (v.dia - 1) * interval '1 day' + interval '8 day'
FROM (VALUES
  -- 5 meses atrás
  ('Oficina Criativa',   'Gabaritos de furação (kit)',          'PLA',   180.00, 95.00,   5, 4,  'ENTREGUE'),
  ('Maria Souza',        'Luminária de mesa em camadas',        'PLA',   260.00, 110.00,  5, 12, 'ENTREGUE'),
  ('Carlos Mendes',      'Peça de reposição para impressora',   'ABS',    55.00, 48.00,   5, 20, 'ENTREGUE'),
  -- 4 meses atrás
  ('Studio Arquitetura', 'Maquete de praça pública',            'PLA',   520.00, 320.00,  4, 3,  'ENTREGUE'),
  ('Loja Geek Point',    'Miniaturas de tabuleiro (kit 8)',     'PETG',  140.00, 168.00,  4, 10, 'ENTREGUE'),
  ('Escola Maker Kids',  'Kit de formas geométricas',           'PLA',   300.00, 150.00,  4, 18, 'ENTREGUE'),
  ('Maria Souza',        'Organizador de gaveta',               'PLA',   210.00, 72.00,   4, 25, 'CANCELADO'),
  -- 3 meses atrás
  ('Oficina Criativa',   'Suportes para prateleira (20 un.)',   'PETG',  430.00, 260.00,  3, 5,  'ENTREGUE'),
  ('Studio Arquitetura', 'Protótipo de fachada',                'PLA',   610.00, 410.00,  3, 14, 'ENTREGUE'),
  ('Loja Geek Point',    'Chaveiros promocionais (100 un.)',    'PLA',   320.00, 290.00,  3, 22, 'ENTREGUE'),
  ('Carlos Mendes',      'Engrenagens para automação',          'ABS',    95.00, 120.00,  3, 27, 'ENTREGUE'),
  -- 2 meses atrás
  ('Escola Maker Kids',  'Kit didático de anatomia',            'PLA',   480.00, 380.00,  2, 2,  'ENTREGUE'),
  ('Oficina Criativa',   'Lote de peças de acabamento',         'TPU',   120.00, 185.00,  2, 9,  'ENTREGUE'),
  ('Studio Arquitetura', 'Maquete de condomínio',               'PLA',   750.00, 560.00,  2, 16, 'ENTREGUE'),
  ('Maria Souza',        'Vaso modular',                        'PETG',  240.00, 98.00,   2, 24, 'ENTREGUE'),
  ('Loja Geek Point',    'Cenário para jogo de RPG',            'PLA',   560.00, 330.00,  2, 28, 'CANCELADO'),
  -- mês passado
  ('Escola Maker Kids',  'Sistema solar em escala',             'PLA',   690.00, 520.00,  1, 4,  'ENTREGUE'),
  ('Loja Geek Point',    'Miniaturas colecionáveis (kit 16)',   'PETG',  310.00, 340.00,  1, 11, 'ENTREGUE'),
  ('Oficina Criativa',   'Caixas organizadoras sob medida',     'PLA',   470.00, 275.00,  1, 17, 'ENTREGUE'),
  ('Carlos Mendes',      'Suportes para câmeras de segurança',  'ABS',   200.00, 210.00,  1, 21, 'ENTREGUE'),
  ('Studio Arquitetura', 'Detalhes de maquete (lote)',          'PLA',   390.00, 295.00,  1, 26, 'ENTREGUE')
) AS v(cliente, descricao, material, peso, valor, meses_atras, dia, status)
JOIN clientes c ON c.nome = v.cliente;
