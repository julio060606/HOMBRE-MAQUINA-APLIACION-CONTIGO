import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const rootPath=path.resolve(here,'../../..');
const output=path.join(rootPath,'output/apf3/figma');
const nodes=new Map(); let counter=0; let finish;
const completed=new Promise(resolve=>{finish=resolve;});
class Node {
 constructor(type){this.id=String(++counter);this.type=type;this.name='';this.children=[];this.width=100;this.height=100;this.paddingLeft=0;this.paddingRight=0;this.paddingTop=0;this.paddingBottom=0;this.data={};this.reactions=[];nodes.set(this.id,this);}
 appendChild(child){if(child.parent){child.parent.children=child.parent.children.filter(item=>item!==child);} child.parent=this;this.children.push(child);}
 resize(width,height){assert(Number.isFinite(width)&&width>0);assert(Number.isFinite(height)&&height>0);this.width=width;this.height=height;}
 findOne(predicate){for(const child of this.children){if(predicate(child))return child;const result=child.findOne(predicate);if(result)return result;}return null;}
 setPluginData(key,value){this.data[key]=value;} getPluginData(key){return this.data[key]??'';}
 async setTextStyleIdAsync(id){assert(nodes.has(id),'text style must exist');this.textStyleId=id;}
 async setReactionsAsync(reactions){for(const reaction of reactions){assert.equal(reaction.trigger.type,'ON_CLICK');assert(reaction.actions.length>0);for(const action of reaction.actions){assert(nodes.has(action.destinationId),'destination must exist');assert.equal(action.navigation,'NAVIGATE');const pageOf=node=>node.type==='PAGE'?node:node.parent?pageOf(node.parent):null;assert.equal(pageOf(this),pageOf(nodes.get(action.destinationId)),'destinations must remain on the same page');}}this.reactions=JSON.parse(JSON.stringify(reactions));}
 createInstance(){assert.equal(this.type,'COMPONENT');const clone=(origin,type=origin.type)=>{const copy=new Node(type);for(const [key,value] of Object.entries(origin)){if(!['id','children','parent','type'].includes(key))copy[key]=typeof value==='object'?JSON.parse(JSON.stringify(value)):value;}copy.children=[];for(const child of origin.children)copy.appendChild(clone(child));return copy;};return clone(this,'INSTANCE');}
 set flowStartingPoints(value){assert.equal(new Set(value.map(item=>item.nodeId)).size,value.length,'flow starts should use unique nodes');for(const item of value)assert(nodes.has(item.nodeId));this.starts=value;}
 get flowStartingPoints(){return this.starts??[];}
}
const root=new Node('DOCUMENT');
const initial=new Node('PAGE');initial.name='Existing content must remain';root.appendChild(initial);
const create=type=>{const node=new Node(type);figma.currentPage.appendChild(node);return node;};
const figma={root,currentPage:initial,async loadFontAsync(font){assert(['Regular','Bold'].includes(font.style));},async setCurrentPageAsync(page){assert.equal(page.type,'PAGE');this.currentPage=page;},createPage(){const node=new Node('PAGE');root.appendChild(node);return node;},createFrame:()=>create('FRAME'),createText:()=>create('TEXT'),createComponent:()=>create('COMPONENT'),createRectangle:()=>create('RECTANGLE'),createPaintStyle:()=>new Node('PAINT_STYLE'),createTextStyle:()=>new Node('TEXT_STYLE'),base64Decode:value=>new Uint8Array(Buffer.from(value,'base64')),createImage(bytes){assert.equal(Buffer.from(bytes).readUInt32BE(0),0x89504e47,'embedded asset must be a PNG');return{hash:'test-png-'+bytes.length};},combineAsVariants(variants,parent){assert(variants.length>0);const node=new Node('COMPONENT_SET');parent.appendChild(node);for(const variant of variants){assert.equal(variant.type,'COMPONENT');node.appendChild(variant);}return node;},viewport:{scrollAndZoomIntoView(selection){assert(selection.length>0);}},notify(message){figma.notifications.push(message);},notifications:[],closePlugin(message){finish(message);}};
vm.runInNewContext(fs.readFileSync(path.join(output,'code.js'),'utf8'),{figma,Uint8Array,Map,Set,Promise,JSON,Math,Number,parseInt,String,Error},{filename:'code.js'});
const message=await Promise.race([completed,new Promise((_,reject)=>setTimeout(()=>reject(new Error('mock timed out')),10000))]);
const generation=JSON.parse(root.getPluginData('contigoApf3LastGeneration')||'null');
assert(generation,'generator reached success path');assert.equal(generation.pages.length,6);assert.equal(generation.screens,105);assert.equal(root.children[0],initial,'existing page preserved');
const pages=root.children.slice(1);assert(pages.every(p=>p.type==='PAGE'));
const sets=[...nodes.values()].filter(n=>n.type==='COMPONENT_SET');assert.equal(sets.length,2);assert.equal(sets[0].children.length,12);assert.equal(sets[1].children.length,6);
const images=[...nodes.values()].filter(n=>n.type==='RECTANGLE'&&n.fills?.some(p=>p.type==='IMAGE'));assert.equal(images.length,10);
const clickable=[...nodes.values()].filter(n=>n.reactions.length>0);assert(clickable.length>=500);
const after=pages.find(p=>p.name.startsWith('02 '));assert.equal(after.flowStartingPoints.length,4);
const settings=after.children.filter(n=>n.name.startsWith('settings ·'));assert.equal(settings.length,3);
for(const frame of settings){const links=[];const walk=n=>{if(n.name==='Botón / Activar alto contraste'||n.name==='Botón / Activar texto ampliado'||n.name==='Botón / Volver al modo estándar')links.push(n);for(const child of n.children)walk(child);};walk(frame);assert.equal(links.length,3);assert.equal(new Set(links.map(n=>n.reactions[0].actions[0].destinationId)).size,3,'mode links should reach different frames');}
const report={status:'MOCK STRUCTURAL CHECK ONLY; NOT EXECUTED IN FIGMA',testedAt:new Date().toISOString(),pages:generation.pages,screens:generation.screens,clickableNodes:clickable.length,embeddedRealCaptures:images.length,componentSets:sets.map(s=>({name:s.name,variants:s.children.length})),checks:['Existing content preserved','All native reaction destinations exist on same page','Four task starting points','Mode toggles reach distinct variants','Font loads occur before text generation','Embedded PNG signatures valid'],limitations:['Mock does not implement Figma auto-layout or typography rendering','No real Figma import,execution,visual QA,Stark or publication verified'],message};
fs.writeFileSync(path.join(output,'mock-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
