# Progresso

## Feito
- **Marco 0 (parcial):** cópia do TCC enxugada. Removidos frontend web, módulos de impressoras, filamentos, estoque, orçamentos, financeiro, relatórios, precificação, upload STL/3MF, refresh token, rate limit e CRUD de usuários.
- API com login JWT, clientes (CRUD, exclusão bloqueada com pedidos), pedidos simplificados (ciclo de status) e `GET /api/dashboard`.
- Migrations: `V1` schema (usuarios, clientes, pedidos), `V2` usuário demo. 26 testes passando (unitários + Testcontainers).

- **Marco 0 concluído:** app Expo (`mobile/`) com Expo Router, React Native Paper, tokens de tema, cliente axios (`EXPO_PUBLIC_API_URL`); typecheck e bundle Android OK. Validado no Expo Go.
- **Marco 1 (código pronto):** tela de login (Zod + mensagens da API), token no SecureStore, rotas protegidas (`Stack.Protected`), logout, 401 derruba a sessão, erro de rede com mensagem própria. Contrato do login conferido contra a API real. **Validado no iPhone (Expo Go):** login com o usuário demo abre a tela autenticada.
- **Marco 2 (código pronto):** `GET /api/cep/{cep}` (ViaCEP via API, timeout 3s, cache em memória; 400/404/503 tratados, testes com HTTP mockado; conferido contra a ViaCEP real). App: lista de clientes com busca e paginação, cadastro/edição com máscaras e CEP que preenche o endereço, detalhe, exclusão com confirmação (409 mostra a mensagem da API). Falta validar no iPhone.
- **Marco 3 (código pronto):** telas de pedidos — lista com busca e filtro por status (chips), atrasados em destaque, cadastro/edição (cliente via seletor, material, peso, valor, prazo DD/MM/AAAA), detalhe com botões só das transições válidas, cancelamento com confirmação, edição só em PENDENTE/EM_PRODUCAO e exclusão só em PENDENTE/CANCELADO. Atalho "Novo pedido" no detalhe do cliente. Falta validar no iPhone.

## Próximo
- Renomear `backend/` → `api/` se desejado (pasta estava travada pela IDE).
- Marco 4: dashboard. Marco 5: fechamento.

## Decisões
- Mantidos nomes em português do domínio (tabelas/campos), como no código herdado.
- Sem papéis: todo usuário autenticado acessa tudo.
- Token JWT único de 24h (sem refresh) para simplificar a demo.
- Faturamento do mês = soma dos pedidos criados no mês, exceto cancelados.
