## Regra de negócio — cálculo automático do preço unitário de itens de pedido reaproveitando a engine de precificação dos orçamentos

**Fluxo/máquina de estados afetada:** Nenhuma máquina de estados foi alterada (nem `OrderStatus`, nem `QuoteStatus`). A mudança é aditiva na criação/edição de itens de `Order` (`POST /orders`, `PUT /orders/{id}`) e adiciona um endpoint novo, `POST /orders/itens/precificar`, sem tocar em transições.

**Transições antes → depois:** N/A — sem diff de máquina de estados.

**Impacto em faturamento/estoque:** Nenhum. `valorTotal` do pedido continua recalculado como Σ(quantidade×precoUnitario) − desconto (agora usando o preço calculado quando `precoUnitario` vier omitido), mas a fórmula em si não mudou. Não mexe em `PrintHistory`, abate de estoque de filamento, nem em `OrderBillingService`.

### O que foi feito

1. **Engine de precificação movida para pacote neutro** (mecânico, sem alterar lógica):
   - `com.print3dmanager.erp.quote.service.pricing.{PricingStrategy,PricingInput,PricingResult,CostMarkupPricingStrategy}` → `com.print3dmanager.erp.pricing.*` (só `package`/caminho; nenhuma linha de lógica alterada).
   - `CostMarkupPricingStrategyTest` movido junto para `backend/src/test/java/com/print3dmanager/erp/pricing/`.
   - `QuoteService.java` e `QuoteServiceTest.java` atualizados para importar do novo pacote.
   - Confirmado (Grep no repo inteiro) que não sobrou nenhuma referência a `quote.service.pricing`.
   - Diretórios antigos vazios removidos.

2. **`PrinterConfigurationService`**: novo método `Optional<PrinterConfiguration> buscarGlobalOpcional()` (mesmo padrão de `buscarEfetivaOpcional`, mas só a global, sem lançar exceção).

3. **`OrderItemRequest`**: removido `@NotNull` de `precoUnitario` (mantido `@PositiveOrZero`); `null` agora significa "calcule automaticamente". `@Schema` atualizado para documentar o comportamento no Swagger.

4. **`OrderService`**: injetadas `PricingStrategy` e `PrinterConfigurationService`; constante `MARKUP_FALLBACK = 100.00` (mesmo fallback do `QuoteService`).
   - Helper privado `calcularPreco(filamento, pesoEstimadoG, tempoImpressaoMinutos, markupInformado)` monta o `PricingInput` (impressora sempre `null` — item de pedido não tem impressora associada, então o componente de energia entra como zero, igual a um orçamento sem impressora) e delega à `PricingStrategy`; markup: informado > `markupPadrao` da config global > fallback 100%.
   - `precoSugerido(...)` (usado em `criar`/`mesclarItens`) chama o helper sem markup informado.
   - `criar()`: para cada item sem `precoUnitario`, calcula e seta antes de `pedido.adicionarItem(item)`.
   - `mesclarItens()`: mesma regra tanto para item novo (`id == null`) quanto para item existente reaproveitado após `orderMapper.atualizarItem(...)` + `setFilamento(...)`.
   - Novo método público `PricingResult precificarPreview(OrderItemPricingRequest request)` — somente leitura, não persiste nada, expõe a decomposição de custos completa (igual ao orçamento).

5. **Novo DTO** `OrderItemPricingRequest` (record): `filamentoId`, `pesoEstimadoG`, `tempoImpressaoMinutos`, `markup` (todos opcionais, mesmas validações leves de `OrderItemRequest`/`QuoteCreateRequest`).

6. **`OrderController`**: novo endpoint `POST /orders/itens/precificar` (`@PreAuthorize(PODE_GERENCIAR)`, mesmo nível dos demais endpoints de gerenciamento de pedido), retorna `PricingResult`.

### Arquivos alterados/criados/movidos

**Movidos** (git mv, só `package`):
- `backend/src/main/java/com/print3dmanager/erp/pricing/PricingStrategy.java`
- `backend/src/main/java/com/print3dmanager/erp/pricing/PricingInput.java`
- `backend/src/main/java/com/print3dmanager/erp/pricing/PricingResult.java`
- `backend/src/main/java/com/print3dmanager/erp/pricing/CostMarkupPricingStrategy.java`
- `backend/src/test/java/com/print3dmanager/erp/pricing/CostMarkupPricingStrategyTest.java`

**Alterados:**
- `backend/src/main/java/com/print3dmanager/erp/quote/service/QuoteService.java` (imports)
- `backend/src/test/java/com/print3dmanager/erp/quote/service/QuoteServiceTest.java` (imports)
- `backend/src/main/java/com/print3dmanager/erp/printer/service/PrinterConfigurationService.java` (+`buscarGlobalOpcional`)
- `backend/src/main/java/com/print3dmanager/erp/order/dto/OrderItemRequest.java` (`precoUnitario` opcional)
- `backend/src/main/java/com/print3dmanager/erp/order/service/OrderService.java` (cálculo automático + `precificarPreview`)
- `backend/src/main/java/com/print3dmanager/erp/order/controller/OrderController.java` (`POST /orders/itens/precificar`)
- `backend/src/test/java/com/print3dmanager/erp/order/service/OrderServiceTest.java` (3 testes novos + fixtures + stubs de mapper corrigidos para propagar peso/tempo)

**Criado:**
- `backend/src/main/java/com/print3dmanager/erp/order/dto/OrderItemPricingRequest.java`

### Testes relevantes rodados

- `mvnw test -Dtest=OrderServiceTest,QuoteServiceTest,CostMarkupPricingStrategyTest` (offline, sem Docker): **53 testes, 0 falhas, 0 erros.**
- `mvnw test` (suíte completa, offline): **187 testes — 174 unitários todos verdes; os 13 de integração (Testcontainers) falharam por `DockerClientFactory`/Docker indisponível neste ambiente de sandbox (`docker info` confirma "docker unavailable"), não por causa das mudanças.** Nenhuma falha de asserção nos testes que rodaram.
- `mvnw compile` / `mvnw test-compile` (offline): verdes, sem erro de compilação.

Testes novos adicionados em `OrderServiceTest`:
1. `criarCalculaPrecoAutomaticoQuandoOmitido` — item sem `precoUnitario`, com filamento (custo/kg 90) + config global (markup 120%, valorHoraMaquina 8, custoDesgasteHora 1.50) → preço calculado via `CostMarkupPricingStrategy` real (mock delega para a instância real, não reinventa a conta): 100g×R$90/kg=9,00 + 1h×8,00=8,00 + 1h×1,50=1,50 (energia=0, sem impressora) = custo 18,50 × markup 120% = **40,70**. Verificado no item persistido e no `valorTotal`.
2. `criarSemConfigNemFilamentoCalculaPrecoZero` — sem config global (`Optional.empty()`) e sem filamento → preço calculado degrada para **0,00** (markup fallback 100% sobre custo zero).
3. `criarPreservaPrecoUnitarioInformado` — `precoUnitario` explícito não é sobrescrito; `pricingStrategy.calcular` e `printerConfigurationService.buscarGlobalOpcional` **nunca** são chamados nesse caso.

**Nota sobre o stub de mapper existente**: `stubMapperDeItens`/`stubMapperDeAtualizacao` (helpers do teste) não propagavam `pesoEstimadoG`/`tempoImpressaoMinutos` do `OrderItemRequest` para o `OrderItem` — reproduziam só `nomePeca`/`quantidade`/`precoUnitario`, o que bastava antes porque nenhum teste dependia desses dois campos. Corrigido para refletir fielmente o `toItemEntity`/`atualizarItem` reais do MapStruct (que mapeiam todos os campos por convenção); sem essa correção, o primeiro teste novo falhava com preço 0,00 em vez de 40,70 (peso/tempo chegavam `null` na estratégia).

### Achados (severidade)

Nenhum achado de regra de negócio incorreta na engine existente. Um ajuste necessário foi feito nos *test doubles* já existentes (ver nota acima) — não é uma regressão de produção, só um gap de fidelidade do stub de teste que a nova cobertura expôs.

### Encaminhamentos

- Nenhum. Trabalho fora de escopo desta tarefa (frontend consumindo `POST /orders/itens/precificar` para pré-preencher o preço no `OrderFormDialog`, por exemplo) não foi abordado — combinar com o usuário se for desejado como próxima etapa (`frontend`).
- Os 13 testes de integração (Testcontainers) não puderam ser executados neste ambiente por falta de Docker — recomenda-se rodar `mvnw test` completo em uma máquina com Docker Desktop antes de considerar a mudança 100% validada em fluxo real (nenhuma dessas classes toca em pedidos/orçamentos de forma que a mudança devesse quebrá-las, mas não foi confirmado experimentalmente).
