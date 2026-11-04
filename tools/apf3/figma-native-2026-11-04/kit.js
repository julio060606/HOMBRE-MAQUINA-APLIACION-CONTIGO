const page=await figma.getNodeByIdAsync('3:3');
await figma.setCurrentPageAsync(page);
const buttons={};const fields={};
const spacing=figma.variables.createVariableCollection('CONTIGO / Geometría');
for(const[name,value,scope]of [['Espacio/12',12,'GAP'],['Espacio/16',16,'GAP'],['Radio/12',12,'CORNER_RADIUS']]){
  const variable=figma.variables.createVariable(name,spacing,'FLOAT');variable.scopes=[scope];variable.setValueForMode(spacing.defaultModeId,value);variable.setVariableCodeSyntax('WEB',`var(--contigo-${name.toLowerCase().replace('/','-')})`);
}
const gapVariable=(await figma.variables.getLocalVariablesAsync('FLOAT')).find(v=>v.name==='Espacio/12');
const radiusVariable=(await figma.variables.getLocalVariablesAsync('FLOAT')).find(v=>v.name==='Radio/12');
const styles=[];
for(const size of [12,14,16,18,20,24,28,32,36,48]){
  const style=figma.createTextStyle();style.name=`CONTIGO / ${size>=24?'Título':'Texto'} / ${size}`;style.fontName={family:size>=24?'Plus Jakarta Sans':'Inter',style:size>=24?'Bold':'Regular'};style.fontSize=size;style.lineHeight={unit:'PERCENT',value:150};styles.push({id:style.id,size});
}
const intro=box(page,'03 · Kit accesible',1140,{padding:32,gap:16});intro.x=80;intro.y=80;
heading(intro,'03 · Kit accesible',0,1,32);
caption(intro,'Fundamentos de CONTIGO tomados del código vigente al 4 de noviembre de 2026. Inter para lectura y datos. Plus Jakarta Sans para títulos.');
caption(intro,'Estándar y alto contraste usan colecciones separadas compatibles con el plan Starter. Los controles tienen área mínima de 44 px.');
for(const mode of [0,1]){
  const row=box(intro,mode?'Alto contraste':'Estándar',1076,{mode,padding:16,gap:10});
  heading(row,mode?'Alto contraste':'Estándar',mode,1,20);
  for(const token of ['text','muted','action','danger','border']){
    const swatch=box(row,token,1044,{mode,padding:12,gap:0,bg:token==='border'?'surface':token});
    text(swatch,token,{mode,token:['text','muted','action','danger'].includes(token)?'onAction':'text',size:16});
    border(swatch,mode,'border');
  }
}
const states=['Normal','Hover','Foco','Activo','Deshabilitado','Error'];
const variants=[];
for(const[ri,role]of ['Primary','Secondary','Danger'].entries())for(const[si,state]of states.entries()){
  const component=track(figma.createComponent());page.appendChild(component);
  component.name=`Rol=${role}, Estado=${state}`;component.resize(320,56);component.layoutMode='VERTICAL';component.primaryAxisSizingMode='AUTO';component.counterAxisSizingMode='FIXED';component.minHeight=52;
  component.paddingTop=12;component.paddingBottom=12;component.paddingLeft=16;component.paddingRight=16;component.cornerRadius=12;component.itemSpacing=12;
  component.setBoundVariable('itemSpacing',gapVariable);component.setBoundVariable('topLeftRadius',radiusVariable);component.setBoundVariable('topRightRadius',radiusVariable);component.setBoundVariable('bottomLeftRadius',radiusVariable);component.setBoundVariable('bottomRightRadius',radiusVariable);
  const token=role==='Secondary'?'surface':role==='Danger'?'danger':'action';
  fill(component,0,state==='Deshabilitado'?'soft':state==='Hover'?'hover':state==='Activo'?'active':token);
  border(component,0,state==='Foco'?'focus':role==='Secondary'?'border':token,state==='Foco'?3:1);
  const label=text(component,state==='Deshabilitado'?'Guardando…':state==='Error'?'Reintentar':'Continuar',{size:16,bold:true,token:role==='Secondary'||state==='Deshabilitado'?'text':'onAction'});label.textAlignHorizontal='CENTER';
  component.description=`Control CONTIGO ${role}. Estado ${state}. La etiqueta describe la acción. Objetivo mínimo 44×44 px. Uso en flujos con teclado, tacto y voz.`;
  buttons[`${role}/${state}`]=component.id;variants.push(component);
}
const set=track(figma.combineAsVariants(variants,page));set.name='CONTIGO / Botón';set.x=1300;set.y=80;set.resize(2112,352);set.description='Tres roles y seis estados. Los modos de color proceden de variables semánticas.';
for(const[index,component]of variants.entries()){component.x=24+(index%6)*344;component.y=24+Math.floor(index/6)*100;}
const fieldVariants=[];
for(const[index,state]of states.entries()){
  const component=track(figma.createComponent());page.appendChild(component);component.name=`Estado=${state}`;component.layoutMode='VERTICAL';component.resize(320,150);component.primaryAxisSizingMode='AUTO';component.counterAxisSizingMode='FIXED';component.paddingTop=12;component.paddingBottom=12;component.paddingLeft=12;component.paddingRight=12;component.itemSpacing=8;component.cornerRadius=12;fill(component,0,'surface');border(component,0,state==='Error'?'danger':state==='Foco'?'focus':'border',state==='Error'||state==='Foco'?3:1);
  text(component,'Número de arriba · SYS',{size:14,bold:true});text(component,'120',{size:32,bold:true});caption(component,'mmHg');
  if(state==='Error')text(component,'Revisa el número de tu equipo.',{size:14,token:'danger'});
  component.description=`Entrada numérica con etiqueta y unidad. Estado ${state}. El error se asocia al campo y se anuncia al validar.`;
  fields[state]=component.id;fieldVariants.push(component);
}
const fieldSet=track(figma.combineAsVariants(fieldVariants,page));fieldSet.name='CONTIGO / Campo numérico';fieldSet.x=1300;fieldSet.y=520;fieldSet.resize(1100,620);
for(const[index,component]of fieldVariants.entries()){component.x=24+(index%3)*352;component.y=24+Math.floor(index/3)*280;}
const external=await figma.importComponentSetByKeyAsync('cc8b558dc7d9684011b6b99ce8e6509399bc836b');
const specimen=box(page,'Referencia reutilizada · Simple Design System',900,{padding:24});specimen.x=80;specimen.y=1440;
heading(specimen,'Biblioteca de referencia',0,1,24);caption(specimen,'Button de Simple Design System se conserva como instancia de referencia. Los controles CONTIGO se adaptan a su identidad y dimensiones propias.');
const externalMaster=external.children.find(node=>node.type==='COMPONENT');const instance=track(externalMaster.createInstance());specimen.appendChild(instance);
const notes=box(page,'04 · Anotaciones de accesibilidad',1140,{padding:32,gap:20});notes.x=80;notes.y=1840;
heading(notes,'04 · Anotaciones de accesibilidad',0,1,32);
const items=[
  ['T1 · Registrar y corregir toma','Foco 1 Opciones de lectura, 2 Comunicarme, 3 SOS, 4 Escuchar, 5 Ya la tomé, 6 No la tomé. Al registrar se enfoca el mensaje de estado. Corregir pide motivo y permite cancelar. WCAG 2.1.1, 2.4.3, 2.4.7, 3.3.4, 4.1.3.'],
  ['T2 · Pedir ayuda','Primer toque registra solicitud en web. Esperando respuesta precede a la aceptación. Texto siempre disponible. Voz requiere permiso y gesto explícito. Finalizar apaga el micrófono. WCAG 1.4.1, 2.1.1, 3.3.2, 4.1.2, 4.1.3.'],
  ['T3 · Consultar seguimiento','Selector anuncia Paciente en seguimiento. Menú identifica página actual. Cada dato incluye unidad y procedencia. Lecturas de gráfica disponibles también en texto. WCAG 1.3.1, 3.2.3, 3.2.4, 4.1.2.'],
  ['T4 · Recuperarse de un error','Número de arriba y Número de abajo tienen etiqueta persistente, unidad y error asociado. El valor inferior debe ser menor al superior. Revisar antecede a guardar. WCAG 3.3.1, 3.3.2, 3.3.3, 3.3.4.'],
  ['Escala y lectura','La variante amplía la tipografía al 200 %, recompone las columnas y conserva desplazamiento vertical. La web permite teclado y lector. El recorrido de lector de pantalla y el zoom nativo se documentan por separado. WCAG 1.4.4, 1.4.10, 1.4.12.'],
  ['Imágenes y alternativas','Fotografía de medicamento con texto Foto de referencia. El nombre y dosis se leen en texto. Avatar decorativo con alternativa vacía. Iconos acompañados de etiqueta visible. WCAG 1.1.1, 2.5.3.'],
  ['Contraste y Stark','Pares principales listos para medir en Stark. Guardar capturas y ratios obtenidos en el plugin. Simulación de daltonismo y baja visión pendiente de ejecución.'],
  ['Alcance de esta demo','En Presentar se recorren casos de ejemplo. Los campos seleccionan estados predeterminados. La llamada muestra estados del diseño. La aplicación web implementa entrada libre, persistencia y WebRTC entre dos cuentas. Validación con participantes pendiente.']
];
for(const[title,body]of items){const note=panel(notes,title);heading(note,title,0,1,20);text(note,body);}
return {createdNodeIds,mutatedNodeIds,buttons,fields,styles,kit: intro.id,annotations:notes.id,componentSet:set.id,fieldSet:fieldSet.id};
