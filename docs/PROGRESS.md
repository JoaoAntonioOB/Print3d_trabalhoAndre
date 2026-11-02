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

- **Dashboard ampliado:** `GET /api/dashboard` agora também entrega ticket médio, valor em aberto, peso total de material, vendas dos últimos 6 meses, maiores clientes, uso por material e vencimentos dos próximos 7 dias. Seed de histórico `V4` (19 pedidos nos 5 meses anteriores) para o gráfico de vendas ter série. App: painel com gráfico de colunas mensal, lista de barras (fila, clientes, materiais) e listas de pedidos. 45 testes passando.

- **Hospedagem preparada:** `render.yaml` (API em Ohio, plano gratuito), `Dockerfile` ajustado para 512 MB (testado em contêiner com 512 MB / 0,5 CPU contra o Neon de Ohio: sobe em ~37 s, ~260 MB, sem erros), banco no Neon com as migrations V1–V4 já aplicadas e `docs/HOSPEDAGEM.md`. Falta enviar o código ao GitHub e criar o serviço no Render.

- **Marco 7 — Estoque de filamentos** (spec em `docs/specs/07-estoque.md`): cadastro com saldo em gramas e estoque mínimo, entradas com histórico, seletor de filamento no pedido (material herdado, desconto ao iniciar produção, estorno ao cancelar), alerta de estoque baixo no painel. Migrações `V5` (schema) e `V6` (seed de demonstração). Testado: 60 testes do backend passando, `tsc` do app ok. Telas ainda não conferidas no Expo Go.

## Pendências / opcionais
- Renomear `backend/` → `api/` (a pasta estava travada pela IDE); ajustar caminhos nos docs e no CI.
- Validar o layout revisado e o Marco 4/5 no iPhone (a revisão visual não pôde ser feita pelo assistente).
- Hospedagem da API e do banco para a apresentação (ver README, seção Produção).
- Conferir as telas de estoque no Expo Go (lista, detalhe, formulário, seletor no pedido e alerta no painel).
- `AJUSTE` existe no enum `TipoMovimento` e no banco, mas nenhum fluxo o grava; ou se implementa ou se remove.
- Filamento com saldo 0 e mínimo 0 entra no alerta (regra saldo ≤ mínimo); confirmar se é o comportamento desejado.

## Decisões
- Nomes do domínio em português (tabelas e campos), como no código herdado.
- Sem papéis: todo usuário autenticado acessa tudo. JWT único de 24 h, sem refresh.
- Faturamento do mês = soma dos pedidos **criados** no mês, exceto cancelados.
- Seed de demonstração como migration Flyway (`V3`); em produção real, remover `V2`/`V3`.
- Login do Expo CLI via `EXPO_TOKEN` (o fluxo de navegador falha no Windows desta máquina).
- Estoque: o desconto acontece em PENDENTE→EM_PRODUCAO e o estorno ao cancelar a partir de EM_PRODUCAO. Editar um pedido em EM_PRODUCAO estorna e desconta de novo (reconcilia). Editar em PENDENTE não mexe no estoque.
- Um filamento por pedido, opcional. Pedidos antigos sem filamento não descontam nada. O material do pedido vem do filamento quando ele é informado.
- Saldo por filamento, sem controle de rolo (bobina). Sem dono por usuário: todo usuário autenticado vê e altera todo o estoque.
- Migrações: `V5` (schema) e `V6` (seed de demonstração). O Flyway aplica as pendentes ao subir a API, então as duas vão ao Neon no próximo deploy. `V6` segue a regra de `V2`/`V3`: fora em produção real.
