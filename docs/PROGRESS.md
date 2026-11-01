# Progresso

## Feito (todos os marcos do escopo)
- **Marco 0 — Fundação:** cópia do TCC enxugada (sem frontend web, impressoras, filamentos, estoque, orçamentos, financeiro, relatórios, upload, refresh token, rate limit, CRUD de usuários); `V1` schema limpo; app Expo com tema em tokens e cliente HTTP.
- **Marco 1 — Autenticação:** login com Zod, token no SecureStore, rotas protegidas, logout, 401 derruba a sessão, erro de rede com mensagem própria. Validado no iPhone.
- **Marco 2 — Clientes + ViaCEP:** `GET /api/cep/{cep}` (400/404/503, cache, timeout 3 s, testes com HTTP simulado) e CRUD de clientes com máscaras e CEP automático. Validado no iPhone.
- **Marco 3 — Pedidos:** CRUD com seletor de cliente em tela cheia, filtro por status, transições válidas, cancelamento com confirmação. Validado no iPhone.
- **Marco 4 — Dashboard:** cards, gráfico por status, atrasados, últimos pedidos, pull-to-refresh.
- **Revisão de layout:** área segura, chips/FAB/gráfico corrigidos, ícones em todo o app, largura máxima em telas grandes.
- **Marco 5 — Fechamento:** seed de demonstração (`V3`: 6 clientes, 12 pedidos em todos os status, 2 atrasados), limites numéricos (`@Digits`) para evitar erro 500, Swagger desligado em `prod`, roteiro e matriz em `docs/APRESENTACAO.md`, README completo. 44 testes passando (após o Marco 6).

- **Marco 6 — CNPJ (BrasilAPI):** `GET /api/cnpj/{cnpj}` (valida dígitos verificadores, 400/404/503, cache, timeout 4 s, testes com HTTP simulado; conferido contra a BrasilAPI real) e preenchimento automático no cadastro de cliente (só campos vazios). 44 testes passando.

- **Menu lateral + ícones:** menu deslizante pelas três barras (Início, lista/cadastro de clientes e de pedidos, Sair) no lugar dos botões flutuantes; ícones corrigidos instalando `@expo/vector-icons` (antes o Paper caía num pacote com fontes nativas que não existem no Expo Go, e os ícones viravam um quadrado com "?"). `react-dom` fixado em 19.3.0 via `overrides` no `package.json`, porque o `npm install` quebrava com o patch 19.3.1.

- **Cabeçalho próprio:** o cabeçalho nativo do iOS é transparente e cobria o primeiro campo dos formulários; todas as telas internas agora usam `Screen` (barra do Paper com área segura, menu/voltar). Botão **Novo** dentro das listas de clientes e de pedidos; o menu lateral ficou só com navegação (Início, Lista de clientes, Lista de pedidos, Sair).

- **Polimento visual (skills `frontend-design` e `design-taste-frontend`):** fonte IBM Plex Sans (dígitos de largura fixa) carregada no início do app; paleta nova — tinta quase preta nos botões e uma única cor de destaque (laranja de impressora 3D, `#c2410c`) usada só em dados e marca; superfícies planas com borda fina e raios de 6/8 px; painel refeito (pergunta principal primeiro, indicadores como tipografia numa lista com linhas finas, fila de produção em barras de uma cor só, sem ícones em círculos coloridos). Biblioteca de gráficos removida (barras feitas no app). Skills ficam fora do git (`.agents/`).

## Pendências / opcionais
- Renomear `backend/` → `api/` (a pasta estava travada pela IDE); ajustar caminhos nos docs e no CI.
- Validar o layout revisado e o Marco 4/5 no iPhone (a revisão visual não pôde ser feita pelo assistente).
- Hospedagem da API e do banco para a apresentação (ver README, seção Produção).

## Decisões
- Nomes do domínio em português (tabelas e campos), como no código herdado.
- Sem papéis: todo usuário autenticado acessa tudo. JWT único de 24 h, sem refresh.
- Faturamento do mês = soma dos pedidos **criados** no mês, exceto cancelados.
- Seed de demonstração como migration Flyway (`V3`); em produção real, remover `V2`/`V3`.
- Login do Expo CLI via `EXPO_TOKEN` (o fluxo de navegador falha no Windows desta máquina).
