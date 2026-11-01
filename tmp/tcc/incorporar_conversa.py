from pathlib import Path
import json

base=Path(__file__).resolve().parent
url='https://chatgpt.com/share/6ad027de-0904-83e9-93ac-831dbcfe87d9'
creation=json.loads((base/'conversa-agentes-criacao.json').read_text(encoding='utf-8'))
templates=json.loads((base/'conversa-agentes-prompts.json').read_text(encoding='utf-8'))
def get_code(messages,start):
    return next(c for m in messages for c in m.get('codes',[]) if c.startswith(start))
def paragraphs(t):return [s.strip() for s in t.split('\n\n') if s.strip()]
p=base/'prompts_expandidos.json'
spec=json.loads(p.read_text(encoding='utf-8'))
spec['creation']={'title':'Quadro 4 - Prompt proposto para criar os agentes','lines':paragraphs(get_code(creation,'Quero configurar uma equipe')),'source':'Fonte: proposta de prompt apresentada pelo ChatGPT na conversa Estrutura de Especialistas TCC (BARROSO, s. d.). Texto recuperado; não é log de execução no Claude Code.'}
spec['audit']={'title':'Quadro 5 - Prompt proposto para a primeira auditoria','lines':paragraphs(get_code(creation,'Quero iniciar a primeira fase')),'source':'Fonte: proposta de prompt apresentada pelo ChatGPT na conversa compartilhada (BARROSO, s. d.). Os resultados da execução são examinados separadamente nos relatórios do projeto.'}
domain=get_code(templates,'Você é um especialista em processos de fabricação')
domain_intro=domain.split('ANALISE:',1)[0].strip()
domain_tail=domain.split('Não invente funcionalidades sem necessidade.',1)[1]
spec['domain']={'title':'Quadro 6 - Recortes do prompt proposto para impressão 3D','lines':[domain_intro,'**Recorte de orientação e saída**','Não invente funcionalidades sem necessidade.'+domain_tail],'source':'Fonte: prompt proposto pelo ChatGPT na conversa compartilhada (BARROSO, s. d.). A lista intermediária de cenários foi omitida neste recorte.'}
auditor=get_code(templates,'Você é o Auditor Final e Principal Engineer')
spec['final']={'title':'Quadro 7 - Recortes do prompt proposto para consolidação','lines':[auditor.split('Você receberá relatórios',1)[0].strip(),auditor.split('Sua função NÃO',1)[1].split('PRINCÍPIOS',1)[0].join(['Sua função NÃO','']).strip() if False else 'Sua função NÃO'+auditor.split('Sua função NÃO',1)[1].split('PRINCÍPIOS',1)[0],
    '**Critérios de descarte de recomendações**','Elimine recomendações:'+auditor.split('Elimine recomendações:',1)[1].split('Para cada problema final:',1)[0],
    '**Estrutura da decisão**','Para cada problema final:'+auditor.split('Para cada problema final:',1)[1].split('Depois gere',1)[0],
    '**Limite de atuação**',auditor.split('IMPORTANTE:',1)[1].strip()],'source':'Fonte: recortes literais da proposta de prompt do Auditor Final na conversa compartilhada (BARROSO, s. d.). Não é comprovação de execução do agente.'}
# Os exemplos anteriores ficam preservados na versão PDF anterior, mas não nesta edição.
for key in ['r1','r2','r3','r4']:spec.pop(key,None)
p.write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
t=(base/'content.md').read_text(encoding='utf-8')
t=t.replace('analisa o uso de agentes de inteligência artificial no processo de construção do sistema.', 'analisa o uso de agentes de inteligência artificial na revisão e no aperfeiçoamento do sistema.')
t=t.replace('Foram examinados o código-fonte, o arquivo de contexto, as configurações de doze subagentes do Claude Code e os relatórios de auditoria preservados no repositório.', 'Foram examinados o código-fonte, o contexto do projeto, uma conversa de planejamento dos agentes, as configurações de doze subagentes do Claude Code e os relatórios de auditoria preservados no repositório.')
t=t.replace('examines the use of artificial intelligence agents during its construction.', 'examines the use of artificial intelligence agents in software review and improvement.')
t=t.replace('The evidence includes source code, a project context file, the configuration of twelve Claude Code subagents, and audit reports preserved in the repository.', 'The evidence includes source code, a project context file, an agent planning conversation, the configuration of twelve Claude Code subagents, and audit reports preserved in the repository.')
t=t.replace('Para apoiar o desenvolvimento, foram definidos doze subagentes no Claude Code.', 'Em uma fase em que o autor descrevia o projeto como quase finalizado, foi planejada a utilização de especialistas para revisar e aperfeiçoar o sistema (BARROSO, s. d.). Foram definidos doze subagentes no Claude Code.')
t=t.replace('A análise documental considera o prompt inicial disponibilizado pelo autor,', 'A análise documental considera a conversa compartilhada Estrutura de Especialistas TCC (BARROSO, s. d.), o prompt inicial disponibilizado pelo autor,')
t=t.replace('A apresentação dos prompts distingue trechos reais do prompt inicial, instruções persistentes existentes no repositório e exemplos reconstruídos para explicar tarefas compatíveis com o sistema. Os exemplos reconstruídos não são tratados como mensagens efetivamente enviadas nem como evidência da execução de agentes.',
 'A apresentação distingue o prompt inicial fornecido pelo autor, os prompts propostos pelo ChatGPT na conversa de planejamento, os arquivos persistentes encontrados no repositório e os relatórios de auditoria. Uma proposta formulada na conversa não é tratada, por si só, como prova de que foi enviada ao Claude Code ou executada sem alterações. Nesta edição, os exemplos anteriormente reconstruídos foram substituídos por recortes das fontes recuperadas.')
needle='Os doze agentes foram definidos em arquivos Markdown no diretório .claude/agents.'
t=t.replace(needle,'''A conversa compartilhada documenta o planejamento dos especialistas em uma etapa de revisão. Na primeira mensagem, o autor informa que o projeto estava quase finalizado, apresenta o README e propõe especialistas para melhorá-lo. Depois solicita ajuda para criar os prompts e pergunta como configurar os agentes no Claude Code. O diálogo distingue, assim, a discussão de planejamento no ChatGPT da configuração e execução no ambiente de desenvolvimento (BARROSO, s. d.).

Em uma mensagem posterior, o autor relata que os doze arquivos haviam sido criados em .claude/agents e que nenhum arquivo de código fora modificado nessa operação. Esse trecho constitui um relato apresentado na conversa, não uma inspeção independente do estado do Git naquele momento. A existência das doze definições no repositório examinado oferece uma evidência adicional da configuração, sem recuperar todos os comandos utilizados para criá-las.

'''+needle)
start=t.index('### 3.8 Exemplos reconstruídos de solicitações')
end=t.index('### 3.9 Fluxo de trabalho')
new='''### 3.8 Prompts recuperados da conversa

A conversa Estrutura de Especialistas TCC permite apresentar propostas reais de prompts relacionadas à configuração e à auditoria. Os textos dos Quadros 4 a 7 foram redigidos pelo ChatGPT durante o planejamento com o autor. Sua origem é identificada para que não sejam confundidos com transcrições do Claude Code. A conversa registra a preparação do processo; os arquivos de agentes registram as instruções persistidas; os relatórios sustentam a discussão dos achados.

O Quadro 4 contém a proposta de criação da equipe. O pedido orienta a leitura do README, estabelece doze papéis, exige delimitação de escopo e proíbe modificar o código da aplicação nessa operação. Seu conteúdo ajuda a explicar como uma intenção genérica de obter especialistas foi convertida em uma estrutura de arquivos e responsabilidades.

!CODE creation

O autor relatou a criação dos doze arquivos após essa orientação. A conversa, entretanto, não apresenta o log completo da operação no Claude Code. Por isso, a correspondência entre proposta, relato e arquivos existentes sustenta a descrição da configuração, mas não permite afirmar que o prompt foi executado literalmente ou que todas as verificações previstas foram cumpridas.

O Quadro 5 apresenta a proposta para iniciar a auditoria de backend. Ela especifica o contexto a consultar, os componentes a analisar e os campos do relatório. O texto também contém uma diferença de escopo: a expressão inicial “não altere nenhum arquivo” é posteriormente delimitada pela instrução de salvar o relatório em .claude/audits. A interpretação operacional é não alterar a aplicação ou o banco e permitir apenas a persistência do relatório solicitado.

!CODE audit

A proposta não solicita a correção imediata dos problemas. A conversa orienta reunir primeiro os relatórios e, depois, consolidar prioridades. Essa separação é importante porque um agente de implementação com ferramentas de escrita não se torna um auditor somente pelo nome. O próprio diálogo questiona essa ambiguidade em backend.md e printing3d.md e recomenda explicitar quando cada papel pode modificar arquivos.

O Quadro 6 recupera recortes do prompt do especialista em impressão 3D. Na parte omitida, a proposta enumera cenários de orçamento, impressão, filamento e arquivos. A orientação selecionada mostra a finalidade da análise: confrontar o modelo existente com os processos físicos, sem criar funcionalidades automaticamente. O arquivo printing3d.md posteriormente apresentado pelo autor na conversa contém regras específicas de consumo, custos e estados, compatíveis com a especialização observada no repositório.

!CODE domain

Na discussão desse agente, o ChatGPT recomenda conferir explicitamente as conversões entre gramas e quilogramas, a precisão monetária e a diferença entre consumo estimado e real. São recomendações de revisão, e não resultados de execução. O diálogo também alerta que a proibição de dois trabalhos simultâneos na mesma impressora precisa de garantia técnica de concorrência, além da regra descrita em linguagem natural.

O Quadro 7 apresenta recortes da proposta do Auditor Final. Sua função é comparar os pareceres, eliminar recomendações sem evidência e decidir entre corrigir, não corrigir ou investigar. A consolidação é diferente de aceitar automaticamente todas as sugestões produzidas pelos especialistas.

!CODE final

A conversa ainda propõe um agente backend-auditor separado, mas essa sugestão não equivale à sua criação. O conjunto examinado no repositório contém os doze agentes descritos na Tabela 2; não foi identificado um arquivo adicional com esse nome. Da mesma forma, pastas de decisões e outros exemplos apresentados no diálogo não são tratados como estruturas implementadas sem confirmação nos arquivos.

Os registros recuperados permitem descrever com mais precisão a intervenção do desenvolvedor: ele forneceu o README, pediu a definição dos prompts, relatou a criação dos agentes, apresentou arquivos para análise e solicitou a arquitetura de revisão. Não há evidência, nessa conversa, de que os doze especialistas tenham participado desde o início da construção do ERP. Seu papel documentado está relacionado à organização da revisão de um sistema já desenvolvido e ao planejamento de suas melhorias.

O apoio de IA à revisão acadêmica também aparece nos materiais fornecidos pelo autor, mas é uma atividade distinta. Esse uso editorial não comprova a execução dos prompts técnicos nem substitui a conferência das fontes bibliográficas.

'''
t=t[:start]+new+t[end:]
t=t.replace('O fluxo adotado começa com uma necessidade definida pelo desenvolvedor.', 'O fluxo de revisão proposto na conversa parte de um ERP já existente e de uma necessidade definida pelo desenvolvedor.')
t=t.replace('A Figura 2 representa o fluxo prescrito nos arquivos, sem afirmar que houve execução simultânea dos doze agentes.', 'A Figura 2 sintetiza o fluxo proposto na conversa e nas instruções dos agentes: contexto do ERP, auditoria especializada, consolidação, correção e validação. Ela não afirma execução simultânea dos doze agentes nem comprova o cumprimento integral de todas as fases.')
t=t.replace('Fonte: elaboração própria com base nas instruções persistentes do projeto, 2026.', 'Fonte: elaboração própria com base na conversa de planejamento (BARROSO, s. d.) e nos arquivos dos agentes, 2026.')
t=t.replace('Os resultados dialogam com a divisão de papéis discutida por Hong et al. (2024) e Qian et al. (2024),', 'A conversa recuperada situa a configuração dos especialistas em uma fase de revisão do ERP. Assim, os achados documentados permitem discutir a auditoria assistida, mas não atribuir aos doze agentes a construção integral dos módulos. Os resultados dialogam com a divisão de papéis discutida por Hong et al. (2024) e Qian et al. (2024),')
t=t.replace('Os exemplos reconstruídos de solicitações têm finalidade explicativa e não permitem medir interações, atribuir autoria de alterações ou demonstrar uma sequência histórica de desenvolvimento.', 'A conversa compartilhada recupera propostas e relatos, mas não contém o histórico completo de execução no Claude Code. Não permite determinar quantas vezes cada agente foi invocado, a duração de sua atuação ou o modelo utilizado em cada chamada.')
t=t.replace('No caso analisado, os agentes apoiaram a distribuição de tarefas e a revisão de problemas que atravessavam diferentes partes da aplicação.', 'No caso analisado, a configuração especializada foi planejada para revisar um sistema que o autor já considerava quase finalizado. Os registros de auditoria mostram análises de problemas que atravessavam diferentes partes da aplicação.')
t=t.replace('BASS, L.; CLEMENTS, P.; KAZMAN, R.', 'BARROSO, J. A. O. Estrutura de Especialistas TCC. Conversa com ChatGPT. [S. l.], [s. d.]. Disponível em: '+url+'. Acesso em: 14 out. 2026. Fonte documental do estudo de caso.\n\nBASS, L.; CLEMENTS, P.; KAZMAN, R.')
(base/'content.md').write_text(t,encoding='utf-8')
builder=base/'build_tcc.py'
b=builder.read_text(encoding='utf-8').replace('TCC_revisado_prompts_ampliados.pdf','TCC_revisado_conversa_agentes.pdf')
# Preservar a distinção entre proposta de auditoria e resultados observados.
b=b.replace("(2,140,136,'Necessidade','Desenvolvedor'),(158,140,136,'Contexto e análise','Arquivos / tech-lead'),(314,140,136,'Implementação','Agentes especialistas'),(314,35,136,'Verificação','Build / testes / revisão'),(158,35,136,'Auditoria','Achados e evidências'),(2,35,136,'Aceitação','Decisão humana')", "(2,140,136,'ERP existente','Contexto / README'),(158,140,136,'Auditoria','Agentes especialistas'),(314,140,136,'Consolidação','Auditor Final / plano'),(314,35,136,'Correção','Agentes responsáveis'),(158,35,136,'Validação','Build / testes / revisão'),(2,35,136,'Nova auditoria','Decisão humana')")
builder.write_text(b,encoding='utf-8')
print('Conversa real incorporada; exemplos reconstruídos removidos desta edição.')
