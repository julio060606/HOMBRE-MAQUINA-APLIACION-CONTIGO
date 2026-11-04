import {chromium} from '../../../tools/apf3/node_modules/playwright/index.mjs';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..');
const require=createRequire(path.join(root,'tools/apf3/package.json'));
const out=import.meta.dirname;
const report={complete:false,method:'AppointmentList en la app paciente central API/PostgreSQL, contextos privados y solo lecturas de dominio.',layouts:[],blockedDomainWrites:0,source:[],limitations:['Escala del producto, no zoom nativo.','Prueba técnica sin participantes ni lector de pantalla.']};
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:1000},locale:'es-PE',reducedMotion:'reduce'});
try {
 const page=await context.newPage();
 await page.route('**/api/v1/**',route=>{const r=route.request();if(!['GET','HEAD','OPTIONS'].includes(r.method())&&!['/api/v1/auth/login','/api/v1/auth/refresh','/api/v1/auth/logout'].includes(new URL(r.url()).pathname)){report.blockedDomainWrites++;return route.abort();}return route.continue();});
 await page.goto('http://127.0.0.1:3001/login');
 await page.getByTestId('login-patient_dacio').click();
 await page.getByRole('button',{name:'Entrada Rápida',exact:true}).click();
 await page.waitForURL('**/patient-app');
 const section=page.getByTestId('patient-appointments');await section.waitFor();
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 for(const width of [320,1280])for(const scale of ['100','125','150','200'])for(const contrast of [false,true]) {
  await page.setViewportSize({width,height:1000});
  await page.evaluate(async ({scale,contrast})=>{const{setReadingPreferences}=await import('/src/services/accessibilityPreferences.ts');setReadingPreferences({scale,contrast,silent:true,vibration:false,largeTargets:false,reducedMotion:true});},{scale,contrast});
  await page.evaluate(()=>document.fonts.ready);
  const card=section.locator('article').first();await card.waitFor();
  await card.evaluate(el=>el.scrollIntoView({block:'start',inline:'nearest',behavior:'instant'}));
  const data=await card.evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth,surfaceWidth:el.closest('[data-app-surface]')?.clientWidth,viewport:innerWidth,document:document.documentElement.scrollWidth,heading:el.querySelector('h3,h2')?.textContent,headingFont:getComputedStyle(el.querySelector('h3,h2')).fontSize,words:getComputedStyle(el.querySelector('h3,h2')).wordBreak,padding:getComputedStyle(el).padding,dates:[...el.querySelectorAll('time')].map(time=>({text:time.textContent,dateTime:time.dateTime,fontSize:getComputedStyle(time).fontSize,whiteSpace:getComputedStyle(time).whiteSpace,overflow:getComputedStyle(time).textOverflow})),meta:el.innerText}));
  if(data.scroll>data.client+1||data.document>width+1)throw Error('Desborde '+JSON.stringify({width,scale,contrast,data}));
  if(data.dates.length!==2||!data.dates[0].dateTime||!data.dates[1].dateTime||!data.meta.includes('hora de Lima'))throw Error('Fecha/hora incompleta');
  const axe=await card.evaluate(el=>window.axe.run(el,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
  if(axe.violations.length)throw Error('axe '+JSON.stringify(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))));
  const image=`appointment-${width}-${scale}-${contrast?'high':'standard'}.png`;await page.screenshot({path:path.join(out,image),fullPage:false});
  report.layouts.push({width,scale,contrast,data,screenshot:image,axe:{violations:axe.violations,incomplete:axe.incomplete}});
 }
 const summary=section.locator('article').first().locator('summary');
 await summary.focus();await page.keyboard.press('Enter');
 await section.getByText('Origen: clínica ficticia del proyecto · datos sintéticos. Contigo consulta esta cita; no la reprograma.',{exact:true}).first().waitFor({state:'visible'});
 await page.keyboard.press('Enter');
 report.keyboard='Enter abre/cierra Sobre esta cita sin modificar datos.';
 if(report.blockedDomainWrites)throw Error('Se bloquearon escrituras inesperadas');
 report.source=await Promise.all(['AppointmentList.tsx','AppointmentList.module.css'].map(async name=>({file:'frontend/src/features/appointments/'+name,sha256:crypto.createHash('sha256').update(await fs.readFile(path.join(root,'frontend/src/features/appointments',name))).digest('hex')})));
 await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
 report.complete=true;
}finally{await context.close();await browser.close();report.finalizedAt=new Date().toISOString();await fs.writeFile(path.join(out,'appointments-qa.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({complete:report.complete,layouts:report.layouts.length,blockedDomainWrites:report.blockedDomainWrites}));

