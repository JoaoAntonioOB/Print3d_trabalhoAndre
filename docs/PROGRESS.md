# Progresso

## Feito (todos os marcos do escopo)
- **Marco 0 — Fundação:** cópia do TCC enxugada (sem frontend web, impressoras, filamentos, estoque, orçamentos, financeiro, relatórios, upload, refresh token, rate limit, CRUD de usuários); `V1` schema limpo; app Expo com tema em tokens e cliente HTTP.
- **Marco 1 — Autenticação:** login com Zod, token no SecureStore, rotas protegidas, logout, 401 derruba a sessão, erro de rede com mensagem própria. Validado no iPhone.
- **Marco 2 — Clientes + ViaCEP:** `GET /api/cep/{cep}` (400/404/503, cache, timeout 3 s, testes com HTTP simulado) e CRUD de clientes com máscaras e CEP automático. Validado no iPhone.
- **Marco 3 — Pedidos:** CRUD com seletor de cliente em tela cheia, filtro por status, transições válidas, cancelamento com confirmação. Validado no iPhone.
- **Marco 4 — Dashboard:** cards, gráfico por status, atrasados, últimos pedidos, pull-to-refresh.
- **Revisão de layout:** área segura, chips/FAB/gráfico corrigidos, ícones em todo o app, largura máxima em telas grandes.
- **Marco 5 — Fechamento:** seed de demonstração (`V3`: 6 clientes, 12 pedidos em todos os status, 2 atrasados), limites numéricos (`@Digits`) para evitar erro 500, Swagger desligado em `prod`, roteiro e matriz em `docs/APRESENTACAO.md`, README completo. 36 testes passando.

## Pendências / opcionais
- Renomear `backend/` → `api/` (a pasta estava travada pela IDE); ajustar caminhos nos docs e no CI.
- Validar o layout revisado e o Marco 4/5 no iPhone (a revisão visual não pôde ser feita pelo assistente).
- Marco 6 (opcional): segunda API externa (BrasilAPI/CNPJ).
- Hospedagem da API e do banco para a apresentação (ver README, seção Produção).

## Decisões
- Nomes do domínio em português (tabelas e campos), como no código herdado.
- Sem papéis: todo usuário autenticado acessa tudo. JWT único de 24 h, sem refresh.
- Faturamento do mês = soma dos pedidos **criados** no mês, exceto cancelados.
- Seed de demonstração como migration Flyway (`V3`); em produção real, remover `V2`/`V3`.
- Login do Expo CLI via `EXPO_TOKEN` (o fluxo de navegador falha no Windows desta máquina).
