import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const out = path.join(root, 'output/wcag-audit-2026-11-04/evidence');
const base = 'http://127.0.0.1:3001';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { date: new Date().toISOString(), layouts: [], contrasts: [], checks: [], extraScreens: [], blockedWrites: [] };
const axeSource = await fs.readFile(path.join(root,'tools/apf3/node_modules/axe-core/axe.min.js'),'utf8');
async function state(page,id,mode) {
  await page.addScriptTag({content:axeSource});
  const result = await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return{title:document.title,url:location.href,lang:document.documentElement.lang,axe:{violations:r.violations,incomplete:r.incomplete,passedRules:r.passes.map(x=>x.id)}};});
  await page.screenshot({path:path.join(out,id+'.png'),fullPage:true});report.extraScreens.push({id,mode,screenshot:id+'.png',...result});
}
async function login(role) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, locale: 'es-PE' });
  await page.route('**/api/**', route => {
    const req = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method()) && !/\/auth\/(login|refresh|logout)$/.test(new URL(req.url()).pathname)) {
      report.blockedWrites.push(req.method() + ' ' + new URL(req.url()).pathname);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(base + '/login');
  await page.getByText('Cambiar cuenta de prueba', { exact: true }).click();
  await page.getByTestId('login-' + role).click();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL(role === 'patient_dacio' ? '**/patient-app' : '**/dashboard');
  await page.locator('main h1').waitFor();
  return page;
}
async function scale(page, value) {
  await page.evaluate(async value => {
    const { setReadingPreferences, DEFAULT_READING_PREFERENCES } = await import('/src/services/accessibilityPreferences.ts');
    setReadingPreferences({ ...DEFAULT_READING_PREFERENCES, scale: String(value) });
  }, value);
  await page.waitForTimeout(150);
}
async function geometry(page, id) {
  const result = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll('main *, header *')].filter(e => {
      const r = e.getBoundingClientRect(); const css = getComputedStyle(e);
      return r.width > 1 && r.height > 1 && css.visibility !== 'hidden' && !e.closest('[aria-hidden="true"]') && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.overflow-x-auto');
    }).map(e => ({ tag: e.tagName, text: e.textContent.trim().slice(0, 80), className: e.getAttribute('class'), right: e.getBoundingClientRect().right, width: e.getBoundingClientRect().width })).slice(0, 16),
  }));
  await page.screenshot({ path: path.join(out, id + '.png'), fullPage: true });
  report.layouts.push({ id, ...result });
}
async function contrast(page, id, selector) {
  const elements = await page.locator(selector).evaluateAll(elements => elements.filter(e => e.getClientRects().length).map(e => {
    const css = getComputedStyle(e); const chain = [];
    for (let node = e; node; node = node.parentElement) {
      const c = getComputedStyle(node);
      if (c.backgroundColor !== 'rgba(0, 0, 0, 0)' || c.backgroundImage !== 'none') chain.push({ tag: node.tagName, bg: c.backgroundColor, image: c.backgroundImage, opacity: c.opacity });
    }
    return { tag: e.tagName, text: (e.textContent || e.getAttribute('aria-label') || e.getAttribute('placeholder') || '').trim().slice(0, 90), color: css.color, fill:css.fill, fontSize: css.fontSize, fontWeight: css.fontWeight, border: css.borderColor, outline: css.outline, background: css.backgroundColor, chain };
  }));
  report.contrasts.push({ id, elements });
}
try {
  const page = await login('caregiver_demo');
  for (const route of ['/dashboard', '/medications', '/appointments', '/vitals', '/clinical-profile', '/settings', '/reports']) {
    await page.goto(base + route); await page.locator('main h1').waitFor(); await page.waitForTimeout(300); await scale(page, 100);
    await page.setViewportSize({ width: 320, height: 900 }); await geometry(page, 'reflow-' + route.slice(1) + '-320-100');
    await contrast(page, route, 'main input,main select, main textarea,main svg text, main svg tspan');
  }
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto(base + '/medications'); await page.getByRole('heading', { name: 'Tratamiento y existencias', exact: true }).waitFor();
  const supply = page.locator('details').filter({ hasText: 'Registrar reposición o conteo físico' }).first(); await supply.locator('summary').click();
  await supply.locator('input[type="number"]').fill('5'); await supply.locator('input').last().fill('x');
  await supply.getByRole('button', { name: 'Revisar movimiento', exact: true }).click(); await supply.getByRole('alert').waitFor();
  report.checks.push({ id: 'supply-reason-only', fields: await supply.locator('input').evaluateAll(elements => elements.map(e => ({ label: e.labels[0].textContent, value: e.value, invalid: e.getAttribute('aria-invalid'), describedby: e.getAttribute('aria-describedby'), focused: e === document.activeElement }))), alert: await supply.getByRole('alert').innerText() });
  await page.screenshot({ path: path.join(out, '30-supply-reason-only.png'), fullPage: true });
  await page.goto(base + '/vitals'); await page.getByRole('heading', { name: 'Gráficas y mediciones', exact: true }).waitFor();
  await fs.writeFile(path.join(out, 'vitals-aria.txt'), await page.locator('main').ariaSnapshot());
  report.checks.push({ id: 'graph-visual-alternative', charts: await page.locator('main [role="img"]').count(), tables: await page.locator('main table').count(), rows: await page.locator('main tbody tr').count() });
  await page.setViewportSize({ width: 844, height: 390 }); await geometry(page, 'orientation-vitals-landscape');
  await page.goto(base + '/dashboard'); await page.getByRole('heading', { name: 'Resumen del día', exact: true }).waitFor();
  await page.locator('summary').filter({ hasText: 'Mi cuenta' }).click();
  await page.getByTestId('link-patient').click(); await page.getByRole('dialog').waitFor();
  await page.getByRole('button', {name:'Cancelar',exact:true}).click(); await page.waitForTimeout(600);
  report.checks.push({id:'pairing-return-after-animation',active:await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent.slice(0,90),testid:document.activeElement.getAttribute('data-testid'),visible:document.activeElement.getClientRects().length>0,closedDetails:!!document.activeElement.closest('details:not([open])')}))});
  await page.screenshot({path:path.join(out,'31-pairing-return.png'),fullPage:true});
  await page.keyboard.press('Tab');report.checks.push({id:'pairing-next-tab',active:await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent.trim().slice(0,90)}))});
  await contrast(page, 'dashboard-gradient', '[class*="patientLabel"],[class*="patientName"] h2,[class*="patientIdentity"] p,[class*="syncBadge"]');
  await fs.writeFile(path.join(out, 'dashboard-aria.txt'), await page.locator('main').ariaSnapshot());
  await page.goto(base + '/clinic'); await page.locator('#clinic-title').waitFor();
  await contrast(page, 'clinic-hero', '#clinic-title,#clinic-title span,[class*="heroCopy"] p,[class*="heroActions"] a');
  await page.goto(base + '/landing'); await page.locator('main h1').waitFor();
  await contrast(page, 'landing-image', '.ct-phone-greeting span,.ct-phone-greeting strong,.ct-photo-caption span,.ct-photo-caption strong');
  const patient = await login('patient_dacio');
  await patient.getByRole('heading', { name: 'Hola, Dacio', exact: true }).waitFor();
  report.checks.push({id:'patient-label-in-name',buttons:await patient.locator('button[aria-label]').evaluateAll(elements=>elements.filter(e=>e.getClientRects().length).map(e=>({visible:e.innerText.trim(),name:e.getAttribute('aria-label')})))});
  await scale(patient, 200);
  await patient.setViewportSize({ width: 320, height: 900 });
  await patient.getByRole('button', { name: /Opciones de lectura/ }).click(); await patient.getByRole('dialog').waitFor();
  await geometry(patient, 'dialog-reading-320-200'); await patient.keyboard.press('Escape');
  await patient.getByRole('button', { name: 'Comunicarme', exact: true }).click(); await patient.getByRole('dialog').waitFor();
  await geometry(patient, 'dialog-communication-320-200');
  await contrast(patient, 'communication', 'dialog[open] textarea,dialog[open] p,dialog[open] h2,dialog[open] button');
  await patient.keyboard.press('Escape'); await scale(patient,100);
  await contrast(patient, 'measurement', '[data-testid="input-systolic"],[data-testid="input-diastolic"],[data-testid="input-pulse"]');
  let releaseLoad;
  const hold = new Promise(resolve=>{releaseLoad=resolve;});
  await patient.route('**/patients/pat_001/dashboard',async route=>{await hold;return route.continue();});
  await patient.goto(base+'/patient-app',{waitUntil:'domcontentloaded'});await patient.getByText('Cargando tu información…',{exact:false}).waitFor();await state(patient,'32-patient-loading','GET retenido hasta terminar captura');releaseLoad();
  await patient.unroute('**/patients/pat_001/dashboard');
  await patient.getByRole('heading',{name:'Hola, Dacio',exact:true}).waitFor();
  await patient.route('**/patients/pat_001/dashboard',route=>route.fulfill({status:503,json:{message:'No se pudo cargar. Fallo controlado de auditoría.'}}));
  await patient.goto(base+'/patient-app');await patient.getByRole('button',{name:'Reintentar',exact:true}).waitFor();await state(patient,'33-patient-data-error','FIXTURE GET 503');await patient.unroute('**/patients/pat_001/dashboard');
  await patient.route('**/patients/pat_001/dashboard',async route=>{const response=await route.fetch();const data=await response.json();data.today=[];data.history=[];data.appointments=[];data.pressures=[];data.weights=[];await route.fulfill({response,json:data});});
  await patient.goto(base+'/patient-app');await patient.getByRole('heading',{name:'Hola, Dacio',exact:true}).waitFor();await state(patient,'34-patient-empty','FIXTURE arrays vacíos del GET');
  await page.goto(base+'/register');await page.getByRole('heading',{name:'Acceso del cuidador',exact:true}).waitFor();await state(page,'35-register','API, ruta informativa');
} finally {
  await fs.writeFile(path.join(out, 'probes.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ layouts: report.layouts.map(x=>({id:x.id,width:x.width,scrollWidth:x.scrollWidth,offenders:x.offenders})),checks:report.checks,blockedWrites:report.blockedWrites }));
