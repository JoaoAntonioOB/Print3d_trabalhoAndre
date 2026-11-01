from pathlib import Path
import json, shutil, hashlib
from datetime import datetime
from zoneinfo import ZoneInfo
import sys

root=Path(sys.argv[1]).resolve()
expected=Path(r'C:\repository\Print3D Manager Novo').resolve()
if root!=expected or root.exists():
    raise SystemExit('Destino inesperado ou já existente; nenhum arquivo foi sobrescrito.')
root.mkdir()
def put(name,text):
    p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text.strip()+'\n',encoding='utf-8')

# Preservação literal das fontes fornecidas. Nunca importar .env, banco ou .git antigos.
sources={}
for name in ['CLAUDE.md','prompt-inicial.md']:
    src=Path(r'C:\Users\joaoa\Downloads')/name
    dest=root/'docs/tcc/02-prompts/fontes'/name
    dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dest)
    sources[name]=hashlib.sha256(src.read_bytes()).hexdigest()
shutil.copyfile(Path(r'C:\Users\joaoa\Downloads\CLAUDE.md'),root/'CLAUDE.md')
shutil.copyfile(Path(r'C:\Users\joaoa\Downloads\prompt-inicial.md'),root/'prompt-inicial.md')
with (root/'CLAUDE.md').open('a',encoding='utf-8') as f:
    f.write('''\n\n## Ajustes desta preparação autorizados na conversa\n\nO desenvolvedor pediu uma versão nova, separada, e dispensou a revisão manual. Nesta execução, somente a Etapa 0 do prompt inicial foi preparada; as decisões recomendadas foram documentadas sem pausas de revisão. Não interpretar isso como permissão permanente para iniciar etapas futuras ou enfraquecer permissões do ambiente.\n\nA preparação foi realizada no Codex, não em uma sessão Claude Code. Nenhum subagente Claude foi executado nem métrica histórica fabricada. Os sete arquivos definem agentes para futuras sessões. Opus 5.5 e Sonnet 5.5 são modelos solicitados nas fontes, mas sua disponibilidade e seus IDs não foram confirmados; `model: inherit` é uma configuração provisória documentada em ADR-006, não uma alegação de uso desses modelos. Resolver os IDs antes da Etapa 1. O prompt original está preservado byte a byte em docs/tcc/02-prompts/fontes/.\n''')

put('.gitignore','''# Segredos e configurações locais
.env
.env.*
!.env.example
.claude/settings.local.json
node_modules/
target/
dist/
coverage/
*.log
*.dump
*.sql.gz
.idea/
.vscode/
tmp/
docs/tcc/06-testes-e-evidencias/tmp/
''')
put('.env.example','''# Modelo sem credenciais; preencher no ambiente local, sem versionar .env.
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8081
DATABASE_URL=jdbc:postgresql://localhost:5432/print3d_novo
DATABASE_USERNAME=
DATABASE_PASSWORD=
TEST_DATABASE_URL=jdbc:postgresql://localhost:5432/print3d_test
TEST_DATABASE_USERNAME=
TEST_DATABASE_PASSWORD=
JWT_SECRET=
FRONTEND_PORT=5174
CORS_ALLOWED_ORIGINS=http://localhost:5174
''')

events=['SessionStart','UserPromptSubmit','PreToolUse','PostToolUse','PostToolUseFailure','SubagentStart','SubagentStop','SessionEnd']
command='node "${CLAUDE_PROJECT_DIR}/scripts/tcc/capture.cjs"'
settings={'hooks':{e:[{'hooks':[{'type':'command','command':command,'timeout':10}]}] for e in events}}
for e in ['PreToolUse','PostToolUse','PostToolUseFailure','SubagentStart','SubagentStop']:
    settings['hooks'][e][0]['matcher']='.*'
put('.claude/settings.json',json.dumps(settings,ensure_ascii=False,indent=2))

put('scripts/tcc/capture.cjs',r'''
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const sensitivePath = /(^|[\\/])(?:\.env(?:\.[^\\/]*)?|[^\\/]*\.(?:pem|key|p12)|settings\.local\.json)(?:$|[\\/])/i;
function redact(value) {
  return String(value)
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, '[SEGREDO REMOVIDO]')
    .replace(/\bBearer\s+[^\s"']+/gi, 'Bearer [REMOVIDO]')
    .replace(/\bsk-(?:ant-)?[A-Za-z0-9_-]{12,}/g, '[CHAVE REMOVIDA]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT REMOVIDO]')
    .replace(/((?:[A-Z_]*(?:PASSWORD|SECRET|TOKEN|API_KEY)|senha|password|segredo|token|api[_-]?key)["']?\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;\r\n]+)/gi, '$1[REMOVIDO]')
    .replace(/(postgres(?:ql)?:\/\/[^:\s/]+:)[^@\s]+@/gi, '$1[REMOVIDO]@');
}
function relativeFile(value) {
  if (!value) return null;
  const resolved = path.resolve(ROOT, String(value));
  const rel = path.relative(ROOT, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return '[FORA DO PROJETO]';
  return rel.replace(/\\/g,'/');
}
function capture(input, dir = path.join(ROOT,'docs/tcc/logs')) {
  const kind = input.hook_event_name || 'Unknown';
  const session = String(input.session_id || 'nao-disponivel');
  const safeSession = crypto.createHash('sha256').update(session).digest('hex').slice(0,20);
  const source = input.record_origin === 'fixture' ? 'teste_controlado' : 'claude_hook';
  const record = {
    schema_version: 1, record_id: crypto.randomUUID(), recorded_at: new Date().toISOString(),
    timezone: 'UTC', session_id: redact(session), event: kind, origin: source,
    agent_id: input.agent_id ? redact(input.agent_id) : null,
    agent_type: input.agent_type ? redact(input.agent_type) : null,
    model: input.model ? redact(input.model) : null,
    activity_id: null,
  };
  const ti = input.tool_input || {};
  const rawPrompt = kind === 'UserPromptSubmit' ? input.prompt :
    kind === 'PreToolUse' && /^(Agent|Task)$/.test(input.tool_name || '') ? ti.prompt : undefined;
  if (typeof rawPrompt === 'string') {
    const scrubbed = redact(rawPrompt);
    record.prompt = scrubbed;
    record.prompt_redacted = scrubbed !== rawPrompt;
    record.activity_id = (scrubbed.match(/ATV-E\d{2}-\d{3}/) || [null])[0];
    if (record.prompt_redacted) record.integrity_note = 'Conteúdo sensível suprimido na ingestão; não é uma cópia integral.';
  }
  if (input.tool_name) {
    record.tool_name = input.tool_name;
    record.tool_use_id = input.tool_use_id || null;
    if (ti.file_path || ti.path) record.file = relativeFile(ti.file_path || ti.path);
    // Nunca copiar conteúdo de Read, Write, Edit ou resultados de comandos para o log bruto.
    if (sensitivePath.test(String(ti.file_path || ti.path || ''))) record.file_content_omitted = true;
    if (typeof ti.command === 'string') {
      // Comandos que mencionam arquivos sensíveis são omitidos por inteiro.
      record.command = sensitivePath.test(ti.command) ? '[COMANDO SENSÍVEL OMITIDO]' : redact(ti.command);
      record.activity_id ||= (ti.command.match(/ATV-E\d{2}-\d{3}/) || [null])[0];
    }
    const response = input.tool_response;
    record.exit_code = response && typeof response === 'object' && Number.isInteger(response.exit_code) ? response.exit_code : null;
    if (kind === 'PostToolUseFailure') record.tool_failed = true;
  }
  // Sem leitura de transcripts: reduz exposição de credenciais e conteúdo fora do projeto.
  if (kind === 'SubagentStop') record.transcript_available = Boolean(input.agent_transcript_path);
  fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir, safeSession+'.jsonl');
  fs.appendFileSync(file, JSON.stringify(record)+'\n',{encoding:'utf8',flag:'a',mode:0o600});
  return {file,record};
}
if (require.main === module) {
  try {capture(JSON.parse(fs.readFileSync(0,'utf8')));}
  catch {process.stderr.write('Falha na captura de evidência; conteúdo de entrada não exibido.\n');process.exitCode=1;}
}
module.exports={capture,redact,relativeFile};
''')

put('scripts/tcc/capture.test.cjs',r'''
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {capture,redact,relativeFile}=require('./capture.cjs');
function tmp(t){const d=fs.mkdtempSync(path.join(os.tmpdir(),'print3d-capture-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));return d;}
test('preserva prompt multilinha sem segredos e extrai atividade',t=>{
 const input='ATV-E00-002\nTeste de prompt.\nSegunda linha.';
 const {record}=capture({session_id:'s1',hook_event_name:'UserPromptSubmit',prompt:input,record_origin:'fixture'},tmp(t));
 assert.equal(record.prompt,input);assert.equal(record.activity_id,'ATV-E00-002');assert.equal(record.prompt_redacted,false);
});
test('append preserva registros anteriores e isola arquivo por sessão',t=>{
 const d=tmp(t);const a=capture({session_id:'a',hook_event_name:'SessionStart'},d);
 const first=fs.readFileSync(a.file,'utf8');capture({session_id:'a',hook_event_name:'SessionEnd'},d);
 const b=capture({session_id:'b',hook_event_name:'SessionStart'},d);
 assert.ok(fs.readFileSync(a.file,'utf8').startsWith(first));assert.notEqual(a.file,b.file);
 assert.equal(fs.readFileSync(a.file,'utf8').trim().split('\n').length,2);
});
test('não inclui conteúdo de arquivos sensíveis nem saída arbitrária',t=>{
 const {record}=capture({session_id:'s',hook_event_name:'PostToolUse',tool_name:'Read',tool_input:{file_path:'.env'},tool_response:{content:'PASSWORD=nao-registrar'}},tmp(t));
 assert.equal(record.file_content_omitted,true);assert.ok(!JSON.stringify(record).includes('nao-registrar'));
});
test('remove segredos de prompt e de comando',t=>{
 assert.ok(!redact('senha=abc123 JWT_SECRET="secreto longo" Bearer abcde').includes('abc123'));
 assert.ok(!redact('JWT_SECRET="secreto longo"').includes('secreto longo'));
 const {record}=capture({session_id:'s',hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{command:'cat .env'}},tmp(t));
 assert.equal(record.command,'[COMANDO SENSÍVEL OMITIDO]');
});
test('captura delegação e código de saída sem presumir modelo',t=>{
 const d=tmp(t);const a=capture({session_id:'s',hook_event_name:'PreToolUse',tool_name:'Agent',tool_input:{prompt:'Analise clientes.'}},d).record;
 assert.equal(a.prompt,'Analise clientes.');assert.equal(a.model,null);
 const b=capture({session_id:'s',hook_event_name:'PostToolUse',tool_name:'Bash',tool_input:{command:'npm run lint'},tool_response:{exit_code:1,stdout:'conteudo privado'}},d).record;
 assert.equal(b.exit_code,1);assert.ok(!JSON.stringify(b).includes('conteudo privado'));
});
test('não permite que caminho de arquivo escape do projeto',()=>{
 assert.equal(relativeFile('../../fora.txt'),'[FORA DO PROJETO]');
});
''')

roles={
 'architect':('Define arquitetura, ADRs, critérios de aceitação e limites entre módulos. Não implementa código da aplicação.','Read, Glob, Grep, Write, Edit','Escreva somente em docs/planejamento e docs/tcc/04-decisoes-arquiteturais. Compare alternativas, recomende uma e documente impactos de segurança e testes.'),
 'backend':('Implementa APIs, regras de negócio, autenticação e testes unitários.','Read, Glob, Grep, Write, Edit, Bash','Edite backend e testes unitários; não altere migrations aplicadas. Faça acesso entre módulos por serviços públicos. Use tenant do token, DTOs e transações na camada de serviço.'),
 'frontend':('Implementa telas claras, componentes e integração com APIs reais.','Read, Glob, Grep, Write, Edit, Bash','Edite frontend. Toda tela deve estar no registro central com código e permissão. Não invente dados ou endpoints. Verifique loading, vazio, erro, teclado e build.'),
 'database':('Define modelo, migrations, índices e isolamento por empresa.','Read, Glob, Grep, Write, Edit, Bash','Edite migrations novas e documentos do banco. Não altere migrations aplicadas nem regras de negócio. Configure RLS conforme ADR e testes com PostgreSQL local dedicado.'),
 'qa':('Escreve e executa testes de integração; relata defeitos sem corrigir produção.','Read, Glob, Grep, Write, Edit, Bash','Edite testes e evidências, nunca produção. Use apenas print3d_test e credenciais de teste. Recuse truncar/destruir banco fora desse alvo. Teste isolamento, auditoria e permissões.'),
 'ux':('Define design system, navegação e critérios de usabilidade.','Read, Glob, Grep, Write, Edit','Edite documentos de UX e especificações de componentes. Tema claro, sem elementos decorativos sem função. Não implemente regra de negócio.'),
 'tcc-docs':('Consolida evidências de logs e Git sem inventar interações ou métricas.','Read, Glob, Grep, Write, Edit','Escreva exclusivamente em docs/tcc, exceto logs brutos que nunca podem ser editados. Cite arquivo e linha de log ou hash Git em cada afirmação factual. Ausência vira não disponível.'),
}
for role,(desc,tools,scope) in roles.items():
    put(f'.claude/agents/{role}.md',f'''---
name: {role}
description: {desc}
tools: {tools}
model: inherit
---

# Papel {role}

Leia CLAUDE.md, docs/tcc/INDEX.md e os ADRs relevantes antes de atuar.

## Escopo e limites

{scope}

As listas de ferramentas não são um sandbox de arquivos. Respeite o escopo declarado e as permissões reais. Não use shell para contornar esses limites. As ferramentas Bash dependem da instalação local do Claude Code e de Git Bash no Windows.

## Procedimento

1. Identifique a atividade ATV-E<etapa>-<sequência> e o critério de aceitação.
2. Confirme o estado real nos arquivos antes de assumir que algo existe.
3. Faça a menor alteração necessária dentro de seu papel.
4. Quando houver execução, registre comando, resultado e caminho da evidência; não declare sucesso sem executar.
5. Relate objetivo, arquivos, decisões, testes, erros, pendências e encaminhamentos.

Nenhum agente registra métricas estimadas ou modifica logs brutos. Nunca arquive credenciais.
Modelo provisório herdado da sessão: resolver ID exato conforme ADR-006 antes da Etapa 1; não alegar Opus/Sonnet 5.5 executados.
''')

sections=['01-metodologia','02-prompts','03-agentes','04-decisoes-arquiteturais','05-diario-desenvolvimento','06-testes-e-evidencias','07-intervencoes-humanas','08-resultados','09-limitacoes']
for sec in sections:(root/'docs/tcc'/sec).mkdir(parents=True,exist_ok=True)
put('docs/tcc/02-prompts/ATV-E00-001.md', '''# ATV-E00-001

Fonte original: [prompt-inicial.md](fontes/prompt-inicial.md).
O arquivo da fonte contém o texto integral, sem alterações. Não reproduzimos com correções editoriais.
Importado manualmente antes da instalação de hooks no novo projeto. Não é captura automática nem mensagem histórica recuperada.
Pedido adicional nesta conversa: criar projeto separado e pular revisão manual.
''')
put('docs/tcc/02-prompts/fontes/SHA256.json',json.dumps(sources,indent=2))
put('docs/tcc/INDEX.md','''# Evidências do Print3D Manager Novo

Estado: Etapa 0 preparada no Codex. Aplicação ainda não implementada.

- [Atividades](AGENTS_ACTIVITY.md)
- [Metodologia](01-metodologia/estudo.md)
- [Prompts originais](02-prompts/ATV-E00-001.md)
- [Papéis dos agentes](03-agentes/configuracao.md)
- [ADRs](04-decisoes-arquiteturais/)
- [Diário](05-diario-desenvolvimento/ATV-E00-001.md)
- [Resultados de testes](06-testes-e-evidencias/)
- [Intervenções humanas](07-intervencoes-humanas/registro.md)
- [Estado da etapa](08-resultados/etapa-0.md)
- [Limitações](09-limitacoes/captura.md)

Logs brutos são acrescentados pelos hooks em logs/. Prompts sensíveis são higienizados na ingestão e marcados como não integrais; nunca inventar o texto omitido. Nenhum modelo Claude foi executado nesta preparação.
''')
put('docs/tcc/AGENTS_ACTIVITY.md','''# Histórico de atividades

| Atividade | Execução | Evidência | Estado |
|---|---|---|---|
| ATV-E00-001 | Preparação pelo Codex, orientada pelo desenvolvedor | prompts/fontes, diário e commit inicial | Planejamento e infraestrutura de registro |
| ATV-E00-002 | Exercício controlado do capturador Node | 06-testes-e-evidencias/registro-controlado.jsonl e capture-tests.tap | Consultar resultados reais |

Os sete agentes foram definidos em arquivos, mas não foram invocados. Os testes controlados usam origin=teste_controlado e não contam como interações reais do Claude.
'''.replace('prompts/fontes','02-prompts/fontes'))
put('docs/tcc/01-metodologia/estudo.md','''# Metodologia e unidades de observação

Estudo de caso do desenvolvimento de um ERP, com atividade como unidade rastreável. Não há alegação de comparação controlada ou ganho de produtividade.

Registrar fonte do prompt, arquivos alterados, revisão ou decisão humana, comandos executados e commit correspondente. Classificar a preparação como orientada pelo desenvolvedor. Usar data UTC no log e converter para America/Sao_Paulo na redação.

Contar prompts somente em eventos UserPromptSubmit de origem claude_hook; excluir fixtures e importações. Não equiparar falha de ferramenta a teste reprovado sem o arquivo do runner. Intervenções corretivas precisam ser classificadas por evidência; não derivar todas de um comando que falhou. Não há métricas históricas disponíveis nesta preparação.
''')
put('docs/tcc/03-agentes/configuracao.md','''# Agentes configurados

Sete definições em .claude/agents: architect, backend, frontend, database, qa, ux e tcc-docs. São arquivos para futuras sessões Claude Code, não registros de execuções já realizadas.

Papéis de análise não têm Bash. Papéis técnicos com Bash precisam de permissões do ambiente. Limites por pasta são instruções, não uma barreira técnica. O executor deve revisar o diff automaticamente quanto a escopo e segredos.

Modelo solicitado: Opus 5.5 para coordenação/architect; Sonnet 5.5 para os demais. Disponibilidade e IDs não confirmados. Campo provisório inherit; ver ADR-006. Nenhuma mudança de modelo em sessão foi realizada.
''')
put('docs/tcc/07-intervencoes-humanas/registro.md','''# Intervenções humanas

1. O desenvolvedor forneceu CLAUDE.md e prompt-inicial.md e solicitou um novo projeto separado do atual.
2. O desenvolvedor dispensou a revisão manual. Isso foi aplicado aos checkpoints desta preparação, preservando verificações automáticas.

Não houve aceite manual de cada decisão arquitetural. As recomendações foram adotadas como propostas de preparação, não como aprovações humanas fictícias.
''')
put('docs/tcc/09-limitacoes/captura.md','''# Limitações observadas

- Esta execução aconteceu no Codex. Não houve sessão de trabalho Claude Code para disparar hooks nativamente. O script foi executado de verdade com entradas controladas, sem apresentar esses eventos como atividade de agentes.
- O prompt inicial antecede os hooks: fonte importada manualmente, preservada com SHA-256.
- model pode faltar nos eventos. Campo ausente permanece null; nenhuma versão é inferida do papel ou de alias.
- PostToolUse pode não fornecer exit_code para determinada ferramenta. Nesse caso é null; guardar relatório do runner separado. O wrapper não modifica comandos da aplicação.
- SubagentStart/Stop não bastam para recuperar o texto de delegação. PreToolUse de Agent/Task captura prompt quando disponível. Não lemos transcripts automaticamente.
- Conteúdo de arquivos e stdout/stderr não são copiados para os logs; isso evita gravar .env e saídas sensíveis. Relatórios de teste devem ser direcionados a arquivos não sensíveis.
- Redação de segredos conhecidos ocorre antes da persistência. Segredos arbitrários sem marcação não podem ser reconhecidos com garantia. Nunca enviar credenciais nos prompts. Se houver redação, o prompt é marcado como não integral; não armazenamos seu hash original.
- JSONL utiliza append por sessão; não é armazenamento inviolável ou à prova de alteração por alguém com acesso ao disco. Git preserva snapshots quando commitados. Não editar logs manualmente.
- Não houve execução de mvn verify, npm run lint/build ou migrations, pois a Etapa 0 não cria backend/frontend.
- Opus 5.5 e Sonnet 5.5 não foram confirmados. Não confundir inherit com pinagem exata.
''')

put('docs/planejamento/00-requisitos.md','''# Análise de requisitos da Etapa 0

## Contradições e lacunas

| Questão | Encaminhamento adotado nesta preparação |
|---|---|
| Clonar sistema atual versus prompt que proíbe código na Etapa 0 | Novo repositório independente preparado pelas fontes; nenhum backend/frontend herdado. Não é uma cópia executável do ERP antigo. |
| Aprovação entre passos versus pedido para pular revisão manual | Planejamento documentado sem checkpoints manuais nesta execução; etapa seguinte continua fora do escopo do prompt inicial. |
| Modelos Opus/Sonnet 5.5 sem ID verificável | ADR-006; inherit provisório, não afirmar execução. |
| Captura integral versus não gravar segredos | Higienizar na entrada, marcar redação; nunca salvar conteúdo sensível nem fingir integralidade. |
| PostgreSQL local dedicado versus banco antigo em Docker | Nova base print3d_novo e print3d_test; não reutilizar volumes ou credenciais. |
| Exclusão de cadastros e histórico imutável | Soft delete nos cadastros; histórico Envers preservado. Eventos append-only. |
| Usuário pertence a uma ou várias empresas? | Proposta MVP: usuário pertence a uma empresa; administração de empresas apenas por papel de plataforma, sem acesso automático aos dados de negócio. |
| Login exige empresa, mas endpoints não aceitam empresa_id | Login recebe identificador de acesso e senha; identidade global única resolve empresa no servidor; token carrega tenant. Não aceitar empresa_id em DTO de negócio. |
| Falha de login sem identidade válida | Evento sem usuário/empresa quando desconhecidos; consulta restrita à plataforma, nunca atribuída a uma empresa presumida. |
| Tela informativa enviada pelo browser | Allowlist de códigos, validação de formato e marcador desconhecido; jamais usar para autorização. |
| Extensões além do MVP | Produção, financeiro e relatórios entram após etapas 1-9, sem prometer entrega nesta preparação. |
| Atualizar dados durante produção e faturamento | Transações, testes de concorrência e restrições de unicidade, não apenas validação na UI. |

## Fora do escopo

Cobrança SaaS, pagamentos externos, Kubernetes, microsserviços, Docker, dados reais de clientes e migração automática do ERP antigo. A etapa atual não implementa módulos.
''')
put('docs/planejamento/01-arquitetura.md','''# Arquitetura proposta

Monólito modular. Backend em backend/src/main/java/br/com/print3dmanager: clientes, estoque, impressoras, orcamentos, pedidos, producao, financeiro, relatorios, admin, shared. Cada módulo: controller, service (API pública), repository, dto, model e mapper quando necessário. shared contém erros, paginação e contexto autenticado; não contém regras de módulos.

Frontend em frontend/src: app (rotas/providers), layout, components, screens/registry.ts, features/<dominio> (api, pages, forms, types), shared. Rotas, menu e breadcrumbs são derivados do registry. Estado de negócio remoto via TanStack Query; formulários via React Hook Form/Zod.

Fluxo: navegador → API Spring Boot → PostgreSQL local. Vite só em desenvolvimento. Build de produção poderá ser servido pelo próprio Spring Boot; não requer NGINX ou Docker. Ports propostos: API 8081 e UI 5174, distintos do ERP antigo.

Dependências: pedidos e orcamentos consultam serviços públicos de clientes/estoque/impressoras; producao consulta pedidos e movimenta estoque por serviço; financeiro recebe operações de faturamento; relatorios utiliza contratos de leitura. Repository é privado ao módulo. Evitar ciclos separando coordenação em serviço de aplicação ou evento transacional. Testes de arquitetura verificarão importações entre módulos.

## Registro de telas proposto

001 Dashboard; 101 consulta e 102 cadastro de clientes; 201/202 orçamentos; 301/302 pedidos; 401 fila; 501/502 materiais; 503 movimentos; 601/602 impressoras; 701 financeiro; 801 relatórios; 901 empresas; 902 usuários; 903 perfis; 904 auditoria. A criação de novas telas consome códigos novos, sem renumerar os anteriores.

O registro inclui código, rota legível, título, módulo, visibilidade e permissão. A API valida tela/ação independentemente do cabeçalho de origem.
''')

adrs={
'001-isolamento-empresas':('Isolamento entre empresas','''Alternativas: filtro Hibernate facilita ORM, mas pode falhar em SQL nativo e operações de ID; RLS aplica o limite no banco, mas depende do papel e contexto por transação; combinação oferece defesa adicional e maior complexidade.

Recomendação: RLS como barreira principal e predicados de empresa explícitos nos repositórios/serviços para defesa adicional. Não depender de filtro Hibernate como única proteção. Papel runtime sem SUPERUSER/BYPASSRLS e não proprietário; proprietário de migrations separado. FORCE ROW LEVEL SECURITY nas tabelas de negócio. SET LOCAL app.empresa_id por transação, vindo exclusivamente do token validado; sem contexto, negar acesso. Nunca usar SET de sessão que vaze entre conexões do pool. Revisions/eventos e tabelas relacionadas também entram na política.

FKs compostas (empresa_id,id) preservam coerência entre tenants; chaves únicas de negócio incluem empresa. Admin da plataforma não ignora RLS silenciosamente. Login é um caminho mínimo separado de identidade, com buscas restritas e sem acesso a dados de negócio.

Critérios futuros: A não lê/atualiza/exclui B por ID, busca, SQL nativo, relatório ou histórico; inserção com vínculo cruzado falha; conexão reaproveitada não conserva tenant; acesso sem contexto falha. Testar com runtime role real e sem privilégios de proprietário.'''),
'002-autenticacao':('Autenticação e renovação','''Alternativas: tokens em localStorage simplificam persistência mas ampliam exposição por XSS; ambos em cookie exigem CSRF em operações; access em memória e refresh em cookie HttpOnly reduzem persistência acessível a JavaScript.

Recomendação: access JWT de 15 minutos em memória; refresh opaco com rotação, hash no banco, revogação e expiração de 7 dias. Claims assinadas: sub, empresa, jti, exp e versão de permissões. Validar algoritmo, emissor e audiência. Refresh HttpOnly, SameSite e Secure em HTTPS; exceção de Secure só no perfil dev local. CSRF token no refresh/logout e verificação de origem, CORS por allowlist.

Credenciais somente de ambiente, BCrypt, falhas de login com resposta genérica e limitação de tentativas. Alterações de perfil/desativação invalidam refresh e precisam refletir no access por versão/sessão. Nenhum token ou hash na auditoria. Testes de rotação, reuso, logout, isolamento e autorização.'''),
'003-auditoria':('Auditoria de dados e eventos','''Alternativas: tabela própria simplifica schema, mas exige reconstrução manual e captura de cada alteração; Envers integra revisões ao ciclo JPA, ao custo de tabelas e configuração adicionais.

Recomendação: Spring Data Auditing para colunas básicas e Envers para histórico. RevisionEntity identifica usuário, empresa, data e tela. Revisões de identidade segregadas das de negócio quando não há tenant resolvido. Password, hash, token e segredos excluídos por configuração e testes.

Eventos de negócio em tabela append-only com autor, tenant, instante, tipo, referência e tela. Revogar UPDATE/DELETE de auditoria no papel runtime e expor apenas consultas autorizadas. RLS em eventos e tabelas auditadas. Envers não substitui evento de login/status; evitar duplicar semântica entre as duas estruturas. Soft delete mantém rastreabilidade dos cadastros.

Criar/alterar/excluir devem gerar revisão com usuário correto na mesma transação; rollback não deixa evento de sucesso. Leituras não geram auditoria. Cabeçalho X-Screen-Code é informativo e validado contra registro.'''),
'004-consultas':('Extração progressiva de consultas','''Alternativas: query builder genérico inicial aumenta abstração sem evidência; consultas separadas são simples, mas duplicam comportamento quando módulos convergem.

Recomendação: Clientes primeiro com DTO de filtro explícito, Pageable, busca textual vinculada e allowlist de campos/ordenação. Limite de página 100. Seleção de colunas é visual e não amplia os campos que a API pode expor. Metadados de exibição são definidos no servidor.

Somente extrair componente/DataTable e contratos comuns depois de Estoque demonstrar duplicação concreta de paginação, filtros e metadados. Registrar o diff que justifica a extração. Nunca aceitar SQL, expressão de coluna ou nome de tabela do cliente. SQL nativo precisa ADR próprio e testes de RLS.'''),
'005-stack':('Stack e controle de versões','''Java 21 é uma restrição do projeto. Spring Boot 4.1.1 aparece como estável na documentação consultada; React 19.2 é a linha apresentada na documentação oficial. Node instalado: 24.15.0; Claude Code instalado: 2.1.296. Não assumir que uma versão instalada é a última estável.

Como esta etapa proíbe código de aplicação, não há pom.xml ou package.json de aplicação para pinagem. Na Etapa 1 consultar registries oficiais, selecionar versões exatas compatíveis (incluindo Springdoc, Envers/Hibernate e MUI), gerar lockfile e registrar resolução e data antes de instalar. Evitar misturar módulos Boot 3 e Boot 4. Nenhuma dependência nova nesta etapa: capturador e testes usam apenas biblioteca padrão do Node.

Fontes consultadas em 14/10/2026:
- https://docs.spring.io/spring-boot/
- https://react.dev/versions
- https://vite.dev/releases

PostgreSQL local deve ter banco runtime e banco de testes com papéis distintos; não usar H2, Docker ou Testcontainers. Patch exato do servidor será registrado após consulta ao servidor, não inferido da pasta instalada.'''),
'006-modelos-registros':('Modelos e fidelidade dos registros','''Fontes pedem Opus 5.5 e Sonnet 5.5. A consulta à documentação não confirmou esses nomes como IDs disponíveis nesta conta. Não inventar um ID, nem atribuir a esses modelos a preparação realizada pelo Codex.

Alternativas: gravar IDs adivinhados (rejeitado: configuração possivelmente inválida); trocar silenciosamente de modelo (rejeitado: rompe metodologia); herdar temporariamente e registrar a lacuna (adotado para arquivos de preparação).

Sete definições usam model: inherit. Isso não satisfaz pinagem exata para o experimento: resolver no seletor/provedor e registrar IDs antes da Etapa 1. Nenhum modelo Claude foi invocado nesta execução. Campo model ausente no hook permanece null. Não produzir métricas de produtividade a partir dos testes sintéticos.

Revisão manual foi dispensada pelo usuário; validações automáticas e registros de erros continuam. Não criar agentes fictícios nos registros nem atribuir a agentes trabalhos feitos pelo coordenador.'''),
}
for key,(title,body) in adrs.items():
    put('docs/tcc/04-decisoes-arquiteturais/ADR-'+key+'.md',f'# ADR-{key[:3]} {title}\n\nStatus: proposta adotada para a preparação da Etapa 0, sem aceite manual individual.\nData: 14/10/2026.\n\n{body}')

put('docs/planejamento/02-modelo-dados.md','''# Modelo inicial proposto

Diagrama conceitual do MVP; não é migration nem representação de schema já criado. Todas as tabelas de negócio têm empresa_id e colunas de criação/alteração. Coleções de permissões e identidade requerem política própria conforme ADR-001.

```mermaid
erDiagram
  EMPRESA ||--o{ USUARIO : possui
  EMPRESA ||--o{ CLIENTE : possui
  EMPRESA ||--o{ MATERIAL : possui
  EMPRESA ||--o{ IMPRESSORA : possui
  USUARIO }o--o{ PERFIL : recebe
  PERFIL }o--o{ PERMISSAO : concede
  CLIENTE ||--o{ ORCAMENTO : solicita
  ORCAMENTO ||--|{ ITEM_ORCAMENTO : contem
  MATERIAL ||--o{ ITEM_ORCAMENTO : utiliza
  IMPRESSORA ||--o{ ITEM_ORCAMENTO : estima
  ORCAMENTO o|--o| PEDIDO : converte
  CLIENTE ||--o{ PEDIDO : realiza
  PEDIDO ||--|{ ITEM_PEDIDO : contem
  MATERIAL ||--o{ MOVIMENTO_ESTOQUE : movimenta
  USUARIO ||--o{ REFRESH_TOKEN : autentica
  EMPRESA ||--o{ EVENTO_AUDITORIA : registra
  USUARIO o|--o{ EVENTO_AUDITORIA : executa
  EMPRESA ||--o{ REVISAO : possui
```

Itens de orçamento guardam snapshot de parâmetros e custos usados, para preservar preço histórico. Conversão tem constraint única por orçamento/empresa. Material: tipo FILAMENTO/RESINA, fabricante, cor, unidade explícita, custo e mínimo; peso pode ser gramas e volume mL, sem conversão implícita. Movimentos transacionais não substituem saldo consistente. Perfis/permissões e vínculos pertencem à empresa; papel plataforma é separado. Login sem identidade resolvida permite evento sem usuário/empresa conforme ADR.
''')

plan=[
('0','Planejamento e registro','Arquivos dos agentes, hooks, ADRs e planos.','Testes do capturador, fontes intactas, Git independente, nenhuma aplicação.','architect, tcc-docs; preparação atual pelo Codex'),
('1','Estrutura backend/frontend','Maven Wrapper, Vite e configuração local.','mvn verify e lint/build; /health funciona; dependências exatas documentadas.','architect, backend, frontend, qa'),
('2','Design system e telas','Layout claro, sidebar, registry e atalho por código.','Rotas derivadas do registry; código único; teclado; estados básicos; build.','ux, frontend, qa'),
('3','Persistência, autenticação e auditoria','RLS, identidade, refresh e Envers.','Migrations do zero; teste A/B; runtime role sem bypass; criar/alterar/excluir auditados.','database, backend, qa'),
('4','Administração','Empresas, usuários, perfis e ações.','Tenant do token; testes 401/403; revogação; histórico isolado.','backend, frontend, database, qa'),
('5','Clientes','CRUD real, contato e consulta direta.','Paginação servidor; filtros; A/B por ID e lista; auditoria por usuário e tela.','backend, frontend, database, qa'),
('6','Estoque','Materiais, fabricantes, cores, saldo e movimentos.','Unidades explícitas; transação concorrente; isolamento/auditoria; decidir extração por diff.','backend, frontend, database, qa'),
('7','Impressoras','Cadastro, estado e parâmetros de custo.','Mudança inválida recusada; custo validado; A/B e histórico.','backend, frontend, database, qa'),
('8','Orçamentos','Fórmula e snapshot, CRUD e conversão.','ADR da fórmula; testes de arredondamento/unidades; conversão idempotente sob concorrência; A/B.','architect, backend, frontend, database, qa'),
('9','Pedidos','Itens, estados, datas e vínculo produção.','Máquina de estados testada; dados do orçamento preservados; A/B e auditoria.','backend, frontend, database, qa'),
('10','Produção (extensão)','Fila, execução, consumo e falhas.','Exclusividade da impressora; consumo uma vez; A/B e auditoria.','backend, frontend, database, qa'),
('11','Financeiro (extensão)','Receitas/despesas, contas e faturamento.','Unicidade por pedido; concorrência; valores decimais; A/B e auditoria.','backend, frontend, database, qa'),
('12','Relatórios (extensão)','Vendas, custo, margem e uso.','Período limitado; resultado confrontado com fixtures; RLS e autorização.','backend, frontend, database, qa'),
('13','Validação integrada','Fluxo completo e evidências finais.','mvn verify/lint/build; migrations vazias; verificação automática de isolamento, auditoria e referências.','qa, architect, tcc-docs'),
]
put('docs/planejamento/03-etapas.md','# Plano de etapas\n\nSomente a Etapa 0 foi executada nesta preparação. Revisão manual dispensada nesta execução; sem aplicação nova entregue.\n\n| Etapa | Tema | Escopo | Critérios automatizáveis | Papéis planejados |\n|---|---|---|---|---|\n'+'\n'.join('| '+' | '.join(x)+' |' for x in plan)+'\n\nEm etapas de negócio, adicionar teste de criação, alteração e exclusão auditadas com usuário correto, códigos de tela/permissão, migrations aplicadas do zero e consolidação de evidência. Não iniciar próxima etapa sem nova instrução do desenvolvedor, conforme prompt inicial.')
put('docs/planejamento/04-captura.md','''# Infraestrutura de captura

Configuração em .claude/settings.json; script Node scripts/tcc/capture.cjs sem dependências externas. Eventos: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PostToolUseFailure, SubagentStart/Stop e SessionEnd. Metadados e prompts de delegação são capturados quando presentes. Ausência fica null. Saídas arbitrárias não são arquivadas. A captura não concede permissões nem desativa aprovação do ambiente.

Arquivo JSONL por hash de identificador de sessão evita usar nomes arbitrários como caminho. Escrita append preserva registros anteriores. Prompts de arquivo fornecidos foram importados com hash; eventos de exercício têm origin=teste_controlado. Não ler o conteúdo de .env ou transcripts.

Fontes oficiais consultadas em 14/10/2026:
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/model-config

Validar automaticamente: node --test scripts/tcc/capture.test.cjs. A evidência na pasta 06 é de teste do script; um teste nativo dos hooks ainda exige sessão Claude Code no novo diretório. Não alegar que esse disparo aconteceu durante a preparação no Codex.
''')
put('docs/planejamento/05-riscos-decisoes.md','''# Riscos e decisões

| Risco concreto | Mitigação planejada |
|---|---|
| Pool reaproveita tenant ou papel runtime ignora RLS | SET LOCAL transacional, papel sem bypass, FORCE RLS e testes de conexão reaproveitada. |
| Auditoria expõe senha ou dados de outra empresa | Excluir campos, políticas nas tabelas históricas, casos negativos de histórico. |
| Orçamento muda porque material/impressora foram atualizados | Snapshot de parâmetros e testes de preço histórico. |
| Dois pedidos convertidos ou duas receitas na concorrência | Constraint única por tenant/referência e transação; teste concorrente. |
| Atualização do Boot quebra Envers/springdoc | Fixar conjunto compatível e executar migrations/integração antes dos módulos. |
| Banco de testes aponta para produção | URL/nome exatos print3d_test e papel dedicado; abortar runner se diferente. |
| Evidência contém segredos ou relata atividade não executada | Metadados mínimos, redação prévia, origem fixture explícita e nenhum agente simulado. |
| UI de fachada | Endpoint real e teste de integração como critérios, não apenas build visual. |

## Decisões registradas sem checkpoint manual

Novo repositório sem histórico ou credenciais do antigo; RLS e predicados explícitos; JWT em memória e refresh HttpOnly; Envers e eventos; consulta Clientes direta antes de extração; ports 8081/5174 e bases separadas.

## Pontos técnicos ainda a resolver

IDs reais e disponibilidade de Opus/Sonnet 5.5; pinagem completa da stack na Etapa 1; teste de hooks em sessão Claude Code; credenciais de bancos dedicados; taxa e unidades da fórmula de preço; regra de arredondamento; definição final do administrador de plataforma. Não foi simulada aprovação desses pontos. Ver ADRs para alternativas e recomendação.
''')

put('docs/tcc/05-diario-desenvolvimento/ATV-E00-001.md','''# ATV-E00-001 Preparação do projeto separado

Data: 14/10/2026, America/Sao_Paulo. Executor: Codex nesta conversa. Modelo exato do executor: não disponível no registro de ferramentas; não presumir versão. Classe: orientada pelo desenvolvedor.

Objetivo: criar base independente a partir dos dois arquivos fornecidos, sem revisão manual e sem avançar ao código de aplicação da Etapa 1.

Contexto: fontes integrais em 02-prompts/fontes; projeto antigo apenas como contexto de domínio, sem copiar código, .git, .env, dados ou resultados do TCC anterior.

Entregas: configurações de captura, testes Node, sete definições, seis ADRs, modelo conceitual, plano das etapas, riscos e limitações. Nenhum agente Claude invocado.

Testes: consultar capture-tests.tap e registro-controlado.jsonl. Build/lint de aplicação e migrations: não executados, pois não há aplicação nesta etapa. Decisões: recomendações adotadas sem confirmação manual, conforme pedido. Problemas: IDs de modelos não confirmados e disparo nativo de hook não realizado.

Commit: identificar por git log --grep=ATV-E00-001; o próprio commit contém este arquivo, sem hash autorreferencial inventado.
''')
put('docs/tcc/08-resultados/etapa-0.md','''# Estado da Etapa 0

Preparação concluída: prompts preservados; sete agentes definidos; capturador e testes; estrutura acadêmica; seis ADRs; análise de requisitos; arquitetura; diagrama conceitual; plano e riscos.

Nenhum ERP novo executável foi gerado, conforme limitação do prompt inicial. Não há endpoint, tela, migration ou funcionalidade de negócio entregue. Código antigo permanece no repositório original.

Validação do capturador por execução controlada: consultar arquivos de evidência. Integração nativa com Claude Code e resolução de modelos: não executadas. Revisão manual dispensada; não substituída por aceite fictício.
''')
put('README.md','''# Print3D Manager Novo

Repositório independente preparado a partir de CLAUDE.md e prompt-inicial.md fornecidos pelo desenvolvedor. Esta versão começa pela Etapa 0; não é cópia executável do código antigo. O ERP atual permanece em C:\\repository\\Print3d Manager ERP.

## O que existe

Planejamento, seis ADRs, modelo de dados proposto, sete agentes Claude Code, hooks de captura e testes do capturador. Não há backend/frontend ou banco novo nesta etapa. Sem Docker.

## Conferir os registros

```powershell
cd "C:\\repository\\Print3D Manager Novo"
node --test scripts/tcc/capture.test.cjs
git log --oneline
```

Leia [índice acadêmico](docs/tcc/INDEX.md), [requisitos](docs/planejamento/00-requisitos.md), [arquitetura](docs/planejamento/01-arquitetura.md) e [etapas](docs/planejamento/03-etapas.md).

## Continuar no Claude Code

Abra esta pasta como projeto separado, confira os IDs dos modelos disponíveis conforme ADR-006 e inicie `claude`. As fontes foram arquivadas byte a byte. As instruções operacionais adicionais do CLAUDE.md informam as exceções autorizadas e as lacunas. O prompt inicial é apenas de Etapa 0: não o use para alegar que o sistema já está pronto.

O hook requer Node no PATH. Arquivos de exemplo não têm credenciais. Antes das etapas de banco, preparar PostgreSQL local, bases print3d_novo e print3d_test e papéis separados; não aproveitar dados do ERP antigo. Ports propostos API 8081 e Vite 5174.

Git local independente, sem remote configurado. Nenhum dado do projeto antigo foi publicado.
''')
print(root)
print('Arquivos:',sum(p.is_file() for p in root.rglob('*')))
