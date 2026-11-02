import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const origin='http://127.0.0.1:3001';
const out=path.resolve('output/apf3/evidence/nvda');
fs.mkdirSync(out,{recursive:true});
const events=[];
const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith(origin+'/'));
if(!page)throw new Error('Local app tab missing');
async function check(){if(new URL(page.url()).origin!==origin)throw new Error('Unexpected page URL; stopping');}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function record(step,details={}){await check();events.push({utc:new Date().toISOString(),step,url:page.url(),...details,focus:await page.evaluate(()=>{const n=document.activeElement;return n?{tag:n.tagName,role:n.getAttribute('role'),name:n.getAttribute('aria-label')||n.innerText||'',id:n.id}:null;})});fs.writeFileSync(path.join(out,'browser-actions.json'),JSON.stringify({kind:'Technical browser traversal with real portable NVDA; no participants',browser:browser.version(),events},null,2));console.log(step);}
async function activate(locator,step,key='Enter'){await check();await locator.waitFor({state:'visible'});await locator.focus();await pause(800);await check();await page.keyboard.press(key);await pause(1300);await record(step,{activation:key});}
async function type(locator,value,step){await check();await locator.focus();await pause(700);await check();await page.keyboard.press('Control+A');await check();await page.keyboard.type(value,{delay:120});await pause(500);await record(step,{entered:value});}
async function capture(file){await check();await page.screenshot({path:path.join(out,file),fullPage:true});}
try{
 await check();await page.bringToFront();await pause(1000);await record('start');
 if(page.url().endsWith('/login')){
  await activate(page.getByTestId('login-patient_dacio'),'select-patient');
  await activate(page.getByRole('button',{name:'Entrada Rápida',exact:true}),'enter-patient');
 }
 await activate(page.getByRole('button',{name:'Tratamiento',exact:true}),'T1-treatment');
 const correction=page.getByRole('button',{name:/Corregir respuesta de/}).first();
 if(await correction.count()){
  await activate(correction,'T1-open-correction');
  await type(page.getByLabel('Motivo de la corrección (obligatorio)'),'Corrección en recorrido técnico NVDA','T1-reason');
 }
 await activate(page.getByTestId('dose-taken').first(),'T1-record-taken','Space');
 await capture('01-t1-response.png');
 await activate(page.getByRole('button',{name:'Citas',exact:true}),'T2-from-citas');
 await activate(page.getByTestId('patient-sos'),'T2-open-sos');
 await capture('02-t2-sos-review.png');
 await check();await page.keyboard.press('Escape');await pause(1000);await record('T2-cancel-escape');
 await activate(page.getByTestId('patient-sos'),'T2-reopen-sos');
 await activate(page.getByTestId('patient-sos-confirm'),'T2-record-sos');
 await capture('03-t2-sos-recorded.png');
 await activate(page.getByRole('button',{name:'Entendido, volver',exact:true}),'T2-close');
 await activate(page.getByRole('button',{name:'Medición',exact:true}),'T4-open-measurement');
 await type(page.getByTestId('input-systolic'),'120','T4-systolic');
 await type(page.getByTestId('input-diastolic'),'130','T4-invalid-diastolic');
 await activate(page.getByTestId('btn-save-vitals'),'T4-show-error');
 await capture('04-t4-error.png');
 await type(page.getByTestId('input-diastolic'),'80','T4-correct-diastolic');
 await activate(page.getByTestId('btn-save-vitals'),'T4-review');
 await capture('05-t4-review.png');
 await activate(page.getByTestId('btn-confirm-vitals'),'T4-save');
 await capture('06-t4-saved.png');
 await activate(page.getByRole('button',{name:'Cerrar sesión',exact:true}),'T3-logout-patient');
 await activate(page.getByTestId('login-caregiver_demo'),'T3-select-caregiver');
 await activate(page.getByRole('button',{name:'Entrada Rápida',exact:true}),'T3-enter-caregiver');
 await activate(page.getByRole('link',{name:'Tratamiento y existencias',exact:true}),'T3-treatment-and-stock');
 await capture('07-t3-treatment.png');
 await activate(page.getByRole('link',{name:'Citas médicas',exact:true}),'T3-appointments');
 await capture('08-t3-appointments.png');
 await record('finished');
}catch(error){await record('FAILED',{error:String(error)}).catch(()=>{});console.error(String(error));process.exitCode=1;}
process.exit(process.exitCode??0);
