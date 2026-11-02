import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),out=path.join(root,'output/apf3');
const read=async file=>JSON.parse(await fs.readFile(path.join(out,file),'utf8'));
const baseline=await read('evidence/baseline/audit.json'),after=await read('evidence/after/audit.json');
const supplementalBaseline=await read('evidence/baseline/supplemental.json'),supplementalAfter=await read('evidence/after/supplemental.json');
const screen=(variant,id)=>`output/apf3/evidence/${variant}/${id}.png`;
const findings=[
  {id:'H01',category:'Sensorial',criteria:['1.4.3'],title:'Contraste insuficiente en texto de apoyo y marco del teléfono',S:2,A:3,
   before:'axe4.11 mide2.56:1 para Tensiómetro o balanza y3.59:1 para4G; ambos textos pequeños requieren4.5:1.',
   adjustment:'Texto slate600/700 y emerald800; modo de alto contraste con colores explícitos.',
   beforeEvidence:screen('baseline','02-patient-home'),afterEvidence:screen('after','02-patient-home'),verification:'Resultados axe por nodo en audit.json; revisión visual.',status:'Resuelto en las capturas automatizadas',profiles:['Baja visión','Adultos mayores']},
  {id:'H02',category:'Sensorial',criteria:['1.4.11'],title:'Bordes de campos con contraste reducido',S:2,A:3,
   before:'Campos de medición con borde#cbd5e1 sobre#fff, ratio1.48:1 calculado a partir de CSS medido.',
   adjustment:'Borde#64748b sobre#fff, ratio4.76:1; objetivo3:1 para límites necesarios.',
   beforeEvidence:screen('baseline','29-input-boundaries'),afterEvidence:screen('after','29-input-boundaries'),verification:'Computed CSS en supplemental.json y cálculo sRGB; no mide bordes de todos los componentes.',status:'Resuelto para campos inspeccionados',profiles:['Baja visión']},
  {id:'H03',category:'Sensorial',criteria:['1.4.10'],title:'Navegación del paciente recortada a320px CSS',S:3,A:3,
   before:'Contenedor268px y contenido322px; Mi cuidador sale por el borde derecho.',
   adjustment:'Cuadrícula adaptable sin truncamiento y texto que puede envolver.',
   beforeEvidence:screen('baseline','26-nav320-detail'),afterEvidence:screen('after','26-nav320-detail'),verification:'Medición DOM de navegación a 320 px CSS y capturas. Recorrido adicional con zoom nativo real al 200 % verificado por chrome.tabs.getZoom en evidence/native-zoom/verified-native-api-final/native-zoom.json. No acredita reflow integral.',status:'Recorte de navegación y tareas probadas con zoom nativo resueltos técnicamente; reflow integral pendiente',profiles:['Baja visión','Movilidad reducida','Uso móvil']},
  {id:'H04',category:'Sensorial',criteria:['1.4.4'],title:'Tipografía local que no sigue el escalado de texto raíz',S:3,A:3,
   before:'Etiquetas de navegación de 11 px que permanecen en 11 px al aplicar estrés de raíz al 200 %; tamaños locales fijos.',
   adjustment:'Unidades relativas y opción de texto ampliado; comprobar sin pérdida de funcionalidad.',
   beforeEvidence:screen('baseline','27-font200-detail'),afterEvidence:screen('after','27-font200-detail'),verification:'Escalado CSS de 16 a 32 px y zoom nativo real 1 a 2 a 1 verificado mediante chrome.tabs.getZoom, DPR1 a 2 y fuente raíz constante en16px; T1 a T4 ejecutadas al 200 %. Ver evidence/native-zoom/verified-native-api-final/native-zoom.json.',status:'Escalado y zoom nativo verificados en el recorrido técnico; criterio completo y validación con personas pendientes',profiles:['Baja visión','Adultos mayores']},
  {id:'H05',category:'Motora',criteria:['2.4.7'],title:'Conservar y uniformar el foco visible existente',S:1,A:3,
   before:'La comprobación dedicada confirma contorno verde #136f53 de 3 px con separación de 3 px; ya existe foco visible. Una lectura anterior sin esperar render fue descartada.',
   adjustment:'Se conserva el foco visible y se uniforma con #0f4c3a de 3 px, separación de 3 px y anillo blanco; variante de colores forzados.',
   beforeEvidence:screen('baseline','34-primary-keyboard-focus'),afterEvidence:screen('after','34-primary-keyboard-focus'),verification:'Tab real, espera de render, CSS calculado y captura inspeccionada. No se atribuye un incumplimiento al APF2.',status:'Conservación y mejora verificadas en control primario; criterio completo pendiente',profiles:['Usuarios de teclado','Movilidad reducida','Baja visión']},
  {id:'H06',category:'Motora',criteria:['2.4.1'],title:'Falta un mecanismo explícito para saltar navegación repetida',S:2,A:3,
   before:'El recorrido Tab inicial del dashboard pasa por controles y navegación antes del contenido; no hay enlace de salto explícito.',
   adjustment:'Enlace Ir al contenido principal visible al foco, destino main y salto local del paciente.',
   beforeEvidence:'output/apf3/evidence/baseline/audit.json#17-caregiver-dashboard-keyboard',afterEvidence:'output/apf3/evidence/after/audit.json#17-caregiver-dashboard-keyboard',verification:'Secuencia Tab real automatizada y DOM. Otros mecanismos del lector no se han validado.',status:'Resuelto por mecanismo de salto; recorrido con lector pendiente',profiles:['Usuarios de teclado','Usuarios de lector de pantalla']},
  {id:'H07',category:'Motora',criteria:['2.5.5'],title:'Objetivos pequeños para contraseña y accesos secundarios',S:2,A:2,
   before:'Ver contraseña18x18px; Cerrar sesión y Ver citas16px de alto.',
   adjustment:'Objetivos principales de64px y controles de al menos44px cuando corresponde; verificar enlaces secundarios.',
   beforeEvidence:screen('baseline','01-login'),afterEvidence:screen('after','01-login'),verification:'Rectángulos DOM en audit.json;2.5.5 es AAA y se registra como buena práctica, no requisitoAA.',status:'Objetivos inspeccionados ampliados; revisión de todos los enlaces pendiente',profiles:['Movilidad reducida','Temblor','Uso táctil']},
  {id:'H08',category:'Cognitiva',criteria:['1.3.5'],title:'Propósito de credenciales sin token autocomplete',S:2,A:1,
   before:'Los campos de correo y contraseña no declaran autocomplete.',
   adjustment:'Tokens username y current-password para autocompletado compatible.',
   beforeEvidence:screen('baseline','25-input-purpose'),afterEvidence:screen('after','25-input-purpose'),verification:'Atributos medidos en supplemental.json; compatibilidad con gestor concreto no ensayada.',status:'Resuelto en DOM',profiles:['Dificultades cognitivas','Movilidad reducida']},
  {id:'H09',category:'Cognitiva',criteria:['2.4.2'],title:'Mismo título de documento en rutas distintas',S:2,A:3,
   before:'Paciente, dashboard y citas usan el mismo título genéricoCONTIGO.',
   adjustment:'Título de la vista y marca al navegar para distinguir pestañas e historial.',
   beforeEvidence:'output/apf3/evidence/baseline/supplemental.json#route-titles',afterEvidence:'output/apf3/evidence/after/supplemental.json#route-titles',verification:'document.title tras navegación real de tres rutas.',status:'Resuelto en rutas verificadas',profiles:['Usuarios de lector de pantalla','Dificultades de orientación']},
  {id:'H10',category:'Cognitiva',criteria:['3.3.4'],title:'Guardado de medición sin revisión previa',S:3,A:2,
   before:'Una lectura válida se guarda directamente al activar Guardar mi lectura; no hay revisión ni edición posterior en ese formulario.',
   adjustment:'Paso Revisar mi lectura con resumen, Volver a editar y Confirmar y guardar; se mantienen valores al volver.',
   beforeEvidence:screen('baseline','07-measurement-saved'),afterEvidence:screen('after','06-measurement-review'),verification:'Flujo ejecutado de error, corrección, revisión y guardado; no son métricas de usuario.',status:'Resuelto técnicamente en flujo probado',profiles:['Dificultades cognitivas','Adultos mayores','Movilidad reducida']},
  {id:'H11',category:'Motora',criteria:['2.4.3'],title:'El foco permanece en navegación al cambiar contenido',S:2,A:2,
   before:'Tras Medición, activeElement es BUTTON Medición; el nuevo formulario está antes de ese control en DOM.',
   adjustment:'Al cambiar vista, foco programático en su encabezado; confirmaciones reciben foco.',
   beforeEvidence:screen('baseline','28-navigation-focus'),afterEvidence:screen('after','28-navigation-focus'),verification:'activeElement pasa deBUTTON aH2Medición. Es mejora de orientación; no toda permanencia del foco incumple por sí sola.',status:'Mejora verificada técnicamente',profiles:['Usuarios de teclado','Usuarios de lector de pantalla']},
  {id:'H12',category:'Cognitiva',criteria:['3.2.3','3.3.4','4.1.3'],title:'Ayuda SOS solo en Inicio y registro inmediato',S:2,A:2,
   before:'En Medición no existe botónSOS; en Inicio un clic registra la petición.',
   adjustment:'SOS de prueba en cabecera común, explicación del alcance, Cancelar y Registrar, confirmación escrita sin promesa de entrega.',
   beforeEvidence:screen('baseline','28-navigation-focus'),afterEvidence:screen('after','13-sos-review'),verification:'ConteoSOS en Medición0->1; diálogo y confirmación capturados. Acceso global es mejora de diseño, no obligación independiente deAA.',status:'Mejora implementada; comprensión con participantes pendiente',profiles:['Dificultades cognitivas','Uso sin audio','Movilidad reducida']}
].map(f=>{
  const replacements=[['axe4.11','axe 4.11'],['mide2.56','mide 2.56'],['y3.59','y 3.59'],['para4G','para 4G'],['requieren4.5','requieren 4.5'],['borde#','borde #'],['Borde#','Borde #'],['sobre#','sobre #'],['ratio1.48','ratio 1.48'],['ratio4.76','ratio 4.76'],['objetivo3:1','objetivo 3:1'],['a320px','a 320 px'],['Contenedor268px','Contenedor de 268 px'],['contenido322px','contenido de 322 px'],['a320CSSpx','a 320 px CSS'],['zoom200%','zoom al 200 %'],['contraseña18x18px','contraseña de 18 x 18 px'],['citas16px','citas de 16 px'],['de64px','de 64 px'],['menos44px','menos 44 px'],[';2.5.5','; 2.5.5'],['requisitoAA','requisito AA'],['genéricoCONTIGO','genérico CONTIGO'],['deBUTTON aH2Medición','de BUTTON a H2 Medición'],['botónSOS','botón SOS'],['ConteoSOS','Conteo de SOS'],['Medición0->1','Medición de 0 a 1'],['deAA','de AA']];
  for(const key of ['title','before','adjustment','verification','status'])for(const[a,b]of replacements)f[key]=f[key].replaceAll(a,b);
  return {...f,priority:f.S*f.A,priorityLabel:f.S*f.A>=8?'Alta':f.S*f.A>=4?'Media':'Baja',severityBasis:'Estimación técnica del auditor; no resultado observado en participante.',sourceType:'Evidencia técnica automatizada y revisión de interfaz',wcagConformanceClaim:false};
});
const count=a=>({screens:a.screens.length,screensWithViolations:a.screens.filter(s=>s.axe.violations.length).length,ruleOccurrences:a.screens.reduce((n,s)=>n+s.axe.violations.length,0),nodeOccurrences:a.screens.reduce((n,s)=>n+s.axe.violations.reduce((m,v)=>m+v.nodes.length,0),0),incompleteOccurrences:a.screens.reduce((n,s)=>n+s.axe.incomplete.length,0),documentHorizontalOverflows:a.screens.filter(s=>s.layout.horizontalOverflow).map(s=>s.id)});
const comparison={timestamp:new Date().toISOString(),baseline:count(baseline),after:count(after),notes:['Los estados adicionales de revisión solo existen en v3 y no integran una comparación idéntica de capturas.','Ocurrencias cuentan reglas/nodos por captura; no equivalen a criterios WCAG ni usuarios.','Cero hallazgos automáticos no acredita conformidad AA.','Teclado T1 a T4 y zoom nativo real al200% ejecutados técnicamente. NVDA real cubre T1,T2,T4 y navegación/encabezados de T3; lectura completa de sus valores pendiente.','Verificación manual completa,Stark,Figma publicado y validación con personas pendientes.'],checks:{baseline:supplementalBaseline.checks,after:supplementalAfter.checks}};
const asciiJson=value=>JSON.stringify(value,null,2).replace(/[\u007f-\uffff]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
await fs.writeFile(path.join(out,'findings.json'),asciiJson({metadata:{date:new Date().toISOString(),status:'Inspección técnica; no conformidad integral',baselineCommit:baseline.metadata.baselineCommit},findings}));
await fs.writeFile(path.join(out,'comparison.json'),JSON.stringify(comparison,null,2));
console.log(JSON.stringify({baseline:comparison.baseline,after:comparison.after,findings:findings.length}));
