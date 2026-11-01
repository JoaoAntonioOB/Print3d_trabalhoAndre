from pathlib import Path
import json,shutil,hashlib

base=Path(__file__).resolve().parent
src=Path(r'C:\Users\joaoa\.codex\attachments\cdd87c13-de0d-41e9-958f-48ca0e4252e9\Texto colado.txt')
shutil.copyfile(src,base/'prompt-especificacao-react-original.txt')
source=src.read_text(encoding='utf-8-sig')
paragraphs=[s.strip() for s in source.split('\n\n') if s.strip()]
def section(start,end):return source.split(start,1)[1].split(end,1)[0].strip().strip('=').strip()
raw_rules=section('\nREGRAS\n','\nFRONTEND\n')
rule_lines=[s.strip() for s in raw_rules.splitlines() if s.strip() and not s.startswith('=')]
head=source.split('==================================================================',1)[0].strip()
opening=head.split('\n\n')[:2]
new_prompt={
 'title':'Quadro 2 - Recortes da provável especificação inicial do ERP',
 'lines':opening+[
 '**Objetivo - recorte literal**',
 'O sistema deverá controlar toda a operação de uma empresa de impressão 3D, desde o orçamento até a entrega do produto.',
 '**Tecnologias - recortes literais**','Java 21\nSpring Boot 3.5+','React 19\nTypeScript\nVite\nMaterial UI (MUI)',
 '**Regras de implementação - recortes literais**','\n'.join(rule_lines[:4]),
 'Utilizar Java Records para DTOs.\nUtilizar MapStruct.\nUtilizar transações.\nUtilizar validações.',
 '**Sequência - recortes literais**','Implemente exatamente nesta sequência:',
 '1. Estrutura do projeto\n2. Docker\n3. Flyway',
 '**Recorte final da lista de etapas**','17. Frontend React\n18. Testes\n19. Melhorias finais',
 'Ao final de cada etapa, aguarde minha confirmação antes de iniciar a próxima.'
 ],
 'source':'Fonte: texto fornecido pelo autor como possível prompt inicial nesta revisão. Recortes literais; itens intermediários da stack, das regras e da sequência foram omitidos.'
}
j=base/'prompts_expandidos.json'
data=json.loads(j.read_text(encoding='utf-8'));data['initial']=new_prompt
j.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
content=base/'content.md'
t=content.read_text(encoding='utf-8')
t=t.replace('Foram examinados o código-fonte, o contexto do projeto, uma conversa de planejamento dos agentes,', 'Foram examinados as especificações fornecidas pelo autor, o código-fonte, o contexto do projeto, uma conversa de planejamento dos agentes,')
t=t.replace('Foram examinados as especificações', 'Foram examinadas as especificações')
# Ajustar concordância pela enumeração: usar formulação impessoal.
t=t.replace('Foram examinadas as especificações fornecidas pelo autor, o código-fonte, o contexto do projeto, uma conversa de planejamento dos agentes, as configurações de doze subagentes do Claude Code e os relatórios de auditoria preservados no repositório.',
 'A análise abrangeu as especificações fornecidas pelo autor, o código-fonte, o contexto do projeto, uma conversa de planejamento dos agentes, as configurações de doze subagentes do Claude Code e os relatórios de auditoria preservados no repositório.')
t=t.replace('The evidence includes source code,', 'The evidence includes specifications supplied by the author, source code,')
t=t.replace('o prompt inicial disponibilizado pelo autor, o código-fonte', 'as especificações disponibilizadas pelo autor, o código-fonte')
t=t.replace('o prompt inicial fornecido pelo autor, os prompts propostos', 'as especificações fornecidas pelo autor, os prompts propostos')
t=t.replace('Nesta edição, os exemplos anteriormente reconstruídos foram substituídos por recortes das fontes recuperadas.', 'Os quadros reproduzem recortes das fontes recuperadas, com identificação de sua origem e de seu alcance documental.')
start=t.index('### 3.6 Prompt inicial')
end=t.index('### 3.7 Instruções persistentes')
replacement='''### 3.6 Especificação inicial do ERP

O autor disponibilizou um texto que identifica, com ressalva, como o possível prompt inicial do Print3D Manager ERP. A mensagem atribui ao modelo o papel de arquiteto de software sênior e solicita apoio ao desenvolvimento do TCC. Em seguida, define o objetivo do produto, a stack, os módulos, as entidades, as regras gerais e uma ordem de dezenove etapas, com confirmação do desenvolvedor entre elas. A fonte é utilizada como especificação recuperada, sem presumir a data de envio ou a integralidade do histórico de execução.

O Quadro 2 apresenta recortes reais dessa mensagem. Java 21, Spring Boot 3.5+, React 19, PostgreSQL, Flyway e Docker são compatíveis com as tecnologias observadas no repositório. A lista de etapas também corresponde à organização registrada em PROJECT_CONTEXT.md, desde a estrutura e a infraestrutura até frontend, testes e melhorias finais. Essa correspondência fortalece a relação documental com o projeto, mas não comprova que cada etapa foi concluída exatamente na ordem solicitada.

!CODE initial

A especificação descreve um fluxo que vai do orçamento à entrega e relaciona pedidos, itens, materiais, impressoras, histórico e financeiro. Ela também solicita diferenças entre tempo previsto e real, peso previsto e utilizado e registro de falhas. Esses elementos dão contexto às análises posteriores dos agentes: revisar o consumo de estoque exige compreender a impressão, enquanto revisar o preço exige conferir as unidades e os componentes de custo.

O texto de precificação enumera filamento, energia, hora de máquina, desgaste e margem de lucro e permite alterar o markup. Essa descrição fornece uma regra de alto nível, mas ainda exige esclarecer a base de aplicação do percentual, a distinção entre markup e margem, o arredondamento e a quantidade de itens. Uma solicitação extensa não elimina ambiguidades: essas definições precisam ser confrontadas com a estratégia implementada e com testes de valores conhecidos.

Nem toda funcionalidade citada no prompt pode ser considerada entregue. Indicadores de lucro, fotografias finais, relatórios e configurações representam requisitos desejados até que sua implementação seja confirmada no código e no comportamento do sistema. Por isso, a descrição dos resultados deste trabalho se apoia no repositório e nas telas verificadas, e não na simples reprodução do escopo solicitado.

Outro texto anteriormente fornecido pelo autor descreve Angular 17 e Spring Boot 3.2. A documentação disponível não permite determinar sua posição cronológica em relação à especificação React nem confirmar que tenha orientado a mesma versão do sistema. Os dois materiais são tratados como fontes distintas; não se infere uma migração de Angular para React apenas pela diferença entre os prompts. A especificação React é adotada como referência principal nesta descrição por sua correspondência com o artefato examinado, preservando a ressalva do autor sobre sua origem inicial.

Essa especificação ampla também é distinta da criação dos especialistas. Na conversa compartilhada, o autor informa que o ERP estava quase finalizado quando pediu ajuda para organizar os agentes. A análise separa, portanto, a orientação de construção do produto e o planejamento posterior de uma revisão especializada. Não se atribui aos doze agentes a execução de todas as dezenove etapas sem registros que sustentem essa participação.

'''
t=t[:start]+replacement+t[end:]
content.write_text(t,encoding='utf-8')
b=base/'build_tcc.py'
b.write_text(b.read_text(encoding='utf-8').replace('TCC_revisado_conversa_agentes.pdf','TCC_revisado_prompts_reais.pdf'),encoding='utf-8')
(base/'fontes-prompts-integridade.json').write_text(json.dumps({'source':'prompt-especificacao-react-original.txt','sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'note':'Arquivo preservado sem alteração. Identificado pelo autor como possível prompt inicial.'},ensure_ascii=False,indent=2),encoding='utf-8')
print('Especificação React incorporada sem inferir uma cronologia não comprovada.')
