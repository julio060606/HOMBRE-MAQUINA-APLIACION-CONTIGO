import {chromium} from '../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../../..');
const out=path.join(root,'output/wcag-audit-2026-11-04/evidence');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:960},locale:'es-PE'});
const result={fixture:'GET dashboard cambia únicamente edad ilustrativa, sin escritura central',requests:[],before:null,after:null};
await page.route('**/api/**',route=>{const r=route.request();return !['GET','HEAD','OPTIONS'].includes(r.method())&&!/\/auth\/(login|refresh|logout)$/.test(new URL(r.url()).pathname)?route.abort():route.continue();});
try {
  await page.goto('http://127.0.0.1:3001/login');await page.getByText('Cambiar cuenta de prueba',{exact:true}).click();await page.getByTestId('login-caregiver_demo').click();await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForURL('**/dashboard');await page.getByRole('heading',{name:'Resumen del día',exact:true}).waitFor();
  const started=Date.now();
  await page.route('**/patients/pat_001/dashboard',async route=>{const response=await route.fetch();const data=await response.json();data.patient.age=Date.now()-started>5000?73:72;result.requests.push({at:new Date().toISOString(),age:data.patient.age});await route.fulfill({response,json:data});});
  await page.reload();await page.getByText('72 años',{exact:true}).waitFor();
  result.before=await page.locator('main').innerText();await page.screenshot({path:path.join(out,'36-auto-refresh-before.png'),fullPage:true});
  await page.getByText('73 años',{exact:true}).waitFor({timeout:42000});
  result.after=await page.locator('main').innerText();await page.screenshot({path:path.join(out,'37-auto-refresh-after.png'),fullPage:true});
  result.controls=await page.getByRole('button').allTextContents();result.changedWithoutUserAction=true;
}catch(error){result.error=error.message;process.exitCode=1;}
finally{await fs.writeFile(path.join(out,'timed-refresh.json'),JSON.stringify(result,null,2));await browser.close();}
console.log(JSON.stringify({requests:result.requests,changedWithoutUserAction:result.changedWithoutUserAction,error:result.error}));
