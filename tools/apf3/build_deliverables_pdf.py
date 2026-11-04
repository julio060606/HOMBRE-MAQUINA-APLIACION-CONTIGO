"""Render the APF3 report and usable study forms with bundled ReportLab."""
from pathlib import Path
import json, re, html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from build_deliverables_data import generate, OUT, ROOT

DATA=generate()
QA=OUT/'qa'; QA.mkdir(exist_ok=True)
FONT=Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('Arial',str(FONT/'arial.ttf')))
pdfmetrics.registerFont(TTFont('ArialBold',str(FONT/'arialbd.ttf')))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='ArialBold',italic='Arial',boldItalic='ArialBold')
S=getSampleStyleSheet()
for n in ['Normal','BodyText','Title','Heading1','Heading2','Heading3']:
    S[n].fontName='Arial'; S[n].textColor=colors.black
S['Normal'].fontSize=10; S['Normal'].leading=14; S['Normal'].spaceAfter=7
S['Title'].fontSize=26; S['Title'].leading=32; S['Title'].spaceAfter=20
S['Heading1'].fontSize=18; S['Heading1'].leading=23; S['Heading1'].spaceAfter=15
S['Heading2'].fontSize=12; S['Heading2'].leading=17; S['Heading2'].spaceAfter=8; S['Heading2'].spaceBefore=9
S.add(ParagraphStyle(name='Small',fontName='Arial',fontSize=8,leading=11,spaceAfter=5))
S.add(ParagraphStyle(name='Cell',fontName='Arial',fontSize=8.5,leading=11))
S.add(ParagraphStyle(name='Caption',fontName='Arial',fontSize=8,leading=11,textColor=colors.HexColor('#334155'),spaceBefore=5,spaceAfter=10))
W=481

def human_text(text):
    protected={}
    def hold(m):
        key='QPROTECTED'+chr(65+len(protected))+'TOKEN'
        protected[key]=m.group(0)
        return key
    text=re.sub(r'https?://[^\s<>]+|<[^>]+>|[a-f0-9]{40}|#[a-fA-F0-9]{3,8}\b|\bv\d+(?:\.\d+)+\b|\b[HAMPTR]\d{1,3}\b|\bW3C\b',hold,text)
    for word in ['WCAG','SUS','SEQ','SOS','APF','TIC','ISO/IEC']:
        text=re.sub(r'\b'+re.escape(word)+r'(?=\d)',word+' ',text)
    text=re.sub(r'(?<=\d)(px|s|min|criterios|participantes|perfiles|respuestas|diapositivas|páginas|nodos|estados)\b',r' \1',text)
    text=re.sub(r'\b(al|de|en|con|solo|los|las|meta|objetivo|criterio|sección|página|artículo|ítems|ítem)(?=\d)',r'\1 ',text,flags=re.I)
    text=re.sub(r'\b(fecha)(?=\d)',r'\1 ',text)
    text=re.sub(r'([a-záéíóúñ])(?=\d)',r'\1 ',text)
    text=re.sub(r'(?<=\d)(?=[A-Za-záéíóúñ])',' ',text)
    text=re.sub(r'(?<=\d)(a|y)(?=\d)',r' \1 ',text)
    text=re.sub(r';(?=\S)','; ',text)
    text=re.sub(r'(?<=\d)( sobre| de| a| y)',r'\1',text)
    text=text.replace('completaslas','completas las').replace('deIA','de IA').replace('uso deIA','uso de IA').replace('númerode','número de').replace('aP05','a P05').replace('commitQPROTECTED','commit QPROTECTED')
    for key,value in protected.items(): text=text.replace(key,value)
    return text.replace('NVDA2026','NVDA 2026').replace('aT4','a T4').replace('deT3','de T3').replace('enT3','en T3').replace('adicionales:31','adicionales: 31')

def p(text,style='Normal'):
    return Paragraph(human_text(text),S[style])
def clean(v):
    return html.escape(str(v)).replace('\n','<br/>')
def title(t): return p(t,'Heading1')
def h(t): return p(t,'Heading2')
def table(rows,widths=None,header=True):
    rows=[[p(clean(c),'Cell') for c in row] for row in rows]
    t=Table(rows,colWidths=widths or [W/len(rows[0])]*len(rows[0]),hAlign='LEFT',repeatRows=1 if header else 0)
    cmds=[('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#D9D9D9'))]
    if header:
        cmds += [('BACKGROUND',(0,0),(-1,0),colors.HexColor('#E2E8F0'))]
    t.setStyle(TableStyle(cmds)); t.spaceBefore=4; t.spaceAfter=9; return t
def page(story,heading,items):
    if story: story.append(PageBreak())
    story.append(title(heading)); story.extend(items)
def footer(c,d):
    c.setFont('Arial',8); c.setFillColor(colors.HexColor('#475569'))
    c.drawString(57,28,'CONTIGO   APF3   '+DATA['date'])
    c.drawRightString(538,28,str(d.page))
def write_pdf(name,story):
    dest=OUT/name
    doc=SimpleDocTemplate(str(dest),pagesize=(595,842),leftMargin=57,rightMargin=57,topMargin=51,bottomMargin=46,title=name.replace('_',' '),author='Equipo CONTIGO')
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    return dest
def audit_summary(a):
    if not a: return {'screens':0,'rules':0,'nodes':0,'counts':[]}
    screens=a.get('screens',[])
    counts=[]
    for s in screens:
        v=s.get('axe',{}).get('violations',[])
        counts.append((s.get('id',''),len(v),sum(len(x.get('nodes',[])) for x in v)))
    return {'screens':len(screens),'rules':sum(x[1] for x in counts),'nodes':sum(x[2] for x in counts),'counts':counts}
def shot(screen,phase):
    if not screen: return None
    value=screen.get('screenshot')
    if not value: return None
    raw=Path(value)
    opts=[raw,ROOT/raw,OUT/'evidence'/phase/raw.name]
    return next((x for x in opts if x.exists()),None)
def paired_shots(category):
    detail={'Sensorial':'detail-dose.png','Motora':'detail-navigation320.png','Cognitiva':'detail-error-field.png'}.get(category)
    if detail:
        paths=[OUT/'evidence'/phase/detail for phase in ['baseline','after']]
        if all(x.exists() for x in paths):
            imgs=[]
            for path in paths:
                iw,ih=ImageReader(str(path)).getSize();scale=min(226/iw,225/ih)
                imgs.append(Image(str(path),width=iw*scale,height=ih*scale))
            paired=Table([[p('Antes v2.0','Caption'),p('Después v3.0','Caption')],imgs],colWidths=[240,241]);paired.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP')]))
            return [paired,p('Recortes auténticos del elemento o contenedor en el navegador con datos sintéticos. Método locator screenshot registrado en closeups.json; no se alteraron cifras ni contenido. Ver captura completa en evidence.','Caption')]
    if not DATA.get('baseline') or not DATA.get('after'): return []
    before=DATA['baseline'].get('screens',[]); after=DATA['after'].get('screens',[])
    preferred={'Sensorial':['patient-home','patient','home'],'Motora':['patient-treatment','patient-home','home'],'Cognitiva':['patient-measure-error','measurement-error','patient-measure','measure']}.get(category,[])
    pair=None
    for token in preferred:
        a=next((s for s in before if token in s.get('id','') and shot(s,'baseline')),None)
        b=next((s for s in after if token in s.get('id','') and shot(s,'after')),None)
        if a and b: pair=(a,b);break
    if not pair:
        for a in before:
            b=next((s for s in after if s.get('id')==a.get('id')),None)
            if b and shot(a,'baseline') and shot(b,'after'):pair=(a,b);break
    if not pair:return []
    images=[]
    for s,phase in zip(pair,['baseline','after']):
        path=shot(s,phase);iw,ih=ImageReader(str(path)).getSize();scale=min(226/iw,225/ih)
        images.append(Image(str(path),width=iw*scale,height=ih*scale))
    return [Table([[p('Antes v2.0','Caption'),p('Después v3.0','Caption')],images],colWidths=[240,241]),p('Capturas técnicas locales con datos sintéticos. '+pair[0].get('id','')+'; ver rutas originales y configuración en evidence. Las miniaturas no sustituyen las capturas completas.','Caption')]

def report():
    if DATA.get('revision')=='current-2026-11-03':
        from current_delivery_pdf import report_current
        return report_current(globals())
    st=[]; base=audit_summary(DATA.get('baseline'));after=audit_summary(DATA.get('after'))
    page(st,'Accesibilidad de CONTIGO',[
        Spacer(1,24),p('Auditoría WCAG 2.1 AA y rediseño inclusivo','Title'),
        p('Interacción Hombre Máquina<br/>APF3<br/>Caso de estudio Clínica San Pablo'),Spacer(1,26),
        table([['Integrantes','Sección'],['Julio Rodrigo Minaya Urdanivia\nAndres Benjamin Puma Parave\nGerson David Vega Cisneros','35145']],[350,131]),
        Spacer(1,16),p('Docente Richard Enrique Caman Sanchez<br/>Grupo '+clean(DATA['group'])+'<br/>Fecha de revisión '+DATA['date']),
        Spacer(1,22),p('Este informe documenta el trabajo técnico disponible y distingue las comprobaciones ejecutadas de la validación pendiente con personas. El objetivo es ampliar el acceso al registro de tomas, al SOS de demostración y al seguimiento del cuidador.'),
        p('Estado de entrega: revisión técnica parcial. Hay recorridos técnicos con teclado, zoom nativo y NVDA real. Faltan Figma publicado, Stark, lectura completa de valores del cuidador con NVDA y sesiones con participantes.')])
    page(st,'1 Contexto alcance y objetivo',[
        p('CONTIGO continúa el caso del APF1 y el prototipo del APF2. La clínica es la fuente de prescripciones, horarios y citas. El paciente declara sus tomas y registra mediciones domésticas. El cuidador consulta el seguimiento y registra movimientos de existencias sin prescribir ni responder por el paciente.'),
        p('La auditoría busca identificar barreras para personas con baja visión, dificultades motoras, menor alfabetización digital o uso de tecnologías de apoyo. La separación por roles se conserva para reducir decisiones ajenas a cada tarea.'),
        h('Alcance del recorrido'),
        table([['Rol','Pantallas y estados'],['Paciente','Inicio, tratamiento, medición, citas, mi salud y cuidador. Carga, vacío, error y confirmación cuando sean alcanzables.'],['Cuidador','Resumen, medicamentos y existencias, mediciones, citas y preferencias. Se registran por separado las pantallas realmente auditadas.']],[90,391]),
        h('Tareas conservadas y tarea nueva'),
        table([['Tarea','Resultado verificable']]+[[x['id']+' '+x['role'],x['success']] for x in DATA['tasks']],[95,386]),
        p('El nivel objetivo es WCAG2.1 AA. Se consideran sus50 criterios A/AA, con evaluación individual de los26 criterios núcleo de la consigna. El tamaño44x44px pertenece a2.5.5 AAA en WCAG2.1 y se adopta como buena práctica. La meta64px de los botones principales procede del proyecto.','Small')])
    page(st,'2 Línea base y método',[
        p('La versión base queda fijada en el commit4656d72365080d18b267f69d565e4d77a7ae3d56. La evaluación técnica compara esa copia con los archivos modificados de v3.0. Cada ejecución registra URL local, fecha, herramientas, tamaño de ventana y capturas. Los datos mostrados pertenecen a la demostración sintética.'),
        h('Qué se hereda del APF2'),
        table([['Dato del documento previo','Tratamiento en APF3'],['T1 iterada4.65s y T2 SOS2.05s','Ejemplos simulados. Se conservan como antecedente, no como línea base empírica.'],['SUS95.83 sobre100','Media de una matriz simulada de tres perfiles. No se presenta como satisfacción de usuarios reales.'],['T3 consulta de tratamiento existencias y cita','Sin medición documentada. Debe ejecutarse en ambas versiones antes de comparar.']],[220,261]),
        h('Triangulación'),
        p('El método combina axe, revisión de DOM y CSS, teclado, zoom nativo y un recorrido técnico con NVDA2026.3. El teclado ejecutó T1 a T4 mediante teclas del navegador. El zoom real se verificó por chrome.tabs.getZoom de1 a2 a1, con fuente raíz constante y DPR de1 a2. El estrés CSS se conserva como prueba distinta.'),
        p('NVDA registró22 acciones y63 anuncios reales: T1, T2 y T4 cubiertas técnicamente, T3 solo navegación y encabezados. La prueba dirigió el foco programáticamente y no valida descubrimiento autónomo ni escucha acústica. Stark y las sesiones con personas permanecen pendientes.','Small'),
        table([['Escala','Regla'],['Severidad S','4 bloquea;3 requiere ayuda o rodeo costoso;2 dificultad menor;1 mejora.'],['Alcance A','3 patrón global o flujo crítico;2 varias pantallas;1 elemento aislado.'],['Prioridad SxA','Alta8 a12; media4 a7; baja1 a3. Resolver todas las altas y al menos70% de medias o documentar plan.']],[110,371]),
        p('Una herramienta sin infracciones detectadas no acredita conformidad del criterio completo. La matriz conserva la evidencia parcial y los pendientes de revisión. No se asignan tiempos ni errores de usuarios a las ejecuciones automáticas.')])
    page(st,'3 Resultados técnicos de la auditoría',[
        p('La tabla resume las ejecuciones disponibles en los archivos JSON de evidencia. Una incidencia de regla puede afectar varios nodos y repetirse entre pantallas. Estos conteos no representan criterios WCAG únicos ni participantes.'),
        table([['Medida','v2.0','v3.0'],['Pantallas o estados registrados',base['screens'],after['screens']],['Incidencias de reglas axe',base['rules'],after['rules']],['Nodos señalados por axe',base['nodes'],after['nodes']],['Reglas indeterminadas que requieren revisión',sum(len(s.get('axe',{}).get('incomplete',[])) for s in (DATA.get('baseline') or {}).get('screens',[])),sum(len(s.get('axe',{}).get('incomplete',[])) for s in (DATA.get('after') or {}).get('screens',[]))]],[275,103,103]),
        h('Cobertura por principio'),
        table([['Principio','Criterios A/AA','Núcleo','Situación de la verificación']]+[[pr,sum(x['principle']==pr for x in DATA['criteria']),sum(x['principle']==pr and x['core'] for x in DATA['criteria']),'Parcial. Revisar evidencia por pantalla y pendientes en XLSX.'] for pr in ['Perceptible','Operable','Comprensible','Robusto']],[95,75,60,251]),
        h('Interpretación'),
        p('El análisis automático aporta evidencia sobre contraste, etiquetas y estructura. Las tres incidencias indeterminadas actuales son de contraste: siete nodos del acceso, uno en una confirmación y21 etiquetas de gráficas. No son29 incumplimientos.'),
        p('Un recorrido independiente midió43 nodos de esas familias, incluidos elementos adicionales:31 superan un límite conservador calculado con colores reales y sondas del fondo renderizado;12 quedan inconclusos. Las sondas y los originales están separados en evidence/contrast-review. Estos conteos no se restan de los nodos axe y no acreditan contraste global.','Small'),
        p('La matriz XLSX contiene una fila por criterio y pantalla, con nivel, aplicabilidad, método, estado, evidencia, severidad, alcance, prioridad y ajuste. Los criterios que no se puedan verificar permanecen pendientes. Los casos sin contenido multimedia no se confunden con resultados aprobados de pruebas de subtítulos.'),
        p('Consulte evidence/baseline/audit.json y evidence/after/audit.json para los datos originales y las capturas completas. Si una ejecución falta o falla, se informa como ausencia de evidencia, no como cero incumplimientos.','Small')])
    # Verified findings are kept verbatim in evidence. Source risks stay labelled observations.
    findings=DATA.get('findings',[])
    if isinstance(findings,dict): findings=findings.get('findings',[])
    rows=[['ID y criterio','Barrera y evidencia','Prioridad']]
    for x in sorted(findings,key=lambda f:f.get('priority',0),reverse=True)[:10]:
        rows.append([str(x.get('id',''))+' '+', '.join(x.get('criteria',[])),str(x.get('title',x.get('description',x.get('finding',''))))[:260],str(x.get('priority',''))+' '+str(x.get('priorityLabel','')) ])
    if len(rows)==1:
        rows += [['R01 1.4.3 y1.4.11','Colores y bordes requieren medición de contraste en los dos modos y en sus estados. Observación de código, pendiente de cierre.','Por asignar con evidencia'],['R02 1.4.4 y1.4.10','Tamaños fijos y altura móvil requieren prueba de ampliación y reajuste. Observación de código.','Por asignar con evidencia'],['R03 2.4.3 y2.4.7','Cambio de vista, diálogos y retorno del foco requieren recorrido completo.','Por asignar con evidencia'],['R04 3.3.1 y3.3.4','Registro de mediciones y SOS necesitan verificación de error, revisión y cancelación.','Por asignar con evidencia']]
    page(st,'3 Hallazgos y perfiles afectados',[
        p('Cada hallazgo debe enlazar una captura o un registro técnico con el criterio afectado. La prioridad se justifica por el impacto sobre la tarea y por el número de pantallas que comparten el patrón.'),table(rows,[118,275,88]),
        h('Perfiles en riesgo'),
        p('Baja visión: contraste, ampliación y foco. Movilidad reducida o teclado: alcance de controles, secuencia y cancelación. Dificultades cognitivas o menor experiencia digital: instrucciones, identificación de errores y comprensión del resultado. Uso sin audio: mensajes visibles equivalentes.'),
        p('No se atribuyen dificultades observadas a participantes que todavía no han realizado una sesión. La severidad técnica inicial puede cambiar al obtener evidencia del recorrido con personas. El objetivo de cerrar los diez hallazgos más graves exige registrar su identificación, prioridad y nueva prueba en el anexo.')])
    for cat in ['Sensorial','Motora','Cognitiva']:
        adjustments=[x for x in DATA['adjustments'] if x.get('category')==cat]
        items=[p('La trazabilidad relaciona la barrera inicial, los criterios y el cambio propuesto o implementado. Su cierre requiere comprobar el comportamiento final y conservar la evidencia antes y después.')]
        items.append(table([['Ajuste y criterio','Cambio y comprobación']]+[[x['id']+' '+x['criteria'],x['change']+' '+x['verify']] for x in adjustments[:4]],[128,353]))
        items.extend(paired_shots(cat))
        items.append(p('El estado de cada ajuste y sus dos referencias de evidencia aparecen en la hoja Trazabilidad. Se incluye un paquete local de plugin para generar las seis páginas, componentes y anotaciones en Figma. Falta ejecutarlo en un archivo nativo, revisar el prototipo, aplicar Stark y publicar el enlace.','Small'))
        page(st,'4 Ajustes '+{'Sensorial':'sensoriales','Motora':'motores','Cognitiva':'cognitivos'}[cat],items)
    page(st,'5 Validación inclusiva',[
        p('No se han aportado consentimientos ni registros de sesiones del APF3. Por ello no se calculan tasas de éxito, tiempos medios, SEQ ni SUS de v3.0. La validación con participantes permanece sin ejecutar y no se infiere de pruebas de software.'),
        h('Diseño previo a las sesiones'),
        p('Se requieren al menos cinco participantes que cubran tres perfiles. Para la banda Excelente de la rúbrica, al menos dos deben tener una condición real o utilizar habitualmente una tecnología de apoyo. Cada persona puede participar sin revelar un diagnóstico. Las simulaciones se registran como simulaciones.'),
        table([['Elemento','Regla propuesta a fijar antes de comenzar'],['Hipótesis','Éxito autónomo al menos80% por tarea y perfil y SUS al menos68. Son metas de trabajo, no resultados.'],['Diseño','Comparación dentro del mismo rol, caso y dispositivo. Alternar orden v2.0/v3.0 cuando ambas condiciones permitan la misma tarea.'],['Cronometraje','Iniciar al acabar la consigna y detener al cumplir el cierre. Registrar ayuda, pausas, fallos y abandonos aparte. No imponer límite de interacción por accesibilidad.'],['Instrumentos','Pensamiento en voz alta, observación, SEQ1 a7 tras cada tarea y SUS1 a5 tras cada versión.'],['Privacidad','Consentimiento antes de observar o grabar. Separar identidad de resultados y conservar solo datos necesarios.']],[100,381]),
        h('Resultados por participante'),
        p('La hoja Sesiones contiene registros vacíos para P01 aP05. Solo se habilitan métricas cuando existe un intento ejecutado y documentado. Las celdas sin datos permanecen en blanco. No se interpreta una respuesta ausente como cero.'),
        p('La comparación válida con APF2 necesita ejecutar la versión base para las mismas tareas. Las cifras simuladas del informe anterior se mantienen aparte y no se usan para afirmar una mejora causal. Las barreras residuales se registrarán por perfil con severidad y criterio.')])
    page(st,'6 Marco normativo',[
        p('CONTIGO es un prototipo académico basado en el caso de una clínica privada. WCAG2.1 AA se adopta como objetivo técnico de la evaluación. Este trabajo no acredita una representación institucional de la clínica ni certifica sus servicios. Las reglas específicas de entidades públicas se presentan con su ámbito y no como una obligación automática de este prototipo.'),
        table([['Referencia','Aplicación al trabajo'],['WCAG2.1 AA [S01]','Relaciona cada barrera con un criterio verificable. La conformidad AA requiere satisfacer todos los criterios A/AA aplicables y los requisitos generales.'],['Ley29973 y reglamento [S02-S04]','Sustenta igualdad y accesibilidad. Se reconoce la modificación de2026 del Reglamento D.S.002-2014-MIMP.'],['Ley29733 y D.S.016-2024-JUS [S05]','Orienta consentimiento, propósito, minimización y protección de los datos de participantes.'],['Ley28530 y R.SGTD001-2025 [S06-S07]','Contexto peruano de inclusión digital. La resolución2025 aplica a la Administración Pública. La R.M.126-2009-PCM fue derogada por R.M.100-2025-PCM.'],['Convención ONU arts.9 y21 [S08]','Vincula acceso a información, comunicación y tecnologías con autonomía y participación.'],['Section508 [S09]','Referencia internacional para TIC del ámbito federal estadounidense. Incorpora WCAG2.0 A/AA y tiene alcance propio.'],['ISO/IEC40500:2025 [S10]','Referencia internacional que adopta WCAG2.2. El nivel objetivo de esta entrega permanece en WCAG2.1 AA.']],[149,332]),
        p('Vínculo con los ajustes: contraste y alternativas textuales reducen barreras perceptivas; teclado y foco apoyan el acceso motor; identificación de errores y revisión ayudan a proteger la integridad de los datos. Estas relaciones orientan la implementación y deben comprobarse con evidencia de cada criterio.')])
    page(st,'6 Declaración de accesibilidad',[
        p('<b>Estado declarado: parcialmente conforme y evaluación en curso.</b> No se declara Conforme AA. El alcance comprende el flujo web del paciente y las vistas de seguimiento revisadas, versión v3.0 local, a fecha'+DATA['date']+'. El anexo identifica las pantallas y los estados realmente registrados.'),
        p('Métodos disponibles: axe, inspección técnica, teclas del navegador en T1 a T4, zoom nativo real por API y NVDA2026.3 con registros Speaking. NVDA cubrió T1, T2 y T4; T3 solamente navegación y encabezados. Foco programático y ausencia de participantes limitan estas comprobaciones. Las condiciones exactas están en los registros originales.'),
        table([['Principio','Criterios A/AA','Declaración'],['Perceptible',20,'Parcial. Zoom nativo probado; contraste y criterios completos aún requieren cierre.'],['Operable',17,'Parcial. Tareas técnicas de teclado realizadas; falta revisión integral y descubrimiento con lector.'],['Comprensible',10,'Parcial. Errores y confirmaciones anunciados; comprensión con personas pendiente.'],['Robusto',3,'Parcial. NVDA real en flujos probados; lectura completa de valores de T3 pendiente.']],[120,95,266]),
        h('Excepciones y limitaciones'),
        p('Faltan capturas Stark, el enlace público al prototipo Figma verificado, la lectura completa de datos de T3 con NVDA, el cierre de los contrastes inconclusos y las sesiones con participantes. Los datos clínicos son sintéticos. El SOS registra una petición de prueba y no acredita entrega a un servicio real.'),
        h('Canal para reportar barreras'),
        p('Repositorio del proyecto: <link href="https://github.com/julio060606/HOMBRE-MAQUINA-APLIACION-CONTIGO/issues">Canal de barreras en GitHub Issues</link>. Registrar pantalla, versión, tarea, navegador y tecnología de apoyo, evitando datos de salud o información personal. Se comprobó que el repositorio tiene habilitadas las incidencias.'),
        p('Esta declaración describe el estado académico y técnico conocido. No equivale a una certificación formal de conformidad WCAG.')])
    page(st,'7 Conclusiones y plan de cierre',[
        p('El trabajo conserva los roles y las tareas del APF2 e incorpora una evaluación de accesibilidad reproducible. La aplicación y las evidencias técnicas permiten revisar mejoras concretas. La autonomía de usuarios diversos todavía necesita sesiones documentadas, por lo que el objetivo de inclusión validada permanece abierto.'),
        table([['Acción pendiente','Cierre verificable','Responsable'],['Revisar matriz y hallazgos','26 criterios núcleo con evidencia por pantalla. Reflow integral, contrastes inconclusos y revisión de todos los criterios aplicables.','Equipo'],['Completar Figma y Stark','Seis páginas exigidas, kit, anotaciones, ratios, simulaciones y enlace en incógnito.','Equipo de diseño'],['Completar el recorrido con lector','Leer valores de tratamiento, existencias y cita de T3 con NVDA y revisar descubrimiento sin foco programático.','Evaluador'],['Reclutar y validar','Cinco sesiones, tres perfiles, consentimientos, tiempos, errores, SEQ y SUS.','Equipo'],['Cerrar comparaciones','Mismo caso y tarea en v2.0/v3.0, denominadores y barreras residuales.','Analista'],['Preparar sustentación','Demo navegable y ensayo12min más3min de preguntas. Todos los integrantes responden.','Equipo']],[126,275,80]),
        h('Continuidad al Proyecto Final'),
        p('Las barreras residuales y observaciones del APF3 deben pasar al plan de mejora del proyecto. La conexión clínica autorizada, la entrega real de ayuda y las fotografías verificadas de medicamentos mantienen requisitos propios de validación; no se dan por resueltos por el rediseño de accesibilidad.'),
        h('Uso de inteligencia artificial'),
        p('Se utilizó Codex con varios subagentes para apoyar programación, revisión, generación de instrumentos y preparación de documentos. Las herramientas ejecutaron comprobaciones técnicas cuando existen registros. No se generaron participantes, consentimientos, testimonios ni resultados de usabilidad. El equipo debe revisar el contenido, registrar su aporte y cumplir la política de IA del curso.')])
    for chunk in [DATA['sources'][:6],DATA['sources'][6:]]:
        page(st,'Referencias',sum(([p(clean(x['title'])),p(clean(x['url']),'Small'),p(clean(x['use']),'Small'),Spacer(1,8)] for x in chunk),[]))
    return write_pdf('APF3_Grupo'+DATA['group']+'_CONTIGO.pdf',st)

def forms():
    st=[]
    page(st,'Protocolo de validación inclusiva',[
        p('CONTIGO APF3. Instrumento para completar antes y durante sesiones reales. Los campos vacíos no representan datos recogidos.'),
        h('Preparación obligatoria'),
        p('Fijar versiones y caso de prueba, verificar acceso, asignar roles y probar la tecnología de apoyo del participante. Acordar contacto del responsable, plazo de conservación, lugar de almacenamiento y procedimiento de retiro antes de solicitar consentimiento.'),
        table([['Campo','Registro'],['Responsable y contacto','________________________________________'],['Versiones v2.0 yv3.0','________________________________________'],['Fecha y dispositivo','________________________________________'],['Perfil y tecnología usada','________________________________________'],['Datos reales o simulación declarada','________________________________________'],['Orden de versiones y tareas','________________________________________']],[192,289]),
        h('Guion uniforme'),
        p('Estamos evaluando la aplicación. Usaremos datos ficticios. Puede detenerse o pedir una pausa cuando lo desee. No necesita revelar ninguna condición de salud. Mientras realiza la tarea, diga qué busca y qué espera que ocurra. Leeré la consigna y observaré sin indicar dónde pulsar. Si solicita ayuda, la registraré antes de intervenir.'),
        p('Hipótesis a fijar antes: éxito autónomo al menos80% por tarea y perfil y SUS al menos68. Registrar los intentos fallidos y la ayuda por separado. No excluirlos para mejorar las medias. No imponer un límite que impida el uso de tecnología de apoyo.')])
    page(st,'Tareas y reglas de medición',sum(([h(t['id']+' '+t['role']),p(t['instruction']),p('<b>Inicio.</b> '+t['start']),p('<b>Cierre.</b> '+t['success'])] for t in DATA['tasks']),[])+[
        p('Inicio del cronómetro: final de la consigna. Fin: criterio de cierre, abandono o detención. Registrar por separado pausas y ayuda. SEQ: qué tan fácil o difícil resultó la tarea,1 muy difícil a7 muy fácil. SUS después de cada versión, antes de discutir respuestas.')])
    page(st,'Consentimiento informado',[
        p('Estudio académico de accesibilidad de CONTIGO. Completar los datos del responsable y las condiciones de tratamiento antes de presentar esta hoja. No usarla como consentimiento ya otorgado.'),
        p('Se me invita a realizar tareas con información sintética para evaluar una interfaz. Mi participación es voluntaria y puedo pausar o retirarme sin consecuencias. No necesito revelar un diagnóstico. La actividad no presta atención médica ni evalúa mis capacidades.'),
        p('El equipo registrará acciones, tiempos, errores y respuestas de cuestionarios bajo un código. Mis datos de identidad se conservarán por separado. Las capturas se revisarán para evitar información personal. No se grabará audio o vídeo sin mi autorización específica.'),
        table([['Información que debe proporcionar el equipo','Dato'],['Responsable y contacto para consultas o retiro','________________________________'],['Finalidad y uso de resultados','Trabajo académico APF3'],['Lugar de almacenamiento y personas con acceso','________________________________'],['Plazo de conservación y fecha de eliminación','________________________________'],['Cómo solicitar acceso rectificación o retiro','________________________________']],[265,216]),
        Spacer(1,10),p('He recibido una explicación comprensible y puedo hacer preguntas. Autorizo participar: Sí [ ] No [ ].'),
        p('Autorización separada para grabación de audio: Sí [ ] No [ ].<br/>Autorización separada para vídeo o imágenes: Sí [ ] No [ ].<br/>Negarme a grabar no impide mi participación.'),
        p('Código participante __________ Fecha __________<br/>Firma o forma accesible de consentimiento ______________________<br/>Nombre y firma de quien informa ______________________________'),
        p('Conservar el consentimiento original en carpeta privada. Los anexos académicos deben usar una copia anonimizada o un registro de consentimiento sin identidad. Evitar firmas y contactos en un ZIP público.','Small')])
    page(st,'Ficha de observación de una sesión',[
        table([['Campo','Registro'],['Código participante y consentimiento registrado','________________________________________'],['Fecha evaluador versión y orden','________________________________________'],['Dispositivo navegador resolución zoom','________________________________________'],['Perfil tecnología de apoyo experiencia','________________________________________'],['Tarea y pantalla inicial','________________________________________'],['Tiempo total y pausas en segundos','________________________________________'],['Resultado autónomo con ayuda fallo abandono','________________________________________'],['Errores y ayuda solicitada','________________________________________'],['SEQ1 a7 y comentario literal autorizado','________________________________________'],['Barrera criterio severidad evidencia','________________________________________']],[207,274]),
        h('Observación libre'),p('____________________________________________________________________<br/><br/>____________________________________________________________________<br/><br/>____________________________________________________________________<br/><br/>____________________________________________________________________'),
        p('Anotar lo observado sin atribuir diagnósticos ni intenciones. Diferenciar cita literal, interpretación del evaluador y resultado comprobado. Guardar el identificador de captura o registro y la versión.')])
    sus=['Me gustaría utilizar este sistema con frecuencia.','Encontré el sistema innecesariamente complejo.','Me pareció que el sistema fue fácil de usar.','Creo que necesitaría ayuda técnica para usarlo.','Las funciones estaban bien integradas.','Había demasiada inconsistencia en el sistema.','La mayoría de personas aprendería a usarlo muy rápido.','Encontré el sistema muy engorroso de usar.','Me sentí seguro al utilizar el sistema.','Necesité aprender muchas cosas antes de poder usarlo.']
    page(st,'Cuestionario SUS y pregunta SEQ',[
        p('Código __________ Versión __________ Fecha __________<br/>Mantener esta redacción uniforme en todas las sesiones. Responder cada ítem de1 totalmente en desacuerdo a5 totalmente de acuerdo.'),
        table([['Ítem','Enunciado','Respuesta1 a5']]+[[i+1,x,'________'] for i,x in enumerate(sus)],[35,365,81]),
        p('Puntuación SUS: sumar respuesta menos1 en los ítems impares y5 menos respuesta en los pares. Multiplicar la suma por2.5. El resultado va de0 a100 y no es un porcentaje. No calcular si falta algún ítem.'),
        p('SEQ después de cada tarea: En general ¿qué tan difícil o fácil le resultó esta tarea?<br/>1 Muy difícil [ ]2 [ ]3 [ ]4 [ ]5 [ ]6 [ ]7 Muy fácil [ ]'),
        p('La hoja XLSX calcula puntuaciones solo cuando están completas las respuestas. El equipo conserva las fichas originales. El cuestionario acompaña las observaciones, no reemplaza la prueba de accesibilidad.')])
    page(st,'Registro con tecnología de apoyo',[
        p('Una captura del árbol de accesibilidad o una ejecución automática no equivale a escuchar y operar con un lector de pantalla. Registrar la herramienta real, su versión y el recorrido.'),
        table([['Condición','Registro y resultado'],['Teclado','Tab yShift+Tab recorren controles. Enter oEspacio activan. Escape cierra. Foco visible y retorno correcto. Evidencia: __________'],['Zoom nativo200%','Configurar el zoom del navegador. Verificar texto, controles, desplazamiento y recuperación. No sustituir por zoom CSS. Evidencia: __________'],['Lector NVDA u otro','Registrar versión, navegador, modo de navegación y lectura. Revisar nombre, rol, estado, encabezados y errores en T1-T4. Evidencia: __________'],['Uso sin audio','Silenciar y completar T1-T4. Los estados e instrucciones deben ser visibles. Evidencia: __________'],['Stark en Figma','Registrar ratios por pareja y estado. Capturas de protanopia, deuteranopia y tritanopia. Evidencia: __________'],['Orientación y espaciado','Probar vertical horizontal y espaciado requerido sin perder contenido ni funciones. Evidencia: __________']],[132,349]),
        h('Criterio de registro'),p('Por cada barrera anotar pantalla, acción, expectativa, resultado, criterioWCAG, severidad y captura. Una prueba sin fallo detectado cubre únicamente las condiciones ejecutadas. Indicar expresamente lo no evaluado.')])
    page(st,'Guion de sustentación de doce minutos',[
        table([['Bloque','Tiempo','Qué mostrar'],['Contexto y alcance','1min','Caso, roles, perfiles y tareas conservadas.'],['Auditoría','2.5min','Métodos, matriz y tres hallazgos con evidencia.'],['Ajustes','2.5min','Antes/después, criterio y resultado de nueva prueba.'],['Demostración','3min','Modo alto contraste o texto ampliado, teclado, error y recuperación.'],['Validación','2min','Participantes, métricas y barreras. Si falta evidencia declararlo.'],['Conformidad','1min','Estado parcial, excepciones y plan.']],[126,60,295]),
        p('La consigna suma estos bloques a12min. Ensayar con cronómetro e incluir la transición entre integrantes. Reservar otros3min para preguntas.'),
        h('Antes de entregar'),
        p('Verificar enlace Figma en incógnito, matriz con26 criterios núcleo documentados, nueve ajustes con evidencia, solución de prioridades altas, consentimientos anonimizados, métricas completas y declaración deIA. Revisar límites de15 páginas de cuerpo y12 diapositivas.'),
        h('Preguntas de defensa'),
        p('¿Qué tarea impide la barrera y para quién? ¿Por qué asignaron esa severidad? ¿Qué evidencia prueba el criterio? ¿Qué cambió con el ajuste? ¿Qué queda pendiente? ¿Qué datos proceden de personas y cuáles son comprobaciones técnicas o simulaciones?')])
    return write_pdf('APF3_CONTIGO_Instrumentos.pdf' if DATA.get('revision')=='current-2026-11-03' else 'APF3_Protocolo_y_fichas_CONTIGO.pdf',st)

if __name__=='__main__':
    files=[report(),forms()]
    import pypdfium2 as pdfium
    from pypdf import PdfReader
    for f in files:
        doc=pdfium.PdfDocument(str(f)); dest=QA/f.stem;dest.mkdir(exist_ok=True)
        for i in range(len(doc)):
            doc[i].render(scale=1.3).to_pil().save(dest/f'page-{i+1:02d}.png')
        text='\n'.join(x.extract_text() for x in PdfReader(str(f)).pages)
        print(json.dumps({'file':str(f),'pages':len(doc),'characters':len(text)},ensure_ascii=False))
