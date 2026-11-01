-- Dados de demonstração (fictícios) para a apresentação: clientes e pedidos em todos os status,
-- com prazos relativos à data de hoje (alguns pedidos ficam atrasados de propósito).

INSERT INTO clientes (nome, email, telefone, cep, logradouro, numero, bairro, cidade, estado) VALUES
 ('Oficina Criativa',   'contato@oficinacriativa.exemplo.com', '(11) 91234-0001', '01001-000', 'Praça da Sé',          '100', 'Sé',          'São Paulo',      'SP'),
 ('Studio Arquitetura', 'projetos@studioarq.exemplo.com',      '(21) 98765-0002', '20040-020', 'Rua da Assembleia',    '45',  'Centro',      'Rio de Janeiro', 'RJ'),
 ('Maria Souza',        'maria.souza@exemplo.com',             '(31) 99876-0003', '30130-010', 'Avenida Afonso Pena',  '1500','Centro',      'Belo Horizonte', 'MG'),
 ('Loja Geek Point',    'vendas@geekpoint.exemplo.com',        '(41) 97654-0004', '80010-000', 'Rua XV de Novembro',   '700', 'Centro',      'Curitiba',       'PR'),
 ('Carlos Mendes',      'carlos.mendes@exemplo.com',           '(51) 96543-0005', '90010-150', 'Rua dos Andradas',     '210', 'Centro Histórico', 'Porto Alegre', 'RS'),
 ('Escola Maker Kids',  'secretaria@makerkids.exemplo.com',    '(61) 95432-0006', '70040-010', 'Esplanada dos Ministérios', 's/n', 'Zona Cívico-Administrativa', 'Brasília', 'DF');

INSERT INTO pedidos (cliente_id, descricao, material, peso_gramas, valor, prazo, status, criado_em, atualizado_em)
SELECT c.id, v.descricao, v.material, v.peso, v.valor, CURRENT_DATE + v.dias, v.status,
       now() - v.idade_horas * interval '1 hour', now() - v.idade_horas * interval '1 hour'
FROM (VALUES
  ('Oficina Criativa',   'Suporte de bancada para ferramentas', 'PLA',  210.00,  89.90,   4, 'PENDENTE',    2),
  ('Oficina Criativa',   'Lote de 20 chaveiros personalizados', 'PETG',  95.50, 120.00,   9, 'EM_PRODUCAO', 30),
  ('Studio Arquitetura', 'Maquete de edifício residencial',     'PLA',  640.00, 480.00,  -3, 'EM_PRODUCAO', 70),
  ('Studio Arquitetura', 'Peças de encaixe para protótipo',     'ABS',  180.25, 156.40,   2, 'CONCLUIDO',   50),
  ('Maria Souza',        'Vaso decorativo geométrico',          'PLA',  320.00,  75.00,  -1, 'PENDENTE',    90),
  ('Loja Geek Point',    'Miniaturas de RPG (kit com 12)',      'PETG', 150.00, 210.00,   7, 'PENDENTE',     5),
  ('Loja Geek Point',    'Suportes para controle de console',   'PLA',  400.00, 189.00,  -6, 'CONCLUIDO',  120),
  ('Carlos Mendes',      'Engrenagem de reposição (eletrodoméstico)', 'ABS', 45.80, 38.50, 0, 'EM_PRODUCAO', 12),
  ('Escola Maker Kids',  'Kit didático de sistema solar',       'PLA',  760.00, 540.00,  14, 'PENDENTE',     1),
  ('Escola Maker Kids',  'Chaveiros com nome dos alunos',       'PLA',  210.00, 260.00, -10, 'ENTREGUE',   200),
  ('Maria Souza',        'Porta-retratos com moldura vazada',   'PETG',  85.00,  49.90,  -8, 'ENTREGUE',   180),
  ('Carlos Mendes',      'Case para Raspberry Pi',              'TPU',   60.00,  42.00,   3, 'CANCELADO',   40)
) AS v(cliente, descricao, material, peso, valor, dias, status, idade_horas)
JOIN clientes c ON c.nome = v.cliente;
