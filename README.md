# Print3D Mobile

App mobile (React Native/Expo) para donos e operadores de pequenas empresas de impressão 3D controlarem **clientes, pedidos e indicadores** em um só lugar, substituindo planilhas e WhatsApp.

- `backend/` — API (BFF) Spring Boot: autenticação JWT, regras de negócio, persistência e integração com ViaCEP e BrasilAPI.
- `mobile/` — app Expo (React Native + TypeScript).
- `docs/` — progresso, specs por marco e [roteiro de apresentação](docs/APRESENTACAO.md).

Login de demonstração: `demo@print3d.com` / `admin123` (dados de exemplo já vêm carregados).

## Como rodar (Windows / PowerShell)

**1. Banco**
```powershell
Copy-Item .env.example .env        # mantenha POSTGRES_PASSWORD=print3d para o perfil dev
docker compose up -d               # PostgreSQL 16 na porta 5433
```

**2. API** (outro terminal)
```powershell
cd backend
.\mvnw spring-boot:run             # sobe em http://localhost:8080/api
```
Swagger: http://localhost:8080/api/swagger-ui.html · saúde: `/api/actuator/health`.

**3. App** (outro terminal)
```powershell
cd mobile
npm install
"EXPO_PUBLIC_API_URL=http://<IP-DO-PC>:8080/api" | Out-File -Encoding ascii .env   # IP do Wi-Fi: ipconfig
$env:EXPO_TOKEN="<token de expo.dev/settings/access-tokens>"   # o login do CLI não abre navegador no Windows
npx expo start -c
```
Abra no **Expo Go** (celular na mesma rede Wi-Fi do PC). Libere a porta 8080 no firewall do Windows (perfil Privado), em um PowerShell como administrador:
```powershell
New-NetFirewallRule -DisplayName "Print3D API" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Private
```
(PowerShell 5.1 não aceita `&&`: use `;` ou comandos em linhas separadas.)

## Testes
```powershell
cd backend; .\mvnw -q test         # 45 testes; requer Docker (Testcontainers)
cd ..\mobile; npx tsc --noEmit     # checagem de tipos do app
```

## Endpoints
`POST /api/auth/login` · `GET|POST /api/clients` · `GET|PUT|DELETE /api/clients/{id}` · `GET|POST /api/orders` · `GET|PUT|DELETE /api/orders/{id}` · `PATCH /api/orders/{id}/status` · `GET /api/cep/{cep}` · `GET /api/cnpj/{cnpj}` · `GET /api/dashboard`

Erros seguem `{ "code", "message", "fieldErrors": [{ "field", "message" }] }`.

## Produção
Defina `SPRING_PROFILES_ACTIVE=prod`, `DATABASE_URL/USERNAME/PASSWORD` e `JWT_SECRET` (Base64, ≥ 32 bytes: `openssl rand -base64 48`). Em `prod` o Swagger fica desligado e a API não sobe sem `JWT_SECRET`. Use HTTPS. Remova ou troque o usuário e os dados de demonstração (migrations `V2` e `V3`).
