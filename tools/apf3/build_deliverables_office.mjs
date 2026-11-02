import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {Workbook,SpreadsheetFile,Presentation,PresentationFile}=await import('file:///C:/Users/vegac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs');

const root=path.resolve(import.meta.dirname,'../..');
const out=path.join(root,'output/apf3');
const qa=path.join(out,'qa');
await fs.mkdir(qa,{recursive:true});
const data=JSON.parse(await fs.readFile(path.join(out,'deliverables-data.json'),'utf8'));
const applicabilityReview=JSON.parse(await fs.readFile(path.join(out,'evidence/applicability-review.json'),'utf8').catch(()=>'{}'));
const font='Arial';
const color={ink:'#0F172A',green:'#14532D',muted:'#475569',light:'#F1F5F9',line:'#CBD5E1',input:'#FFFBEB'};
function human(v){
  if(typeof v!=='string'||/^(https?:|output\/|frontend\/)/.test(v))return v;
  const protectedTokens=[];
  v=v.replace(/https?:\/\/[^\s<>]+|[a-f0-9]{12,40}|#[a-fA-F0-9]{3,8}\b|\bv\d+(?:\.\d+)+\b|\b[HAMPTR]\d{1,3}\b|\bW3C\b/g,x=>{protectedTokens.push(x);return 'QPROTECTED'+String.fromCharCode(64+protectedTokens.length)+'TOKEN'});
  v=v.replace(/\b(WCAG|SUS|SEQ)(?=\d)/g,'$1 ').replace(/([a-záéíóúñ])(?=\d)/g,'$1 ').replace(/(\d)(?=[A-Za-záéíóúñ])/g,'$1 ').replace(/\b(deIA|uso deIA)\b/g,'uso de IA').replace('Sección35145','Sección 35145').replace('GrupoPorConfirmar','Grupo por confirmar').replace('CriterioWCAG','Criterio WCAG').replace('deEE.UU.','de EE. UU.').replace('commitQPROTECTED','commit QPROTECTED');
  protectedTokens.forEach((x,i)=>{v=v.replace('QPROTECTED'+String.fromCharCode(65+i)+'TOKEN',x)});
  return v.replaceAll('aT4','a T4').replaceAll('deT3','de T3').replaceAll('enT3','en T3').replaceAll('NVDA2026','NVDA 2026');
}
const col=n=>{let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s};
function sumAudit(a){const screens=a?.screens??[];return {screens:screens.length,rules:screens.reduce((s,x)=>s+(x.axe?.violations?.length??0),0),nodes:screens.reduce((s,x)=>s+(x.axe?.violations??[]).reduce((n,v)=>n+(v.nodes?.length??0),0),0)}}
const base=sumAudit(data.baseline),after=sumAudit(data.after);
const sources=data.sources.map(s=>[s.id,s.title,s.url,s.use]);
const rawFindings=Array.isArray(data.findings)?data.findings:(data.findings?.findings??[]);

async function workbook(){
  const wb=Workbook.create();
  const names=['Resumen','Matriz WCAG','Hallazgos','Trazabilidad','Sesiones','SUS','Resultados','Fuentes'];
  const sheets=Object.fromEntries(names.map(n=>[n,wb.worksheets.add(n)]));
  function style(s,rows,columns){
    s.showGridLines=false;
    s.getRange(`A1:${col(columns)}${rows}`).format.font={name:font,size:10,color:color.ink};
    s.getRange(`A1:${col(columns)}${rows}`).format.verticalAlignment='center';
    s.getRange(`A1:${col(columns)}${rows}`).format.rowHeight=28;
    s.getRange(`A1:${col(columns)}${rows}`).format.columnWidth=22;
    s.getRange('A1').values=[[s.name??'CONTIGO APF3']];
    s.getRange('A1').format.font={name:font,size:15,bold:true};
  }
  function grid(s,headers,rows,start=5,widths=[]){
    s.getRange(`A${start}:${col(headers.length)}${start+rows.length}`).values=[headers,...rows].map(r=>r.map(human));
    const h=s.getRange(`A${start}:${col(headers.length)}${start}`);
    h.format={fill:color.green,font:{name:font,bold:true,color:'#FFFFFF',size:10},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:42};
    const body=s.getRange(`A${start+1}:${col(headers.length)}${start+rows.length}`);body.format.wrapText=true;
    widths.forEach((w,i)=>s.getRange(`${col(i+1)}${start}:${col(i+1)}${start+rows.length}`).format.columnWidth=w);
    if(rows.length>20){s.freezePanes.freezeRows(start);s.freezePanes.freezeColumns(2);}
    s.tables.add(`A${start}:${col(headers.length)}${start+rows.length}`,true,`AuditTable${names.indexOf(s.name)+1}_${start}`);
    return start+1;
  }
  const rs=sheets.Resumen;style(rs,30,6);rs.getRange('A1').values=[['CONTIGO APF3 seguimiento de evidencia']];
  rs.getRange('A3').values=[['Fecha '+data.date+'. No se declara conformidad AA completa.']];
  grid(rs,['Evidencia','Versión2.0','Versión3.0','Interpretación'],[
    ['Pantallas o estados técnicos',base.screens,after.screens,'Cada estado registrado conserva captura y JSON.'],
    ['Incidencias de reglas axe',base.rules,after.rules,'Una regla puede repetirse en varias pantallas. No son criterios WCAG únicos.'],
    ['Nodos señalados por axe',base.nodes,after.nodes,'No representan usuarios ni tareas fallidas.'],
    ['Participantes con sesión aportada',null,null,'No ejecutado. Faltan sesiones y consentimientos.'],
    ['Figma y Stark',null,null,'Pendiente archivo nativo y recorrido con capturas.'],
    ['Lector de pantalla',null,null,'NVDA 2026.3 real: T1,T2,T4 y navegación/encabezados de T3. Foco técnico programado. Lectura completa de T3 pendiente.'],
    ['Zoom nativo del navegador',null,null,'Verificado por chrome.tabs.getZoom de1 a2 a1. T1 aT4 al200%. Perfil aislado de Chromium con viewport de escritorio.'],
    ['Contraste indeterminado',null,null,'3reglas axe pendientes. Recorrido independiente:43nodos,31límites conservadores suficientes y12inconclusos.'],
  ],5,[34,18,18,80]);
  rs.getRange('A5:D13').format.autofitRows();
  rs.getRange('A16').values=[['Matriz: 50criterios A/AA,26núcleo. Sin evidencia completa el estado permanece parcial o pendiente.']];
  rs.getRange('A18').values=[['Editar entradas amarillas en Sesiones y SUS. Un dato ausente nunca se transforma en cero.']];
  rs.tabColor=color.green;

  const screens=data.after?.screens??data.baseline?.screens??[];
  const beforeById=new Map((data.baseline?.screens??[]).map(x=>[x.id,x]));
  const afterById=new Map((data.after?.screens??[]).map(x=>[x.id,x]));
  const ctag=id=>'wcag'+id.replaceAll('.','');
  const nextCheck={
    '1.1.1':'Revisar propósito y alternativa de cada imagen, icono y gráfica.',
    '1.3.1':'Revisar encabezados, asociaciones de etiquetas y tablas en orden de lectura.',
    '1.3.2':'Escuchar la secuencia del contenido con lector de pantalla.',
    '1.3.3':'Comprobar que las instrucciones no dependan de posición, forma o sonido.',
    '1.3.4':'Probar ambas orientaciones sin restricción ni pérdida de funcionalidad.',
    '1.3.5':'Verificar tokens autocomplete para los datos personales que correspondan.',
    '1.4.1':'Revisar estados sin color y sin audio. Conservar texto e iconos equivalentes.',
    '1.4.3':'Verificar todas las parejas texto fondo y todos los estados, incluido alto contraste.',
    '1.4.4':'Zoom nativo al200% verificado por API en T1 aT4. Revisar todos los estados y funcionalidades del alcance, además de la ventana técnica probada.',
    '1.4.5':'Confirmar que no se emplea imagen de texto cuando puede usarse texto real.',
    '1.4.10':'Revisar el interior de cada contenedor además del ancho del documento.',
    '1.4.11':'Medir límites de campos, estados, iconos y foco contra superficies adyacentes.',
    '1.4.12':'Aplicar espaciado WCAG y comprobar pérdidas de texto o controles.',
    '1.4.13':'Revisar cualquier contenido emergente por hover o foco: descartable persistente y alcanzable.',
    '2.1.1':'Ejecutar cada acción por teclado, incluidas cancelación y recuperación.',
    '2.1.2':'Entrar y salir de cada control o diálogo con teclado.',
    '2.1.4':'Revisar existencia de atajos de una sola tecla y posibilidad de desactivarlos.',
    '2.2.1':'Revisar sesión, código temporal y cualquier límite de tiempo del flujo.',
    '2.2.2':'Revisar animaciones, actualización automática y opciones de pausa.',
    '2.3.1':'Inspeccionar destellos de contenido y estados de alerta.',
    '2.4.1':'Activar salto al contenido con teclado y comprobar destino del foco.',
    '2.4.2':'Comprobar título y propósito específico de esta ruta.',
    '2.4.3':'Revisar secuencia, entrada y retorno del foco al cambiar vistas o cerrar diálogos.',
    '2.4.4':'Revisar propósito de enlaces en su contexto y nombre accesible.',
    '2.4.5':'Revisar vías alternativas dentro del conjunto de páginas y excepciones de procesos.',
    '2.4.6':'Revisar claridad y propósito de cada encabezado y etiqueta.',
    '2.4.7':'Verificar foco perceptible en todas las superficies y desplazamientos.',
    '2.5.1':'Confirmar alternativas simples a gestos multipunto o dependientes de trayectoria.',
    '2.5.2':'Comprobar cancelación o reversión al soltar fuera del control.',
    '2.5.3':'Comparar etiqueta visible con nombre accesible de cada control.',
    '2.5.4':'Revisar que ninguna acción dependa exclusivamente de movimiento.',
    '3.1.1':'Verificar idioma programático de la página.',
    '3.1.2':'Revisar cambios de idioma en contenido y pronunciación del lector.',
    '3.2.1':'Comprobar que recibir foco no cambie el contexto inesperadamente.',
    '3.2.2':'Revisar efectos de entradas y cambios de selección con aviso previo.',
    '3.2.3':'Comparar orden relativo de navegación en las vistas del mismo rol.',
    '3.2.4':'Comparar nombres e iconos para funciones equivalentes.',
    '3.3.1':'Provocar errores, comprobar identificación textual y asociación al campo.',
    '3.3.2':'Revisar etiquetas, unidades, obligatoriedad y ejemplos sin valores prefijados.',
    '3.3.3':'Comprobar sugerencia útil para corregir cada error de entrada.',
    '3.3.4':'Probar revisión cancelación y corrección de los datos modificables.',
    '4.1.1':'Revisar duplicados de ID, anidamiento y relaciones programáticas en DOM.',
    '4.1.2':'Verificar nombre rol estado y valor con lector real y árbol de accesibilidad.',
    '4.1.3':'Escuchar mensajes de carga error y guardado sin mover el foco innecesariamente.'
  };
  const matrix=[];
  for(const screen of screens){
    const before=beforeById.get(screen.id),post=afterById.get(screen.id);
    for(const c of data.criteria){
      const bv=(before?.axe?.violations??[]).filter(x=>x.tags?.includes(ctag(c.id)));
      const av=(post?.axe?.violations??[]).filter(x=>x.tags?.includes(ctag(c.id)));
      let applies='Sí';let why=nextCheck[c.id]??'Revisión manual pendiente.';
      if(c.id.startsWith('1.2.')){applies='No';why='No hay audio o vídeo pregrabado ni emisiones en directo en esta pantalla del flujo. Revalidar si se incorpora multimedia.';}
      if(c.id==='1.4.2'){applies='No';why='La lectura por voz es opcional y se inicia mediante acción del usuario. No se reproduce audio automático mayor de3s.';}
      const applicability=applicabilityReview.byScreen?.[screen.id]?.[c.id];
      if(applicability){applies=applicability.applies;why=applicability.justification;}
      let result=applies==='No'?'No aplica':av.length?'No cumple en comprobación automática':post?'Parcial, sin fallo automático en condiciones probadas':'Pendiente de nueva prueba';
      const passes=(post?.axe?.passes??[]).filter(v=>v.tags?.includes(ctag(c.id)));
      const incomplete=(post?.axe?.incomplete??[]).filter(v=>v.tags?.includes(ctag(c.id)));
      let evidence=av.length?av.map(v=>v.id+': '+v.nodes.length+' nodo(s)').join('; '):post?`axe: ${passes.length} regla(s) sin fallo, ${incomplete.length} revisión(es) incompleta(s). ${nextCheck[c.id]??''}`:'No existe ejecución v3.0 para este estado.';
      if(c.id==='2.4.2'&&post){evidence='Título DOM: '+post.layout?.title;result='Cumple en título observado. Revalidar nuevos estados.';}
      if(c.id==='3.1.1'&&post&&passes.some(v=>v.id==='html-has-lang')){evidence='html lang=es en código, reglas html-has-lang y html-lang-valid de axe. Lectura de partes pendiente en3.1.2.';result='Cumple en idioma de página observado.';}
      if(c.id==='1.4.10'&&post)evidence+=` Ancho documento ${post.layout?.documentWidth}px, ventana ${post.layout?.viewport?.width}px, desbordamiento ${post.layout?.horizontalOverflow}.`;
      const finding=rawFindings.find(f=>f.criteria?.includes(c.id)&&(
        f.afterEvidence?.includes(screen.id)||
        (['H01','H03','H04','H05','H06'].includes(f.id)&&screen.role==='patient')||
        (f.id==='H02'&&screen.id.includes('measurement'))||
        (f.id==='H08'&&screen.id.includes('login'))||
        (f.id==='H09'&&['02-patient-home','17-caregiver-dashboard','19-caregiver-appointments'].includes(screen.id))));
      if(finding){evidence+=` ${finding.id}: ${finding.verification} Estado: ${finding.status}`;}
      const review=data.codeReview?.criteria?.[c.id];
      if(review){evidence+=' Inspección del patrón fuente: '+review.observed+' Archivos: '+review.sources.join('; ')+'. Pendiente: '+review.remaining;}
      if(c.id==='1.4.4'&&data.technical?.nativeZoom)evidence+=' Prueba real adicional: evidence/native-zoom/verified-native-api-final/native-zoom.json, getZoom1->2->1, DPR1->2->1 y fuente16px constante; recorridos técnicos T1 aT4. No cubre todas las ventanas.';
      if(['2.1.1','2.4.3','2.5.3','3.3.1','3.3.4'].includes(c.id)&&data.technical?.keyboard)evidence+=' Recorridos técnicos mediante teclas T1 aT4: evidence/keyboard-tasks/keyboard-tasks.json. No son métricas de participantes.';
      if(['3.3.1','3.3.2','3.3.3','3.3.4','4.1.2','4.1.3'].includes(c.id)&&data.technical?.nvda)evidence+=' NVDA2026.3 real registra T1,T2,T4; T3solo navegación y encabezados. Foco programático y anuncios reales, sin juicio acústico: evidence/nvda/summary.json.';
      if(c.id==='1.4.3'&&data.technical?.contrast){const nodes=data.technical.contrast.nodes.filter(n=>n.screen===screen.id);if(nodes.length)evidence+=` Contraste independiente de ${nodes.length} nodo(s):${nodes.filter(n=>n.contrast.result==='Conservative bounding-box contrast passes').length} límite(s) conservador(es) suficiente(s),${nodes.filter(n=>n.contrast.result!=='Conservative bounding-box contrast passes').length} inconcluso(s). Ver evidence/contrast-review/results.json; no equivale a conformidad global.`;}
      if(applicability){evidence=applicability.observation+' Fuentes: '+applicability.sources.join('; ')+'. Consultas rg y decisión específica: evidence/applicability-review.json # '+screen.id+' / '+c.id;}
      const s=applies==='No'?null:(finding?.S??(av.length?(c.id==='1.4.3'?3:2):null)),a=applies==='No'?null:(finding?.A??(av.length?3:null));
      matrix.push([`M${String(matrix.length+1).padStart(4,'0')}`,c.principle,c.id,c.name,c.level,c.core?'Sí':'No',screen.id,screen.state??'',applies,why,
        applicability?'Inspección directa de fuentes y búsquedas rg registradas':review?'axe + inspección directa del patrón fuente; recorrido con TA pendiente':'Automático y revisión manual pendiente',bv.length?'No cumple en comprobación automática':'Sin fallo automático detectado',result,
        evidence,s,a,null,null,finding?.afterEvidence??post?.screenshot??before?.screenshot??'',applies==='No'?'No requiere ajuste de este criterio en el estado revisado. Revalidar ante cambios.':finding?finding.id+' '+finding.status:post?'Implementación disponible. Completar prueba manual.':'Pendiente de evidencia v3.0',
        applies==='No'?'No aplica en este estado':finding?.profiles?.join(', ')??({'Perceptible':'Visual y auditivo según contenido. Impacto inferido del criterio, no participante observado.','Operable':'Motor, teclado y visual según contenido. Impacto inferido del criterio.','Comprensible':'Cognitivo, aprendizaje y lector según contenido. Impacto inferido del criterio.','Robusto':'Uso de tecnologías de apoyo. Impacto inferido del criterio.'}[c.principle])]);
    }
  }
  const ms=sheets['Matriz WCAG'];style(ms,matrix.length+6,21);ms.getRange('A1').values=[['Matriz de auditoría WCAG2.1 AA por pantalla y estado']];
  ms.getRange('A3').values=[['Resultado parcial no equivale a cumple. Las no aplicabilidades se justifican y deben revisarse ante cambios.']];
  grid(ms,['ID','Principio','Criterio','Nombre','Nivel','Núcleo','Pantalla','Estado','Aplica','Justificación','Método','Resultado base','Resultado v3','Evidencia','S','A','SxA','Prioridad','Captura','Estado del ajuste','Perfiles afectados'],matrix,5,[12,18,12,34,9,9,32,24,10,60,38,42,48,90,8,8,8,12,62,48,48]);
  ms.getRange(`A6:U${matrix.length+5}`).format.autofitRows();
  ms.getRange(`Q6:R${matrix.length+5}`).formulas=matrix.map((_,i)=>{const r=i+6;return [`=IF(COUNT(O${r}:P${r})<2,"",O${r}*P${r})`,`=IF(Q${r}="","",IF(Q${r}>=8,"Alta",IF(Q${r}>=4,"Media","Baja")))`]});
  ms.getRange(`O6:P${matrix.length+5}`).dataValidation={rule:{type:'whole',operator:'between',formula1:1,formula2:4}};
  ms.getRange(`P6:P${matrix.length+5}`).dataValidation={rule:{type:'whole',operator:'between',formula1:1,formula2:3}};
  ms.getRange(`R6:R${matrix.length+5}`).conditionalFormats.add('containsText',{text:'Alta',format:{fill:'#FEE2E2',font:{bold:true,color:'#991B1B'}}});

  const hs=sheets.Hallazgos;style(hs,rawFindings.length+7,13);hs.getRange('A1').values=[['Hallazgos técnicos y prioridad']];
  grid(hs,['ID','Categoría','Criterio','Barrera','S','A','SxA','Prioridad','Antes','Ajuste','Estado','Evidencia antes','Evidencia después'],rawFindings.map(f=>[f.id,f.category,f.criteria.join(', '),f.title,f.S,f.A,null,null,f.before,f.adjustment,f.status,f.beforeEvidence,f.afterEvidence]),5,[11,18,20,58,8,8,10,13,72,72,56,72,72]);
  hs.getRange(`G6:H${rawFindings.length+5}`).formulas=rawFindings.map((_,i)=>{const r=i+6;return[`=E${r}*F${r}`,`=IF(G${r}>=8,"Alta",IF(G${r}>=4,"Media","Baja"))`]});
  hs.getRange(`A6:M${rawFindings.length+5}`).format.rowHeight=90;

  const ts=sheets.Trazabilidad;style(ts,25,10);ts.getRange('A1').values=[['Ajustes inclusivos y nueva verificación']];
  grid(ts,['ID','Categoría','CriterioWCAG','Antes','Cambio','Nueva comprobación','Estado','Archivo','Evidencia antes','Evidencia después'],data.adjustments.map(x=>[x.id,x.category,x.criteria,x.before,x.change,x.verify,x.status??'Implementado o propuesto según código. Cierre de evidencia pendiente.',x.file,x.beforeEvidence??'',x.afterEvidence??'']),5,[12,18,28,50,65,65,50,65,72,72]);
  ts.getRange('A6:J20').format.rowHeight=100;

  const ss=sheets.Sesiones;style(ss,48,18);ss.getRange('A1').values=[['Registro de sesiones por tarea y versión']];
  ss.getRange('A3').values=[['Solo ingresar datos de sesiones consentidas.1significa autónomo;0significa con ayuda fallo o abandono. No incluir diagnósticos ni identidad.']];
  const sessionRows=[];
  for(let i=1;i<=5;i++)for(const version of ['v2.0','v3.0'])for(const t of data.tasks)sessionRows.push([`P${String(i).padStart(2,'0')}`,null,version,t.id,null,null,null,null,null,null,null,null,null,null,null,null,null,null]);
  grid(ss,['Código','Perfil','Versión','Tarea','Fecha','Consentimiento','Condición real o simulación','Tecnología usada','Resultado','Autónomo1/0','Tiempo(s)','Errores','Ayudas','SEQ1-7','Pausas(s)','Barrera residual','CriterioWCAG','Evidencia'],sessionRows,5,[14,24,13,10,18,21,32,32,22,18,16,13,13,14,16,55,18,60]);
  ss.getRange('B6:B45').format.fill=color.input;ss.getRange('E6:R45').format.fill=color.input;
  ss.getRange('A6:R45').format.rowHeight=40;
  ss.getRange('I6:I45').dataValidation={rule:{type:'list',values:['Sin ayuda','Con ayuda','Fallo','Abandono','No asignada']}};
  ss.getRange('J6:J45').formulas=sessionRows.map((_,i)=>{const r=i+6;return [`=IF(OR(I${r}="",I${r}="No asignada"),"",IF(I${r}="Sin ayuda",1,0))`]});
  ss.getRange('F6:F45').dataValidation={rule:{type:'list',values:['Sí','No']}};
  ss.getRange('N6:N45').dataValidation={rule:{type:'whole',operator:'between',formula1:1,formula2:7}};
  ss.getRange('K6:K45').setNumberFormat('0.0');ss.getRange('O6:O45').setNumberFormat('0.0');

  const us=sheets.SUS;style(us,20,16);us.getRange('A1').values=[['Respuestas SUS y cálculo individual']];
  us.getRange('A3').values=[['Ítems1a5. Se calcula únicamente con10respuestas. Resultado0a100, no porcentaje.']];
  const susRows=[];for(let i=1;i<=5;i++)for(const version of ['v2.0','v3.0'])susRows.push([`P${String(i).padStart(2,'0')}`,version,...Array(10).fill(null),null,null,null,null]);
  grid(us,['Código','Versión',...Array.from({length:10},(_,i)=>'Ítem'+(i+1)),'Respuestas','Contribuciones','SUS','Ficha'],susRows,5,[14,14,...Array(10).fill(12),14,20,14,55]);
  us.getRange('C6:L15').format.fill=color.input;us.getRange('C6:L15').dataValidation={rule:{type:'whole',operator:'between',formula1:1,formula2:5}};
  us.getRange('M6:O15').formulas=susRows.map((_,i)=>{const r=i+6;return [`=COUNT(C${r}:L${r})`,`=IF(M${r}<10,"",(C${r}-1)+(5-D${r})+(E${r}-1)+(5-F${r})+(G${r}-1)+(5-H${r})+(I${r}-1)+(5-J${r})+(K${r}-1)+(5-L${r}))`,`=IF(M${r}<10,"",N${r}*2.5)`]});
  us.getRange('O6:O15').setNumberFormat('0.0');
  // Test meaningful formula boundaries and restore actual empty data.
  us.getRange('C6:L6').values=[[5,1,5,1,5,1,5,1,5,1]];wb.recalculate();
  if(us.getRange('O6').values[0][0]!==100)throw Error('SUS upper bound failed');
  us.getRange('C6:L6').values=[[1,5,1,5,1,5,1,5,1,5]];wb.recalculate();
  if(us.getRange('O6').values[0][0]!==0)throw Error('SUS lower bound failed '+JSON.stringify(us.getRange('C6:O6').values));
  us.getRange('C6:L6').clear({applyTo:'contents'});wb.recalculate();
  if(us.getRange('O6').values[0][0]!=='' && us.getRange('O6').values[0][0]!==null)throw Error('Blank SUS should stay unavailable');

  const os=sheets.Resultados;style(os,23,12);os.getRange('A1').values=[['Resultados de validación y comparación']];
  os.getRange('A3').values=[['Pendiente de sesiones. Las cifras simuladas de APF2 no se usan como línea base empírica.']];
  const rr=[];for(const v of ['v2.0','v3.0'])for(const t of data.tasks)rr.push([v,t.id,null,null,null,null,null,null,null,null,null,null]);
  grid(os,['Versión','Tarea','Intentos','Éxitos sin ayuda','Tasa éxito','Tiempos válidos','Tiempo medio(s)','SEQ válidos','SEQ medio','SUS completos','SUS medio','Observación'],rr,5,[14,10,15,22,18,20,22,18,18,20,20,62]);
  os.getRange('C6:K13').formulas=rr.map((_,i)=>{const r=i+6;return [
    '='+['Sin ayuda','Con ayuda','Fallo','Abandono'].map(status=>`COUNTIFS(Sesiones!$C$6:$C$45,A${r},Sesiones!$D$6:$D$45,B${r},Sesiones!$I$6:$I$45,"${status}",Sesiones!$F$6:$F$45,"Sí")`).join('+'),
    `=IF(C${r}=0,"",COUNTIFS(Sesiones!$C$6:$C$45,A${r},Sesiones!$D$6:$D$45,B${r},Sesiones!$I$6:$I$45,"Sin ayuda",Sesiones!$F$6:$F$45,"Sí"))`,
    `=IF(C${r}=0,"",D${r}/C${r})`,
    `=COUNTIFS(Sesiones!$C$6:$C$45,A${r},Sesiones!$D$6:$D$45,B${r},Sesiones!$K$6:$K$45,">0",Sesiones!$I$6:$I$45,"Sin ayuda",Sesiones!$F$6:$F$45,"Sí")`,
    `=IF(F${r}=0,"",SUMIFS(Sesiones!$K$6:$K$45,Sesiones!$C$6:$C$45,A${r},Sesiones!$D$6:$D$45,B${r},Sesiones!$I$6:$I$45,"Sin ayuda",Sesiones!$F$6:$F$45,"Sí")/F${r})`,
    `=COUNTIFS(Sesiones!$C$6:$C$45,A${r},Sesiones!$D$6:$D$45,B${r},Sesiones!$N$6:$N$45,">=1",Sesiones!$F$6:$F$45,"Sí")`,
    `=IF(H${r}=0,"",SUMIFS(Sesiones!$N$6:$N$45,Sesiones!$C$6:$C$45,A${r},Sesiones!$D$6:$D$45,B${r},Sesiones!$F$6:$F$45,"Sí")/H${r})`,
    `=COUNTIFS(SUS!$B$6:$B$15,A${r},SUS!$M$6:$M$15,10)`,
    `=IF(J${r}=0,"",SUMIFS(SUS!$O$6:$O$15,SUS!$B$6:$B$15,A${r})/J${r})`];});
  os.getRange('E6:E13').setNumberFormat('0.0%');os.getRange('G6:K13').setNumberFormat('0.0');
  os.getRange('L6:L13').values=[['SUS corresponde a la versión completa, no a una tarea.'],...Array.from({length:7},()=>[''])];
  os.getRange('A17').values=[['Antecedente APF2 simulado (no comparar como medición): T1 4.65s, T2 2.05s, SUS95.83. T3 sin registro.']];
  os.getRange('A19').values=[['Para análisis por perfil filtrar Sesiones y conservar denominadores. No mezclar ayuda abandono y éxito autónomo en tiempos medios.']];

  wb.recalculate();
  if(os.getRange('C6').values[0][0]!==0)throw Error('Empty attempts counted: '+JSON.stringify(os.getRange('C6:K6').values));
  ss.getRange('F6').values=[['Sí']];ss.getRange('I6').values=[['Sin ayuda']];ss.getRange('K6').values=[[4]];ss.getRange('N6').values=[[6]];wb.recalculate();
  if(os.getRange('C6').values[0][0]!==1||os.getRange('E6').values[0][0]!==1||os.getRange('G6').values[0][0]!==4||os.getRange('I6').values[0][0]!==6)throw Error('Session calculation test failed '+JSON.stringify(os.getRange('C6:K6').values));
  for(const cell of ['F6','I6','K6','N6'])ss.getRange(cell).clear({applyTo:'contents'});

  const fsheet=sheets.Fuentes;style(fsheet,20,4);fsheet.getRange('A1').values=[['Fuentes y procedencia de los datos']];grid(fsheet,['ID','Referencia','URL o archivo','Uso'],sources,5,[10,65,85,80]);fsheet.getRange('A6:D17').format.rowHeight=78;
  wb.recalculate();
  const validation=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},maxChars:3000});
  await fs.writeFile(path.join(qa,'workbook-validation.ndjson'),validation.ndjson);
  const snapshots={Resumen:'A1:D14','Matriz WCAG':'A5:I11',Hallazgos:'A5:H10',Trazabilidad:'A5:D10',Sesiones:'A5:J11',SUS:'A5:O11',Resultados:'A5:G13',Fuentes:'A5:C9'};
  for(const [name,range] of Object.entries(snapshots)){
    const image=await wb.render({sheetName:name,range,scale:1.3,format:'png'});await fs.writeFile(path.join(qa,'xlsx-'+name.replaceAll(' ','-')+'.png'),new Uint8Array(await image.arrayBuffer()));
  }
  const rightPreview=await wb.render({sheetName:'Matriz WCAG',range:'N5:U8',scale:1.3,format:'png'});await fs.writeFile(path.join(qa,'xlsx-Matriz-evidencia.png'),new Uint8Array(await rightPreview.arrayBuffer()));
  const applicabilityPreview=await wb.render({sheetName:'Matriz WCAG',range:'G15:N25',scale:1.3,format:'png'});await fs.writeFile(path.join(qa,'xlsx-Matriz-aplicabilidad.png'),new Uint8Array(await applicabilityPreview.arrayBuffer()));
  const applicabilityChecks=matrix.filter(r=>['1.3.5','1.4.13','2.1.4','2.5.4'].includes(r[2]));
  if(applicabilityChecks.length!==92||applicabilityChecks.filter(r=>r[8]==='Sí').length!==1||applicabilityChecks.filter(r=>r[8]==='No').length!==91)throw Error('Unexpected applicability decision totals.');
  if(applicabilityChecks.some(r=>r[8]==='No'&&r[12]!=='No aplica'))throw Error('Non-applicable row must not claim compliance or a failure.');
  await fs.writeFile(path.join(qa,'applicability-validation.json'),JSON.stringify({rows:92,applies:1,notApplicable:91,source:'evidence/applicability-review.json',noNonApplicablePassClaims:true},null,2));
  await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(out,'APF3_Matriz_y_validacion_CONTIGO.xlsx'));
  await fs.writeFile(path.join(qa,'workbook-summary.json'),JSON.stringify({rows:matrix.length,criteria:50,core:26,sheets:names},null,2));
  console.log(JSON.stringify({xlsx:'saved',matrixRows:matrix.length,sheets:names.length}));
}

async function presentation(){
  const pres=Presentation.create({slideSize:{width:1280,height:720}});
  function text(slide,value,left,top,width,height,size=28,bold=false,colorValue=color.ink){
    const s=slide.shapes.add({geometry:'textbox',position:{left,top,width,height},fill:'none',line:{fill:'none',width:0}});
    s.text=human(value);s.text.style={typeface:font,fontSize:size,bold,color:colorValue};return s;
  }
  function slide(title,notes=''){
    const s=pres.slides.add();s.background.fill='#FFFFFF';text(s,title,64,48,1152,92,42,true);text(s,`CONTIGO APF3   ${pres.slides.items.length}`,64,666,1152,28,17,false,color.muted);s.speakerNotes.text=notes;return s;
  }
  function lines(s,items,top=172,size=29){items.forEach((x,i)=>text(s,x,76,top+i*88,1128,80,size));}
  async function addScreenshot(slide,file,left,top,maxW,maxH,alt){
    if(!file)return;const filePath=path.join(root,file);const bytes=await fs.readFile(filePath);const iw=bytes.readUInt32BE(16),ih=bytes.readUInt32BE(20),scale=Math.min(maxW/iw,maxH/ih);
    slide.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:'image/png',alt,fit:'contain',position:{left,top,width:iw*scale,height:ih*scale}});
  }
  function auditNote(){return 'Fuentes: datos reales de evidence/baseline/audit.json y evidence/after/audit.json. Las ejecuciones son técnicas automatizadas con datos sintéticos, sin participantes. W3C https://www.w3.org/TR/WCAG21/';}
  let s=slide('Evaluamos la accesibilidad de CONTIGO','Exponer el objetivo y el estado honesto del trabajo. Duración total12min más3min de preguntas.');
  text(s,'Auditoría WCAG 2.1 AA y rediseño inclusivo',76,190,1100,110,40);
  text(s,'Paciente y cuidador conservan sus roles y tareas',76,330,1100,65,30);
  text(s,'Julio Minaya   Andres Puma   Gerson Vega\nSección35145   Grupo'+data.group+'   '+data.date,76,455,1100,110,23,false,color.muted);
  s=slide('Conservamos los roles y las tareas','1min de contexto. Fuente: avance2 aportado por el equipo.');
  lines(s,['T1 Paciente registra una respuesta de toma','T2 Paciente localiza y comprende el SOS de prueba','T3 Cuidador consulta tratamiento existencias y cita','T4 Paciente corrige un error y revisa la medición']);
  s=slide('Fijamos una línea base verificable','El APF2 llama simulaciones a sus tiempos y SUS. No pueden presentarse como resultados de participantes. Repetir v2.0 yv3.0 con las mismas tareas.');
  lines(s,['Base técnica: commit4656d7236508','APF2: tiempos y SUS proceden de simulaciones','T3 vigente no tiene medición documentada','Comparar versiones con el mismo caso rol y dispositivo']);
  s=slide('Auditamos pantallas y estados',auditNote());
  lines(s,[`v2.0: ${base.screens} estados   ${base.rules} incidencias axe   ${base.nodes} nodos`,`v3.0: ${after.screens} estados   ${after.rules} incidencias axe   ${after.nodes} nodos`,'H03 y H04 prioridad9: reajuste y ampliación','H01 prioridad6: contraste de texto. Ver evidencia y matriz']);
  for(const [cat,heading] of [['Sensorial','Mejoramos la lectura y el contraste'],['Motora','Facilitamos el teclado y el alcance'],['Cognitiva','Guiamos la revisión y la corrección']]){
    s=slide(heading,auditNote()+'\nAjustes: '+data.adjustments.filter(x=>x.category===cat).map(x=>x.id+' '+x.criteria+' '+x.change).join('\n'));
    const relevant=data.adjustments.filter(x=>x.category===cat).slice(0,3);
    relevant.forEach((x,i)=>text(s,x.id+'  '+x.criteria+'\n'+x.change,64,163+i*150,625,135,24));
    const selected={Sensorial:{beforeEvidence:'output/apf3/evidence/baseline/detail-dose.png',afterEvidence:'output/apf3/evidence/after/detail-dose.png',id:'A01'},Motora:{beforeEvidence:'output/apf3/evidence/baseline/detail-navigation320.png',afterEvidence:'output/apf3/evidence/after/detail-navigation320.png',id:'A06'},Cognitiva:{beforeEvidence:'output/apf3/evidence/baseline/detail-error-field.png',afterEvidence:'output/apf3/evidence/after/detail-error-field.png',id:'A07'}}[cat];
    if(selected?.beforeEvidence&&selected?.afterEvidence){
      text(s,'Antes v2.0',730,154,210,35,21,true);text(s,'Después v3.0',972,154,210,35,21,true);
      await addScreenshot(s,selected.beforeEvidence,730,205,210,380,'Captura local antes del ajuste '+selected.id);
      await addScreenshot(s,selected.afterEvidence,972,205,210,380,'Captura local después del ajuste '+selected.id);
      text(s,'Datos sintéticos. Capturas técnicas locales.\nVer imágenes completas en anexos.',730,600,470,50,17,false,color.muted);
    }
  }
  s=slide('Demostramos el flujo de recuperación','3min demo. Abrir app en el navegador y ejecutar ajustes de lectura, Tab, error y revisión. Figma obligatorio debe estar importado probado y publicado antes de sustentar.');
  lines(s,['Teclado: T1 aT4 ejecutadas mediante teclas','Zoom nativo: factor2 verificado por API del navegador','NVDA real: T1,T2,T4 y encabezados deT3','Pendiente: lectura completa de valores deT3 y usuarios']);
  s=slide('Preparamos la validación inclusiva','2min validación. No presentar métricas hasta obtener sesiones consentidas.5participantes3perfiles,2condicionesreales oTA habitual para Excelente.');
  lines(s,['Estado actual: sesiones y consentimientos pendientes','Mínimo5participantes que cubran3perfiles','Recoger éxito tiempo errores SEQ y SUS','Registrar tecnología de apoyo y barreras residuales']);
  s=slide('Vinculamos ajustes con las normas',data.sources.filter(x=>['S01','S02','S04','S05','S06','S08','S09','S10'].includes(x.id)).map(x=>x.title+' '+x.url).join('\n'));
  lines(s,['WCAG2.1 AA define el objetivo técnico','Ley29973 y su reglamento sustentan accesibilidad','Ley29733 orienta consentimiento y datos personales','Section508 es referencia del ámbito federal deEE.UU.']);
  s=slide('Declaramos el estado de accesibilidad',auditNote()+'\nDistinguir declaración académica de parcial conformidad de una certificación. Canal repositorio Issues verificar habilitación.');
  lines(s,['Parcialmente conforme y evaluación en curso','NVDA parcial enT3 y12contrastes inconclusos','Faltan Figma Stark y validación con participantes','Canal de barreras: Issues del repositorio']);
  s=slide('Cerramos las evidencias pendientes','1min cierre. Todos los integrantes deben poder justificar severidad, criterio, evidencia y límites. No entregar como completo sin sesiones y Figma.');
  lines(s,['Resolver altas y comprobar los ajustes','Completar Figma y probar enlace en incógnito','Ejecutar sesiones y comparar la línea base','Ensayar12min y declarar el uso deIA']);

  const staging=path.join(qa,'pptx-staging');await fs.mkdir(staging,{recursive:true});
  const candidate=path.join(staging,'candidate.pptx');await (await PresentationFile.exportPptx(pres)).save(candidate);
  for(let i=0;i<pres.slides.items.length;i++){
    const png=await pres.export({slide:pres.slides.items[i],format:'png',scale:1});await fs.writeFile(path.join(qa,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
  }
  const skill='C:/Users/vegac/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/presentations';
  const privateValidation=path.join(root,'tools/apf3/.artifact-qa');await fs.mkdir(privateValidation,{recursive:true});
  await fs.rm(path.join(privateValidation,'pptx-validation.json'),{force:true});
  const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
  const dest=path.join(out,'APF3_Grupo'+data.group+'_CONTIGO.pptx');
  // Finalizer refuses overwrite: remove only our known generated output to regenerate.
  await fs.rm(dest,{force:true});
  await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:dest,
    pythonExecutable:'C:/Users/vegac/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
    integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
    layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
    layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
    explicitTotalSlideCount:12,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
    fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,
    receiptPath:path.join(privateValidation,'pptx-validation.json')});
  console.log(JSON.stringify({pptx:'saved',slides:12}));
}

try {
  if(process.argv.includes('--xlsx'))await workbook();
  if(process.argv.includes('--pptx'))await presentation();
} catch(error) {console.error(error.message);process.exitCode=1;}
