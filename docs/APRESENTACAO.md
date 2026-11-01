# Apresentação — Print3D Mobile

**Problema:** pequenas empresas de impressão 3D controlam clientes e pedidos em planilhas e WhatsApp, sem visão clara de status, prazos e faturamento.
**Público:** donos e operadores dessas empresas.
**Benefícios:** centralizar clientes e pedidos, acompanhar status e prazos, ver indicadores no dashboard e cadastrar clientes rápido (endereço pelo CEP).

## Matriz de aderência ao enunciado

| Requisito do professor | Como atendemos | Marco |
|---|---|---|
| Login e autenticação, funcionalidades só para autenticados | Login JWT na API; rotas do app protegidas; logout; 401 derruba a sessão | 1 |
| Dashboard com indicadores relevantes | Clientes, pedidos por status, faturamento do mês, pedidos atrasados e últimos pedidos | 4 |
| Cadastro, consulta, edição e exclusão | CRUD de Clientes e Pedidos | 2 e 3 |
| Integração com API externa | ViaCEP no cadastro de cliente (CEP preenche o endereço) | 2 |
| API BFF com regras de negócio e persistência; app sem acesso direto ao banco | Spring Boot atuando como BFF | 0 a 4 |
| Fluxo completo, validação de campos, tratamento de erros, mensagens claras | Zod no app + Bean Validation na API + erro padronizado | todos, fechamento no 5 |
| Apresentação (demo, integrações, aderência ao problema) | Este documento | 5 |

## Roteiro da demo
_(a preencher no Marco 5)_ login → cadastro de cliente com CEP → criação de pedido → mudança de status → dashboard.
