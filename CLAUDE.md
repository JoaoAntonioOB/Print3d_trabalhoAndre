# Print3D Mobile

App mobile (faculdade) que resolve o controle de clientes e pedidos de pequenas empresas de impressão 3D. Reaproveita o Print3D Manager ERP (TCC) de forma simplificada.

## Stack
- **API/BFF** (`backend/`): Java 21, Spring Boot 3.5, Spring Security + JWT, JPA, Flyway, MapStruct, PostgreSQL 16.
- **App** (`mobile/`, ainda não criado): Expo + TypeScript, Expo Router, React Native Paper, TanStack Query, React Hook Form + Zod, axios, expo-secure-store.
- Banco via `docker-compose.yml` (só o Postgres).

## Comandos
- Banco: `cp .env.example .env` e `docker compose up -d`
- API: `cd backend && ./mvnw spring-boot:run` (Swagger: http://localhost:8080/api/swagger-ui.html)
- Testes da API: `cd backend && ./mvnw -q test` (precisa de Docker; mostrar só falhas)
- App: `cd mobile && npx expo start`

## Escopo (nada além disso)
Login JWT · Clientes (CRUD + CEP via ViaCEP) · Pedidos (CRUD + status) · Dashboard (`GET /api/dashboard`).

## Convenções
- Package-by-feature em `com.print3dmanager.erp`: `security`, `user`, `client`, `order`, `dashboard`.
- Schema só por Flyway (`V1` schema, `V2` seed do usuário demo). Valores monetários `numeric(12,2)`.
- Entidades JPA nunca saem da API: DTOs `record` + MapStruct. Regras de negócio nos services.
- Erro padrão `{ code, message, fieldErrors[] }`; o app exibe `message` e marca `fieldErrors`.
- Nomes do domínio em português (tabelas `usuarios`, `clientes`, `pedidos`; campos `nome`, `valor`, `prazo`).
- Pedido: `PENDENTE → EM_PRODUCAO → CONCLUIDO → ENTREGUE`; `CANCELADO` a partir de PENDENTE/EM_PRODUCAO; só PENDENTE/EM_PRODUCAO são editáveis.
- Cliente com pedidos não pode ser excluído (409).
- ViaCEP: o app chama `GET /api/cep/{cep}` na API, nunca a ViaCEP direto; falha externa não bloqueia o cadastro.

## Segurança
- Dados de clientes (endereço, telefone, e-mail) são sensíveis: sem logs com esses dados.
- `.env` fora do git; `JWT_SECRET` só por variável de ambiente em produção.
- Usuário demo (`demo@print3d.com`) existe só para a demonstração.

## Fluxo de trabalho
Marcos pequenos com spec em `docs/specs/NN-nome.md`; estado em `docs/PROGRESS.md`. Leia só o spec do marco atual. Agentes em `.claude/agents/`.
