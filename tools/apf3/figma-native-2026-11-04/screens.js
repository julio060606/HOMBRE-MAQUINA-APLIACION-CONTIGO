const page=await figma.getNodeByIdAsync('3:2');
await figma.setCurrentPageAsync(page);
const screens={};
const add=(key,title,column,row,options={})=>{
  const screen=frame(page,key,title,0,{x:80+column*510,y:100+row*1100,...options});
  screens[key]=screen;return screen;
};
function action(screen,label,target,role='Primary',parent=screen.content){return button(parent,label,{mode:screen.mode,scale:screen.scale,target,role,screen});}
function card(screen,title,body=''){
  const node=panel(screen.content,title,{mode:screen.mode});heading(node,title,screen.mode,screen.scale,20);
  if(body)text(node,body,{size:16*screen.scale,mode:screen.mode,token:'muted'});return node;
}
function photo(parent,name,width,height){const node=track(figma.createRectangle());parent.appendChild(node);node.name=`Foto de referencia · ${name}`;node.resize(width,height);node.cornerRadius=12;node.fills=[{type:'IMAGE',imageHash:IMAGES[name],scaleMode:'FILL'}];accessibilityNotes.push({id:node.id,label:name==='losartan_pill.jpg'?'Foto ilustrativa de Losartán. El nombre y dosis están disponibles como texto.':'Imagen decorativa. Alternativa vacía.'});return node;}
function appHeader(screen){
  text(screen.content,'CONTIGO',{size:18*screen.scale,heading:true,mode:screen.mode,token:'action'});
  caption(screen.content,'Mi cuidado diario',screen.mode,screen.scale);
  action(screen,'Opciones de lectura','reading-options','Secondary');
  action(screen,'Comunicarme','communication','Secondary');
  action(screen,'SOS · Pedir ayuda','sos-waiting','Danger');
}
function medication(screen,state='pending'){
  const node=card(screen,'Losartán','Dosis recetada · 50 mg');
  caption(node,'08:00 · '+(state==='taken'?'Tomada':state==='not-taken'?'No tomada':'Por confirmar'),screen.mode,screen.scale);
  photo(node,'losartan_pill.jpg',76,68);
  caption(node,'Foto de referencia',screen.mode,screen.scale);
  text(node,'Tomar con agua. Indicación del profesional ficticio.',{size:16*screen.scale,mode:screen.mode});
  if(state==='pending'){
    action(screen,'Ya la tomé','patient-recorded','Primary',node);
    action(screen,'No la tomé','patient-not-taken','Secondary',node);
  }else{
    text(node,state==='taken'?'Toma confirmada':'Marcada como no tomada',{size:18*screen.scale,bold:true,mode:screen.mode});
    action(screen,'Corregir respuesta','patient-correction','Secondary',node);
  }
  action(screen,'Ver detalles del medicamento','medication-details','Secondary',node);
}
function measurement(screen,state){
  top(screen,'Registrar medición');
  caption(screen.content,'Una lectura de tu equipo, paso a paso.',screen.mode,screen.scale);
  const review=state==='review'||state==='weight-review';
  const weight=state.startsWith('weight');
  if(state==='saved'){
    const saved=card(screen,'Medición guardada','Tu lectura quedó registrada.');
    text(saved,'120 / 80 mmHg\nPulso no registrado',{size:20*screen.scale,bold:true,mode:screen.mode});
    action(screen,'Registrar otra medición','measurement-input');
    action(screen,'Volver al inicio','patient-home','Secondary');return;
  }
  text(screen.content,review?'1 Ingresa los valores  ✓\n2 Revisa y guarda':'1 Ingresa los valores\n2 Revisa y guarda',{size:14*screen.scale,bold:true,mode:screen.mode});
  if(review){
    heading(screen.content,'¿Los valores son correctos?',screen.mode,screen.scale,20);
    caption(screen.content,'Compáralos con la pantalla de tu equipo.',screen.mode,screen.scale);
    card(screen,weight?'72,5 kg':'120 / 80 mmHg',weight?'Peso registrado':'Pulso no registrado');
    action(screen,'Guardar medición','measurement-saved');
    action(screen,'Corregir números',weight?'weight-input':'measurement-filled','Secondary');return;
  }
  action(screen,'Presión','measurement-input',weight?'Secondary':'Primary');
  action(screen,'Peso','weight-input',weight?'Primary':'Secondary');
  if(weight){input(screen.content,'Peso en kg','72,5',{mode:screen.mode,scale:screen.scale});caption(screen.content,'Puedes usar coma o punto decimal.',screen.mode,screen.scale);}
  else{
    caption(screen.content,'Copia los dos números de tu tensiómetro.',screen.mode,screen.scale);
    const error=state==='error';const filled=state==='filled';
    input(screen.content,'Número de arriba · SYS',error?'80':filled?'120':'—',{mode:screen.mode,scale:screen.scale,screen,target:'measurement-filled'});
    input(screen.content,'Número de abajo · DIA',error?'120':filled?'80':'—',{mode:screen.mode,scale:screen.scale,error:error?'El número de abajo debe ser menor que el de arriba. Revisa ambos.':'',screen,target:'measurement-filled'});
    action(screen,'Añadir pulso · opcional','measurement-pulse','Secondary');
  }
  action(screen,'Revisar medición',weight?'weight-review':state==='filled'?'measurement-review':'measurement-error');
  caption(screen.content,'Primero revisas. Después decides guardar.',screen.mode,screen.scale);
}
function dashboard(screen,{requests=false,accepted=false,tab='Resumen'}={}){
  const root=screen.content;root.paddingLeft=24;root.paddingRight=24;
  const nav=box(root,'Navegación principal',root.width-48,{mode:screen.mode,padding:12,gap:10,row:true,bg:'surface',radius:12});
  text(nav,'CONTIGO',{size:20,bold:true,width:200,token:'action'});
  for(const[label,target]of [['Resumen','caregiver-summary'],['Medicamentos','caregiver-treatment'],['Mediciones','caregiver-measurements'],['Citas','caregiver-appointments']]){
    const link=box(nav,`Navegación · ${label}`,180,{padding:10,gap:0,bg:label===tab?'soft':'surface',radius:10});text(link,label,{size:16,bold:true,width:160});screen.links.push({id:link.id,target});
  }
  caption(root,'Paciente en seguimiento · Dacio Ramos');
  if(requests){const sos=panel(root,'Solicitud SOS',{padding:16});border(sos,0,'danger',2);heading(sos,accepted?'Solicitud aceptada':'Dacio espera respuesta',0,1,20);caption(sos,'Clínica de demostración · voz o mensajes');action(screen,accepted?'Abrir conversación':'Atender solicitud',accepted?'caregiver-conversation':'caregiver-accepted','Primary',sos);}
  else caption(root,'Solicitudes SOS · Sin solicitudes abiertas');
  heading(root,tab==='Resumen'?'Resumen del día':tab,0,1,28);
  if(tab==='Resumen'){
    const patient=panel(root,'Paciente seleccionado',{bg:'soft'});heading(patient,'Dacio Ramos',0,1,24);caption(patient,'78 años · Papá · Datos sincronizados');
    const metrics=box(root,'Lo esencial del seguimiento',root.width-48,{padding:0,gap:16,row:true,bg:'background'});
    for(const[title,value,detail,target]of [['Tomas de hoy','1 de 3','Declaradas como tomadas','caregiver-treatment'],['Última medición','120 / 80','Presión · mmHg','caregiver-measurements'],['Próxima cita','9 nov.','Geriatría · 10:30','caregiver-appointments']]){
      const c=box(metrics,title,(metrics.width-32)/3,{padding:20,gap:12,radius:16});border(c,0);heading(c,title,0,1,18);heading(c,value,0,1,28);caption(c,detail);action(screen,'Ver '+(title==='Tomas de hoy'?'tratamiento':title==='Última medición'?'mediciones':'citas'),target,'Secondary',c);
    }
    const c=panel(root,'Medicamentos de hoy');heading(c,'Medicamentos de hoy',0,1,20);text(c,'08:00  ·  Losartán 50 mg  ·  Tomada\n12:00  ·  Vitamina D3  ·  Por confirmar');
    action(screen,'Tratamiento completo','caregiver-treatment','Secondary',c);
    action(screen,'Preparar un informe','caregiver-report','Secondary');
  }else if(tab==='Medicamentos'){
    const c=panel(root,'Tratamiento actual');heading(c,'Losartán · 50 mg',0,1,24);text(c,'08:00 · vía oral\nDiagnóstico indicado en receta\nI10 · Hipertensión esencial\nProfesional ficticio · clínica de demostración');
    const stock=panel(root,'Existencias');heading(stock,'Vitamina D3',0,1,20);caption(stock,'1 tableta disponible · revisar existencias');
  }else if(tab==='Mediciones'){
    const c=panel(root,'Últimas lecturas');heading(c,'Lecturas de presión',0,1,24);text(c,'3 nov. · 08:15 · 120 / 80 mmHg\nPulso no registrado\nOrigen · casa\n\n2 nov. · 08:10 · 127 / 83 mmHg\nPulso · 72 lpm\nOrigen · casa');
  }else if(tab==='Citas'){
    const c=panel(root,'Próxima cita');heading(c,'Geriatría',0,1,24);text(c,'9 de noviembre de 2026\nHora · 10:30\nProfesional ficticio\nSede de demostración · consultorio 02');
  }
  action(screen,'Volver al resumen','caregiver-summary','Secondary');action(screen,'Volver al acceso','login','Secondary');
}
function buildPatient(screen,key){
  if(key==='patient-home'){
    appHeader(screen);heading(screen.content,'Hola, Dacio',screen.mode,screen.scale);medication(screen);
    action(screen,'Registrar medición','measurement-input','Secondary');action(screen,'Mis próximas citas','patient-appointments','Secondary');action(screen,'Salir','login','Secondary');return;
  }
  if(key==='patient-recorded'||key==='patient-not-taken'){
    top(screen,'Mi respuesta');medication(screen,key==='patient-recorded'?'taken':'not-taken');action(screen,'Volver al inicio','patient-home','Secondary');return;
  }
  if(key==='patient-correction'){
    top(screen,'Corregir mi respuesta');caption(screen.content,'Losartán · 08:00');input(screen.content,'Motivo de la corrección','Me equivoqué al tocar.',{mode:screen.mode,scale:screen.scale});caption(screen.content,'Elige la respuesta correcta. Puedes cancelar para conservar el registro.',screen.mode,screen.scale);
    action(screen,'Ya la tomé','patient-recorded');action(screen,'No la tomé','patient-not-taken','Secondary');action(screen,'Cancelar corrección','patient-recorded','Secondary');return;
  }
  if(key==='medication-details'){
    top(screen,'Mi medicamento');card(screen,'Losartán · 50 mg','08:00 · tomar con agua.');card(screen,'Diagnóstico de la receta','I10 · Hipertensión esencial. Profesional ficticio.');return;
  }
  if(key==='patient-appointments'){
    top(screen,'Mis próximas citas');caption(screen.content,'Programadas por la clínica del proyecto.');card(screen,'Geriatría','9 nov. 2026\nHora · 10:30\nSede de demostración');return;
  }
  if(key.startsWith('measurement-')||key.startsWith('weight-')){
    if(key==='measurement-pulse'){
      top(screen,'Añadir pulso');input(screen.content,'Pulso (opcional)','72 lpm',{mode:screen.mode,scale:screen.scale});caption(screen.content,'Puedes dejarlo vacío si tu equipo no lo muestra.');action(screen,'Continuar sin pulso','measurement-filled','Secondary');action(screen,'Revisar lectura','measurement-review');return;
    }
    const state=key.replace('measurement-','').replace('weight-input','weight-input');measurement(screen,state);return;
  }
  if(key==='reading-options'){
    top(screen,'Opciones de lectura');caption(screen.content,'CONTIGO, a tu manera',screen.mode,screen.scale);
    for(const[label,target]of [['Texto habitual · 100 %','patient-home'],['Texto ampliado · 200 %','large-home'],['Alto contraste','high-home']])action(screen,label,target,'Secondary');
    card(screen,'Sonido y avisos','Modo sin sonido · todas las confirmaciones por escrito.');action(screen,'Listo','patient-home');return;
  }
  if(key==='communication'){
    top(screen,'Comunicarme');caption(screen.content,'Para conversar con una persona cercana.');action(screen,'Necesito agua','communication-message','Secondary');action(screen,'Prefiero comunicarme por escrito','communication-message','Secondary');action(screen,'Escribir un mensaje','communication-message');return;
  }
  if(key==='communication-message'){
    top(screen,'Mi mensaje', {back:'communication'});card(screen,'Prefiero comunicarme por escrito','Puedes mostrar este mensaje a la persona que está contigo.');input(screen.content,'Respuesta de la otra persona','Te leo. ¿Qué necesitas?',{mode:screen.mode,scale:screen.scale});action(screen,'Limpiar y volver','communication','Secondary');return;
  }
  if(key.startsWith('sos-')){
    top(screen,'Pedir ayuda');caption(screen.content,'Clínica de demostración',screen.mode,screen.scale);
    const waiting=key==='sos-waiting',ended=key==='sos-ended';
    card(screen,ended?'Conversación finalizada':waiting?'Esperando respuesta':'Cuidador de demostración te atiende',ended?'El micrófono está apagado.':waiting?'Tu solicitud está en el dashboard.':'Ya pueden hablar o escribir.');
    if(!ended){
      if(waiting)action(screen,'Continuar demo · atienden mi solicitud','sos-accepted','Secondary');
      else action(screen,'Activar micrófono','sos-audio','Secondary');
      input(screen.content,'Escribe tu mensaje','Prefiero comunicarme por escrito.',{mode:screen.mode,scale:screen.scale});
      if(key==='sos-text')card(screen,'Mensajes','Tú · Prefiero comunicarme por escrito.\nCuidador · Te leo. ¿Qué necesitas?');
      if(key==='sos-audio')card(screen,'Audio conectado','Micrófono encendido · estado ilustrativo de la llamada.');
      action(screen,'Enviar mensaje','sos-text');action(screen,'Finalizar y volver','sos-ended','Secondary');
    }else action(screen,'Volver a la aplicación','patient-home');
    caption(screen.content,'Prototipo académico. No contacta servicios de emergencia.',screen.mode,screen.scale);return;
  }
}

const patientKeys=['patient-home','patient-recorded','patient-not-taken','patient-correction','medication-details','patient-appointments','measurement-input','measurement-filled','measurement-error','measurement-review','measurement-saved','weight-input','weight-review','measurement-pulse','reading-options','communication','communication-message','sos-waiting','sos-accepted','sos-text','sos-audio','sos-ended'];
for(const[index,key]of patientKeys.entries()){
  const screen=add(key,key,1+index%5,1+Math.floor(index/5));buildPatient(screen,key);
}
const landing=add('landing','Inicio de CONTIGO',0,0,{width:960,height:820});
text(landing.content,'CONTIGO',{size:24,heading:true,token:'action'});caption(landing.content,'Inicio   ·   Cómo funciona   ·   Clínica');heading(landing.content,'El cuidado diario,\nmás cerca de ti.',0,1,36);
text(landing.content,'Una app sencilla para registrar tomas y mediciones, y acompañar el seguimiento desde casa.');photo(landing.content,'caregiver_senior.jpg',320,200);action(landing,'Iniciar sesión','login');action(landing,'Entrar como paciente','login-patient','Secondary');action(landing,'Entrar como cuidador','login','Secondary');
for(const[key,patient]of [['login',false],['login-patient',true]]){
  const screen=add(key,'Iniciar sesión',key==='login'?2:3,0);top(screen,'Iniciar sesión',{back:'landing'});caption(screen.content,'Entra a tu espacio de cuidado.');input(screen.content,'Correo electrónico',patient?'dacio@contigo.example':'cuidador@contigo.example');input(screen.content,'Contraseña','••••••••••••');action(screen,'Entrar',patient?'patient-home':'caregiver-summary');action(screen,'Cambiar cuenta de prueba',patient?'login':'login-patient','Secondary');caption(screen.content,'Demostración académica · datos ficticios');
}
const dashboards=[['caregiver-summary',{}],['caregiver-treatment',{tab:'Medicamentos'}],['caregiver-measurements',{tab:'Mediciones'}],['caregiver-appointments',{tab:'Citas'}],['caregiver-requests',{requests:true}],['caregiver-accepted',{requests:true,accepted:true}]];
for(const[index,[key,options]]of dashboards.entries()){const screen=add(key,key,0,0,{width:1280,height:900,x:3300,y:100+index*1060});dashboard(screen,options);}
const conversation=add('caregiver-conversation','Atender a Dacio',0,0,{width:640,x:3300,y:6600});top(conversation,'Atender a Dacio',{back:'caregiver-summary'});card(conversation,'Solicitud aceptada','Ya puedes responder por voz o por texto.');action(conversation,'Activar micrófono','caregiver-audio','Secondary');card(conversation,'Mensajes','Dacio · Prefiero comunicarme por escrito.');input(conversation.content,'Escribe tu mensaje','Te leo. ¿Qué necesitas?');action(conversation,'Enviar mensaje','caregiver-audio');action(conversation,'Finalizar atención','caregiver-summary','Secondary');
const audio=add('caregiver-audio','Conversación con Dacio',0,0,{width:640,x:4050,y:6600});top(audio,'Conversación con Dacio',{back:'caregiver-summary'});card(audio,'Audio conectado','Micrófono encendido · estado ilustrativo.');card(audio,'Mensajes','Dacio · Prefiero comunicarme por escrito.\nTú · Te leo. ¿Qué necesitas?');action(audio,'Apagar audio y seguir por escrito','caregiver-conversation','Secondary');action(audio,'Finalizar atención','caregiver-summary');
const report=add('caregiver-report','Preparar informe',0,0,{width:640,x:4800,y:6600});top(report,'Preparar un informe',{back:'caregiver-summary'});card(report,'Resumen para la consulta','Tratamiento · Mediciones · Avisos\nPeriodo de ejemplo · últimos 30 días');action(report,'Volver al resumen','caregiver-summary');
for(const[index,[key,title,body]]of [['loading','Cargando información','Comprobando tus registros…'],['network-error','No se pudo conectar','Comprueba tu conexión y vuelve a intentarlo. Tus registros anteriores se conservan.'],['empty','Sin registros todavía','Las mediciones aparecerán cuando registres una lectura.']].entries()){
 const screen=add(key,title,4+index,0);top(screen,title);caption(screen.content,body);action(screen,key==='network-error'?'Reintentar':'Continuar','patient-home');
}
for(const [key,mode,scale,x]of [['high-home',1,1,4800],['large-home',0,2,5350]]){
  const screen=add(key,key,0,0,{mode,scale,x,y:100});appHeader(screen);heading(screen.content,'Hola, Dacio',mode,scale);medication(screen);action(screen,'Registrar medición',key==='high-home'?'high-measurement':'large-measurement','Secondary');action(screen,'Volver a texto habitual','patient-home','Secondary');
  // The variant keeps its own reading controls and task path.
  for(const link of screen.links){if(link.target==='reading-options')link.target=key==='high-home'?'high-options':'large-options';}
}
for(const [key,mode,scale,x]of [['high-measurement',1,1,4800],['large-measurement',0,2,5350]]){
  const screen=add(key,key,0,0,{mode,scale,x,y:1200});measurement(screen,'error');for(const link of screen.links){if(link.target==='patient-home')link.target=mode?'high-home':'large-home';if(link.target==='measurement-filled')link.target=mode?'high-review':'large-review';}
}
for(const [key,mode,scale,x]of [['high-review',1,1,4800],['large-review',0,2,5350]]){
  const screen=add(key,key,0,0,{mode,scale,x,y:2300});measurement(screen,'review');
}
for(const [key,mode,scale,x]of [['high-options',1,1,4800],['large-options',0,2,5350]]){
  const screen=add(key,key,0,0,{mode,scale,x,y:3400});top(screen,'Opciones de lectura',{back:mode?'high-home':'large-home'});action(screen,'Texto habitual · 100 %','patient-home','Secondary');action(screen,'Texto ampliado · 200 %','large-home','Secondary');action(screen,'Alto contraste','high-home','Secondary');action(screen,'Listo',mode?'high-home':'large-home');
}
await Promise.all(styleTasks);
const reactions=await connect(screens);
page.flowStartingPoints=[{nodeId:screens.landing.frame.id,name:'Inicio · Acceso y navegación'},{nodeId:screens['patient-home'].frame.id,name:'T1 · Toma y corrección'},{nodeId:screens['sos-waiting'].frame.id,name:'T2 · Pedir ayuda'},{nodeId:screens['caregiver-summary'].frame.id,name:'T3 · Seguimiento del cuidador'},{nodeId:screens['measurement-input'].frame.id,name:'T4 · Error, revisión y guardado'},{nodeId:screens['high-home'].frame.id,name:'Alto contraste'},{nodeId:screens['large-home'].frame.id,name:'Texto ampliado · 200 %'}];
return {createdNodeIds,mutatedNodeIds,reactions,annotationCount:accessibilityNotes.length,frames:Object.fromEntries(Object.entries(screens).map(([key,screen])=>[key,{id:screen.frame.id,width:screen.frame.width,height:screen.frame.height,contentHeight:screen.content.height,links:screen.links}]))};
