## Alteração — Pedidos: sugestão automática de preço unitário (OrderFormDialog)

**Arquivos alterados/criados:**
- `frontend/src/api/orders.ts` — novos tipos `PrecificacaoItemInput`/`PrecificacaoItem`, `ordersApi.precificarItem(dados)` (POST `/orders/itens/precificar`), `ItemPedidoInput.precoUnitario` passou a `number | null`.
- `frontend/src/pages/orders/OrderFormDialog.tsx` — `esquemaItem.precoUnitario` trocado de `decimalObrigatorio` para `decimalOpcional` (import `decimalObrigatorio` removido por ficar sem uso); `paraPayload` sem o `!` no `precoUnitario`; nova mutation `precificarItem` (silenciosa, sem toast); função `sugerirPreco(indice)`; estado `precosSugeridos: Record<number, string>` para não sobrescrever valor digitado manualmente; `setValue`/`getValues` adicionados ao `useForm`; `onChange` no select "Filamento" e `onBlur` em "Peso (g)"/"Tempo (min)" disparando `sugerirPreco`; label do campo "Preço unit." perdeu o `*` (não é mais obrigatório) e ganhou helper text "Deixe em branco para calcular automaticamente." quando não há erro de validação.

**Padrão seguido de:** o próprio `OrderFormDialog.tsx` (mutations existentes como `anexarArquivo`/`removerArquivo` sem toast redundante; uso de `paraCampo`/`paraNumero`/`decimalOpcional` de `lib/form.ts`, mesmo padrão de `QuoteFormDialog.tsx`).

**Build/lint:** passou (`npm run build` — tsc -b + vite build sem erros; `npm run lint` — oxlint sem achados, exit 0).

**Como validar no browser:**
1. Subir a stack (`docker compose up` ou backend+frontend locais) e logar como ADMINISTRADOR/OPERADOR.
2. Ir em "Pedidos" → "Novo pedido", adicionar um item.
3. Escolher um filamento no select "Filamento" → o campo "Preço unit. (R$)" deve preencher sozinho após a resposta da API (sem tocar em Peso/Tempo, já dispara pois filamento sozinho já é suficiente).
4. Digitar um peso em "Peso (g)" e sair do campo (blur), depois um tempo em "Tempo (min)" e sair — cada blur deve atualizar a sugestão de preço automaticamente.
5. Digitar manualmente um valor no campo "Preço unit." por cima da sugestão e depois alterar peso/tempo de novo — o valor digitado manualmente NÃO deve ser sobrescrito (só é sobrescrito se o campo estiver vazio ou ainda igual à última sugestão automática).
6. Salvar o pedido com o campo "Preço unit." vazio em algum item — deve salvar com sucesso (backend calcula sozinho).
7. Abrir um pedido existente (edição) e confirmar que o comportamento anterior de precoUnitario preenchido continua normal e que os gatilhos automáticos não disparam quando `somenteLeitura` (status ≠ PENDENTE), já que os campos ficam `disabled`.

**Achados (severidade):** nenhum.

**Encaminhamentos:** nenhum — endpoint e contrato de payload (`OrderItemPricingRequest`/`PricingResult` no backend, `OrderController.precificarItem`) já conferidos e batem exatamente com os tipos TS criados.

**Observação:** não foi possível validar visualmente no browser nesta execução — Docker Desktop não estava rodando (`docker ps` falhou ao conectar no daemon) e não havia backend/postgres locais de pé (nenhum listener em 8080/5432/5173 e nenhum processo Spring Boot ativo). A verificação foi feita por build/typecheck limpos e por conferência manual do DTO real do backend (`OrderController.java`, `OrderItemPricingRequest.java`, `PricingResult.java`) contra os tipos e chamada Axios criados no frontend.
