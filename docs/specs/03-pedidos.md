# Marco 3 — Pedidos

**Objetivo:** CRUD de pedidos vinculado a cliente, com status e regras do item 5.

## Critérios de aceite
- Lista com busca (descrição/cliente), filtro por status, paginação, pull-to-refresh, estados carregando/vazio/erro; atrasados em destaque.
- Cadastro/edição: cliente (seletor com busca), descrição, material, peso (>0), valor (>0), prazo (não pode estar no passado na criação).
- Detalhe mostra só as transições válidas: PENDENTE→EM_PRODUCAO|CANCELADO, EM_PRODUCAO→CONCLUIDO|CANCELADO, CONCLUIDO→ENTREGUE. Cancelar pede confirmação.
- Editar só em PENDENTE/EM_PRODUCAO; excluir só em PENDENTE/CANCELADO; a API valida de qualquer forma (400 com mensagem).
- Mensagens e `fieldErrors` da API aparecem no app.

## Arquivos
App: `app/orders/{index,[id],form}.tsx`, `src/api/orders.ts`, `src/components/{StatusChip,ClientPicker}.tsx`, `src/utils/format.ts`.
