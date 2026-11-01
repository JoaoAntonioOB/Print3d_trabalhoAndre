# Print3D Mobile

App mobile (React Native/Expo) para donos e operadores de pequenas empresas de impressão 3D controlarem **clientes, pedidos e indicadores** em um só lugar, substituindo planilhas e WhatsApp.

- `backend/` — API (BFF) Spring Boot: autenticação JWT, regras de negócio, persistência e integração com a ViaCEP.
- `mobile/` — app Expo (Marco 0/1 em diante).
- `docs/` — progresso, specs por marco e roteiro de apresentação.

## Rodando a API

```bash
cp .env.example .env          # defina POSTGRES_PASSWORD=print3d (o perfil dev usa essa senha)
docker compose up -d          # PostgreSQL 16 na porta 5433
cd backend; ./mvnw spring-boot:run   # no PowerShell 5.1 use ';' (não '&&')
```

Swagger: http://localhost:8080/api/swagger-ui.html · login de demonstração: `demo@print3d.com` / `admin123`.

## Rodando o app (Expo Go)

```powershell
cd mobile
"EXPO_PUBLIC_API_URL=http://<IP-do-PC>:8080/api" | Out-File -Encoding ascii .env
$env:EXPO_TOKEN="<token de expo.dev/settings/access-tokens>"   # o CLI não consegue abrir o navegador no login
npx expo start -c
```

Celular e PC na mesma rede Wi-Fi; libere a porta 8080 no firewall (perfil Privado).

## Testes

```bash
cd backend && ./mvnw -q test   # requer Docker (Testcontainers)
```

## Endpoints

`POST /api/auth/login` · `GET|POST /api/clients` · `GET|PUT|DELETE /api/clients/{id}` · `GET|POST /api/orders` · `GET|PUT|DELETE /api/orders/{id}` · `PATCH /api/orders/{id}/status` · `GET /api/dashboard` · (Marco 2) `GET /api/cep/{cep}`
