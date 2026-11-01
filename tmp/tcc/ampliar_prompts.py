from pathlib import Path
import json

base=Path(__file__).resolve().parent
source=Path(r'C:\Users\joaoa\.codex\attachments\0b4d7bb9-4a5c-464e-9c03-5628ffb4b6b2\Texto colado.txt').read_text(encoding='utf-8-sig')
def part(start,end):
    return source.split(start,1)[1].split(end,1)[0].strip()
initial=[source.split('## Stack obrigatória',1)[0].strip(),
         '**Stack obrigatória - recorte**',part('## Stack obrigatória','## Estrutura de pacotes do backend'),
         '**Strategy Pattern - Precificação**',part('## Strategy Pattern — Precificação','## Lógica de orçamento (QuoteService)'),
         '**Critério de teste solicitado - recorte**',
         '- Testes unitários: QuoteServiceTest (JUnit 5 + Mockito) testando cálculo de custo e geração de token']
backend=(base.parents[1]/'.claude/agents/backend.md').read_text(encoding='utf-8-sig')
qa=(base.parents[1]/'.claude/agents/qa.md').read_text(encoding='utf-8-sig')
prompts={
 'initial':{'title':'Quadro 2 - Trechos do prompt inicial fornecido pelo autor','lines':initial,'source':'Fonte: prompt fornecido pelo autor nesta revisão. Recortes literais; não corresponde à transcrição integral.'},
 'prompts':{'title':'Quadro 3 - Instruções persistentes de implementação e verificação','lines':[
 '**backend.md - leitura do contexto**',backend.split('## Primeiro passo obrigatório',1)[1].split('## Stack',1)[0].strip(),
 '**backend.md - padrões**','DTOs sempre como **Java Records**; controllers nunca recebem/retornam entidades JPA.',
 'Service Layer + Repository Pattern + `@Transactional` na camada de serviço; Bean Validation nos DTOs de entrada.',
 'Ao editar arquivos existentes, preserve integralmente o código não relacionado à alteração.',
 '**qa.md - processo**',
 'Leia o service/componente a testar e identifique os caminhos de decisão reais (branches, estados terminais, validações) — não escreva teste "de cobertura" que não afirma nada sobre comportamento.',
 'Rode `cd backend && .\\mvnw.cmd test` (suíte completa exige Docker) e reporte o resultado real, nunca assuma que passou sem rodar.'
 ],'source':'Fonte: .claude/agents/backend.md e .claude/agents/qa.md. Trechos selecionados dos arquivos reais.'},
 'r1':{'title':'Quadro 4 - Exemplo reconstruído de solicitação de precificação','lines':[
 '**Reconstrução ilustrativa - não é registro de mensagem enviada**',
 'Revise o cálculo de orçamento do Print3D Manager. Antes de alterar arquivos, leia PROJECT_CONTEXT.md, o serviço de orçamento, a estratégia de precificação e a configuração efetiva da impressora. Mantenha os contratos de API consumidos pela interface.',
 'Separe os componentes: filamento = peso em gramas × custo por kg / 1000; energia = potência em watts / 1000 × tempo em minutos / 60 × valor do kWh; máquina = horas × valor da hora; desgaste = horas × custo de desgaste por hora. Aplique o markup percentual sobre a base de custo definida pela regra do projeto. Use BigDecimal e explicite o arredondamento, sem trocar markup por margem sobre o preço de venda.',
 'Organize a revisão por especialidade: printing3d confere unidades e parâmetros; erp confere a regra comercial; backend altera o serviço e o DTO quando necessário; qa verifica os resultados. Se um contrato mudar, descreva o impacto para frontend.',
 'Adicione cenários com 60 minutos, peso zero, markup zero, quantidade maior que um e valor inválido. Explique como a quantidade participa da fórmula para evitar dupla multiplicação. Entregue os arquivos alterados, a regra aplicada, o comando de teste e seu resultado real. Não declare o cálculo validado apenas por ter compilado.'
 ],'source':'Fonte: reconstrução elaborada para explicar uma tarefa compatível com os módulos quote, pricing e printer; não comprova uma invocação histórica.'},
 'r2':{'title':'Quadro 5 - Exemplo reconstruído de solicitação de produção','lines':[
 '**Reconstrução ilustrativa - não é registro de mensagem enviada**',
 'Ajuste o fluxo de impressão associado a um item de pedido. Consulte os estados já implementados antes de definir novas transições. A impressão só pode começar quando o pedido e a impressora estiverem em condições válidas; uma mesma impressora não pode receber dois trabalhos em andamento.',
 'Ao finalizar, falhar ou cancelar, trate o consumo de filamento conforme a regra de domínio. Uma falha pode ter consumido material: não devolva automaticamente ao estoque todo o peso previsto. Use o consumo real informado e impeça uma segunda baixa ao repetir a operação. Saldo insuficiente deve rejeitar a operação e reverter a transação.',
 'Peça ao agente printing3d a conferência do comportamento físico, ao backend a implementação transacional e ao database a análise de concorrência e restrições. Em seguida, solicite ao qa testes de transição inválida, saldo insuficiente, repetição da finalização e duas tentativas simultâneas de ocupar a máquina.',
 'Entregue uma descrição do antes e depois, os arquivos envolvidos e as evidências dos cenários executados. Preserve os registros e contratos que não fazem parte da correção. Se um cenário não puder ser testado, indique a limitação.'
 ],'source':'Fonte: reconstrução baseada nas regras de impressão, estoque e estados documentadas no projeto; não é evidência de que esses testes foram executados.'},
 'r3':{'title':'Quadro 6 - Exemplo reconstruído de solicitação de auditoria','lines':[
 '**Reconstrução ilustrativa - não é registro de mensagem enviada**',
 'Faça uma auditoria do caminho de autenticação e do limite de requisições. Nesta tarefa, analise e relate; não implemente novas funcionalidades. Leia a configuração de segurança, o filtro de rate limiting, docker-compose.yml e nginx.conf. Confira quais portas estão publicadas e quais endereços podem fornecer cabeçalhos de proxy confiáveis.',
 'Verifique se o IP usado para limitar requisições pode ser alterado por X-Forwarded-For enviado diretamente ao backend. Compare acesso pelo NGINX e acesso direto, quando este existir. Explique quais condições tornam o teste válido e não conclua que a proteção funciona só porque o filtro está presente.',
 'Separe a análise de security da revisão de infraestrutura de devops. Para cada achado, registre arquivo ou endpoint, cenário concreto, consequência, severidade e correção sugerida. Se houver discordância entre os pareceres, explicite os pressupostos e solicite ao auditor-final a consolidação com base na evidência disponível.',
 'Não exponha senhas, JWTs ou credenciais nos relatórios. Informe os comandos executados e diferencie resultado observado de hipótese. Se não houver ambiente para reproduzir o cenário, relate a análise estática e mantenha a reprodução como pendência.'
 ],'source':'Fonte: reconstrução baseada nos escopos de security e devops e no episódio descrito em FINAL-PLAN.md; não reproduz o prompt original da auditoria.'},
 'r4':{'title':'Quadro 7 - Exemplo reconstruído de solicitação de interface','lines':[
 '**Reconstrução ilustrativa - não é registro de mensagem enviada**',
 'Revise a interface do Dashboard do Print3D Manager preservando a integração com os endpoints existentes. Antes de criar novos componentes, leia o layout, as páginas de referência e os contratos em frontend/src/api. Organize os indicadores de pedidos, impressões, clientes e estoque para que o usuário identifique as ações pendentes.',
 'Mantenha gráficos com legenda, unidade e período explícitos. Diferencie ausência de movimento, carregamento e falha da API. Não preencha indicadores com dados inventados para tornar a tela visualmente completa. Se usar uma base fictícia de demonstração, identifique essa origem na documentação.',
 'Centralize as cores no tema MUI para que cards, tabelas, notificações e tooltips acompanhem o modo escolhido. Verifique a navegação por teclado, os rótulos dos botões e o comportamento em tela estreita. Preserve o controle de acesso dos módulos.',
 'Ao terminar, execute a compilação e a análise estática. Apresente os componentes alterados, os problemas encontrados e o resultado de cada verificação realizada. Diferencie essas verificações da avaliação com usuários, que exige um procedimento próprio.'
 ],'source':'Fonte: reconstrução baseada na implementação React, no tema e nos componentes do Dashboard; não é transcrição de uma solicitação original.'},
}
(base/'prompts_expandidos.json').write_text(json.dumps(prompts,ensure_ascii=False,indent=2),encoding='utf-8')

p=base/'content.md'
t=p.read_text(encoding='utf-8')
t=t.replace('A análise documental considera quatro grupos de evidências: código-fonte e configuração da aplicação; arquivo PROJECT_CONTEXT.md; definições dos agentes em .claude/agents; e relatórios em .claude/audits.',
 'A análise documental considera o prompt inicial disponibilizado pelo autor, o código-fonte e a configuração da aplicação, o arquivo PROJECT_CONTEXT.md, as definições dos agentes em .claude/agents e os relatórios em .claude/audits.')
t=t.replace('Assim, os exemplos de prompts apresentados adiante são trechos dos arquivos persistentes efetivamente disponíveis. Não são uma reconstrução de conversas históricas.',
 'A apresentação dos prompts distingue trechos reais do prompt inicial, instruções persistentes existentes no repositório e exemplos reconstruídos para explicar tarefas compatíveis com o sistema. Os exemplos reconstruídos não são tratados como mensagens efetivamente enviadas nem como evidência da execução de agentes.')
start=t.index('### 3.6 Instruções persistentes')
end=t.index('### 3.7 Fluxo de trabalho')
replacement='''### 3.6 Prompt inicial

O autor disponibilizou um prompt utilizado como orientação inicial para a continuidade do Print3D Manager. O texto atribui à ferramenta o papel de desenvolvedor sênior full-stack e descreve tecnologias, pacotes, entidades, endpoints, regras de negócio, aparência da interface e tarefas ainda pendentes. A solicitação, portanto, fornece uma especificação de trabalho mais extensa do que um pedido genérico para criar um sistema.

O Quadro 2 seleciona trechos que mostram três níveis dessa orientação: o papel atribuído ao modelo, as restrições técnicas e um comportamento de negócio que deveria ser testado. Os recortes são literais e não incluem a seção de configuração que contém credenciais de desenvolvimento. O texto completo fornecido pelo autor também inclui o fluxo do QuoteService, o uso de DTOs Java Records, transações na camada de serviço e a sequência de componentes a implementar.

!CODE initial

O trecho de precificação delimita entradas, unidades e operação matemática. Custo por grama, consumo elétrico e tempo precisam ser convertidos de forma consistente antes da aplicação do markup. A indicação de um teste para QuoteService mostra que o prompt também solicita uma forma de verificação, embora sua presença não comprove que o teste foi escrito ou executado naquela interação.

Há diferenças entre a especificação recuperada e o artefato apresentado neste trabalho. O prompt prevê Angular 17, Spring Boot 3.2 e pacotes agrupados por camada; o repositório examinado utiliza React, Spring Boot 3.5 e organização modular por domínio. Essa comparação documenta a diferença entre a orientação inicial e o produto atual, mas os registros disponíveis não permitem reconstruir a sequência completa de mensagens que levou a essas mudanças. Tampouco se atribui a um agente específico uma decisão de migração sem seu registro correspondente.

### 3.7 Instruções persistentes

O prompt inicial descreve uma tarefa ampla, enquanto os arquivos em .claude/agents definem orientações reutilizáveis para papéis especializados. Essa distinção é importante: atribuir o papel de desenvolvedor full-stack em uma mensagem não equivale a demonstrar que os doze subagentes foram acionados. A configuração de agentes é examinada nos arquivos específicos, e sua participação na auditoria é discutida pelos relatórios preservados.

As instruções de backend determinam a leitura do contexto e de um módulo de referência antes da alteração. Também fixam o uso de DTOs, transações e preservação do código não relacionado à tarefa. As instruções de QA pedem a identificação de estados e caminhos de decisão antes de escrever asserções. O Quadro 3 apresenta recortes mais extensos desses prompts reais.

!CODE prompts

O resultado esperado também é especificado. O relatório de backend deve informar arquivos alterados, padrão de referência, build, testes e riscos. O de segurança pede localização, cenário de exploração e responsável pela correção. O de QA exige distinguir testes executados, lacunas e defeitos encontrados. Essas exigências permitem confrontar uma conclusão como “concluído” com evidências concretas.

Os limites entre papéis restringem o escopo pretendido. Uma alteração de schema deve envolver database; uma regra comercial, erp; e um comportamento físico de consumo ou custo, printing3d. A configuração oferece uma referência para esse encaminhamento, mas não prova que todas as etapas foram cumpridas em cada tarefa. A análise dos resultados se apoia nos registros de auditoria, e não apenas na existência das instruções.

### 3.8 Exemplos reconstruídos de solicitações

Além do prompt inicial recuperado, o autor relata ter solicitado ajustes durante o desenvolvimento, mas não dispõe do texto completo dessas mensagens. Para tornar compreensível o nível de detalhamento dessas tarefas, os Quadros 4 a 7 apresentam reconstruções ilustrativas elaboradas a partir das funcionalidades e dos arquivos do projeto. São exemplos de como essas solicitações poderiam ser formuladas. Não correspondem a transcrições históricas, não estabelecem datas ou ordem de execução e não entram como evidência dos resultados.

O primeiro exemplo trata de precificação. A solicitação explicita as unidades, o tratamento monetário e a relação entre regra de domínio, contrato da API e teste. A divisão de responsabilidades proposta permite observar por que uma alteração de cálculo pode exigir mais de uma especialidade.

!CODE r1

O segundo exemplo trata de produção e estoque. Seu foco é o comportamento em situações que um CRUD não resolve sozinho: repetição de operação, transição inválida, material consumido em falha e concorrência na ocupação de uma impressora. Os cenários citados são critérios propostos no exemplo, não um relato de testes executados.

!CODE r2

O terceiro exemplo descreve uma solicitação de auditoria. Ele separa análise de correção e exige que a interpretação de um risco seja acompanhada de condições de reprodução. A reconstrução utiliza o problema discutido nos resultados para explicar o tipo de pedido pertinente, sem substituir o prompt original ausente nem sugerir que a falha foi antecipada exatamente nesses termos.

!CODE r3

O quarto exemplo aborda a interface. A necessidade de apresentar indicadores envolve contratos da API, estados de carregamento, interpretação dos períodos e origem dos dados. A reconstrução também mostra como o pedido pode especificar verificações objetivas sem confundir compilação com validação de usabilidade.

!CODE r4

Os quatro exemplos seguem uma organização comum: informar o objetivo, indicar o contexto, delimitar a mudança, definir condições de verificação e pedir um relatório. Essa organização é uma interpretação didática dos padrões observáveis nos arquivos do projeto. A contribuição empírica do estudo continua restrita às fontes reais e aos episódios registrados, sem atribuir resultados às reconstruções.

O autor também utilizou IA como apoio à revisão acadêmica. O prompt de revisão por ele fornecido solicita análise de ortografia, escrita acadêmica, clareza, coesão, conteúdo técnico e normas da ABNT, seguida de uma versão revisada do trecho. Esse uso editorial é distinto do desenvolvimento do ERP. Sugestões de correção bibliográfica precisam ser conferidas nas fontes e não comprovam, por si só, a edição consultada.

'''
t=t[:start]+replacement+t[end:]
t=t.replace('### 3.7 Fluxo de trabalho','### 3.9 Fluxo de trabalho').replace('### 3.8 Critérios de verificação','### 3.10 Critérios de verificação')
t=t.replace('os registros de conversas não são completos e os relatórios refletem rodadas específicas.',
 'os registros de conversas não são completos e os relatórios refletem rodadas específicas. Os exemplos reconstruídos de solicitações têm finalidade explicativa e não permitem medir interações, atribuir autoria de alterações ou demonstrar uma sequência histórica de desenvolvimento.')
p.write_text(t,encoding='utf-8')
print('Conteúdo ampliado e sete quadros preparados.')
