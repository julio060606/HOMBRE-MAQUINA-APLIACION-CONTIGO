"""Generate APF3 content from actual evidence. No participant data are synthesized."""
from pathlib import Path
import json
import datetime

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'apf3'
OUT.mkdir(parents=True, exist_ok=True)
TODAY = datetime.date.today().isoformat()

CORE = set('1.1.1 1.3.1 1.3.4 1.3.5 1.4.1 1.4.3 1.4.4 1.4.10 1.4.11 1.4.12 1.4.13 2.1.1 2.2.1 2.4.3 2.4.7 2.5.1 2.5.3 3.1.1 3.2.3 3.2.4 3.3.1 3.3.2 3.3.3 3.3.4 4.1.2 4.1.3'.split())
RAW = '''1.1.1|Contenido no textual|A
1.2.1|Solo audio y solo vídeo pregrabado|A
1.2.2|Subtítulos pregrabados|A
1.2.3|Audiodescripción o alternativa multimedia|A
1.2.4|Subtítulos en directo|AA
1.2.5|Audiodescripción pregrabada|AA
1.3.1|Información y relaciones|A
1.3.2|Secuencia significativa|A
1.3.3|Características sensoriales|A
1.3.4|Orientación|AA
1.3.5|Identificar el propósito de la entrada|AA
1.4.1|Uso del color|A
1.4.2|Control del audio|A
1.4.3|Contraste mínimo|AA
1.4.4|Cambio de tamaño del texto|AA
1.4.5|Imágenes de texto|AA
1.4.10|Reajuste del contenido|AA
1.4.11|Contraste no textual|AA
1.4.12|Espaciado del texto|AA
1.4.13|Contenido con hover o foco|AA
2.1.1|Teclado|A
2.1.2|Sin trampas para el foco del teclado|A
2.1.4|Atajos de teclas de caracteres|A
2.2.1|Tiempo ajustable|A
2.2.2|Pausar detener ocultar|A
2.3.1|Tres destellos o por debajo del umbral|A
2.4.1|Evitar bloques|A
2.4.2|Titulado de páginas|A
2.4.3|Orden del foco|A
2.4.4|Propósito de los enlaces en contexto|A
2.4.5|Múltiples vías|AA
2.4.6|Encabezados y etiquetas|AA
2.4.7|Foco visible|AA
2.5.1|Gestos del puntero|A
2.5.2|Cancelación del puntero|A
2.5.3|Etiqueta en el nombre|A
2.5.4|Activación mediante movimiento|A
3.1.1|Idioma de la página|A
3.1.2|Idioma de las partes|AA
3.2.1|Al recibir el foco|A
3.2.2|Al recibir entradas|A
3.2.3|Navegación consistente|AA
3.2.4|Identificación consistente|AA
3.3.1|Identificación de errores|A
3.3.2|Etiquetas o instrucciones|A
3.3.3|Sugerencia ante errores|AA
3.3.4|Prevención de errores en datos|AA
4.1.1|Procesamiento|A
4.1.2|Nombre función valor|A
4.1.3|Mensajes de estado|AA'''

CRITERIA = []
for row in RAW.splitlines():
    cid, name, level = row.split('|')
    CRITERIA.append(dict(id=cid, name=name, level=level, core=cid in CORE,
        principle=['Perceptible','Operable','Comprensible','Robusto'][int(cid[0])-1]))
assert len(CRITERIA) == 50 and len(CORE) == 26

SOURCES = [
 {'id':'S01','title':'W3C (2025). Web Content Accessibility Guidelines WCAG 2.1. Recomendación de 6 de mayo de 2025.','url':'https://www.w3.org/TR/WCAG21/','use':'Criterios, umbrales y requisitos de conformidad AA.'},
 {'id':'S02','title':'Congreso de la República (2012). Ley 29973 Ley General de la Persona con Discapacidad.','url':'https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales/211941-29973','use':'Marco de derechos y eliminación de barreras.'},
 {'id':'S03','title':'CONADIS (2024). Ley General de la Persona con Discapacidad y su Reglamento.','url':'https://www.gob.pe/institucion/conadis/informes-publicaciones/223512-ley-general-de-la-persona-con-discapacidad-y-su-reglamento','use':'Reglamento D.S.002-2014-MIMP, leído con modificaciones posteriores.'},
 {'id':'S04','title':'MIMP (2026). Decreto Supremo 001-2026-MIMP.','url':'https://www.gob.pe/institucion/mimp/normas-legales/7984297-001-2026-mimp','use':'Actualiza el Reglamento de la Ley 29973. No sustituye la auditoría WCAG.'},
 {'id':'S05','title':'El Peruano. Ley 29733 y Reglamento D.S.016-2024-JUS.','url':'https://diariooficial.elperuano.pe/Normas/obtenerDocumento?idNorma=23','use':'Consentimiento, finalidad, minimización y protección de los datos del estudio.'},
 {'id':'S06','title':'PCM (2025). Resolución 001-2025-PCM/SGTD.','url':'https://busquedas.elperuano.pe/dispositivo/NL/2412980-1','use':'Lineamiento actual para servicios digitales de la Administración Pública. Documenta derogación de R.M.126-2009-PCM por R.M.100-2025-PCM.'},
 {'id':'S07','title':'Ministerio de Educación (2005). Ley 28530.','url':'https://www.gob.pe/institucion/minedu/normas-legales/118388-28530','use':'Referencia peruana sobre promoción del acceso a internet para personas con discapacidad.'},
 {'id':'S08','title':'Naciones Unidas (2006). Convención sobre los Derechos de las Personas con Discapacidad.','url':'https://www.un.org/disabilities/documents/convention/convention_accessible_pdf.pdf','use':'Artículos 9 y 21, acceso a información y comunicación.'},
 {'id':'S09','title':'U.S. Access Board (2017). Revised 508 Standards and 255 Guidelines.','url':'https://www.access-board.gov/ict/','use':'Referencia internacional de contratación pública federal estadounidense, incorpora WCAG 2.0 A/AA. No es obligación automática del prototipo peruano.'},
 {'id':'S10','title':'W3C (2025). WCAG 2.2 approved as ISO/IEC international standard.','url':'https://www.w3.org/press-releases/2025/wcag22-iso-pas/','use':'Referencia ISO/IEC40500:2025 adopta WCAG2.2, no confundir con objetivo WCAG2.1 de la consigna.'},
 {'id':'S11','title':'Equipo CONTIGO (2026). CONTIGO AVANCE 2 ACTUALIZADO.','url':'CONTIGO_AVANCE_2_ACTUALIZADO.docx','use':'Documento aportado por el equipo. T1 media iterada4.65s, T2 2.05s y SUS95.83 son simulaciones, no datos de participantes.'},
 {'id':'S12','title':'UTP (2026). Consigna APF3 Interacción Hombre Máquina.','url':'Consigna APF3 — Interacción Hombre Máquina.pdf','use':'Requisitos académicos: 26 núcleo, 9 ajustes, 5 participantes, Figma y límites de entrega.'},
]

TASKS = [
 {'id':'T1','role':'Paciente','instruction':'Imagine que ya tomó Losartán 50 mg de las 08:00. Registre esa respuesta.','success':'La dosis correcta queda respondida y la persona identifica el estado guardado.','start':'Inicio paciente, dosis sin responder.','checks':'Nombre, dosis, hora, confirmación y posibilidad de corregir.'},
 {'id':'T2','role':'Paciente','instruction':'Imagine que necesita pedir ayuda. Localice el SOS de prueba y explique su confirmación.','success':'Completa el flujo de demostración y distingue registro de solicitud de entrega efectiva.','start':'Una vista acordada del paciente. Mantener la misma en ambas versiones.','checks':'Encontrar SOS, leer alcance, confirmar o cancelar y explicar estado.'},
 {'id':'T3','role':'Cuidador','instruction':'Revise el tratamiento e indique las unidades disponibles y cuándo es la próxima cita.','success':'Los tres datos coinciden con el caso sintético y se reconoce la procedencia.','start':'Resumen del cuidador, mismo paciente seleccionado.','checks':'Tratamiento, existencias, cita, fecha y fuente.'},
 {'id':'T4','role':'Paciente','instruction':'Registre una presión con un campo vacío. Explique el error, corríjalo usando su ficha sintética y revise antes de guardar.','success':'Localiza el campo y su sugerencia, corrige, revisa y guarda una sola vez.','start':'Formulario de medición vacío. Usar ficha de prueba 120/80, pulso no registrado.','checks':'Error asociado, foco, valor conservado, revisión y mensaje de guardado.'},
]

ADJUSTMENTS = [
 {'id':'A01','category':'Sensorial','criteria':'1.4.3, 1.4.11','before':'Colores y bordes de poco contraste y filtro de contraste general.','change':'Definir colores de texto, superficies, bordes y foco para modos estándar y alto contraste.','file':'frontend/src/styles/index.css','verify':'Ratios medidos por pareja en ambos modos y estados. Stark queda por ejecutar.'},
 {'id':'A02','category':'Sensorial','criteria':'1.4.4, 1.4.10, 1.4.12','before':'Textos de tamaño fijo y contenedor móvil de altura rígida.','change':'Escalar texto y permitir reajuste del contenido sin perder controles.','file':'frontend/src/styles/index.css','verify':'Capturas de anchos reducidos, texto ampliado y espaciado. Zoom nativo200% requiere recorrido registrado.'},
 {'id':'A03','category':'Sensorial','criteria':'1.1.1, 1.3.1, 4.1.3','before':'Síntesis de voz opcional con información visual y semántica incompleta.','change':'Mantener texto de las alertas, alternativas de imágenes y estados anunciables.','file':'frontend/src/features/patient-app/PatientAppContent.tsx','verify':'Inspección DOM y prueba sin audio. Lectura real con NVDA pendiente.'},
 {'id':'A04','category':'Motora','criteria':'2.1.1, 2.4.1, 2.4.3, 2.4.7','before':'Foco genérico y sin salto al contenido principal.','change':'Salto al contenido, foco visible consistente y gestión del foco en navegación y diálogos.','file':'frontend/src/App.tsx','verify':'Secuencia Tab/Shift+Tab, Enter, Escape y retorno del foco.'},
 {'id':'A05','category':'Motora','criteria':'2.5.1, 2.5.3; buena práctica 2.5.5 AAA','before':'Botones de dosis con mínimo52px y controles auxiliares pequeños.','change':'Ampliar controles y conservar nombre accesible consistente con texto visible.','file':'frontend/src/features/patient-app/DoseCard.tsx','verify':'Medición geométrica. Objetivo44x44px, principales64px como meta del proyecto.'},
 {'id':'A06','category':'Motora','criteria':'2.1.1, 2.4.3, 3.2.3','before':'SOS solamente dentro de Inicio, requiere desplazamiento.','change':'Hacer accesible el SOS desde todas las vistas del paciente y mediante teclado.','file':'frontend/src/features/patient-app/PatientAppContent.tsx','verify':'Recorrido de cada pestaña, sin pérdida de foco ni solapamientos.'},
 {'id':'A07','category':'Cognitiva','criteria':'3.3.1, 3.3.2, 3.3.3','before':'Formulario con términos clínicos y recuperación por campo.','change':'Explicar unidades, identificar errores y dar una sugerencia junto al campo.','file':'frontend/src/features/patient-app/MeasurementForm.tsx','verify':'Vacío, formato inválido, corrección y conservación de valores.'},
 {'id':'A08','category':'Cognitiva','criteria':'3.3.4, 4.1.3','before':'Registro directo de medición sin paso de revisión.','change':'Separar ingreso, revisión y confirmación, con opción de volver y corregir.','file':'frontend/src/features/patient-app/MeasurementForm.tsx','verify':'Flujo T4 de error a guardado, solo una medición registrada.'},
 {'id':'A09','category':'Cognitiva','criteria':'3.3.4, 4.1.3','before':'SOS registra solicitud con un único clic.','change':'Explicar alcance del SOS y ofrecer confirmación o cancelación antes del registro.','file':'frontend/src/features/patient-app/PatientAppContent.tsx','verify':'Cancelar no crea evento; confirmar muestra registro sin prometer entrega.'},
 {'id':'A10','category':'Cognitiva','criteria':'3.2.3, 3.2.4, 4.1.2','before':'Preferencias fuera del recorrido móvil principal.','change':'Exponer ajustes de lectura, contraste y voz desde la app del paciente.','file':'frontend/src/features/patient-app/PatientAppContent.tsx','verify':'Nombre, estado y persistencia de preferencias.'},
 {'id':'A11','category':'Motora','criteria':'2.1.1, 2.4.3, 4.1.2','before':'Diálogos y formularios requieren revisar captura y devolución de foco.','change':'Proveer diálogo semántico y cierre por Escape con retorno al activador.','file':'frontend/src/components','verify':'Apertura, ciclo de foco, Escape, cancelación y regreso.'},
 {'id':'A12','category':'Sensorial','criteria':'1.4.1, 1.3.1, 4.1.3','before':'Estados de dosis usan color y texto en componentes dispersos.','change':'Identificar los estados con texto y mantener confirmaciones visibles.','file':'frontend/src/features/patient-app/DoseCard.tsx','verify':'Recorrido sin audio y simulaciones sensoriales de Stark pendientes.'},
]

def load_json(p):
    try:
        return json.loads(p.read_text(encoding='utf-8-sig'))
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def generate():
    baseline=load_json(OUT/'evidence/baseline/audit.json')
    after=load_json(OUT/'evidence/after/audit.json')
    findings=load_json(OUT/'findings.json') or load_json(OUT/'evidence/findings.json') or load_json(OUT/'evidence/verified-findings.json') or []
    override=load_json(OUT/'changes.json')
    if isinstance(override,dict):
        override=override.get('adjustments')
    changes=override or [dict(x) for x in ADJUSTMENTS if x['id']!='A12']
    evidence_pairs={
      'A01':('02-patient-home.png','02-patient-home.png','Implementado. Contraste automático sin fallos en capturas; Stark y revisión completa pendientes.'),
      'A02':('26-nav320-detail.png','26-nav320-detail.png','Reajuste verificado a 320 px CSS. Ampliación completa y zoom nativo pendientes.'),
      'A03':('29-input-boundaries.png','29-input-boundaries.png','Bordes de campos inspeccionados: 1.48:1 antes y 4.76:1 después. No cubre todos los componentes.'),
      'A04':('17-caregiver-dashboard-keyboard.png','17-caregiver-dashboard-keyboard.png','Mecanismo de salto implementado. Completar recorrido manual de foco en todas las superficies.'),
      'A05':('01-login.png','01-login.png','Objetivo de contraseña ampliado de 18x18 px a 44x44 px. Revisar enlaces secundarios.'),
      'A06':('04-patient-measurement.png','04-patient-measurement.png','SOS visible en vistas del paciente inspeccionadas. Comprensión con participantes pendiente.'),
      'A07':('05-measurement-error.png','05-measurement-error.png','Errores y sugerencias implementados. Flujo técnico registrado; validación con participantes pendiente.'),
      'A08':('04-patient-measurement.png','06-measurement-review.png','Paso de revisión y guardado técnico registrado. Comprensión de unidades pendiente.'),
      'A09':('14-sos-recorded.png','13-sos-review.png','Confirmación y cancelación implementadas. No acredita entrega real de ayuda.'),
      'A10':('02-patient-home.png','02-patient-home.png','Preferencias y controles directos implementados. Verificar persistencia y uso con lector.'),
      'A11':('30-revoke-review.png','30-revoke-review.png','Confirmación del retiro implementada como revisión en línea. Probar cancelación y retorno del foco.')}
    for change in changes:
        if change['id']=='A03':
            change.update(criteria='1.4.11',before='Bordes de campos #cbd5e1 sobre blanco, contraste 1.48:1.',change='Distinguir los límites de los campos con bordes #64748b sobre blanco, contraste 4.76:1.',file='frontend/src/styles/index.css',verify='CSS medido y cálculo sRGB. Comprobar los demás componentes y modos.')
        if change['id']=='A11':
            change.update(change='Revisar el retiro de acceso del cuidador antes de confirmarlo, con cancelación visible.',file='frontend/src/features/patient-app/PairingPanel.tsx',verify='Retiro, revisión, cancelación y conservación de los registros. No se presupone que sea un diálogo modal.')
        pair=evidence_pairs.get(change['id'])
        if pair:
            change['beforeEvidence']='output/apf3/evidence/baseline/'+pair[0]
            change['afterEvidence']='output/apf3/evidence/after/'+pair[1]
            change['status']=pair[2]
    data={'date':TODAY,'group':'PorConfirmar','criteria':CRITERIA,'sources':SOURCES,'tasks':TASKS,
          'adjustments':changes,'baseline':baseline,'after':after,'findings':findings,
          'participants':[], 'status':{'figma':'Pendiente de archivo nativo y enlace público verificado',
          'stark':'Pendiente de ejecución en Figma con capturas y ratios',
          'screenReader':'Pendiente de recorrido registrado con NVDA u otro lector',
          'participants':'No ejecutado. Faltan sesiones y consentimientos',
          'zoom':'Pendiente de verificación de zoom nativo del navegador al200%'}}
    data['codeReview']=load_json(OUT/'evidence/code-review.json') or {}
    data['technical']={
        'keyboard':load_json(OUT/'evidence/keyboard-tasks/keyboard-tasks.json'),
        'nvda':load_json(OUT/'evidence/nvda/summary.json'),
        'nativeZoom':load_json(OUT/'evidence/native-zoom/verified-native-api-final/native-zoom.json'),
        'contrast':load_json(OUT/'evidence/contrast-review/results.json'),
    }
    if data['technical']['keyboard']:
        data['status']['keyboard']='T1 a T4 ejecutadas técnicamente con Tab, Mayús+Tab, Enter, Espacio y escritura; no son resultados de participantes.'
    if data['technical']['nvda']:
        data['status']['screenReader']='NVDA 2026.3 real: 22 acciones y 63 anuncios registrados. T1, T2 y T4 cubiertos técnicamente. T3 solo navegación y encabezados; lectura completa de valores pendiente. Foco programático, sin juicio acústico ni participantes.'
    if data['technical']['nativeZoom']:
        data['status']['zoom']='Zoom nativo del navegador verificado por chrome.tabs.getZoom: 1 a 2 a 1, sin zoom CSS. Recorridos técnicos T1 a T4 al 200%, en un perfil aislado de Chromium con viewport de escritorio. Criterios completos y participantes pendientes.'
    for change in data['adjustments']:
        if change['id']=='A02' and data['technical']['nativeZoom']:
            change['status']='Escalado 16 a 32 px y zoom nativo por API verificados en recorridos técnicos T1 a T4. Reflow integral en todo el alcance y validación con personas pendientes.'
            change['verify']='Ver evidence/native-zoom/verified-native-api-final/native-zoom.json y supplemental.json. Mantener separados estrés CSS y zoom nativo.'
        if change['id']=='A04' and data['technical']['keyboard']:
            change['status']='T1 a T4 ejecutadas con teclado real del navegador. Conservar revisión global de todos los controles y el recorrido de descubrimiento con lector.'
        if change['id'] in ['A07','A08'] and data['technical']['nvda']:
            change['status']='Error, revisión y confirmación de T4 registrados con NVDA real. El foco se controló técnicamente; comprensión con participantes pendiente.'
        if change['id']=='A09' and data['technical']['keyboard']:
            change['status']='T2 canceló sin crear alerta y confirmó una alerta de prueba usando teclado; el diálogo y el resultado se anunciaron en NVDA. No acredita entrega real ni comprensión.'
    if (OUT/'figma/CONTIGO_APF3_Figma.zip').exists():
        data['status']['figma']='Paquete local de plugin generador disponible. Falta ejecutarlo en Figma, revisar páginas y publicar el enlace.'
    config=load_json(OUT/'team.json')
    if config:
        data.update(config)
    (OUT/'deliverables-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    return data

if __name__=='__main__':
    data=generate()
    print(json.dumps({'criteria':len(CRITERIA),'core':len(CORE),'baseline':bool(data['baseline']),'after':bool(data['after'])}))
