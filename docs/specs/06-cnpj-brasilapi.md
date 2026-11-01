# Marco 6 — Consulta de CNPJ (BrasilAPI)

**Objetivo:** segunda API externa; clientes empresa com dados preenchidos pelo CNPJ.

## Critérios de aceite
- `GET /api/cnpj/{cnpj}` (autenticado): 200 `{cnpj, razaoSocial, nomeFantasia, email, telefone, situacao, endereco{...}}`; 400 CNPJ inválido (formato ou dígitos verificadores, sem chamar a API externa); 404 não encontrado; 503 BrasilAPI indisponível/limite/timeout.
- Testes só com HTTP simulado; complemento cortado em 80 caracteres (limite do cadastro).
- App: 14 dígitos no CPF/CNPJ consultam e preenchem **só campos vazios**; aviso se situação ≠ ATIVA; falha não bloqueia o cadastro.

## Arquivos
API: `cnpj/*`. App: `app/clients/form.tsx`, `src/api/clients.ts` (`lookupCnpj`).
