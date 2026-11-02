import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const [baseUrl='http://127.0.0.1:3001',variant='after']=process.argv.slice(2);
const out=path.resolve(import.meta.dirname,'../../output/apf3/evidence',variant);
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results={metadata:{timestamp:new Date().toISOString(),baseUrl,variant,method:'Automated Chrome DOM inspection, keyboard and explicit fault injection on synthetic demonstration data',limitations:['No participant or screen-reader measurements.','Root-font stress is not native browser zoom.']},checks:[]};
async function fresh(actor='patient_dacio',options={}){
  const context=await browser.newContext({viewport:{width:1280,height:960},locale:'es-PE',reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.addInitScript(actor=>sessionStorage.setItem('contigo-demo-actor-v1',actor),actor);
  if(options.disableStorage)await page.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true}));
  return {context,page};
}
async function shot(page,name){await page.screenshot({path:path.join(out,`${name}.png`),fullPage:true});return `output/apf3/evidence/${variant}/${name}.png`;}
async function ready(page){await page.waitForLoadState('networkidle');}
async function check(id,value){results.checks.push({id,...value});await fs.writeFile(path.join(out,'supplemental.json'),JSON.stringify(results,null,2));console.log(id);}
const {context,page}=await fresh();
try{
  await page.goto(`${baseUrl}/login`);await ready(page);
  await check('input-purpose',{method:'DOM inspection',fields:await page.locator('input').evaluateAll(els=>els.map(e=>({id:e.id,type:e.type,autocomplete:e.autocomplete}))),screenshot:await shot(page,'25-input-purpose')});
  await page.goto(`${baseUrl}/patient-app`);await ready(page);
  await page.getByTestId('dose-taken').first().focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await page.waitForTimeout(120);
  await check('primary-keyboard-focus',{method:'Actual keyboard Shift+Tab then Tab to the primary dose control',focus:await page.evaluate(()=>{const e=document.activeElement,c=getComputedStyle(e);return {text:e.textContent.trim(),outline:c.outline,outlineOffset:c.outlineOffset,background:c.backgroundColor,boxShadow:c.boxShadow}}),screenshot:await shot(page,'34-primary-keyboard-focus')});
  const normal=await page.locator('.patient-navigation span').evaluateAll(els=>els.map(e=>({text:e.textContent,fontSize:getComputedStyle(e).fontSize})));
  await page.setViewportSize({width:320,height:800});
  const nav=await page.locator('.patient-navigation').evaluate(el=>{const r=el.getBoundingClientRect();return {clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,rect:{x:r.x,right:r.right},children:[...el.children].map(e=>{const q=e.getBoundingClientRect();return{text:e.textContent.trim(),x:q.x,right:q.right,width:q.width,height:q.height,clipped:q.right>r.right+1||q.x<r.x-1}})}});
  await check('reflow-navigation',{method:'320 CSS px viewport; inspect internal container, not just document',navigation:nav,screenshot:await shot(page,'26-nav320-detail')});
  await page.setViewportSize({width:640,height:900});await page.addStyleTag({content:'html{font-size:200%!important}'});await page.waitForTimeout(220);
  const enlarged=await page.locator('.patient-navigation span').evaluateAll(els=>els.map(e=>({text:e.textContent,fontSize:getComputedStyle(e).fontSize})));
  await check('root-font-scaling',{method:'200% root-font CSS stress; nativeBrowserZoom=false',normal,enlarged,screenshot:await shot(page,'27-font200-detail')});
  await page.goto(`${baseUrl}/patient-app`);await page.setViewportSize({width:1280,height:960});await ready(page);
  const navControl=page.getByRole('navigation',{name:'Navegación del paciente'}).getByRole('button',{name:'Medición',exact:true});
  await navControl.click();
  await check('tab-focus',{method:'Click Medición, inspect actual active element',active:await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent.trim(),tabIndex:document.activeElement.tabIndex})),sosCount:await page.getByTestId('patient-sos').count(),screenshot:await shot(page,'28-navigation-focus')});
  await check('input-boundaries',{method:'Computed CSS foreground/background; compare boundary with adjacent white surface',inputs:await page.locator('input').evaluateAll(els=>els.map(e=>({label:e.closest('label')?.textContent.trim(),border:getComputedStyle(e).borderColor,background:getComputedStyle(e).backgroundColor}))),screenshot:await shot(page,'29-input-boundaries')});
  const title1=await page.title();await page.goto(`${baseUrl}/dashboard`);await ready(page);const title2=await page.title();await page.goto(`${baseUrl}/appointments`);await ready(page);const title3=await page.title();
  await check('route-titles',{method:'document.title after three routes',routes:[{route:'/patient-app',title:title1},{route:'/dashboard',title:title2},{route:'/appointments',title:title3}]});
  await page.goto(`${baseUrl}/patient-app`);await ready(page);await page.getByRole('navigation',{name:'Navegación del paciente'}).getByRole('button',{name:'Mi cuidador',exact:true}).click();
  await page.getByTestId('revoke-caregiver_demo').click();
  await check('revoke-review',{method:'Click remove access on synthetic caregiver; inspect actual DOM',dialogCount:await page.getByRole('dialog').count(),text:await page.locator('main').innerText(),screenshot:await shot(page,'30-revoke-review')});
  // Explicit storage failure produces the application's real query-error UI.
  const failure=await fresh('patient_dacio',{disableStorage:true});
  await failure.page.goto(`${baseUrl}/patient-app`);await ready(failure.page);
  await check('patient-storage-error',{method:'Fault injection: indexedDB undefined before app load',alerts:await failure.page.getByRole('alert').allTextContents(),screenshot:await shot(failure.page,'31-storage-error')});await failure.context.close();
  // Hold the lazy module request so that the actual Suspense loading state is captured.
  const loading=await fresh('caregiver_demo');let release;const gate=new Promise(resolve=>release=resolve);
  await loading.page.route('**/src/features/dashboard/DashboardPage.tsx*',async route=>{await gate;await route.continue();});
  await loading.page.goto(`${baseUrl}/dashboard`,{waitUntil:'domcontentloaded'});
  await loading.page.getByText('Cargando módulo…',{exact:true}).waitFor();
  await check('dashboard-loading',{method:'Fault injection: delayed lazy dashboard module request',screenshot:await shot(loading.page,'32-dashboard-loading')});release();await ready(loading.page);await loading.context.close();
  // Empty medication/dose fixture is explicitly injected into synthetic local data.
  const empty=await fresh();await empty.page.goto(`${baseUrl}/patient-app`);await ready(empty.page);
  await empty.page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('contigo-synthetic-demo',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('datasets','readwrite'),store=tx.objectStore('datasets'),get=store.get('default');get.onsuccess=()=>{const s=get.result;s.medications=[];s.intakes=[];store.put(s,'default');};tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>reject(tx.error);};}));
  await empty.page.reload();await ready(empty.page);await empty.page.getByRole('navigation',{name:'Navegación del paciente'}).getByRole('button',{name:'Tratamiento',exact:true}).click();
  await check('patient-treatment-empty',{method:'Explicit synthetic fixture: medications=[],intakes=[]; reload actual app',text:await empty.page.locator('main').innerText(),screenshot:await shot(empty.page,'33-patient-empty')});await empty.context.close();
  if(variant!=='baseline'){
    const help=await fresh();await help.page.goto(`${baseUrl}/patient-app`);await ready(help.page);await help.page.getByTestId('patient-sos').click();
    const initial=await help.page.evaluate(()=>document.activeElement.textContent.trim());
    await help.page.keyboard.press('Tab');const next=await help.page.evaluate(()=>document.activeElement.textContent.trim());
    await help.page.keyboard.press('Tab');const wrapped=await help.page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement===document.body?'BODY intermediary':document.activeElement.textContent.trim(),insideDialog:document.activeElement.closest('dialog')!==null}));
    await help.page.keyboard.press('Escape');const returned=await help.page.evaluate(()=>document.activeElement.textContent.trim());
    await check('sos-keyboard-dialog',{method:'Actual Tab,Tab,Escape in native dialog; no request confirmed',initial,next,wrapped,returned,screenshot:await shot(help.page,'35-sos-escape')});await help.context.close();
    const supply=await fresh('caregiver_demo');await supply.page.goto(`${baseUrl}/medications`);await ready(supply.page);
    const current=()=>supply.page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('contigo-synthetic-demo',1);r.onsuccess=()=>{const db=r.result,t=db.transaction('datasets','readonly'),g=t.objectStore('datasets').get('default');g.onsuccess=()=>{const s=g.result;resolve({movements:s.movements.filter(m=>m.medicationId==='med_001').length,quantity:s.movements.filter(m=>m.medicationId==='med_001').reduce((n,m)=>n+m.quantity,0)});db.close()}}}));
    const initialStock=await current();await supply.page.locator('details').filter({has:supply.page.getByTestId('supply-quantity-med_001')}).locator('summary').click();
    await supply.page.getByTestId('supply-quantity-med_001').fill('5');await supply.page.getByTestId('supply-reason-med_001').fill('Reposición sintética para prueba técnica');await supply.page.getByTestId('supply-save-med_001').click();const reviewStock=await current();const reviewShot=await shot(supply.page,'36-supply-review');
    await supply.page.getByRole('button',{name:'Volver y corregir movimiento',exact:true}).click();const quantityRetained=await supply.page.getByTestId('supply-quantity-med_001').inputValue();const cancelStock=await current();
    await supply.page.getByTestId('supply-save-med_001').click();await supply.page.getByTestId('supply-confirm-med_001').click();await supply.page.getByText('Movimiento guardado en la demostración.',{exact:true}).waitFor();await supply.page.waitForTimeout(150);const savedStock=await current();
    const savedFocus=await supply.page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent.trim(),tabIndex:document.activeElement.tabIndex}));
    await check('supply-review-confirm',{method:'Explicit synthetic restock +5; inspect persisted dataset before review, after back, and after confirm',initialStock,reviewStock,cancelStock,quantityRetained,savedStock,savedFocus,reviewShot,screenshot:await shot(supply.page,'37-supply-saved')});await supply.context.close();
    const lazy=await fresh('caregiver_demo');await lazy.page.goto(`${baseUrl}/dashboard`);await ready(lazy.page);
    await lazy.page.route('**/src/features/appointments/AppointmentsPage.tsx*',async route=>{await new Promise(resolve=>setTimeout(resolve,700));await route.continue();});
    await lazy.page.getByRole('link',{name:'Citas médicas',exact:true}).click();await lazy.page.waitForTimeout(100);
    const during=await lazy.page.evaluate(()=>({title:document.title,activeTag:document.activeElement.tagName,visibleHeadings:[...document.querySelectorAll('h1')].filter(e=>e.checkVisibility()).map(e=>e.textContent.trim())}));
    await ready(lazy.page);await lazy.page.getByRole('heading',{name:'Citas médicas',exact:true}).waitFor();await lazy.page.waitForTimeout(120);
    const finished=await lazy.page.evaluate(()=>({title:document.title,activeTag:document.activeElement.tagName,activeText:document.activeElement.textContent.trim(),visibleHeadings:[...document.querySelectorAll('h1')].filter(e=>e.checkVisibility()).map(e=>e.textContent.trim())}));
    await check('lazy-route-focus',{method:'Actual SPA navigation dashboard->appointments with700ms delayed lazy module; inspect visible heading/title/focus',during,finished,screenshot:await shot(lazy.page,'47-lazy-route-focus')});await lazy.context.close();
  }
}catch(error){results.fatal={message:error.message,stack:error.stack};console.error(error);process.exitCode=1;}
finally{await fs.writeFile(path.join(out,'supplemental.json'),JSON.stringify(results,null,2));await context.close();await browser.close();}
