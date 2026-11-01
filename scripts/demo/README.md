# Dados de demonstração para o TCC

## Complemento do mês atual

Em 17/10/2026 foi executado `seed-current-month.sql`, acrescentando dados fictícios de outubro sem alterar a carga histórica de setembro: 18 clientes, 6 impressoras, 8 filamentos, 4 insumos, 46 pedidos, 44 registros de impressão, 7 orçamentos e 44 transações financeiras.

Os pedidos incluem 36 entregues, 2 concluídos, 4 em produção, 3 pendentes e 1 cancelado. As transações pagas da carga somam R$ 21.892,00 em receitas e R$ 9.851,40 em despesas. Há também receitas e despesa pendentes. Esses valores são apenas demonstração, não resultados reais de uma empresa.

O complemento usa o marcador mensal `DEMO_TCC_MENSAL_YYYYMM`, transação única e bloqueio para evitar execução simultânea. Reexecutar no mesmo mês não duplica os dados. Os números de pedidos e orçamentos incluem o mês, e os clientes utilizam e-mails em `example.test`.

Backup anterior ao complemento: `%TEMP%\print3d-before-demo-20261017.dump`. A primeira tentativa foi revertida integralmente pelo PostgreSQL porque o número do orçamento ultrapassava o limite do campo; o identificador foi ajustado antes da execução concluída.

Para acrescentar o cenário de outro mês, executar manualmente:

```powershell
docker cp scripts/demo/seed-current-month.sql print3d-postgres:/tmp/seed-current-month.sql
docker compose exec -T postgres psql -U print3d -d print3d_manager -f /tmp/seed-current-month.sql
```

O script usa a data atual do banco no fuso `America/Sao_Paulo`. Não faz parte das migrations Flyway. Para as capturas, atualize as telas do sistema e identifique as figuras como demonstração com dados fictícios.

## Carga histórica

`seed-dashboard.sql` acrescenta dados **fictícios**, destinados a capturas de tela e demonstração do sistema. Não representam resultados reais de uma empresa nem resultados empíricos da pesquisa.

A carga foi executada em 27/09/2026 e contém 18 clientes, 6 impressoras, 8 filamentos, 4 insumos, 293 pedidos, históricos de impressão, receitas, despesas e 7 orçamentos. Os gráficos abrangem os 12 meses até o mês da execução. Os registros anteriores são preservados.

O script usa uma transação única e o marcador `DEMO_TCC_DASHBOARD_V1`. Reexecutá-lo com a carga presente não cria duplicatas nem atualiza as datas. Não é uma migração automática do Flyway. O cenário foi preparado para setembro de 2026; revise as datas antes de reutilizá-lo em outra época.

Execução manual, na raiz do projeto, com os containers em funcionamento:

```powershell
docker cp scripts/demo/seed-dashboard.sql print3d-postgres:/tmp/seed-dashboard-tcc.sql
docker compose exec -T postgres psql -U print3d -d print3d_manager -f /tmp/seed-dashboard-tcc.sql
```

Antes da carga inicial, foi salvo um backup da base em `%TEMP%\print3d-before-tcc-20260927.dump` (formato custom do PostgreSQL). Restaurar esse backup substituiria o estado posterior da base, portanto não faz parte da execução do script.

Para as capturas, acesse `http://localhost`, abra o Dashboard e atualize a página. Sugestão de legenda: “Dashboard do sistema preenchido com dados fictícios para demonstração das funcionalidades”.
