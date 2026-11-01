from pathlib import Path
from xml.sax.saxutils import escape
import re, shutil, math, json
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Ellipse, Polygon, Circle
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[2]
TMP=ROOT/'tmp/tcc'
OUT=ROOT/'output/pdf'
OUT.mkdir(parents=True,exist_ok=True)
for name,file in [('TimesCustom','times.ttf'),('TimesCustom-Bold','timesbd.ttf'),('TimesCustom-Italic','timesi.ttf'),('TimesCustom-BoldItalic','timesbi.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
pdfmetrics.registerFontFamily('TimesCustom',normal='TimesCustom',bold='TimesCustom-Bold',italic='TimesCustom-Italic',boldItalic='TimesCustom-BoldItalic')
W=453.54
styles={
 'body':ParagraphStyle('body',fontName='TimesCustom',fontSize=12,leading=18,alignment=TA_JUSTIFY,firstLineIndent=28.35,spaceAfter=8,splitLongWords=True,allowWidows=0,allowOrphans=0),
 'title':ParagraphStyle('title',fontName='TimesCustom-Bold',fontSize=14,leading=19,alignment=TA_CENTER,spaceAfter=22,keepWithNext=True),
 'h1':ParagraphStyle('h1',fontName='TimesCustom-Bold',fontSize=12,leading=18,spaceBefore=16,spaceAfter=10,keepWithNext=True),
 'h2':ParagraphStyle('h2',fontName='TimesCustom-Bold',fontSize=12,leading=18,spaceBefore=12,spaceAfter=8,keepWithNext=True),
 'caption':ParagraphStyle('caption',fontName='TimesCustom',fontSize=11,leading=14,alignment=TA_CENTER,spaceBefore=8,spaceAfter=7,keepWithNext=True),
 'source':ParagraphStyle('source',fontName='TimesCustom',fontSize=10,leading=13,alignment=TA_CENTER,spaceAfter=12),
 'ref':ParagraphStyle('ref',fontName='TimesCustom',fontSize=11,leading=15,spaceAfter=10,alignment=TA_LEFT),
 'cell':ParagraphStyle('cell',fontName='TimesCustom',fontSize=10,leading=13,spaceAfter=0),
 'code':ParagraphStyle('code',fontName='TimesCustom',fontSize=10,leading=14,alignment=TA_LEFT,spaceAfter=6),
 'foot':ParagraphStyle('foot',fontName='TimesCustom',fontSize=9,leading=12,spaceAfter=5),
 'author':ParagraphStyle('author',fontName='TimesCustom',fontSize=12,leading=18,alignment=TA_CENTER,spaceAfter=4),
 'abstract':ParagraphStyle('abstract',fontName='TimesCustom',fontSize=11,leading=15,alignment=TA_JUSTIFY,spaceAfter=10),
}

def para(t,style='body'):
    t=escape(t)
    t=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',t)
    t=t.replace('\n','<br/>')
    return Paragraph(t,styles[style])

ink=colors.HexColor('#24344a'); accent=colors.HexColor('#345a82'); pale=colors.HexColor('#f3f6fa')
def label(d,x,y,t,size=9,bold=False,color=ink):
    d.add(String(x,y,t,fontName='TimesCustom-Bold' if bold else 'TimesCustom',fontSize=size,fillColor=color,textAnchor='middle'))
def arrow(d,x1,y1,x2,y2):
    d.add(Line(x1,y1,x2,y2,strokeColor=accent,strokeWidth=1.3))
    a=math.atan2(y2-y1,x2-x1); s=5
    pts=[x2,y2,x2-s*math.cos(a-.5),y2-s*math.sin(a-.5),x2-s*math.cos(a+.5),y2-s*math.sin(a+.5)]
    d.add(Polygon(pts,fillColor=accent,strokeColor=accent))
def browser_icon(d,x,y):
    d.add(Rect(x-18,y-11,36,24,rx=3,strokeColor=accent,fillColor=colors.white,strokeWidth=1.4))
    d.add(Line(x-18,y+6,x+18,y+6,strokeColor=accent))
    for i in range(3): d.add(Circle(x-13+i*4,y+9,1,fillColor=accent,strokeColor=accent))
    label(d,x,y-4,'< / >',10,True)
def server_icon(d,x,y):
    for i in range(3):
        d.add(Rect(x-18,y-11+i*9,36,7,rx=2,strokeColor=accent,fillColor=colors.white))
        d.add(Circle(x-12,y-7.5+i*9,1.2,strokeColor=accent,fillColor=accent))
        d.add(Line(x-5,y-7.5+i*9,x+13,y-7.5+i*9,strokeColor=accent))
def db_icon(d,x,y):
    d.add(Rect(x-17,y-10,34,23,fillColor=colors.white,strokeColor=accent))
    for yy in [y-10,y,y+13]: d.add(Ellipse(x,yy,17,4,fillColor=colors.white if yy==y+13 else None,strokeColor=accent))
def proxy_icon(d,x,y):
    d.add(Polygon([x-13,y+16,x+13,y+16,x+18,y,x+13,y-16,x-13,y-16,x-18,y],fillColor=colors.white,strokeColor=accent,strokeWidth=1.5))
    label(d,x,y-4,'N',16,True)
def react_icon(d,x,y):
    for a in [0,60,120]:
        e=Ellipse(0,0,19,7,strokeColor=accent,fillColor=None,strokeWidth=1.2)
        from reportlab.graphics.shapes import Group
        g=Group(e);g.translate(x,y);g.rotate(a);d.add(g)
    d.add(Circle(x,y,2,fillColor=accent,strokeColor=accent))
def card(d,x,y,w,h,title,subtitle,icon):
    d.add(Rect(x,y,w,h,rx=6,fillColor=colors.white,strokeColor=colors.HexColor('#a9b9cb'),strokeWidth=1))
    icon(d,x+w/2,y+h-27)
    label(d,x+w/2,y+27,title,10,True)
    label(d,x+w/2,y+12,subtitle,8.5)

def architecture():
    d=Drawing(W,285)
    d.add(Rect(110,20,337,252,rx=8,fillColor=pale,strokeColor=colors.HexColor('#bcc9d7'),strokeDashArray=[4,3]))
    label(d,278,255,'Ambiente Docker Compose',10,True)
    card(d,2,139,96,95,'Navegador','Usuário',browser_icon)
    card(d,121,139,96,95,'NGINX','Arquivos / proxy',proxy_icon)
    card(d,234,139,96,95,'API REST','Java / Spring Boot',server_icon)
    card(d,346,139,92,95,'PostgreSQL','Dados / Flyway',db_icon)
    arrow(d,98,186,121,186);arrow(d,217,186,234,186);arrow(d,330,186,346,186)
    label(d,225,196,'/api',7)
    card(d,121,35,96,82,'Bundle React','Arquivos estáticos',react_icon)
    arrow(d,169,139,169,117)
    label(d,98,119,'Entrega da SPA',8)
    d.add(Rect(234,35,204,82,rx=6,fillColor=colors.white,strokeColor=colors.HexColor('#a9b9cb')))
    label(d,336,97,'Módulos da API',10,True)
    label(d,336,78,'Clientes · Orçamentos · Pedidos',9)
    label(d,336,62,'Produção · Estoque · Financeiro',9)
    label(d,336,46,'Controllers → Services → Repositories',8.5)
    arrow(d,282,139,282,117)
    return d

def workflow():
    d=Drawing(W,218)
    nodes=[(2,140,136,'ERP existente','Contexto / README'),(158,140,136,'Auditoria','Agentes especialistas'),(314,140,136,'Consolidação','Auditor Final / plano'),(314,35,136,'Correção','Agentes responsáveis'),(158,35,136,'Validação','Build / testes / revisão'),(2,35,136,'Nova auditoria','Decisão humana')]
    for x,y,w,title,sub in nodes:
        d.add(Rect(x,y,w,61,rx=6,fillColor=pale,strokeColor=accent))
        label(d,x+w/2,y+37,title,10,True);label(d,x+w/2,y+17,sub,9)
    arrow(d,138,170,158,170);arrow(d,294,170,314,170);arrow(d,382,140,382,96)
    arrow(d,314,65,294,65);arrow(d,158,65,138,65)
    d.add(Line(225,35,225,10,strokeColor=accent));d.add(Line(225,10,451,10,strokeColor=accent));d.add(Line(451,10,451,127,strokeColor=accent));arrow(d,451,127,382,127)
    label(d,337,0,'Nova rodada quando há correções',8)
    return d

def table(rows,widths,caption,source):
    data=[[para(c,'cell') for c in row] for row in rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='CENTER')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),pale),('VALIGN',(0,0),(-1,-1),'TOP'),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#7c8b9c')),('INNERGRID',(0,0),(-1,-1),.3,colors.HexColor('#a9b4c0')),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    return [para(caption,'caption'),t,para(source,'source')]

tech=[['**Camada**','**Tecnologias utilizadas**'],['Backend','Java 21, Spring Boot 3.5, Spring Security, JWT, Spring Data JPA, Hibernate, Flyway e MapStruct.'],['Banco de dados','PostgreSQL 16.'],['Frontend','React 19, TypeScript, Vite, Material UI, TanStack Query, React Hook Form, Zod e Recharts.'],['Infraestrutura','Docker, Docker Compose e NGINX.'],['Testes','JUnit 5, Mockito, Testcontainers e MockMvc.']]
agents=[['**Agente**','**Responsabilidade definida**','**Atuação**'],['tech-lead','Arquitetura, impacto e encaminhamento das tarefas.','Análise'],['backend','API, serviços, DTOs e padrões dos módulos.','Implementação'],['frontend','Páginas, formulários e integração com a API.','Implementação'],['database','Modelo de dados, JPA, SQL e migrações Flyway.','Implementação'],['erp','Orçamentos, pedidos, estados e faturamento.','Implementação'],['printing3d','Material, impressoras e custos de impressão.','Implementação'],['security','Autenticação, autorização e vulnerabilidades.','Auditoria'],['performance','Consultas, índices e gargalos de interface.','Análise'],['qa','Testes e identificação de lacunas de cobertura.','Testes'],['devops','Docker, NGINX e configuração dos ambientes.','Infraestrutura'],['tcc','Coerência da documentação com o repositório.','Documentação'],['auditor-final','Consolidação de evidências e veredito.','Auditoria']]

def codebox(kind):
    if kind != 'config':
        spec=json.loads((TMP/'prompts_expandidos.json').read_text(encoding='utf-8'))[kind]
        content=[spec['title']]+spec['lines']
        rows=[[para(line.replace('`',''),'code')] for line in content]
        rows.append([para(spec['source'],'source')])
        t=Table(rows,colWidths=[W],hAlign='CENTER',repeatRows=1)
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),pale),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#a9b4c0')),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
        t.setStyle(TableStyle([('BACKGROUND',(0,-1),(-1,-1),colors.white),('NOSPLIT',(0,-2),(-1,-1))]))
        return [t,Spacer(1,12)]
    if kind=='config':
        lines=['**Quadro 1 - Campos selecionados do cabeçalho de tech-lead.md**','---','name: tech-lead','tools: Read, Grep, Glob, Bash, PowerShell','---']
        source='Fonte: .claude/agents/tech-lead.md. Campo description omitido neste recorte.'
    else:
        lines=['**Quadro 2 - Trechos dos prompts persistentes**','**backend.md - contrato de implementação**','DTOs sempre como **Java Records**; controllers nunca recebem/retornam entidades JPA.','**backend.md - preservação do código**','Faça alterações mínimas e focadas no problema solicitado.','**qa.md - execução e evidência**','Rode `cd backend && .\\mvnw.cmd test` (suíte completa exige Docker) e reporte o resultado real, nunca assuma que passou sem rodar.','**auditor-final.md - revisão independente**','Não faça auditoria superficial "de carimbo" — cada item do checklist precisa de evidência (comando rodado, arquivo lido), não suposição.']
        source='Fonte: arquivos backend.md, qa.md e auditor-final.md em .claude/agents.'
    rows=[[para(line.replace('`',''),'code')] for line in lines]
    t=Table(rows,colWidths=[W],hAlign='CENTER')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),pale),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#a9b4c0')),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    return [KeepTogether([t,para(source,'source')])]

def imageblock(name,caption,source):
    if name=='architecture': visual=architecture()
    elif name=='workflow': visual=workflow()
    else:
        mapping={'dashboard':'original_p8_0_Im3.png','orders':'original_p9_0_Im4.png','financial':'original_p9_1_Im5.png'}
        path=TMP/(name+'.jpg')
        if not path.exists(): raise FileNotFoundError(f'Captura em modo claro ausente: {path}')
        iw,ih=ImageReader(str(path)).getSize()
        visual=Image(str(path),width=W,height=W*ih/iw)
        visual.hAlign='CENTER'
    return KeepTogether([para(caption,'caption'),visual,Spacer(1,4),para(source,'source')])

def footer(canvas,doc):
    if doc.page>1:
        canvas.setFont('TimesCustom',10)
        canvas.drawRightString(538.58,795, str(doc.page))

blocks=(TMP/'content.md').read_text(encoding='utf-8').strip().split('\n\n')
story=[]; inref=False; firstpart=True
for block in blocks:
    block=block.strip()
    if block=='!PAGE': story.append(PageBreak());firstpart=False;continue
    if block.startswith('!FIG '):
        name,caption,source=block[5:].split('|');story.append(imageblock(name,caption,source));continue
    if block=='!TABLE tech':story.extend(table(tech,[100,W-100],'Tabela 1 - Tecnologias utilizadas','Fonte: código e configurações do projeto, 2026.'));continue
    if block=='!TABLE agents':story.extend(table(agents,[80,W-165,85],'Tabela 2 - Agentes configurados no projeto','Fonte: definições em .claude/agents, 2026.'));continue
    if block.startswith('!CODE '):story.extend(codebox(block[6:]));continue
    if block.startswith('### '):story.append(para(block[4:],'h2'));continue
    if block.startswith('## '):
        title=block[3:];inref=title.startswith('REFERÊNCIAS');story.append(para(title,'h1'));continue
    if block.startswith('# '):story.append(para(block[2:],'title'));continue
    if block.startswith(('João Antônio','Felipe Dallilo')):style='author'
    elif block.startswith(('¹ ','² ')):style='foot'
    elif block.startswith(('**Resumo:','**Abstract:','**Palavras-chave:','**Keywords:')):style='abstract'
    else:style='ref' if inref else 'body'
    story.append(para(block,style))

doc=SimpleDocTemplate(str(OUT/'TCC_revisado_prompts_reais.pdf'),pagesize=(595.28,841.89),rightMargin=56.7,leftMargin=85.04,topMargin=77,bottomMargin=56.7,title='Print3D Manager - Desenvolvimento de um ERP com apoio de agentes de inteligência artificial',author='João Antônio Oliveira Barroso')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT/'TCC_revisado_prompts_reais.pdf')
