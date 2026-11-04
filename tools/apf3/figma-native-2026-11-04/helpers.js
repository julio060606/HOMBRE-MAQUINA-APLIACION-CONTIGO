const createdNodeIds = [];
const mutatedNodeIds = [];
const styleTasks=[]; const accessibilityNotes=[];
await figma.loadFontAsync({family:'Inter',style:'Regular'});
await figma.loadFontAsync({family:'Inter',style:'Bold'});
await figma.loadFontAsync({family:'Plus Jakarta Sans',style:'Bold'});
const variableHandles = {};
for (const [mode, values] of Object.entries(FOUNDATIONS.vars)) {
  variableHandles[mode] = {};
  for (const [name, id] of Object.entries(values)) variableHandles[mode][name] = await figma.variables.getVariableByIdAsync(id);
}
function track(node) { createdNodeIds.push(node.id); return node; }
function paint(mode, token) {
  const variable = variableHandles[mode][token];
  const hex=COLOR_VALUES[token][mode];
  const color={r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255};
  return figma.variables.setBoundVariableForPaint({type:'SOLID',color},'color',variable);
}
function fill(node, mode, token) { node.fills = [paint(mode, token)]; }
function border(node, mode, token='line', weight=1) { node.strokes=[paint(mode,token)];node.strokeWeight=weight; }
function box(parent,name,width,{mode=0,padding=16,gap=12,row=false,bg='surface',radius=0}={}) {
  const node=track(figma.createAutoLayout(row?'HORIZONTAL':'VERTICAL'));
  parent.appendChild(node);node.name=name;node.resize(width,100);
  node.primaryAxisSizingMode=row?'FIXED':'AUTO';node.counterAxisSizingMode=row?'AUTO':'FIXED';
  node.paddingTop=padding;node.paddingBottom=padding;node.paddingLeft=padding;node.paddingRight=padding;
  node.itemSpacing=gap;node.cornerRadius=radius;node.clipsContent=false;fill(node,mode,bg);
  return node;
}
function text(parent,value,{size=16,bold=false,heading=false,mode=0,token='text',width}={}) {
  const node=track(figma.createText());parent.appendChild(node);
  node.name=value.slice(0,70);node.fontName={family:heading?'Plus Jakarta Sans':'Inter',style:heading||bold?'Bold':'Regular'};
  node.fontSize=size;node.lineHeight={unit:'PERCENT',value:150};node.characters=value;
  const useWidth=width??Math.max(40,parent.width-parent.paddingLeft-parent.paddingRight);
  node.resize(useWidth,size*1.5);node.textAutoResize='HEIGHT';fill(node,mode,token);
  const style=STYLE_IDS?.find(item=>item.size===size && (heading?size>=24:!bold&&size<24));
  if(style)styleTasks.push(node.setTextStyleIdAsync(style.id));
  return node;
}
function caption(parent,value,mode=0,scale=1) { return text(parent,value,{size:14*scale,mode,token:'muted'}); }
function heading(parent,value,mode=0,scale=1,size=24) { return text(parent,value,{size:size*scale,bold:true,heading:true,mode}); }
function panel(parent,name,{mode=0,padding=16,gap=12,bg='surface'}={}) {
  const node=box(parent,name,parent.width-parent.paddingLeft-parent.paddingRight,{mode,padding,gap,bg,radius:16});
  border(node,mode);return node;
}
function button(parent,label,{mode=0,role='Primary',state='Normal',target=null,screen=null,scale=1}={}) {
  const master=MASTERS?.buttons?.[`${role}/${state}`];
  const node=master?track(master.createInstance()):box(parent,'Button',parent.width-parent.paddingLeft-parent.paddingRight,{mode,padding:12});
  if(master)parent.appendChild(node);
  node.name=`Botón · ${label}`;node.resize(parent.width-parent.paddingLeft-parent.paddingRight,52);
  node.primaryAxisSizingMode='AUTO';node.minHeight=52;node.counterAxisSizingMode='FIXED';
  const labelNode=master?node.findOne(child=>child.type==='TEXT'):text(node,label,{bold:true});
  if(master)mutatedNodeIds.push(labelNode.id);
  labelNode.characters=label;labelNode.fontSize=16*scale;
  labelNode.resize(Math.max(40,node.width-node.paddingLeft-node.paddingRight),24*scale);labelNode.textAutoResize='HEIGHT';
  labelNode.textAlignHorizontal='CENTER';
  const bg=role==='Secondary'?'surface':role==='Danger'?'danger':'action';
  fill(node,mode,state==='Deshabilitado'?'soft':state==='Hover'?'hover':state==='Activo'?'active':bg);
  fill(labelNode,mode,role==='Secondary'||state==='Deshabilitado'?'text':'onAction');
  border(node,mode,state==='Foco'?'focus':role==='Secondary'?'border':bg,state==='Foco'?3:1);
  accessibilityNotes.push({id:node.id,label:`Nombre accesible «${label}». Orden de foco indicado en pantalla. Objetivo mínimo 44 px. Estado ${state}.`});
  if(target&&screen)screen.links.push({id:node.id,target});
  return node;
}
function input(parent,label,value,{mode=0,scale=1,error='',screen=null,target=null}={}) {
  const node=panel(parent,`Campo · ${label}`,{mode,padding:12,gap:6});
  text(node,label,{size:14*scale,bold:true,mode});
  text(node,value||'—',{size:18*scale,mode});
  border(node,mode,error?'danger':'border',error?2:1);
  if(error)text(node,error,{size:14*scale,mode,token:'danger'});
  accessibilityNotes.push({id:node.id,label:`Etiqueta ${label}. ${error?'Error asociado e invalid=true. ':''}En el prototipo se usan valores de ejemplo seleccionables. Entrada libre disponible en la web.`});
  if(target&&screen)screen.links.push({id:node.id,target});
  return node;
}
function frame(page,key,title,index,{width=390,height=844,mode=0,scale=1,x=80,y=80}={}) {
  const node=box(page,key,width,{mode,padding:0,gap:0,bg:'background',radius:20});
  node.x=x;node.y=y+index*(height+160);node.resize(width,height);node.primaryAxisSizingMode='FIXED';node.clipsContent=true;border(node,mode);
  const viewport=box(node,'Área desplazable',width,{mode,padding:0,gap:0,bg:'background'});
  viewport.resize(width,height);viewport.primaryAxisSizingMode='FIXED';viewport.clipsContent=true;viewport.overflowDirection='VERTICAL';
  const content=box(viewport,'Contenido en orden de lectura',width,{mode,padding:16,gap:16,bg:'background'});
  const screen={key,frame:node,content,links:[],mode,scale,title};
  accessibilityNotes.push({id:node.id,label:`${title}. Orden de lectura de arriba abajo. Texto ${scale*100} %. ${mode?'Alto contraste. ':''}Demostración navegable con datos sintéticos. Validar teclado y lector en la web implementada.`});
  return screen;
}
function top(screen,title,{back='patient-home',logout=false}={}) {
  const {content,mode,scale}=screen;
  const brand=box(content,'Cabecera CONTIGO',content.width-content.paddingLeft-content.paddingRight,{mode,padding:0,gap:8});
  text(brand,'CONTIGO',{size:18*scale,bold:true,heading:true,mode,token:'action'});
  if(logout)button(brand,'Salir',{mode,role:'Secondary',screen,target:'login'});
  if(back)button(content,'Volver',{mode,role:'Secondary',screen,target:back,scale});
  heading(content,title,mode,scale);
}
async function connect(screens) {
  let count=0;
  for(const screen of Object.values(screens))for(const link of screen.links){
    const node=await figma.getNodeByIdAsync(link.id);
    const target=screens[link.target];
    if(!target)throw Error(`Destino ausente ${screen.key} → ${link.target}`);
    if(target.frame.id===screen.frame.id)continue;
    await node.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:target.frame.id,navigation:'NAVIGATE',transition:null,resetScrollPosition:true}]}]);
    mutatedNodeIds.push(node.id);count++;
  }
  return count;
}
