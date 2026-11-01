# Marco 1 — Autenticação no app

**Objetivo:** só usuários autenticados acessam o app.

## Critérios de aceite
- Tela de login (e-mail + senha) com validação Zod e mensagens claras.
- `POST /api/auth/login` → token salvo no `expo-secure-store`.
- Rotas protegidas: sem token, redireciona ao login; com token, abre o app.
- Logout apaga o token e volta ao login.
- Resposta 401 em qualquer chamada limpa a sessão e volta ao login.
- Erro de rede mostra mensagem específica ("Não foi possível conectar ao servidor").
- Credenciais inválidas mostram o `message` da API ("E-mail ou senha inválidos.").

## Arquivos prováveis
`mobile/app/(auth)/login.tsx`, `mobile/src/auth/AuthContext.tsx`, `mobile/src/api/http.ts` (interceptor 401), `mobile/app/_layout.tsx`.
