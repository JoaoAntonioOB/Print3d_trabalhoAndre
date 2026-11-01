# Print3D Mobile

App mobile (React Native/Expo) para donos e operadores de pequenas empresas de impressão 3D controlarem **clientes, pedidos e indicadores** em um só lugar, substituindo planilhas e WhatsApp.

- `backend/` — API (BFF) Spring Boot: autenticação JWT, regras de negócio, persistência e integração com a ViaCEP.
- `mobile/` — app Expo (Marco 0/1 em diante).
- `docs/` — progresso, specs por marco e roteiro de apresentação.

## Rodando a API

```bash
cp .env.example .env          # defina POSTGRES_PASSWORD
docker compose up -d          # PostgreSQL 16
cd backend && ./mvnw spring-boot:run
```

Swagger: http://localhost:8080/api/swagger-ui.html · login de demonstração: `demo@print3d.com` / `admin123`.

## Testes

```bash
cd backend && ./mvnw -q test   # requer Docker (Testcontainers)
```

## Endpoints

`POST /api/auth/login` · `GET|POST /api/clients` · `GET|PUT|DELETE /api/clients/{id}` · `GET|POST /api/orders` · `GET|PUT|DELETE /api/orders/{id}` · `PATCH /api/orders/{id}/status` · `GET /api/dashboard` · (Marco 2) `GET /api/cep/{cep}`
