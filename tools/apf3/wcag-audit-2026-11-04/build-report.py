import json
from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[3]
AUDIT = ROOT / 'output/wcag-audit-2026-11-04'
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads((AUDIT / 'auditoria-datos.json').read_text(encoding='utf-8'))
pdfmetrics.registerFont(TTFont('AuditArial', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('AuditArialBold', 'C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('AuditArial', normal='AuditArial', bold='AuditArialBold')
INK = colors.HexColor('#172B3B')
GREEN = colors.HexColor('#173D35')
MUTED = colors.HexColor('#506472')
RED = colors.HexColor('#8C1638')
LIGHT = colors.HexColor('#F0F5F3')
WIDTH, HEIGHT = A4
CONTENT = WIDTH - 92
styles = {
    'body': ParagraphStyle('Body', fontName='AuditArial', fontSize=10, leading=14.5, textColor=INK, spaceAfter=9),
    'small': ParagraphStyle('Small', fontName='AuditArial', fontSize=8.3, leading=11.2, textColor=MUTED, spaceAfter=6),
    'h1': ParagraphStyle('H1', fontName='AuditArialBold', fontSize=24, leading=28, textColor=GREEN, spaceAfter=14),
    'h2': ParagraphStyle('H2', fontName='AuditArialBold', fontSize=14, leading=18, textColor=GREEN, spaceBefore=11, spaceAfter=8),
    'h3': ParagraphStyle('H3', fontName='AuditArialBold', fontSize=11, leading=15, textColor=INK, spaceAfter=7),
    'cell': ParagraphStyle('Cell', fontName='AuditArial', fontSize=8.7, leading=11.5, textColor=INK),
    'head': ParagraphStyle('Head', fontName='AuditArialBold', fontSize=8.7, leading=11.5, textColor=colors.white),
}
story = []
def para(text, kind='body'):
    return Paragraph(escape(str(text)).replace('\n', '<br/>'), styles[kind])
def p(text, kind='body'):
    story.append(para(text, kind))
def title(number, text):
    p(f'CONTIGO / {number:02d}', 'small')
    p(text, 'h1')
def table(headers, rows, widths, padding=7):
    content = [[para(x, 'head') for x in headers]] + [[para(x, 'cell') for x in row] for row in rows]
    t = Table(content, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREEN),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), padding),
        ('BOTTOMPADDING', (0, 0), (-1, -1), padding),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT]),
        ('LINEBELOW', (0, 0), (-1, 0), .6, GREEN),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))
def br(): story.append(PageBreak())
def source(title, url):
    story.append(Paragraph(f'<link href="{escape(url, quote=True)}" color="#17604C">{escape(title)}</link>', styles['small']))
def finding(identifier): return next(f for f in DATA['findings'] if f['id'] == identifier)
def finding_text(identifier, show_steps=True):
    f = finding(identifier)
    p(f"{f['id']} · {f['title']}", 'h2')
    p(f"{f['criteria']} · S {f['s']} × A {f['a']} = {f['priority']} · Prioridad {f['band'].lower()}", 'small')
    if show_steps: p(f['steps'])
    p(f['observed'])
    p('Corrección propuesta', 'h3')
    p(f['fix'])
    p('Verificación de cierre', 'h3')
    p(f['retest'])
    p('Evidencia ' + f['evidence'], 'small')

title(1, 'Auditoría WCAG 2.1 AA')
p('Aplicación CONTIGO · corte del 4 de noviembre de 2026', 'h3')
p('Se evaluó la aplicación web local que representa la experiencia móvil del paciente y el panel de seguimiento del cuidador, junto con sus páginas públicas.')
table(['Cobertura', 'Resultado'], [
    ['Criterios A y AA', '50 revisados, incluidos los 26 núcleo de APF3'],
    ['Pantallas y estados', '33 con axe, incluidas carga, error, vacío y confirmación'],
    ['Diseño adaptable', '35 variantes de geometría, espaciado y orientación'],
    ['Zoom nativo', '13 capturas al 200 %, verificadas con la API del navegador'],
    ['Hallazgos normativos', '5 abiertos, uno de prioridad alta'],
    ['Automatización', '0 incidencias detectadas por axe y 14 reglas incomplete, con 72 nodos'],
], [165, CONTENT-165])
table(['Estado del criterio', 'Cantidad'], [[key, value] for key, value in DATA['stats']['statuses'].items()], [CONTENT-90, 90])
p('La aplicación todavía presenta barreras de tiempo, actualización automática, foco, identificación de errores y coincidencia de etiquetas. Los resultados de la muestra y las verificaciones pendientes se detallan en la matriz.')
p('Los cinco hallazgos siguen abiertos. Esta auditoría deja propuestas de corrección y pruebas de cierre. La evaluación global de conformidad AA queda pendiente.', 'h3')
source('Referencia normativa del W3C · WCAG 2.1', 'https://www.w3.org/TR/WCAG21/')
br()

title(2, 'Alcance y método')
table(['Experiencia', 'Vistas o estados revisados'], [
    ['Acceso y páginas públicas', 'Login, error de acceso, acceso de cuidador, landing, clínica y ayuda de accesibilidad'],
    ['Paciente', 'Inicio, toma pendiente, error de guardado, carga, error de datos y vacío'],
    ['Mediciones', 'Campos vacíos, error de relación, revisión de presión, confirmación y revisión de peso'],
    ['Ayudas', 'Opciones de lectura, mensaje grande y respuesta escrita'],
    ['SOS', 'Espera y caducidad con borrador, mediante transporte controlado'],
    ['Cuidador', 'Resumen, medicamentos, citas, mediciones, ficha clínica, preferencias e informes'],
    ['Procesos', 'Error y revisión de existencias, vinculación, cambio de ruta lazy y retorno de foco'],
], [140, CONTENT-140])
p(f"Se utilizó Chrome {DATA['browser']} y axe-core {DATA['axe']}. Se inspeccionaron DOM, nombres, relaciones, estados, foco y fuentes. El zoom nativo se ejecutó en un perfil Chromium temporal y se confirmó con chrome.tabs.getZoom.")
p('Se probaron Tab, Enter y Escape en flujos seleccionados. Las variantes de texto se distinguen del zoom nativo. El CSS de espaciado aplicó los cuatro valores del criterio 1.4.12.')
p('Límites de esta ronda', 'h2')
p('Las cuentas son sintéticas. Guardado, error de toma, SOS, carga, error y vacío se reprodujeron con respuestas controladas donde corresponde. La autenticación utiliza el backend local. Las pruebas bloquearon otras escrituras clínicas y verificaron 125 huellas de fuentes sin cambios.')
p('Quedan pendientes la lectura real con NVDA, TalkBack o VoiceOver, el inventario completo de contraste, las pruebas integrales de voz, los dispositivos físicos y Figma/Stark. Las instantáneas ARIA aportan evidencia técnica sin sustituir esa validación.')
p('Los PDF descargables de la aplicación y los documentos del proyecto necesitan evaluación documental propia. La auditoría no incorpora sesiones humanas ni métricas de participantes.')
source('Método de evaluación de conformidad · WCAG-EM', 'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/')
br()

title(3, 'Prioridad alta del SOS')
f = finding('H01')
p('H01 · Tiempo ajustable · 2.2.1 A', 'h2')
p('S 3 × A 3 = 9 · prioridad alta. El servidor fija 30 minutos desde la creación de la sesión. No se encontró aviso previo ni mecanismo de extensión. La caducidad controlada ocultó el campo con el borrador sin enviar.')
p(f['fix'])
p('El cierre debe probar aviso accesible, tiempo suficiente para reaccionar, extensión sencilla repetible y conservación del borrador. La espera de 30 minutos se sustituyó por una transición controlada a ENDED/EXPIRED, contrastada con la lógica del servidor.', 'small')
shots=[]
for filename, label in [('15-sos-waiting.png','Esperando respuesta, antes de caducar'),('16-sos-expired.png','Después de ENDED/EXPIRED')]:
    im=Image(str(AUDIT/'evidence'/filename), width=156, height=384)
    shots.append([im, para(label, 'small')])
photo_table=Table([[shots[0][0],shots[1][0]],[shots[0][1],shots[1][1]]],colWidths=[CONTENT/2,CONTENT/2])
photo_table.setStyle(TableStyle([('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
story.append(photo_table)
p('Evidencia 15-sos-waiting.png, 16-sos-expired.png y audit.json. Fuente SupportSessionService.java, línea 81.', 'small')
source('W3C · Tiempo ajustable', 'https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html')
br()

title(4, 'Actualización y control por voz')
finding_text('H05')
source('W3C · Pausar, detener, ocultar', 'https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html')
finding_text('H02')
table(['Texto visible', 'Nombre accesible actual', 'Ejemplo de corrección'], [['Salir','Cerrar sesión','Salir de CONTIGO']], [120,180,CONTENT-300])
source('W3C · Etiqueta en el nombre', 'https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html')
br()

title(5, 'Foco y errores de formulario')
finding_text('H03')
finding_text('H04')
table(['Campo', 'Valor usado', 'Resultado observado'], [
    ['Cantidad','5','Válido, pero recibe aria-invalid=true y foco'],
    ['Motivo','x','Inválido, sin aria-invalid ni descripción asociada'],
], [92,80,CONTENT-172])
source('W3C · Orden del foco', 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html')
br()

title(6, 'Los 26 criterios núcleo')
p('El Excel incluye 253 filas de trazabilidad por grupos de vistas. Aquí se resume el estado del criterio en el conjunto de la muestra. Las filas parciales mantienen pruebas abiertas.', 'small')
short={'Sin fallo en muestra':'Sin fallo en muestra','Fallo':'Fallo','Parcial':'Parcial','No aplica':'No aplica'}
rows=[]
for c in DATA['criteria']:
    if c['core']:
        ids=' / '.join(f['id'] for f in DATA['findings'] if f['type']=='Fallo WCAG' and f['criteria'].startswith(c['id']))
        rows.append([c['id'],c['name'],short[c['status']],ids or 'Ver matriz'])
table(['Criterio','Nombre','Estado','Referencia'],rows,[53,215,140,CONTENT-408],padding=4)
br()

title(7, 'Comprobaciones y ajustes adicionales')
p('Comprobaciones sin fallo en la muestra', 'h2')
table(['Prueba', 'Resultado observado'], [
    ['Zoom nativo 200 %','Las vistas principales mantuvieron el ancho documental y sus controles sin recortes detectados.'],
    ['Reajuste a 320 CSS px','Los siete módulos del cuidador y el paciente pasaron a escala normal.'],
    ['Espaciado de texto','Se revisaron diez vistas con los valores de WCAG sin pérdida visible detectada.'],
    ['Diálogo de lectura','36 pasos de Tab dentro del diálogo y retorno por Escape.'],
    ['Mediciones','Error identificado, valores conservados al corregir y revisión previa al guardado.'],
    ['Cambio de página','Una ruta lazy demorada actualizó título y foco al encabezado de destino.'],
], [145,CONTENT-145])
p('U01 · Ampliación interna y ancho estrecho', 'h2')
p('Con ventana de 320 píxeles y texto interno al 200 %, Citas alcanza 334 píxeles de ancho y Mediciones 326. Se propone ajustar selectores, márgenes y tamaños mínimos. La condición combina dos ajustes y se conserva como mejora de uso, sin contabilizarla como fallo normativo confirmado.')
p('U02 · Semántica ARIA por revisar', 'h2')
p('Axe dejó tres aria-label sobre div o span genéricos en el portal y el resumen. Se propone retirar nombres redundantes o introducir agrupaciones semánticas cuando sean necesarias. Falta comprobar el efecto con lector antes de atribuir un incumplimiento a esos nodos.')
p('Contraste por completar', 'h2')
p('Los colores calculados, bordes y cadenas de fondos quedan en probes.json. Los 14 resultados incomplete abarcan contraste y ARIA. Se requiere medir todas las combinaciones indeterminadas, selecciones, alto contraste, hover, error y foco. El total de nodos pendientes no se presenta como número de barreras confirmadas.')
br()

title(8, 'Cierre de la auditoría')
p('Plan de corrección y nueva prueba', 'h2')
table(['Orden', 'Trabajo de cierre'], [
    ['1','Resolver H01 y comprobar límite de tiempo, aviso y extensión en servidor y cliente.'],
    ['2','Resolver H05, H02, H03 y H04. Repetir cada reproducción y revisar regresiones en sus vistas.'],
    ['3','Completar contraste y múltiples vías. Validar anuncios, nombres, lectura, foco y flujos completos con tecnologías de apoyo reales.'],
    ['4','Revisar U01 y U02. Verificar navegador, dispositivo y estados de llamada y error adicionales.'],
    ['5','Retomar el Figma parcial, ejecutar Stark y conservar evidencia diferenciada de diseño y código.'],
    ['6','Realizar la validación humana exigida en APF3 con consentimientos y medidas observadas.'],
], [55,CONTENT-55])
p('Se aplicó prioridad S × A. La severidad va de 1 a 4 y el alcance de 1 a 3. Alta comienza en 8, media cubre 4 a 7 y baja llega a 3. Los valores y el estado de cierre son editables en el Excel, con resumen calculado.')
p('Archivos de la evaluación', 'h2')
p('El Excel reúne criterios, trazabilidad, hallazgos, catálogo y método. El paquete de evidencias conserva capturas, JSON de ejecución, datos de esta auditoría y registros de intentos técnicos incompletos. Los intentos incompletos se mantienen identificados y no aumentan la cobertura comunicada.')
p('Esta auditoría fue asistida por IA. El equipo debe revisar las interpretaciones y ejecutar las validaciones humanas y con tecnología de apoyo pendientes. Los hallazgos y el contraste integral requieren cierre antes de declarar conformidad AA.')
p('Fuentes y criterio de aplicación', 'h2')
for name,url,note in DATA['sources']:
    if url.startswith('https://'):
        source(name,url)
p('La consigna APF3 aportó el conjunto de 26 criterios núcleo y la escala de priorización. Se conserva 4.1.1 para completar los 50 criterios de WCAG 2.1 con su tratamiento actualizado. La llamada de solo audio no se presenta como vídeo sincronizado para aplicar 1.2.4.', 'small')

class NumberedCanvas(canvas.Canvas):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs);self.pages=[]
    def showPage(self):
        self.pages.append(dict(self.__dict__));self._startPage()
    def save(self):
        total=len(self.pages)
        for state in self.pages:
            self.__dict__.update(state)
            self.setStrokeColor(colors.HexColor('#D8E3DE'));self.setLineWidth(.5);self.line(46,40,WIDTH-46,40)
            self.setFont('AuditArial',8);self.setFillColor(MUTED)
            self.drawString(46,26,'CONTIGO · Auditoría técnica · 04/11/2026')
            self.drawRightString(WIDTH-46,26,f'{self._pageNumber} / {total}')
            super().showPage()
        super().save()

target=OUT/'CONTIGO_Auditoria_WCAG_2.1_AA_2026-11-04.pdf'
doc=SimpleDocTemplate(str(target),pagesize=A4,leftMargin=46,rightMargin=46,topMargin=44,bottomMargin=54,title='CONTIGO — Auditoría WCAG 2.1 AA — 2026-11-04',author='Equipo CONTIGO · auditoría técnica asistida por IA')
doc.build(story,canvasmaker=NumberedCanvas)
print(target)
