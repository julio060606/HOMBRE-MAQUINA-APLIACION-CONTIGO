import {chromium} from '../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..');
const out=path.join(root,'output/wcag-priority-2026-11-04');
await fs.mkdir(out,{recursive:true});
const base='http://127.0.0.1:3001';
const axeSource=await fs.readFile(path.join(root,'tools/apf3/node_modules/axe-core/axe.min.js'),'utf8');
const report={date:new Date().toISOString(),checks:[],screens:[],blockedWrites:[],sourceHashes:{},limitations:['Autenticación API real con cuentas sintéticas. Estados de SOS y cambios de GET controlados mediante transporte interceptado.','Las extensiones REST, permisos, idempotencia y concurrencia se prueban separadamente con Spring y H2.','Esta comprobación no equivale a validación humana ni prueba de lector de pantalla.']};
const browser=await chromium.launch({channel:'chrome',headless:true});
let lastPage;
let session=null,extendFailure=false;
const extensions=[];
const applied=new Set();
async function login(role,width=1280){
  const ctx=await browser.newContext({viewport:{width,height:960},locale:'es-PE'});
  const page=await ctx.newPage();lastPage=page;
  await ctx.route('**/api/**',route=>{
    const r=route.request();
    if(!['GET','HEAD','OPTIONS'].includes(r.method())&&!/\/auth\/(login|refresh|logout)$/.test(new URL(r.url()).pathname)){report.blockedWrites.push(r.method()+' '+new URL(r.url()).pathname);return route.abort();}
    return route.continue();
  });
  await page.route('**/support-sessions**',route=>{
    const r=route.request(),url=new URL(r.url());
    if(!url.pathname.includes('/pat_001/'))return route.fulfill({json:[]});
    if(r.method()==='POST'){
      if(url.pathname.endsWith('/extend')){
        const op=r.postDataJSON().operationId;extensions.push(op);
        if(extendFailure){extendFailure=false;return route.fulfill({status:503,json:{message:'Error controlado de red. Tu tiempo no se cambió.'}});}
        if(!applied.has(op)){session.expiresAt=new Date(Date.parse(session.expiresAt)+1800000).toISOString();applied.add(op);}
      }else if(url.pathname.endsWith('/accept')){session.status='ACCEPTED';session.responderId='caregiver_demo';session.responderName='Cuidador de demostración';}
      else if(url.pathname.endsWith('/end')){session.status='ENDED';}
      return route.fulfill({json:session});
    }
    if(url.pathname.endsWith('/events'))return route.fulfill({json:{session,events:[]}});
    return route.fulfill({json:session?[session]:[]});
  });
  await page.goto(base+'/login');await page.getByText('Cambiar cuenta de prueba',{exact:true}).click();await page.getByTestId('login-'+role).click();await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForURL(role==='patient_dacio'?'**/patient-app':'**/dashboard');await page.locator('main h1').waitFor();
  return page;
}
async function capture(page,id,selector){
  await page.addScriptTag({content:axeSource});
  const axe=await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return{violations:r.violations,incomplete:r.incomplete.map(x=>({id:x.id,targets:x.nodes.map(n=>n.target)}))};});
  if(selector)await page.locator(selector).screenshot({path:path.join(out,id+'.png')});else await page.screenshot({path:path.join(out,id+'.png'),fullPage:true});
  report.screens.push({id,...axe});assert.equal(axe.violations.length,0,'axe '+id);
}
function pass(name,details={}){report.checks.push({name,passed:true,...details});console.log(name);}
function newSession(id){return{id,patientId:'pat_001',patientName:'Dacio Ramos',callerId:'patient_dacio',status:'WAITING',createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+90000).toISOString(),alertId:'fixture-alert'};}
try{
  const patient=await login('patient_dacio',390);
  await patient.getByRole('heading',{name:'Hola, Dacio',exact:true}).waitFor();
  assert.equal(await patient.getByRole('button',{name:'Salir de CONTIGO',exact:true}).innerText(),'Salir');pass('H02 etiqueta visible contenida en el nombre accesible');
  session=newSession('fixture-patient-priority');
  await patient.getByTestId('patient-sos').click();await patient.getByText('Esperando respuesta',{exact:true}).waitFor();
  await patient.getByTestId('support-message-input').fill('Borrador conservado para la auditoría');
  await patient.getByRole('alert').filter({hasText:'La conversación está por terminar'}).waitFor();
  assert.ok(Date.parse(session.expiresAt)-Date.now()>20000);await capture(patient,'01-sos-warning');pass('H01 aviso disponible con más de 20 segundos para ampliar');
  extendFailure=true;await patient.getByTestId('support-extend').click();await patient.getByRole('alert').filter({hasText:'Error controlado de red'}).waitFor();
  assert.equal(await patient.getByTestId('support-message-input').inputValue(),'Borrador conservado para la auditoría');
  await patient.getByTestId('support-extend').click();await patient.getByRole('status').filter({hasText:'Tiempo ampliado'}).waitFor();
  assert.equal(extensions[0],extensions[1]);pass('H01 reintento conserva operación y borrador');
  for(let i=0;i<9;i++){await patient.getByTestId('support-extend').click();await patient.getByRole('status').filter({hasText:'Tiempo ampliado'}).waitFor();}
  assert.equal(applied.size,10);await capture(patient,'02-sos-extended');pass('H01 permite diez ampliaciones consecutivas');
  await patient.getByTestId('support-message-input').focus();session.status='ENDED';session.endedReason='EXPIRED';
  await patient.getByText('Conversación finalizada',{exact:true}).waitFor();
  const draft=patient.getByRole('textbox',{name:'Tu mensaje sin enviar',exact:true});await draft.waitFor();
  assert.equal(await draft.inputValue(),'Borrador conservado para la auditoría');assert.equal(await draft.getAttribute('readonly'),'');
  assert.equal(await draft.evaluate(e=>e===document.activeElement),true);assert.equal(await patient.getByTestId('support-send-message').count(),0);
  await capture(patient,'03-sos-expired-draft');pass('H01 caducidad mantiene borrador seleccionable y foco');
  await patient.getByTestId('support-end').click();session=null;

  const caregiver=await login('caregiver_demo');
  for(const width of [1280,320]){
    await caregiver.setViewportSize({width,height:960});await caregiver.goto(base+'/dashboard');await caregiver.getByRole('heading',{name:'Resumen del día',exact:true}).waitFor();
    await caregiver.locator('summary').filter({hasText:'Mi cuenta'}).click();await caregiver.getByTestId('link-patient').click();await caregiver.getByRole('dialog').waitFor();await caregiver.getByRole('button',{name:'Cancelar',exact:true}).click();await caregiver.waitForTimeout(650);
    assert.equal(await caregiver.getByTestId('link-patient').evaluate(e=>e===document.activeElement&&e.getClientRects().length>0),true);
    await caregiver.keyboard.press('Tab');assert.equal(await caregiver.getByTestId('btn-logout').evaluate(e=>e===document.activeElement),true);
    pass('H03 retorno de foco tras animación y siguiente Tab en '+width+' px');
  }
  await caregiver.setViewportSize({width:1280,height:960});await caregiver.goto(base+'/medications');await caregiver.getByRole('heading',{name:'Tratamiento y existencias',exact:true}).waitFor();
  const supply=caregiver.locator('details').filter({hasText:'Registrar reposición o conteo físico'}).first();await supply.locator('summary').click();
  const quantity=supply.locator('input[type="number"]'),reason=supply.locator('input').last(),review=supply.getByRole('button',{name:'Revisar movimiento',exact:true});
  await quantity.fill('5');await reason.fill('x');await review.click();assert.equal(await quantity.getAttribute('aria-invalid'),'false');assert.equal(await reason.getAttribute('aria-invalid'),'true');assert.equal(await reason.evaluate(e=>e===document.activeElement),true);pass('H04 error exclusivo de Motivo marca y enfoca Motivo');
  await quantity.fill('-1');await reason.fill(' ');await review.click();assert.equal(await quantity.getAttribute('aria-invalid'),'true');assert.equal(await reason.getAttribute('aria-invalid'),'true');
  await quantity.fill('5');assert.equal(await reason.getAttribute('aria-invalid'),'true');assert.ok(await reason.getAttribute('aria-describedby'));await capture(caregiver,'04-supply-field-error');pass('H04 corregir Cantidad conserva el error pendiente de Motivo');
  await reason.fill('Conteo de auditoría');await review.click();await supply.getByRole('heading',{name:/Revisa el movimiento/}).waitFor();pass('H04 datos válidos llegan a revisión sin escritura clínica');

  let age=72,dashboardRequests=0;
  await caregiver.route('**/patients/pat_001/dashboard',async route=>{dashboardRequests++;const snapshotAge=age;const response=await route.fetch();const data=await response.json();data.patient.age=snapshotAge;await route.fulfill({response,json:data});});
  await caregiver.route('**/events/stream?*',route=>route.fulfill({contentType:'text/event-stream',body:'event: CONNECTED\ndata: {"patientId":"pat_001"}\n\nevent: CLINICAL_SYNC\ndata: {"patientId":"pat_001"}\n\n'}));
  await caregiver.goto(base+'/dashboard');await caregiver.getByText('72 años',{exact:true}).waitFor();await caregiver.waitForTimeout(400);
  await caregiver.getByRole('button',{name:/Opciones de lectura/}).click();await caregiver.getByRole('checkbox',{name:'Pausar actualizaciones automáticas',exact:true}).check();await caregiver.getByRole('button',{name:'Listo',exact:true}).click();
  await caregiver.getByRole('status').filter({hasText:'Actualizaciones en pausa'}).waitFor();await caregiver.waitForTimeout(300);
  const before=dashboardRequests;age=73;session=newSession('fixture-caregiver-priority');
  await caregiver.getByTestId('support-accept').waitFor();
  await caregiver.waitForTimeout(32000);
  assert.equal(dashboardRequests,before);await caregiver.getByText('72 años',{exact:true}).waitFor();await capture(caregiver,'05-paused-with-urgent-sos');pass('H05 pausa bloquea refresco de 30 s y eventos remotos, con SOS activo',{ordinaryRequestsDuringPause:dashboardRequests-before});
  await caregiver.getByTestId('support-accept').click();await caregiver.getByRole('dialog').waitFor();await caregiver.getByTestId('support-extend').waitFor();
  const expiry=Date.parse(session.expiresAt);await caregiver.getByTestId('support-extend').click();await caregiver.getByRole('status').filter({hasText:'Tiempo ampliado'}).waitFor();assert.equal(Date.parse(session.expiresAt),expiry+1800000);pass('H01 cuidador amplía conversación mientras las actualizaciones ordinarias están pausadas');
  await caregiver.getByRole('button',{name:'Finalizar atención y cerrar',exact:true}).last().click();await caregiver.getByRole('dialog').waitFor({state:'hidden'});
  await caregiver.getByRole('button',{name:'Actualizar',exact:true}).click();await caregiver.getByRole('status').filter({hasText:'Resumen actualizado.'}).waitFor();await caregiver.getByText('73 años',{exact:true}).waitFor();pass('H05 actualización manual funciona durante la pausa');
  age=74;await caregiver.waitForTimeout(3500);await caregiver.getByText('73 años',{exact:true}).waitFor();
  await caregiver.getByRole('button',{name:'Reanudar actualizaciones',exact:true}).click();await caregiver.getByText('74 años',{exact:true}).waitFor();
  assert.equal(await caregiver.getByRole('button',{name:/Opciones de lectura/}).evaluate(e=>e===document.activeElement),true);pass('H05 reanuda con datos nuevos y foco conservado');

  await caregiver.getByRole('button',{name:/Opciones de lectura/}).click();await caregiver.getByRole('checkbox',{name:'Pausar actualizaciones automáticas',exact:true}).check();await caregiver.getByRole('button',{name:'Listo',exact:true}).click();
  await caregiver.route('**/api/v1/patients',route=>route.fulfill({json:[]}));
  await caregiver.route('**/patients/pat_001/dashboard',route=>route.fulfill({status:403,json:{message:'Acceso retirado, simulación de auditoría'}}));
  await caregiver.route('**/events/stream?*',route=>route.fulfill({contentType:'text/event-stream',body:'event: REVOKED\ndata: {"patientId":"pat_001"}\n\n'}));
  await caregiver.getByText('No tiene pacientes vinculados.',{exact:false}).waitFor({timeout:10000});assert.equal(await caregiver.getByText('74 años',{exact:true}).count(),0);pass('H05 retirada de permisos limpia la vista incluso durante la pausa');
  await capture(caregiver,'06-revoked-while-paused');
  for(const file of ['frontend/src/hooks/usePatientView.ts','frontend/src/context/PatientContext.tsx','frontend/src/services/accessibilityPreferences.ts','frontend/src/services/apiClient.ts','frontend/src/services/demo/repository.ts','frontend/src/components/layout/ReadingOptions.tsx','frontend/src/components/layout/ReadingOptions.module.css','frontend/src/components/layout/Navbar.tsx','frontend/src/features/patient-app/PatientAppContent.tsx','frontend/src/features/medications/SupplyForm.tsx','frontend/src/domain/validation.ts','frontend/src/features/support/LiveSupportConversation.tsx','frontend/src/features/support/LiveSupportConversation.module.css','frontend/src/features/support/supportApi.ts','backend/src/main/java/com/sanpablo/contigo/controller/SupportSessionController.java','backend/src/main/java/com/sanpablo/contigo/service/SupportSessionService.java','backend/src/main/java/com/sanpablo/contigo/dto/telemetry/SupportDtos.java'])report.sourceHashes[file]=crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex');
  report.complete=true;
}catch(error){report.error={message:error.message,stack:error.stack};report.complete=false;await lastPage?.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({complete:report.complete,checks:report.checks.length,screens:report.screens.length,blockedWrites:report.blockedWrites,error:report.error}));
