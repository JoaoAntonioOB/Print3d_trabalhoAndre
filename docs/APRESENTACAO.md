# Apresentação — Print3D Mobile

## O problema
Pequenas empresas de impressão 3D controlam **clientes e pedidos em planilhas e WhatsApp**, sem visão clara de status, prazos e faturamento. Pedidos atrasam sem ninguém perceber e o dono não sabe quanto vendeu no mês.

**Público:** donos e operadores dessas empresas.

## A solução
App mobile (React Native/Expo) que centraliza **clientes, pedidos e indicadores**, com:
- login seguro (só quem tem conta acessa);
- cadastro de clientes com **endereço preenchido automaticamente pelo CEP** e **dados da empresa preenchidos pelo CNPJ**;
- pedidos com **ciclo de status controlado** (Pendente → Em produção → Concluído → Entregue, ou Cancelado);
- **dashboard** que responde primeiro "o que está na fila e o que está atrasado?" e traz indicadores de gestão: faturamento do mês, ticket médio, valor a receber, material usado, vendas dos últimos 6 meses (gráfico de colunas), fila de produção por status, vencimentos da semana, pedidos atrasados, maiores clientes e uso por material.

## Arquitetura (BFF)
```
App (Expo/React Native) ──HTTPS/JSON + JWT──▶ API BFF (Spring Boot) ──▶ PostgreSQL
                                                  └──▶ ViaCEP (API externa)
```
- O app **nunca acessa o banco** nem a ViaCEP: só conversa com a API.
- A API aplica as **regras de negócio**, valida, persiste e chama a API externa.
- `GET /api/dashboard` devolve numa só chamada tudo que a tela inicial precisa (é o que "serve o app").

## Integração com API externa: ViaCEP
1. O usuário digita o CEP (máscara `00000-000`).
2. Com 8 dígitos o app chama `GET /api/cep/{cep}` **na nossa API** (autenticada).
3. A API valida o formato, consulta `viacep.com.br` com timeout curto (3 s), guarda em cache e devolve só `{cep, logradouro, bairro, cidade, estado}`.
4. O app preenche logradouro, bairro, cidade e UF (editáveis) e leva o foco ao "Número".

| Situação | Resposta da API | O que o usuário vê |
|---|---|---|
| CEP válido | 200 | endereço preenchido |
| CEP malformado | 400 | "CEP inválido: informe 8 dígitos" |
| CEP inexistente (a ViaCEP responde 200 com `erro`) | 404 | "CEP não encontrado, preencha manualmente." |
| ViaCEP fora do ar / timeout | 503 | "Serviço de CEP indisponível, preencha manualmente." |

A falha da API externa **nunca bloqueia o cadastro**.

## Segunda integração: BrasilAPI (CNPJ)
Para clientes empresa, ao digitar os 14 dígitos do CNPJ o app chama `GET /api/cnpj/{cnpj}` **na nossa API**, que valida o formato e os **dígitos verificadores** antes de consultar `brasilapi.com.br` (timeout 4 s, com cache). O app preenche nome (fantasia ou razão social), e-mail, telefone e endereço — **só os campos que ainda estão vazios** — e avisa se a situação cadastral não for ATIVA.

| Situação | Resposta da API | O que o usuário vê |
|---|---|---|
| CNPJ válido | 200 | dados preenchidos + "Confira antes de salvar" |
| CNPJ inválido (formato ou dígito verificador) | 400 | "CNPJ inválido: confira os 14 dígitos." (sem chamar a BrasilAPI) |
| CNPJ inexistente | 404 | "CNPJ não encontrado, preencha manualmente." |
| BrasilAPI fora do ar, limite (429) ou timeout | 503 | "Serviço de consulta de CNPJ indisponível, preencha manualmente." |

Também nunca bloqueia o cadastro.

## Roteiro da demonstração (≈ 5 min)
Pré-requisitos: banco e API no ar, celular na mesma rede (ver README). Os dados de exemplo já estão carregados.

1. **Login** — entrar com `demo@print3d.com` / `admin123`. Mostrar antes um erro: senha errada → "E-mail ou senha inválidos." *(valida autenticação e mensagens claras)*.
2. **Painel** — apresentar o número de pedidos em aberto e o valor a receber, os indicadores (faturamento do mês, ticket médio, clientes, material usado), o **gráfico de vendas dos últimos 6 meses** (a coluna laranja é o mês atual), a fila de produção, os pedidos que **vencem na semana** e os **atrasados**, e por fim os maiores clientes e o uso por material. Puxar para atualizar.
3. **Clientes** — abrir a lista, buscar por "Studio". Abrir o **menu lateral** (três barras, canto superior esquerdo) → **Lista de clientes** → botão **Novo**, digitar o CEP `01001-000` e mostrar o endereço preenchendo sozinho. Salvar.
3b. **CNPJ** — em outro cliente novo, digitar o CNPJ `06.990.590/0001-23`: nome, telefone e endereço completos aparecem sozinhos. Digitar `00.000.000/0001-92` (dígito errado) → mensagem de CNPJ inválido.
4. **Erro tratado** — tentar um CEP inexistente (`99999-999`): mensagem amigável e cadastro continua possível. Tentar salvar sem nome: campo marcado.
5. **Pedido** — no cliente recém-criado, **Pedidos** → botão **Novo** (ou **Novo pedido** no detalhe do cliente) (material PLA, peso `120,5`, valor `45,90`, prazo futuro). Tentar prazo no passado → erro no campo.
6. **Status** — no detalhe, avançar *Iniciar produção → Concluído → Entregue*; mostrar que só aparecem as transições válidas e que **cancelar** pede confirmação. Pedido entregue não pode mais ser alterado.
7. **Regra de negócio** — tentar excluir um cliente que tem pedidos → "Não é possível excluir o cliente X: ele possui pedidos." (409).
8. **Volta ao dashboard** — os números e o gráfico mudaram. **Sair** → volta ao login; sem token as rotas não abrem.

## Matriz de aderência ao enunciado

| Requisito do professor | Como atendemos | Onde ver |
|---|---|---|
| Login e autenticação, funcionalidades só para autenticados | Login JWT na API; rotas do app protegidas; logout; 401 derruba a sessão; token no armazenamento seguro | `app/login.tsx`, `AuthContext`, `security/` |
| Dashboard com indicadores relevantes | 13 indicadores e painéis: pedidos em aberto e valor a receber, faturamento do mês, ticket médio, clientes, material usado (kg), vendas por mês (gráfico de 6 meses), fila de produção, vencimentos da semana, atrasados, maiores clientes, uso por material, últimos pedidos | `app/index.tsx`, `GET /api/dashboard` |
| Cadastro, consulta, edição e exclusão | CRUD de **Clientes** e **Pedidos** (busca, filtro por status, paginação) | `app/clients/*`, `app/orders/*` |
| Integração com API externa | **ViaCEP** (CEP) e **BrasilAPI** (CNPJ) no cadastro de cliente | `cep/*`, `cnpj/*` (API), `clients/form.tsx` |
| API BFF com regras de negócio e persistência; app sem acesso direto ao banco | Spring Boot + PostgreSQL com Flyway; o app só fala HTTP com a API | `backend/` |
| Fluxo completo, validação de campos, tratamento de erros, mensagens claras | Zod no app + Bean Validation na API + erro padrão `{code, message, fieldErrors[]}`; estados de carregando, vazio e erro | todas as telas |
| Apresentação (demo, integrações, aderência ao problema) | Este documento | — |

## Regras de negócio (na API)
- Cliente: nome obrigatório; e-mail e telefone válidos; CEP com 8 dígitos; CPF/CNPJ único; **não pode ser excluído se tiver pedidos** (409).
- Pedido: cliente existente; valor e peso > 0 (até 2 casas); prazo não pode estar no passado na criação; transições `PENDENTE → EM_PRODUCAO → CONCLUIDO → ENTREGUE` e `CANCELADO` a partir de PENDENTE/EM_PRODUCAO; só PENDENTE/EM_PRODUCAO podem ser editados; só PENDENTE/CANCELADO podem ser excluídos.

## Segurança (resumo)
- Senhas com BCrypt; JWT assinado (segredo só por variável de ambiente em produção; a API recusa subir sem ele).
- Todas as rotas, exceto login e health, exigem token; token guardado no `expo-secure-store`.
- Dados de clientes não vão para logs; `.env` fora do git; Swagger desligado em produção; mensagens de erro não expõem detalhes internos.
- Limitações assumidas (escopo acadêmico): sem limite de tentativas de login, sem renovação de token (validade de 24 h), HTTP em rede local na demo (em produção, usar HTTPS).

## Tecnologias
**App:** Expo, TypeScript, Expo Router, React Native Paper, TanStack Query, React Hook Form + Zod, axios, expo-secure-store.
**API:** Java 21, Spring Boot 3.5, Spring Security + JWT, JPA, Flyway, MapStruct, PostgreSQL 16.
**Testes:** 45 automatizados (unitários das regras de status e dos clientes ViaCEP e BrasilAPI com HTTP simulado; integração com PostgreSQL real via Testcontainers).
