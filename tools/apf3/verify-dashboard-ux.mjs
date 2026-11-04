import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const root=path.resolve(import.meta.dirname,'../..');
const out=path.join(root,'output/dashboard-ux-2026-11-03');
const base='http://127.0.0.1:3001';
await fs.mkdir(out,{recursive:true});
const require=createRequire(import.meta.url);
const axe=await fs.readFile(require.resolve('axe-core/axe.min.js'),'utf8');
const files=['frontend/src/components/layout/MainLayout.tsx','frontend/src/components/layout/Navbar.tsx','frontend/src/components/layout/Sidebar.tsx','frontend/src/components/layout/caregiverNavigation.ts','frontend/src/components/layout/CaregiverLayout.module.css','frontend/src/features/dashboard/DashboardPage.tsx','frontend/src/features/dashboard/PatientSummary.tsx','frontend/src/features/dashboard/Dashboard.module.css','frontend/src/features/support/SupportInbox.tsx','frontend/src/features/support/SupportInbox.module.css'];
const hashes=async()=>Object.fromEntries(await Promise.all(files.map(async file=>[file,crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex')])));
const report={complete:false,timestamp:new Date().toISOString(),sourceHashes:await hashes(),mode:'Lecturas y autenticación API/PostgreSQL, contexto Chrome privado. Escenarios límite con respuestas GET modificadas solo en el navegador de prueba; no cambian bases ni datos del usuario.',checks:[],layouts:[],blockedWrites:[],errors:[]};
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-PE',reducedMotion:'reduce'});
await context.route('**/api/**',route=>{const req=route.request();if(req.method()!=='GET'&&!/\/auth\/(login|logout|refresh)$/.test(new URL(req.url()).pathname)){report.blockedWrites.push(req.url());return route.abort();}return route.continue();});
const page=await context.newPage();
page.on('pageerror',error=>report.errors.push(error.message));
async function ready(){await page.getByRole('heading',{name:'Resumen del día',exact:true}).waitFor();await page.getByTestId('caregiver-dashboard').waitFor();}
async function prefs(scale,contrast=false){await page.evaluate(async value=>{const{setReadingPreferences,DEFAULT_READING_PREFERENCES}=await import('/src/services/accessibilityPreferences.ts');setReadingPreferences({...DEFAULT_READING_PREFERENCES,...value});},{scale:String(scale),contrast});await page.waitForTimeout(100);}
async function shot(name,fullPage=true){await page.screenshot({path:path.join(out,name),fullPage});return name;}
async function audit(){await page.addScriptTag({content:axe});return page.evaluate(async()=>{const r=await window.axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return{violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))};});}
async function widthCheck(){return page.evaluate(()=>({client:innerWidth,scroll:document.documentElement.scrollWidth,overflows:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1);}).slice(0,10).map(e=>({tag:e.tagName,class:e.className,text:e.textContent?.trim().slice(0,80)}))}));}
try{
  await page.goto(base+'/login');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForURL('**/dashboard');await ready();
  await page.getByRole('heading',{name:'Dacio Ramos',exact:true}).waitFor();
  const regions=page.getByTestId('caregiver-dashboard');
  for(const name of ['Tomas de hoy','Última medición','Próxima cita'])assert(await regions.getByRole('heading',{name,exact:true}).count()===1,`Dato esencial duplicado o ausente: ${name}`);
  let reads=0;page.on('request',req=>{if(/\/patients\/[^/]+\/dashboard$/.test(new URL(req.url()).pathname))reads++;});
  const before=reads;await page.getByRole('button',{name:'Actualizar',exact:true}).click();await page.getByRole('status').filter({hasText:'Resumen actualizado.'}).waitFor();assert(reads>before,'Actualizar no consultó al servidor.');
  report.checks.push({name:'Tres datos esenciales únicos y actualización manual real',passed:true,screenshot:await shot('dashboard-desktop.png')});
  const all=page.getByRole('button',{name:'Todas',exact:true});await all.click();assert(await all.getAttribute('aria-pressed')==='true','Filtro Todas no se activa.');
  await page.getByTestId('select-patient-active').selectOption('pat_002');await page.getByRole('heading',{name:'Rosa Martínez',exact:true}).waitFor();assert(await page.getByRole('button',{name:/Por confirmar/}).getAttribute('aria-pressed')==='true','El filtro se filtra entre pacientes.');assert(!(await regions.innerText()).includes('Dacio Ramos'),'Se mezclan pacientes en el resumen.');
  report.checks.push({name:'Cambio de paciente actualiza identidad y reinicia filtros sin mezclar registros',passed:true});
  const nav=page.getByRole('navigation',{name:'Módulos de seguimiento',exact:true});await nav.getByRole('link',{name:'Mediciones',exact:true}).click();await page.waitForURL('**/vitals');await page.getByRole('heading',{level:1,name:'Gráficas y mediciones',exact:true}).waitFor();assert(await nav.getByRole('link',{name:'Mediciones',exact:true}).getAttribute('aria-current')==='page','No se indica sección activa.');assert(await page.getByRole('navigation',{name:'Ubicación actual'}).locator('[aria-current="page"]').innerText()==='Mediciones','Ubicación actual incorrecta.');
  await page.waitForFunction(()=>document.activeElement?.tagName==='H1'&&document.activeElement.textContent==='Gráficas y mediciones');
  assert((await page.title()).startsWith('Gráficas y mediciones'),'El título de página no corresponde a la sección.');
  await page.getByRole('navigation',{name:'Ubicación actual'}).getByRole('link',{name:'Mi panel',exact:true}).click();await ready();await page.getByRole('heading',{name:'Rosa Martínez',exact:true}).waitFor();
  report.checks.push({name:'Menú lateral y ubicación actual conectan Mediciones y Resumen conservando paciente',passed:true});
  await page.getByRole('link',{name:'Inicio de CONTIGO',exact:true}).click();await page.waitForURL('**/landing');await page.getByRole('navigation',{name:'Navegación principal'}).getByRole('link',{name:'Mi panel',exact:true}).click();await ready();
  report.checks.push({name:'Retorno al landing y al panel con sesión conservada',passed:true});
  for(const width of [320,390,1440])for(const scale of [100,200])for(const contrast of [false,true]){
    await page.setViewportSize({width,height:1000});await prefs(scale,contrast);await ready();
    const menu=page.getByRole('button',{name:'Abrir menú de navegación',exact:true});
    if(await menu.isVisible()){
      await menu.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-current')==='page'&&document.activeElement?.closest('nav')?.getAttribute('aria-label')==='Módulos de seguimiento');
      await page.keyboard.press('Escape');assert(await menu.evaluate(e=>e===document.activeElement),'Escape no retorna foco al menú.');assert(!(await nav.isVisible()),'Menú permanece abierto.');
    }
    const details=page.locator('details').filter({has:page.getByText('Mediciones y evolución',{exact:true})});if(!await details.evaluate(e=>e.open))await details.locator('summary').first().click();await page.getByRole('heading',{name:'Presión registrada',exact:true}).waitFor();
    await page.getByRole('button',{name:'30 días',exact:true}).click();
    const layout=await widthCheck();const a11y=await audit();const name=`dashboard-${width}-${scale}-${contrast?'high':'standard'}.png`;
    report.layouts.push({width,scale,contrast,...layout,...a11y,screenshot:await shot(name)});
    assert(layout.scroll<=layout.client+1,`Desborde ${width}/${scale}: ${JSON.stringify(layout)}`);assert(!a11y.violations.length,`Axe ${width}/${scale}: ${JSON.stringify(a11y.violations)}`);
  }
  report.checks.push({name:'Doce vistas móvil/escritorio, contraste y texto200%, menú por teclado y gráfica desplegada',passed:true});
  await page.setViewportSize({width:1440,height:1000});await prefs(100);await page.getByTestId('select-patient-active').selectOption('pat_001');await page.getByRole('heading',{name:'Dacio Ramos',exact:true}).waitFor();
  await page.route('**/patients/pat_001/dashboard',async route=>{
    const response=await route.fetch();const data=await response.json();
    data.alerts=Array.from({length:4},(_,index)=>({id:`qa-critical-${index}`,patientId:'pat_001',patientName:'Dacio Ramos',type:'PANIC_BUTTON',title:`Solicitud prioritaria de prueba ${index+1}`,description:`Mensaje sintético visible ${index+1}`,timestamp:new Date().toISOString(),severity:'CRITICAL',isResolved:false}));
    data.supplies=[{medicationId:data.medications[0]?.id||'qa-med',patientId:'pat_001',unit:'unidades',quantity:0,daysRemaining:0,state:'EMPTY'}];
    data.weights=[{id:'qa-weight',patientId:'pat_001',organizationId:data.patient.organizationId,weightKg:70.5,recordedAt:new Date(Date.now()+1000).toISOString(),actorId:'patient_dacio',source:'HOME'}];
    await route.fulfill({response,json:data});
  });
  await page.getByRole('button',{name:'Actualizar',exact:true}).click();await page.getByRole('heading',{name:'Solicitud prioritaria de prueba 4',exact:true}).waitFor();
  assert(await page.getByTestId('dashboard-priority').getByRole('article').count()===4,'Se ocultan avisos críticos.');assert((await page.getByTestId('dashboard-followups').innerText()).includes('1 pendiente de seguimiento'),'Se cuentan los críticos otra vez en adicionales.');assert((await regions.innerText()).match(/70[.,]5 kg/),'La medición reciente no incluye peso y unidad.');
  report.checks.push({name:'Escenario GET sintético: cuatro críticos visibles, recuento adicional exacto y peso reciente',passed:true,screenshot:await shot('dashboard-synthetic-priorities.png')});
  await page.setViewportSize({width:320,height:1000});await prefs(200,true);const fixtureLayout=await widthCheck();const fixtureA11y=await audit();assert(fixtureLayout.scroll<=fixtureLayout.client+1,'Prioridades desbordan en320/200.');assert(!fixtureA11y.violations.length,'Prioridades fallan axe.');
  report.layouts.push({width:320,scale:200,contrast:true,fixture:true,...fixtureLayout,...fixtureA11y,screenshot:await shot('dashboard-synthetic-320-200.png')});
  await page.route('**/patients/pat_001/support-sessions',route=>route.request().method()==='GET'?route.fulfill({json:[{id:'qa-visible-sos',patientId:'pat_001',patientName:'Dacio Ramos',callerId:'patient_dacio',status:'WAITING',createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+1800000).toISOString(),alertId:'qa-alert-visible'}]}):route.fallback());
  const request=page.getByTestId('support-request').filter({has:page.getByTestId('support-accept')});await request.waitFor();assert(await request.getAttribute('data-session-id')==='qa-visible-sos','La solicitud SOS pendiente no aparece.');
  assert(await request.getByRole('button',{name:'Atender solicitud',exact:true}).isVisible(),'No se puede localizar la atención SOS.');
  const sosLayout=await widthCheck();assert(sosLayout.scroll<=sosLayout.client+1,'SOS activo desborda en320/200.');report.checks.push({name:'Solicitud SOS WAITING GET sintética mantiene botón de atención visible en320/200',passed:true,screenshot:await shot('dashboard-active-sos-320-200.png')});
  assert(!report.blockedWrites.length,'Se intentaron escrituras clínicas.');
  report.sourceHashesAfter=await hashes();report.changedSources=files.filter(file=>report.sourceHashes[file]!==report.sourceHashesAfter[file]);assert(!report.changedSources.length,'Fuentes cambiaron durante QA.');report.complete=true;
}catch(error){report.errors.push({message:error.message,stack:error.stack});await shot('failure.png').catch(()=>{});process.exitCode=1;}
finally{await browser.close();await fs.writeFile(path.join(out,'audit.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({complete:report.complete,checks:report.checks.length,layouts:report.layouts.length,errors:report.errors,blockedWrites:report.blockedWrites}));
