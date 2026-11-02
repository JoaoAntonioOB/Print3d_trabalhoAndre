# Marco 7 — Estoque de filamentos

**Objetivo:** controlar o saldo em gramas de cada filamento, registrar entradas e descontar o peso do pedido quando a produção começa (estorno no cancelamento), com alerta de estoque baixo.

## Critérios de aceite
- [x] Cadastro de filamento com nome, material, cor, marca, saldo inicial (≥ 0) e estoque mínimo (≥ 0); saldo nunca fica negativo.
- [x] Edição não altera o saldo; o saldo muda só por entrada, desconto de pedido ou estorno.
- [x] Entrada de estoque (gramas > 0) gera movimentação; histórico do filamento com os mais recentes primeiro.
- [x] Pedido com filamento (opcional): o material vem do filamento; PENDENTE→EM_PRODUCAO desconta o peso; saldo insuficiente dá 400 com a mensagem "Estoque insuficiente de X: disponível Ng, necessário Mg".
- [x] EM_PRODUCAO→CANCELADO estorna as gramas descontadas.
- [x] Editar pedido em EM_PRODUCAO devolve o que saiu e desconta de novo com os dados novos.
- [x] Pedido sem filamento (inclusive pedidos anteriores ao marco) não mexe no estoque.
- [x] Filamento usado em pedido não pode ser excluído (409); sem pedidos, a exclusão remove também o histórico.
- [x] Dashboard entrega `filamentosAbaixoMinimo` (saldo ≤ mínimo, até 5, mais críticos primeiro).
- [x] Lista com busca por nome/cor/marca e filtro por material.
- [x] Backend: testes unitários do service e de fluxo completo (API) cobrem desconto, estorno, saldo insuficiente e exclusão bloqueada.
- [ ] Telas conferidas no Expo Go: lista, detalhe (saldo, entrada, histórico), formulário, seletor de filamento no pedido e alerta no painel.

## Arquivos
Backend: `filament/{controller,service,repository,model,dto,mapper}/`, `order/service/OrderService.java` (regras de desconto/estorno), `dashboard/service/DashboardService.java`, migrações `V5__estoque_filamentos.sql` e `V6__seed_filamentos_demo.sql`, testes em `test/.../filament/service/FilamentServiceTest.java`, `order/service/OrderServiceTest.java` e `ApiFlowIntegrationTest.java`.
App: `app/filaments/{index,[id],form}.tsx`, `app/orders/select-filament.tsx`, `src/api/filaments.ts`, `src/components/FilamentPicker.tsx`, `src/utils/pickerBus.ts`; alterados `app/orders/{form,[id]}.tsx`, `app/index.tsx` (alerta), `src/components/SideMenu.tsx` (item "Estoque").
