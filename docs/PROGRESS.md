# Progresso

## Feito
- **Marco 0 (parcial):** cópia do TCC enxugada. Removidos frontend web, módulos de impressoras, filamentos, estoque, orçamentos, financeiro, relatórios, precificação, upload STL/3MF, refresh token, rate limit e CRUD de usuários.
- API com login JWT, clientes (CRUD, exclusão bloqueada com pedidos), pedidos simplificados (ciclo de status) e `GET /api/dashboard`.
- Migrations: `V1` schema (usuarios, clientes, pedidos), `V2` usuário demo. 26 testes passando (unitários + Testcontainers).

- **Marco 0 concluído:** app Expo (`mobile/`) com Expo Router, React Native Paper, tokens de tema, cliente axios (`EXPO_PUBLIC_API_URL`); typecheck e bundle Android OK. Falta só validar no Expo Go.
- **Marco 1 (código pronto):** tela de login (Zod + mensagens da API), token no SecureStore, rotas protegidas (`Stack.Protected`), logout, 401 derruba a sessão, erro de rede com mensagem própria. Contrato do login conferido contra a API real. Falta validar no Expo Go.

## Próximo
- Renomear `backend/` → `api/` se desejado (pasta estava travada pela IDE).
- Marco 2: `/api/cep` + telas de clientes. Marco 3: pedidos. Marco 4: dashboard. Marco 5: fechamento.

## Decisões
- Mantidos nomes em português do domínio (tabelas/campos), como no código herdado.
- Sem papéis: todo usuário autenticado acessa tudo.
- Token JWT único de 24h (sem refresh) para simplificar a demo.
- Faturamento do mês = soma dos pedidos criados no mês, exceto cancelados.
