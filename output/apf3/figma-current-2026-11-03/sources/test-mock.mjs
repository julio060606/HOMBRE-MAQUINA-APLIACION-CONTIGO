import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),rootPath=path.resolve(here,'../../..'),out=path.join(rootPath,'output/apf3/figma-current-2026-11-03');
const nodes=new Map();let count=0,finish;const completed=new Promise(resolve=>{finish=resolve;});
class Node {
  constructor(type){this.type=type;this.id=String(++count);this.name='';this.children=[];this.width=100;this.height=100;this.paddingLeft=0;this.paddingRight=0;this.data={};this.reactions=[];nodes.set(this.id,this);}
  appendChild(child){if(child.parent)child.parent.children=child.parent.children.filter(c=>c!==child);this.children.push(child);child.parent=this;}
  resize(w,h){assert(Number.isFinite(w)&&w>0);assert(Number.isFinite(h)&&h>0);this.width=w;this.height=h;}
  findOne(predicate){for(const child of this.children){if(predicate(child))return child;const found=child.findOne(predicate);if(found)return found;}return null;}
  setPluginData(key,value){this.data[key]=value;}
  async setFillStyleIdAsync(id){assert(nodes.has(id));this.fillStyleId=id;}
  async setReactionsAsync(reactions){for(const reaction of reactions){assert.equal(reaction.trigger.type,'ON_CLICK');assert(reaction.actions.length);for(const action of reaction.actions){assert.equal(action.type,'NODE');assert.equal(action.navigation,'NAVIGATE');assert(nodes.has(action.destinationId));assert.equal(pageOf(this),pageOf(nodes.get(action.destinationId)),'No cross-page destinations');}}this.reactions=reactions;}
  createInstance(){const clone=origin=>{const node=new Node(origin.type);for(const [key,value] of Object.entries(origin))if(!['id','parent','children'].includes(key))node[key]=value;for(const child of origin.children)node.appendChild(clone(child));return node;};const result=clone(this);result.type='INSTANCE';return result;}
}
function pageOf(node){while(node&&node.type!=='PAGE')node=node.parent;return node;}
const root=new Node('DOCUMENT'),existing=new Node('PAGE');existing.name='Existing document';root.appendChild(existing);
const create=type=>{const node=new Node(type);figma.currentPage.appendChild(node);return node;};
const figma={root,currentPage:existing,async loadFontAsync(font){assert(['Regular','Bold'].includes(font.style));},async setCurrentPageAsync(page){this.currentPage=page;},
 createPage(){const page=new Node('PAGE');root.appendChild(page);return page;},createFrame:()=>create('FRAME'),createText:()=>create('TEXT'),createRectangle:()=>create('RECTANGLE'),createComponent:()=>create('COMPONENT'),createPaintStyle:()=>new Node('PAINT_STYLE'),createTextStyle:()=>new Node('TEXT_STYLE'),
 combineAsVariants(items,parent){const set=new Node('COMPONENT_SET');parent.appendChild(set);for(const item of items)set.appendChild(item);return set;},
 base64Decode:text=>new Uint8Array(Buffer.from(text,'base64')),createImage(bytes){assert.equal(Buffer.from(bytes).readUInt32BE(0),0x89504e47);return{hash:'mock-image-'+bytes.length};},
 viewport:{scrollAndZoomIntoView(items){assert(items.length);}},notify(message){figma.errorMessage=message;},closePlugin(message){finish(message);}
};
vm.runInNewContext(fs.readFileSync(path.join(out,'code.js'),'utf8'),{figma,Uint8Array,Map,Set,Promise,JSON,Math,Number,parseInt,String,Error},{filename:'code.js'});
let timer;const message=await Promise.race([completed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Mock timed out')),10000);})]);clearTimeout(timer);
assert(!figma.errorMessage,figma.errorMessage);
const generation=JSON.parse(root.data.contigoAccessibility);assert.equal(generation.pages.length,6);assert.equal(generation.screens,85);assert.equal(root.children[0],existing);
const all=[...nodes.values()],pages=root.children.slice(1),sets=all.filter(n=>n.type==='COMPONENT_SET'),images=all.filter(n=>n.type==='RECTANGLE'&&n.fills?.some(f=>f.type==='IMAGE'));
assert.equal(sets.length,2);assert(sets.every(set=>set.children.length===12));assert.equal(images.length,20);
const after=pages.find(p=>p.name.startsWith('02 '));assert.equal(after.flowStartingPoints.length,4);
assert.equal(after.children.filter(node=>node.name.startsWith('patient-home ·')).length,3);
for(const home of after.children.filter(node=>node.name.startsWith('patient-home ·'))){
  const text=[];const walk=node=>{if(node.type==='TEXT')text.push(node.characters);for(const child of node.children)walk(child);};walk(home);
  for(const heading of ['Mis medicamentos','Mis mediciones','Mis próximas citas'])assert(text.includes(heading),'Single-view section missing');
  assert(!home.findOne(n=>/Navegación paciente|Fila de navegación/.test(n.name)),'Retired bottom navigation returned');
}
const nativeCorrection=after.children.find(node=>node.name.startsWith('patient-correction-not-taken · Estándar · 100%'));
const cancel=nativeCorrection.findOne(node=>node.name==='Botón / Cancelar corrección');assert(nodes.get(cancel.reactions[0].actions[0].destinationId).name.startsWith('patient-not-taken ·'));
const review=after.children.find(node=>node.name.startsWith('measurement-review · Estándar · 100%'));
assert(review.findOne(node=>node.type==='TEXT'&&node.characters==='¿Los valores son correctos?'));
assert(review.findOne(node=>node.name==='Botón / Corregir números'));
const content=all.filter(node=>node.type==='TEXT').map(node=>node.characters||'').join('\n');assert(content.includes('#74887E'));assert(content.includes('30 tabletas'));assert(content.includes('5 nov. 2026, 10:30'));
const clickable=all.filter(node=>node.reactions.length).length;
const report={status:'MOCK STRUCTURAL VERIFICATION ONLY; NOT REAL FIGMA',testedAt:new Date().toISOString(),pages:generation.pages,nativeScreens:85,scopeIds:generation.expectedScopeIds,componentSets:sets.map(set=>({name:set.name,states:set.children.length})),clickableNodes:clickable,embeddedRealCaptures:20,currentApiCaptures:15,
checks:['Existing pages preserved','Current single-view contains medication,measurement and appointments','Retired patient navigation absent','Reaction destinations exist on same page','Correction cancellation preserves prior no-taken state','Review has correct heading and edit control','Current token #74887E present','Embedded assets have PNG signatures'],limitations:['No actual Figma execution,layout rendering,Stark or publication','No participant validation or NVDA evidence generated'],message};
fs.writeFileSync(path.join(out,'mock-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
