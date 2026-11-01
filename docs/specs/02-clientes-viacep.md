# Marco 2 — Clientes + ViaCEP

**Objetivo:** CRUD de clientes no app e endereço preenchido pelo CEP.

## Critérios de aceite
- `GET /api/cep/{cep}` (autenticado): 200 `{cep, logradouro, bairro, cidade, estado}`; 400 malformado; 404 "CEP não encontrado, preencha manualmente."; 503 "Serviço de CEP indisponível, preencha manualmente."
- ViaCEP com timeout curto; testes só com HTTP mockado.
- Lista com busca (nome, e-mail, CPF/CNPJ), paginação, pull-to-refresh, estados carregando/vazio/erro.
- Cadastro/edição com validação (Zod) e máscaras (telefone, CPF/CNPJ, CEP); `fieldErrors` da API marcam os campos.
- CEP com 8 dígitos preenche logradouro/bairro/cidade/UF e leva o foco ao número; falha nunca bloqueia.
- Exclusão com confirmação; cliente com pedidos mostra a mensagem 409 da API.

## Arquivos
API: `cep/*`, `ExternalServiceException`. App: `app/clients/{index,[id],form}.tsx`, `src/api/clients.ts`, `src/utils/masks.ts`.
