import {chromium} from '../../../tools/apf3/node_modules/playwright/index.mjs';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..');
const require=createRequire(path.join(root,'tools/apf3/package.json'));
const out=import.meta.dirname;
const report={complete:false,method:'Headless Chrome privado, API/PostgreSQL local solo lecturas y sesiones sintéticas propias. Tarjeta de dosis actual; no confirma tomas ni cambios clínicos.',layouts:[],blockedDomainWrites:0,checks:[],limitations:['No sustituye participantes ni lectura con tecnología de apoyo.','Escala del producto no es zoom nativo del navegador.']};
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
for(const width of [320,390,430])for(const scale of ['100','200'])for(const contrast of [false,true]) {
 const context=await browser.newContext({viewport:{width,height:1000},locale:'es-PE',reducedMotion:'reduce'});
 try {
 const page=await context.newPage();
 await page.addInitScript(({scale,contrast})=>localStorage.setItem('contigo-reading-options',JSON.stringify({scale,contrast,silent:true})),{scale,contrast});
 await page.route('**/api/v1/**',route=>{const request=route.request();if(!['GET','HEAD','OPTIONS'].includes(request.method())&&!['/api/v1/auth/login','/api/v1/auth/refresh','/api/v1/auth/logout'].includes(new URL(request.url()).pathname)){report.blockedDomainWrites++;return route.abort();}return route.continue();});
 await page.goto('http://127.0.0.1:3001/login');
 await page.getByTestId('login-patient_dacio').click();
 await page.getByRole('button',{name:'Entrada Rápida',exact:true}).click();
 await page.waitForURL('**/patient-app');
 const card=page.locator('article[data-testid^="dose-"]').filter({has:page.getByTestId('dose-taken')}).first();
 await card.waitFor();
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const summary=card.locator('summary').filter({hasText:'Ver detalles del medicamento'});
 const taken=card.getByTestId('dose-taken'),notTaken=card.getByTestId('dose-not-taken');
 const geometry=await card.evaluate(element=>({client:element.clientWidth,scroll:element.scrollWidth,buttons:[...element.querySelectorAll('button[data-testid]')].map(button=>({name:button.textContent.trim(),height:button.getBoundingClientRect().height,width:button.getBoundingClientRect().width})),heading:element.querySelector('h3').textContent}));
 if(geometry.scroll>geometry.client+1||geometry.buttons.some(button=>button.height<64))throw Error('Geometría incompleta '+JSON.stringify({width,scale,contrast,geometry}));
 const axe=await card.evaluate(element=>window.axe.run(element,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
 if(axe.violations.length)throw Error('axe '+JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
 await taken.focus();await page.keyboard.press('Tab');
 if(!await notTaken.evaluate(element=>element===document.activeElement))throw Error('Orden de teclado entre respuestas incorrecto');
 await page.keyboard.press('Tab');
 if(!await summary.evaluate(element=>element===document.activeElement))throw Error('Detalle no sigue a las respuestas');
 await page.keyboard.press('Enter');
 await card.getByText('Médico prescriptor',{exact:true}).waitFor({state:'visible'});
 await page.keyboard.press('Enter');
 await card.getByText('Médico prescriptor',{exact:true}).waitFor({state:'hidden'});
 const image=`dose-${width}-${scale}-${contrast?'high':'standard'}.png`;
 await card.screenshot({path:path.join(out,image)});
 report.layouts.push({width,scale,contrast,geometry,screenshot:image,axe:{violations:axe.violations,incomplete:axe.incomplete}});
 await page.getByRole('button',{name:/Cerrar sesión/}).first().click();
 }finally{await context.close();}
}
if(report.blockedDomainWrites)throw Error('Se intentó escribir datos del paciente');
report.checks=['Instrucciones y respuestas visibles antes de abrir metadatos clínicos.','Tab recorre Ya la tomé, No la tomé y Ver detalles; Enter abre/cierra detalle.','Botones>=64px, sin desborde horizontal en12 combinaciones.'];
report.source=await Promise.all(['DoseCard.tsx','DoseCard.module.css'].map(async name=>({file:'frontend/src/features/patient-app/'+name,sha256:crypto.createHash('sha256').update(await fs.readFile(path.join(root,'frontend/src/features/patient-app',name))).digest('hex')})));
report.complete=true;
}finally{await browser.close();report.finalizedAt=new Date().toISOString();await fs.writeFile(path.join(out,'dose-card-qa.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({complete:report.complete,layouts:report.layouts.length,blockedDomainWrites:report.blockedDomainWrites}));
