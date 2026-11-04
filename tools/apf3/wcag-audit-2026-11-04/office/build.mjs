import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';

const root=path.resolve(import.meta.dirname,'../../../..');
const data=JSON.parse(await fs.readFile(path.join(root,'output/wcag-audit-2026-11-04/auditoria-datos.json'),'utf8'));
const out=path.join(root,'outputs/wcag-audit-2026-11-04');
const qa=path.join(root,'output/wcag-audit-2026-11-04/qa');
await fs.mkdir(out,{recursive:true});await fs.mkdir(qa,{recursive:true});
const wb=Workbook.create();
const names=['Resumen','Criterios 50','Núcleo por vista','Hallazgos','Evidencias','Método'];
const sheets=Object.fromEntries(names.map(name=>[name,wb.worksheets.add(name)]));
const col=n=>String.fromCharCode(64+n);
const dark='#173D35';
function table(name,title,headers,rows,widths){
  const s=sheets[name],last=rows.length+5,lastCol=col(headers.length);
  s.showGridLines=false;
  s.getRange(`A1:${lastCol}${last}`).format={font:{name:'Arial',size:10,color:'#172B3B'},verticalAlignment:'top',rowHeight:30};
  s.getRange('A2').values=[[title]];s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:dark};
  s.getRange('A3').values=[['Corte 2026-11-04 · evaluación técnica local · todos los hallazgos abiertos']];
  s.getRange(`A5:${lastCol}${last}`).values=[headers,...rows];
  s.getRange(`A5:${lastCol}5`).format={fill:dark,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:34,wrapText:true,horizontalAlignment:'center',verticalAlignment:'center'};
  s.getRange(`A6:${lastCol}${last}`).format.wrapText=true;
  widths.forEach((width,i)=>s.getRange(`${col(i+1)}5:${col(i+1)}${last}`).format.columnWidth=width);
  s.getRange(`A6:${lastCol}${last}`).format.autofitRows();
  s.freezePanes.freezeRows(5);s.freezePanes.freezeColumns(name==='Núcleo por vista'?2:1);
  s.tables.add(`A5:${lastCol}${last}`,true,'Audit'+names.indexOf(name));
  return s;
}
const cs=table('Criterios 50','Evaluación de los 50 criterios A y AA',
 ['Criterio','Nombre','Nivel','Núcleo','Estado','Observación','Evidencia','Acción pendiente'],
 data.criteria.map(c=>[c.id,c.name,c.level,c.core?'Sí':'No',c.status,c.result,c.evidence,c.next]),[12,34,9,9,23,76,50,68]);
cs.getRange('E6:E55').conditionalFormats.add('expression',{formula:'=$E6="Fallo"',format:{fill:'#FCE8EC',font:{bold:true,color:'#831331'}}});
cs.getRange('E6:E55').conditionalFormats.add('containsText',{text:'Parcial',format:{fill:'#FFF3DA',font:{color:'#704B13'}}});
const ds=table('Núcleo por vista','26 criterios núcleo con trazabilidad por grupo de vistas',
 ['Criterio','Grupo de vistas','Estado global del criterio','Observación global','Capturas relativas al paquete','Comprobación pendiente'],
 data.details.map(d=>[d.id,d.group,d.status,d.observation,d.evidence,d.next]),[12,34,25,85,61,74]);
table('Evidencias','Catálogo de evidencias de esta ronda',
 ['Identificador','Prueba','Modo o transporte','Ruta','Archivo relativo','Resultado técnico'],
 data.evidence.map(e=>[e.id,e.kind,e.mode,e.url||'',e.file,e.detail]),[39,31,60,38,65,62]);
const hs=table('Hallazgos','Hallazgos abiertos y plan de corrección',
 ['ID','Tipo','Criterios','Hallazgo','Severidad S','Alcance A','S × A','Prioridad','Estado','Reproducción y resultado','Evidencia y fuente','Corrección y nueva prueba'],
 data.findings.map(f=>[f.id,f.type,f.criteria,f.title,f.s,f.a,null,null,f.status,f.steps+'\n'+f.observed,f.evidence+'\n'+f.source,f.fix+'\n'+f.retest]),[10,23,29,46,13,13,12,13,14,85,70,90]);
for(let i=0;i<data.findings.length;i++){
  const row=i+6;hs.getRange(`G${row}:H${row}`).formulas=[[`=E${row}*F${row}`,`=IF(G${row}>=8,"Alta",IF(G${row}>=4,"Media","Baja"))`]];
}
hs.getRange('E6:F12').format.fill='#FFF7DB';
hs.getRange('E6:G12').setNumberFormat('0');
hs.getRange('H6:H12').conditionalFormats.add('containsText',{text:'Alta',format:{fill:'#FCE8EC',font:{bold:true,color:'#831331'}}});
hs.getRange('H6:H12').conditionalFormats.add('containsText',{text:'Media',format:{fill:'#FFF3DA',font:{color:'#704B13'}}});
hs.getRange('E6:E12').dataValidation={rule:{type:'list',values:['1','2','3','4']}};
hs.getRange('F6:F12').dataValidation={rule:{type:'list',values:['1','2','3']}};
hs.getRange('I6:I12').dataValidation={rule:{type:'list',values:['Abierto','En corrección','Por repetir','Resuelto']}};
const ms=table('Método','Alcance, límites y fuentes', ['Elemento','Detalle','Referencia'],[
 ['Objeto','CONTIGO web en '+data.origin+' · paciente, cuidador y páginas públicas.','Fecha '+data.date+' · '+data.timezone],
 ['Entorno',`Chrome ${data.browser}, axe-core ${data.axe}. Zoom nativo ejecutado con Chromium en perfil aislado.`,'evidence/audit.json; evidence/native-zoom.json'],
 ['Estados','Sin fallo en muestra es un resultado de esta muestra. Parcial conserva verificaciones abiertas. No aplica tiene justificación individual. Fallo identifica barrera reproducida.','Criterios 50'],
 ['Severidad S','4 bloquea la tarea, 3 requiere solución alternativa costosa, 2 dificulta la tarea, 1 impacto menor.','Consigna APF3'],
 ['Alcance A','3 transversal o flujo crítico, 2 varias vistas o elementos repetidos, 1 elemento localizado.','Consigna APF3'],
 ['Prioridad','S × A. Alta desde 8, media de 4 a 7, baja hasta 3. El cierre requiere implementación y nueva prueba.','Hallazgos. Entradas editables de severidad y alcance en amarillo.'],
 ['Protocolo','Inspección automática, DOM, teclado, foco, errores, geometría, espaciado, fuentes y zoom nativo.','33 estados axe, 35 variantes de geometría y 15 capturas de zoom nativo.'],
 ['Trazabilidad por vista','Las 253 filas relacionan criterios núcleo con capturas de contexto. La valoración del criterio es global. No equivalen a 253 pruebas manuales independientes.','La observación distingue el grupo donde se reprodujo cada fallo.'],
 ...data.limitations.map((text,i)=>['Límite '+(i+1),text,'']),
 ['IA','Auditoría técnica asistida por IA. El equipo debe revisar la interpretación y validar los hallazgos con sus tecnologías y personas usuarias.','Sin participantes simulados ni resultados de Stark atribuidos.'],
 ...data.sources.map(s=>[s[0],s[2],s[1]]),
 ],[29,108,103]);
const rs=table('Resumen','CONTIGO · Auditoría WCAG 2.1 AA', ['Resultado','Cantidad','Interpretación'],[
 ['Criterios revisados',null,'50 criterios A y AA con justificación y evidencia.'],
 ['Criterios núcleo',26,'253 filas de trazabilidad agrupada por vistas.'],
 ['Sin fallo en muestra',null,'Resultado técnico limitado a la muestra revisada.'],
 ['Con fallo',null,'Hallazgos confirmados que requieren corrección.'],
 ['Parciales',null,'Verificaciones todavía abiertas.'],
 ['No aplicables',null,'Cada criterio conserva su justificación.'],
 ['Hallazgos WCAG abiertos',null,'Cinco barreras reproducidas.'],
 ['Hallazgos de prioridad alta',null,'Incluye solo hallazgos normativos.'],
 ['Pantallas y estados con axe',data.stats.screens,'Cero incidencias automáticas detectadas.'],
 ['Reglas incomplete',data.stats.incomplete,`${data.stats.incompleteNodes} nodos requieren revisión. No equivalen a fallos confirmados.`],
 ['Variantes de diseño',data.stats.layouts,'Tamaño del texto, reajuste, espaciado y orientación.'],
 ['Capturas con zoom nativo 200 %',data.stats.native200,'Confirmado mediante chrome.tabs.getZoom.'],
 ['Lector real y Stark',null,'Pendientes. No se declara conformidad AA completa.'],
 ],[41,15,96]);
const formulas={6:"=COUNTA('Criterios 50'!A6:A55)",8:"=COUNTIF('Criterios 50'!E6:E55,\"Sin fallo en muestra\")",9:"=COUNTIF('Criterios 50'!E6:E55,\"Fallo\")",10:"=COUNTIF('Criterios 50'!E6:E55,\"Parcial\")",11:"=COUNTIF('Criterios 50'!E6:E55,\"No aplica\")",12:"=COUNTIFS(Hallazgos!B6:B12,\"Fallo WCAG\",Hallazgos!I6:I12,\"Abierto\")",13:"=COUNTIFS(Hallazgos!B6:B12,\"Fallo WCAG\",Hallazgos!H6:H12,\"Alta\")"};
for(const[row,formula]of Object.entries(formulas))rs.getRange('B'+row).formulas=[[formula]];
rs.getRange('B6:B18').setNumberFormat('0');rs.tabColor=dark;rs.freezePanes.unfreeze();
rs.getRange('A20').values=[['Las correcciones quedan propuestas. Los cinco hallazgos normativos siguen abiertos.']];
rs.getRange('A21').values=[['La validación de lector de pantalla, contraste integral y Figma/Stark sigue pendiente.']];
rs.getRange('A20:C21').format.font={name:'Arial',size:10,color:'#831331'};
wb.recalculate();
// Check formula-linked summaries and editable priority before restoring the delivered inputs.
if(rs.getRange('B9').values[0][0]!==5||rs.getRange('B13').values[0][0]!==1)throw Error('Resumen no coincide con fuente');
hs.getRange('E6').values=[[1]];wb.recalculate();
if(hs.getRange('H6').values[0][0]!=='Baja'||rs.getRange('B13').values[0][0]!==0)throw Error('La prioridad no actualiza');
hs.getRange('E6').values=[[3]];wb.recalculate();
hs.getRange('I6').values=[['Resuelto']];wb.recalculate();
if(rs.getRange('B12').values[0][0]!==4)throw Error('El cierre no actualiza');
hs.getRange('I6').values=[['Abierto']];wb.recalculate();
const check=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:20},maxChars:1800});
await fs.writeFile(path.join(qa,'xlsx-formula-check.json'),JSON.stringify(check,null,2));
console.log(check.ndjson);
for(const[name,range]of [['Resumen','A2:C18'],['Criterios 50','A5:H8'],['Núcleo por vista','A5:F7'],['Hallazgos','A5:I8'],['Evidencias','A5:F8'],['Método','A5:C9']]){
  const png=await wb.render({sheetName:name,range,scale:1.2,format:'png'});
  await fs.writeFile(path.join(qa,'xlsx-'+name.replaceAll(' ','-')+'.png'),new Uint8Array(await png.arrayBuffer()));
}
await(await SpreadsheetFile.exportXlsx(wb)).save(path.join(out,'CONTIGO_Auditoria_WCAG_2.1_AA_2026-11-04.xlsx'));
console.log(JSON.stringify({output:out,criteria:50,core:26,details:data.details.length,findings:data.findings.length}));
