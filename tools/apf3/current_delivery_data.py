"""Canonical current-version APF3 data. Historical tests are never relabeled current."""
from pathlib import Path
import json, datetime, hashlib
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/apf3'
EVIDENCE=OUT/'evidence/current-2026-11-03'
def read(path):
    try:return json.loads(path.read_text(encoding='utf-8-sig'))
    except (FileNotFoundError,json.JSONDecodeError):return None
def relative(path):return path.relative_to(ROOT).as_posix()
def generate_current(criteria,sources,tasks):
    EVIDENCE.mkdir(parents=True,exist_ok=True)
    files={relative(p):read(p) for p in sorted(EVIDENCE.rglob('*.json')) if '/qa/' not in p.as_posix()}
    screens=[];rejected=[]
    for file,obj in files.items():
        if not isinstance(obj,dict):continue
        if obj.get('complete') is False:continue
        for key in ['screens','pages']:
            for raw in obj.get(key,[]) if isinstance(obj.get(key),list) else []:
                if not isinstance(raw,dict) or not ('axe' in raw or 'violations' in raw):continue
                s=dict(raw)
                s['id']=s.get('id',s.get('name','estado'))
                actual_path=urlparse(s.get('url','')).path
                if actual_path=='/login' and 'login' not in s['id'].lower():
                    rejected.append({'id':s['id'],'source':file,'reason':'URL observada login no corresponde al estado declarado.'});continue
                s['role']=s.get('role','patient' if actual_path.startswith('/patient-app') else 'caregiver' if actual_path in ['/dashboard','/medications','/appointments','/vitals','/clinical-profile','/settings'] else 'public')
                s['state']=s.get('state','estado observado')
                s['axe']=s.get('axe') or {k:s.get(k,[]) for k in ['violations','passes','incomplete']}
                s['layout']=s.get('layout') or {'title':s.get('title','CONTIGO'),'viewport':s.get('viewport',{}),'documentWidth':s.get('overflow',{}).get('document'),'horizontalOverflow':s.get('overflow',{}).get('horizontalOverflow')}
                s['sourceEvidence']=file
                raw_shot=s.get('screenshot','')
                if raw_shot:
                    options=[Path(raw_shot),ROOT/raw_shot,ROOT/Path(file).parent/raw_shot]
                    found=next((p.resolve() for p in options if p.is_file()),None)
                    s['screenshot']=relative(found) if found and found.is_relative_to(ROOT) else raw_shot
                else:s['screenshot']=''
                screens.append(s)
    # Deduplicate only identical observations, preserve different states/modes.
    dedup={}
    for s in screens:dedup[(s['id'],s['sourceEvidence'])]=s
    screens=list(dedup.values())
    after={'revision':'current-2026-11-03','screens':screens,'sourceFiles':list(files),'rejectedStates':rejected}
    checks=[]
    for file,obj in files.items():
        if not isinstance(obj,dict):continue
        for check in obj.get('checks',[]) if isinstance(obj.get('checks'),list) else []:
            if isinstance(check,dict):checks.append({**check,'sourceEvidence':file})
            elif isinstance(check,str):checks.append({'name':check,'sourceEvidence':file,'passed':None})
    stats={'screens':len(screens),'violations':sum(len(s['axe'].get('violations',[])) for s in screens),'violationNodes':sum(len(v.get('nodes',[])) for s in screens for v in s['axe'].get('violations',[])),'incomplete':sum(len(s['axe'].get('incomplete',[])) for s in screens),'incompleteNodes':sum(len(v.get('nodes',[])) for s in screens for v in s['axe'].get('incomplete',[])),'checks':len(checks),'checksPassed':sum(c.get('passed') is True for c in checks)}
    current_tasks=[dict(t) for t in tasks]
    for t in current_tasks:
        if t['id']=='T1':t.update(start='Vista única del paciente, medicamentos y mediciones; dosis sin responder.',checks='Nombre, dosis y hora; estado guardado; corrección desde Tomas registradas hoy.')
        if t['id']=='T2':t.update(start='Vista única paciente, SOS superior.',checks='Revisión, cancelación y confirmación; petición de prueba sin entrega real.')
        if t['id']=='T4':t.update(instruction='Ingrese una lectura con un dato obligatorio vacío o con el número de abajo mayor al de arriba. Corrija, revise y guarde.',start='Vista única paciente, sección Registrar medición.',success='Identifica el campo, conserva los valores válidos, corrige, revisa y confirma una sola medición.',checks='Número de arriba/abajo, unidades mmHg, pulso opcional; peso kg con decimal; revisión y guardado.')
    after_screenshot=next((s.get('screenshot') for s in screens if s.get('screenshot') and 'patient' in s['id']),'')
    flow=read(EVIDENCE/'flows/keyboard-current.json') or {}
    api=read(EVIDENCE/'api-database.json')
    contrast=read(EVIDENCE/'contrast/after.json')
    changes=[]
    specifications=[
      ('A01','Sensorial','1.4.3, 1.4.11','Colores y límites de la revisión previa no acreditan el diseño actual.','Colores explícitos; límites de los campos y selector revisados frente al fondo efectivo.','frontend/src/features/patient-app/MeasurementForm.module.css'),
      ('A02','Sensorial','1.4.4, 1.4.10, 1.4.12','La nueva vista única y el formulario requieren revalidar ampliación y espaciado.','Escala global de texto, reajuste de una columna y controles sin pérdida de contenido.','frontend/src/styles/index.css'),
      ('A03','Sensorial','1.1.1, 1.4.1, 4.1.3','La representación por color o audio no basta como información de estado.','Mantener instrucciones, unidades, errores y confirmación mediante texto y semántica; gráficas acompañadas de valores.','frontend/src/features/patient-app/MeasurementForm.tsx'),
      ('A04','Motora','2.1.1, 2.4.1, 2.4.3, 2.4.7','Los recorridos técnicos anteriores usaban pestañas retiradas.','Saltar al contenido, foco visible y revisión por teclado del recorrido actual.','frontend/src/App.tsx'),
      ('A05','Motora','2.5.3; buena práctica 2.5.5 AAA','Controles secundarios necesitan nombre y área verificables.','Conservar etiquetas visibles en nombre accesible y objetivos amplios; 44px es buena práctica AAA, no criterio AA.','frontend/src/features/patient-app/DoseCard.tsx'),
      ('A06','Motora','2.1.1, 2.4.3, 3.2.3','La aplicación tenía navegación inferior y vistas ajenas a la acción inmediata.','Una vista paciente con medicamentos y mediciones; SOS superior y tomas registradas sin cambiar pestañas.','frontend/src/features/patient-app/PatientAppContent.tsx'),
      ('A07','Cognitiva','3.3.1, 3.3.2, 3.3.3','Terminología sistólica y diastólica puede dificultar la entrada.','Número de arriba y Número de abajo con mmHg; ayudas, validación y recuperación conservando valores.','frontend/src/features/patient-app/MeasurementForm.tsx'),
      ('A08','Cognitiva','3.3.4, 4.1.3','Registrar datos sin revisarlos puede consolidar un error.','Ingreso, revisión y confirmación; volver a corregir sin perder valores; presión/pulso/peso.','frontend/src/features/patient-app/MeasurementForm.tsx'),
      ('A09','Cognitiva','3.3.4, 4.1.3','La solicitud SOS de prueba requiere alcance comprensible.','Revisión y cancelación antes del registro; resultado no afirma contacto a emergencias ni recepción efectiva.','frontend/src/features/patient-app/PatientAppContent.tsx'),
    ]
    for cid,cat,wcag,before,change,file in specifications:changes.append(dict(id=cid,category=cat,criteria=wcag,before=before,change=change,file=file,verify='Consultar evidencia del corte current-2026-11-03; completar revisión manual y sesiones.',status='Implementación local; comprobación técnica limitada al registro enlazado. Cierre integral pendiente.',beforeEvidence='output/apf3/history/2026-11-03-pre-current-refresh/ENTREGA.md (antecedente histórico; no comparación experimental)',afterEvidence=after_screenshot or 'output/apf3/evidence/current-2026-11-03/'))
    current_images={'A01':'contrast/after-390-100-standard-digits.png','A02':'contrast/after-320-200-standard-weight.png','A03':'api-audit/04-measurement-error.png','A04':'flows/01-t1-response-cancel.png','A05':'api-audit/01-patient-home.png','A06':'api-audit/01-patient-home.png','A07':'flows/03-t4-invalid.png','A08':'flows/04-t4-review.png','A09':'flows/02-t2-sos-scope.png'}
    titles=['Límites de campos con contraste insuficiente','Reajuste y escala del formulario vigente por comprobar','Estados requieren información textual y semántica','Recorrido de teclado anterior desactualizado','Nombre y área de controles secundarios por verificar','Acciones repartidas en pestañas retiradas','Terminología y recuperación de datos difíciles','Riesgo de consolidar datos sin revisión','Alcance del SOS de demostración puede confundirse']
    for c in changes:
        image=EVIDENCE/current_images[c['id']]
        if image.is_file():c['afterEvidence']=relative(image)
    changes[0]['beforeEvidence']=relative(EVIDENCE/'contrast/before-390-100-standard-digits.png')
    findings=[]
    for i,c in enumerate(changes,1):
        findings.append(dict(id=f'H{i:02}',category=c['category'],criteria=[x.strip() for x in c['criteria'].split(';')[0].split(',')],title=titles[i-1],S=3 if i in [1,2,4,7,8] else 2,A=3 if i in [1,2,4,7,8] else 2,before=c['before'],adjustment=c['change'],verification=c['verify'],status=c['status'],beforeEvidence=c['beforeEvidence'],afterEvidence=c['afterEvidence'],profiles=['Visual','Motor','Cognitivo'] if i==2 else [c['category']]))
    current_sources=[dict(s,checked='2026-11-03',verification='Referencias oficiales consultadas; algunas páginas bloquearon acceso directo, corroboradas mediante resultados oficiales indexados. No dictamen jurídico institucional.') for s in sources]
    data=dict(date='2026-11-03',revision='current-2026-11-03',group='',criteria=criteria,sources=current_sources,tasks=current_tasks,adjustments=changes,baseline=None,after=after,findings=findings,participants=[],codeReview={},technical={'keyboard':None,'nativeZoom':None,'nvda':None,'contrast':None},currentEvidence=files,currentChecks=checks,summary=stats,apiDatabase=api,currentContrast=contrast,currentFlow=flow)
    data['status']={'figma':'Pendiente archivo nativo actual y enlace verificado; el plugin local no acredita ejecución.','stark':'Pendiente capturas de Stark y simulaciones en Figma actual.','screenReader':'Registros NVDA históricos conservados por versión. Falta recorrido completo de la interfaz actual salvo evidencia nueva identificada.','keyboard':'Ver comprobaciones del corte actual. No sustituye observación de participantes.','zoom':'Zoom nativo histórico no se traslada automáticamente al formulario actual; comprobar el recorrido vigente.','participants':'Pendiente: cinco participantes, tres perfiles y consentimientos; sin datos humanos nuevos.','deployment':'Web local; publicación y acceso completo público pendientes de backend desplegado y verificación.'}
    figma=read(EVIDENCE/'figma-status.json')
    if figma:data['figmaCurrent']=figma;data['status']['figma']=figma.get('status',data['status']['figma'])
    data['status']['figma']='Diferido expresamente por el usuario para una etapa posterior. El paquete preparatorio no acredita archivo nativo publicado.'
    data['status']['deployment']='Diferido: el equipo todavía no dispone de alojamiento para el backend. La ejecución central local no se presenta como publicación.'
    (OUT/'deliverables-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'findings.json').write_text(json.dumps(findings,ensure_ascii=False,indent=2),encoding='utf-8')
    return data
