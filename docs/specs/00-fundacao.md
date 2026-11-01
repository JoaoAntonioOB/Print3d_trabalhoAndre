# Marco 0 — Fundação

**Objetivo:** base enxuta com API funcionando e app Expo criado.

## Critérios de aceite
- [x] Cópia do TCC limpa (sem módulos fora de escopo, frontend web, docx, tmp/output).
- [x] `V1` limpo (usuarios, clientes, pedidos) + `V2` usuário demo.
- [x] API sobe; `POST /api/auth/login` retorna JWT; rotas sem token → 401; `./mvnw test` verde.
- [ ] `mobile/` criado com Expo Router, tema (tokens em um arquivo), cliente HTTP lendo `EXPO_PUBLIC_API_URL`.
- [x] `CLAUDE.md` e agentes em `.claude/agents/`.

## Arquivos prováveis (pendente)
`mobile/app/_layout.tsx`, `mobile/src/theme/tokens.ts`, `mobile/src/api/http.ts`.
