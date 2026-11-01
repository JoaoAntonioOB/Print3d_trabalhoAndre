# Hospedagem gratuita (Render + Neon)

API no **Render** (Docker) e banco no **Neon** (PostgreSQL), os dois na região **Ohio / us-east-2**.
O app continua no Expo Go e só muda o endereço da API.

> Limites dos planos gratuitos mudam. Confira nas páginas de preço antes de depender deles.

## O que cada plano gratuito costuma ter

| | Render (API) | Neon (banco) |
|---|---|---|
| Recursos | 512 MB de RAM, ~0,5 CPU | 0,5 GB por projeto, ~100 h de computação/mês |
| Quando está parado | **dorme após 15 min** sem requisições; acordar leva ~1 min | **suspende após 5 min**; a primeira consulta leva alguns segundos |
| Horas | 750 h/mês (um serviço 24 h cabe) | — |

Testado localmente: a imagem Docker deste projeto sobe em ~37 s com **512 MB e 0,5 CPU**, usando ~260 MB, contra o Neon de Ohio.

## Antes de começar
- Código no GitHub (o Render constrói a partir do repositório).
- Projeto criado no Neon, região **US East (Ohio)**. Em **Connect**, desmarque *Pooled connection* e anote host, banco, usuário e senha.
- Conta no Render.

## 1. Montar os dados do banco para a API
| Variável | Valor |
|---|---|
| `DATABASE_URL` | `jdbc:postgresql://HOST-DO-NEON/neondb?sslmode=require` (host **sem** `-pooler`) |
| `DATABASE_USERNAME` | usuário do Neon (ex.: `neondb_owner`) |
| `DATABASE_PASSWORD` | senha do Neon |
| `JWT_SECRET` | gere no passo abaixo |

Gerar o `JWT_SECRET` (PowerShell):
```powershell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```
Nunca coloque essas senhas no repositório, em prints ou no chat.

## 2. Criar a API no Render
1. **New > Blueprint**, conecte o GitHub e escolha este repositório. O Render lê o `render.yaml`.
2. Preencha `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` e `JWT_SECRET` quando ele pedir.
3. Aguarde o primeiro build (alguns minutos). Na primeira subida a API cria as tabelas e carrega o usuário e os dados de demonstração sozinha (migrations V1 a V4).
4. Teste no navegador: `https://SEU-SERVICO.onrender.com/api/actuator/health` deve mostrar `{"status":"UP"}`.

O nome público pode ganhar um sufixo se `print3d-api` já existir; use o endereço que o painel mostrar.

## 3. Apontar o app para a API
No `mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://SEU-SERVICO.onrender.com/api
```
Reinicie o Metro (`npx expo start -c`) e recarregue o app. Com a API na internet, o celular não precisa estar na mesma rede Wi-Fi do PC para falar com ela (o Expo Go ainda precisa alcançar o Metro do PC).

## 4. Evitar o "sono" na apresentação
- Abra o endereço de *health* uns **2 minutos antes** de começar; ou
- Cadastre um monitor gratuito (ex.: UptimeRobot) para acessar o *health* a cada 5 minutos. As 750 h/mês cobrem um serviço ligado o mês todo, com pouca folga.

A primeira consulta ao banco depois de uns minutos parado demora alguns segundos (Neon acordando). É normal.

## 5. Depois da apresentação
O usuário `demo@print3d.com` / `admin123` e os dados de exemplo ficam acessíveis pela internet, e a API não limita tentativas de login. Para encerrar com segurança: **apague o serviço no Render e o projeto no Neon**, ou ao menos troque a senha do usuário.

## Problemas comuns
| Sintoma | Causa provável |
|---|---|
| Deploy cai em "password authentication failed" | usuário/senha trocados ou copiados com espaço |
| "The connection attempt failed" / SSL | faltou `?sslmode=require` na `DATABASE_URL` |
| Erros do Flyway (lock/advisory) | `DATABASE_URL` com host `-pooler`; use a conexão direta |
| "A API não sobe sem JWT_SECRET" | variável `JWT_SECRET` ausente ou vazia |
| App mostra "Não foi possível conectar ao servidor" | `EXPO_PUBLIC_API_URL` errada, ou a API ainda dormindo (espere ~1 min e tente de novo) |
| Build falha por falta de memória | tente de novo; o primeiro build é o mais pesado |
