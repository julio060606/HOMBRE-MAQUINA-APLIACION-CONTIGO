import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../../..');
const out = path.join(root, 'output/wcag-audit-2026-11-04/evidence');
const base = 'http://127.0.0.1:3001';
const require = createRequire(import.meta.url);
const axeSource = await fs.readFile(require.resolve('../node_modules/axe-core/axe.min.js'), 'utf8');
await fs.mkdir(out, { recursive: true });
const report = {
  complete: false,
  date: '2026-11-04',
  startedAt: new Date().toISOString(),
  origin: base,
  engine: 'Chrome headless y axe-core',
  axeVersion: require('../node_modules/axe-core/package.json').version,
  sourceHashes: {},
  screens: [], checks: [], layouts: [], errors: [], blockedWrites: [], fixtureWrites: [],
  limitations: ['Las interacciones se ejecutan con teclado y API del navegador en contextos privados.', 'Los casos de guardado, respuesta de toma y SOS usan transporte interceptado, identificado como FIXTURE en cada estado. No escriben datos clínicos centrales.', 'Escala del producto y CSS de espaciado se distinguen del zoom nativo. Lectura real con NVDA/TalkBack/VoiceOver y Stark requieren ejecución adicional.', 'Las fotografías, redacción y semántica se inspeccionan en la muestra. Los resultados incomplete de axe requieren evaluación manual.'],
};
async function collectHashes(folder) {
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) await collectHashes(file);
    else if (/\.(tsx?|css)$/.test(entry.name)) report.sourceHashes[path.relative(root, file).replaceAll('\\', '/')] = crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
  }
}
await collectHashes(path.join(root, 'frontend/src'));
for (const file of ['frontend/index.html', 'backend/src/main/java/com/sanpablo/contigo/service/SupportSessionService.java', 'backend/src/main/java/com/sanpablo/contigo/service/PairingService.java']) {
  report.sourceHashes[file] = crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex');
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browserVersion = browser.version();
const contexts = [];
let lastPage;

async function context(role, width = 1280) {
  const ctx = await browser.newContext({ viewport: { width, height: 960 }, locale: 'es-PE', reducedMotion: 'reduce' });
  contexts.push(ctx);
  const page = await ctx.newPage();
  lastPage = page;
  page.on('pageerror', error => report.errors.push({ role, message: error.message }));
  await ctx.route('**/api/**', async route => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !/\/auth\/(login|refresh|logout)$/.test(new URL(request.url()).pathname)) {
      report.blockedWrites.push({ role, method: request.method(), path: new URL(request.url()).pathname });
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  if (role !== 'public') {
    await page.goto(base + '/login');
    await page.getByText('Cambiar cuenta de prueba', { exact: true }).click();
    await page.getByTestId(role === 'patient' ? 'login-patient_dacio' : 'login-caregiver_demo').click();
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL(role === 'patient' ? '**/patient-app' : '**/dashboard');
    await page.getByRole('heading', { name: role === 'patient' ? 'Hola, Dacio' : 'Resumen del día', exact: true }).waitFor();
  }
  return page;
}
async function snapshot(page, id, mode = 'API', selector) {
  await page.waitForTimeout(120);
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    const axe = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    const concise = value => ({ id: value.id, impact: value.impact, tags: value.tags, help: value.help, nodes: value.nodes.map(node => ({ target: node.target, html: node.html, failureSummary: node.failureSummary, any: node.any, all: node.all, none: node.none })) });
    const visible = element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
    const identify = element => ({ tag: element.tagName, text: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 180), id: element.id, testid: element.getAttribute('data-testid') });
    const elements = [...document.querySelectorAll('*')];
    const idCounts = new Map();
    for (const element of elements) if (element.id) idCounts.set(element.id, (idCounts.get(element.id) || 0) + 1);
    const missingReferences = [];
    for (const element of elements) for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
      for (const reference of (element.getAttribute(attribute) || '').split(/\s+/).filter(Boolean)) if (!document.getElementById(reference)) missingReferences.push({ ...identify(element), attribute, reference });
    }
    return {
      title: document.title, lang: document.documentElement.lang, url: location.href,
      viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
      activeElement: identify(document.activeElement),
      headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(identify),
      controls: [...document.querySelectorAll('button,input,select,textarea,summary,a[href]')].filter(visible).map(element => ({ ...identify(element), name: element.getAttribute('name'), type: element.getAttribute('type'), labels: 'labels' in element ? [...element.labels || []].map(label => label.textContent.trim()) : [], autocomplete: element.getAttribute('autocomplete'), role: element.getAttribute('role'), ariaInvalid: element.getAttribute('aria-invalid'), ariaDescribedby: element.getAttribute('aria-describedby'), expanded: element.getAttribute('aria-expanded'), pressed: element.getAttribute('aria-pressed'), current: element.getAttribute('aria-current'), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })),
      images: [...document.images].filter(visible).map(image => ({ alt: image.getAttribute('alt'), src: image.getAttribute('src'), width: image.width, height: image.height, loaded: image.complete && image.naturalWidth > 0 })),
      statuses: [...document.querySelectorAll('[role="status"],[role="alert"],[role="log"],[aria-live]')].filter(visible).map(element => ({ ...identify(element), role: element.getAttribute('role'), live: element.getAttribute('aria-live') })),
      duplicateIds: [...idCounts].filter(([, count]) => count > 1), missingReferences,
      axe: { violations: axe.violations.map(concise), incomplete: axe.incomplete.map(concise), passedRules: axe.passes.map(rule => rule.id), inapplicable: axe.inapplicable.map(rule => rule.id) },
    };
  });
  const filename = id + '.png';
  if (selector) await page.locator(selector).screenshot({ path: path.join(out, filename) });
  else await page.screenshot({ path: path.join(out, filename), fullPage: true });
  report.screens.push({ id, mode, screenshot: filename, ...result });
  await fs.writeFile(path.join(out, id + '.json'), JSON.stringify(result, null, 2));
  console.log(`${id} axe=${result.axe.violations.length} incomplete=${result.axe.incomplete.length}`);
  return result;
}
async function check(name, execute) {
  try { report.checks.push({ name, ...(await execute()) }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); }
}
async function tabTo(page, locator) {
  for (let index = 0; index < 200; index++) {
    if (await locator.evaluate(element => element === document.activeElement)) return index;
    await page.keyboard.press('Tab');
  }
  throw Error('Control no alcanzado en 200 pasos Tab');
}
async function activate(page, locator) { await tabTo(page, locator); await page.keyboard.press('Enter'); }
async function scale(page, size) {
  await page.evaluate(async size => {
    const { setReadingPreferences, DEFAULT_READING_PREFERENCES } = await import('/src/services/accessibilityPreferences.ts');
    setReadingPreferences({ ...DEFAULT_READING_PREFERENCES, scale: String(size) });
  }, size);
  await page.waitForTimeout(80);
}
async function layout(page, id, size, viewport, spacing = false) {
  await page.setViewportSize(viewport);
  await scale(page, size);
  if (spacing) await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
  const geometry = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('main *, dialog[open] *')].filter(element => element.getClientRects().length);
    const controls = nodes.filter(element => /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(element.tagName));
    return {
      viewport: { width: innerWidth, height: innerHeight }, scrollWidth: document.documentElement.scrollWidth,
      overflowingControls: controls.filter(element => element.scrollWidth > element.clientWidth + 2 && !/^(INPUT|TEXTAREA)$/.test(element.tagName)).map(element => ({ tag: element.tagName, text: element.textContent.trim(), client: element.clientWidth, scroll: element.scrollWidth })),
      textClips: nodes.filter(element => !element.children.length && element.textContent.trim() && !element.closest('[aria-hidden="true"]') && getComputedStyle(element).overflowY === 'hidden' && element.scrollHeight > element.clientHeight + 2).map(element => ({ tag: element.tagName, text: element.textContent.trim().slice(0, 120), height: element.clientHeight, scroll: element.scrollHeight })),
    };
  });
  const screenshot = id + '.png';
  await page.screenshot({ path: path.join(out, screenshot), fullPage: true });
  report.layouts.push({ id, scale: size, spacing, screenshot, ...geometry });
  return geometry;
}

try {
  const publicPage = await context('public');
  for (const [id, route, title] of [['01-login', '/login', 'Iniciar sesión'], ['02-landing', '/landing', /El cuidado diario/], ['03-clinic', '/clinic', /Tu salud merece/], ['04-accessibility', '/accessibility', 'Accesibilidad y ayuda de CONTIGO']]) {
    await publicPage.goto(base + route); await publicPage.getByRole('heading', { name: title, level: 1 }).waitFor(); await snapshot(publicPage, id);
  }
  await publicPage.goto(base + '/login'); await publicPage.locator('#email-input').waitFor();
  await publicPage.locator('#password-input').fill('Incorrecta-auditoria'); await activate(publicPage, publicPage.getByRole('button', { name: 'Entrar', exact: true }));
  await publicPage.getByRole('alert').waitFor(); await snapshot(publicPage, '05-login-error');
  for (const route of ['/login', '/landing', '/clinic']) {
    await publicPage.goto(base + route); await publicPage.locator('main h1').waitFor();
    await layout(publicPage, `layout-${route.slice(1)}-320-200`, 200, { width: 320, height: 900 });
    await publicPage.goto(base + route); await publicPage.locator('main h1').waitFor();
    await layout(publicPage, `spacing-${route.slice(1)}`, 100, { width: 390, height: 900 }, true);
  }

  const patient = await context('patient', 390);
  await snapshot(patient, '06-patient-home');
  await check('T1 y T4 accesibles mediante Tab, Enter y foco visible', async () => {
    const control = patient.getByTestId('input-systolic');
    const tabs = await tabTo(patient, control);
    const focus = await control.evaluate(element => ({ outline: getComputedStyle(element).outline, shadow: getComputedStyle(element).boxShadow, active: element === document.activeElement }));
    return { passed: focus.active && !focus.outline.startsWith('0px'), tabs, focus };
  });
  await activate(patient, patient.getByTestId('btn-save-vitals'));
  await patient.locator('.measurement-form [role="alert"]').waitFor(); await snapshot(patient, '07-pressure-empty-error');
  await patient.getByTestId('input-systolic').fill('80'); await patient.getByTestId('input-diastolic').fill('120');
  await activate(patient, patient.getByTestId('btn-save-vitals')); await snapshot(patient, '08-pressure-relation-error');
  await patient.getByTestId('input-systolic').fill('120'); await patient.getByTestId('input-diastolic').fill('80');
  await activate(patient, patient.getByTestId('btn-save-vitals')); await patient.getByTestId('measurement-review').waitFor(); await snapshot(patient, '09-pressure-review');
  await activate(patient, patient.getByRole('button', { name: 'Corregir números', exact: true }));
  report.checks.push({ name: 'T4 revisar y corregir conserva valores y foco', passed: await patient.getByTestId('input-systolic').inputValue() === '120' && await patient.getByTestId('input-diastolic').inputValue() === '80' && await patient.getByTestId('input-systolic').evaluate(element => element === document.activeElement) });
  await patient.route('**/measurements/pressure', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    report.fixtureWrites.push({ kind: 'pressure', path: new URL(route.request().url()).pathname });
    await route.fulfill({ json: { id: 'audit-fixture-pressure', ...route.request().postDataJSON(), source: 'HOME', status: 'UNCLASSIFIED' } });
  });
  await activate(patient, patient.getByTestId('btn-save-vitals')); await activate(patient, patient.getByTestId('btn-confirm-vitals')); await patient.getByRole('status').filter({ hasText: 'Medición guardada.' }).waitFor(); await snapshot(patient, '10-pressure-confirmation', 'FIXTURE POST, sin persistencia central');
  await patient.getByRole('button', { name: 'Registrar otra medición', exact: true }).click(); await patient.getByTestId('measurement-weight').click(); await patient.getByTestId('input-weight').fill('72,5'); await patient.getByTestId('btn-save-vitals').click(); await patient.getByTestId('measurement-review').waitFor(); await snapshot(patient, '11-weight-review');
  await patient.getByRole('button', { name: 'Corregir números', exact: true }).click();

  const reading = patient.getByRole('button', { name: 'Opciones de lectura', exact: true });
  await activate(patient, reading); await snapshot(patient, '12-reading-options');
  await check('Diálogo de lectura contiene el foco y Escape lo devuelve al activador', async () => {
    const positions = [];
    for (let index = 0; index < 36; index++) { await patient.keyboard.press('Tab'); positions.push(await patient.evaluate(() => !!document.activeElement.closest('dialog[open]'))); }
    await patient.keyboard.press('Escape');
    return { passed: positions.every(Boolean) && await reading.evaluate(element => element === document.activeElement), stepsInside: positions.filter(Boolean).length };
  });
  const communicate = patient.getByRole('button', { name: 'Comunicarme', exact: true });
  await activate(patient, communicate); await patient.getByRole('button', { name: 'Prefiero comunicarme por escrito', exact: true }).click(); await patient.getByRole('button', { name: 'Mostrar mensaje grande', exact: true }).click(); await snapshot(patient, '13-communication-large');
  await patient.getByRole('button', { name: 'Escribir una respuesta', exact: true }).click(); await snapshot(patient, '14-communication-response'); await patient.keyboard.press('Escape');

  const session = { id: 'audit-fixture-support', patientId: 'pat_001', patientName: 'Dacio Ramos', callerId: 'patient_dacio', status: 'WAITING', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1800000).toISOString(), alertId: 'audit-fixture-alert' };
  await patient.route('**/support-sessions**', async route => {
    const request = route.request(); const pathname = new URL(request.url()).pathname;
    if (request.method() === 'POST') {
      report.fixtureWrites.push({ kind: 'support', path: pathname });
      if (pathname.endsWith('/end')) session.status = 'ENDED';
      return route.fulfill({ json: session });
    }
    if (pathname.endsWith('/events')) return route.fulfill({ json: { session, events: [] } });
    return route.fulfill({ json: [session] });
  });
  await activate(patient, patient.getByTestId('patient-sos')); await patient.getByText('Esperando respuesta', { exact: true }).waitFor(); await snapshot(patient, '15-sos-waiting', 'FIXTURE sesión y eventos');
  await patient.getByTestId('support-message-input').fill('Borrador de auditoría sin enviar');
  session.status = 'ENDED'; session.endedReason = 'EXPIRED';
  await patient.getByText('Conversación finalizada', { exact: true }).waitFor(); await snapshot(patient, '16-sos-expired', 'FIXTURE caducidad sin espera real de 30 minutos');
  report.checks.push({ name: 'Caducidad SOS conserva acceso al borrador sin enviar', passed: await patient.getByTestId('support-message-input').isVisible(), observation: 'Se simuló ENDED/EXPIRED con borrador previo y se inspeccionó la interfaz resultante.' });
  await patient.getByTestId('support-end').click();

  const apiResponse = await patient.request.get(base + '/api/v1/health'); report.health = await apiResponse.json();
  await patient.route('**/patients/pat_001/dashboard', async route => {
    const response = await route.fetch(); const data = await response.json();
    const original = data.today.find(dose => dose.medicationName) || data.history[0];
    const dose = { ...original, id: 'audit-fixture-dose', medicationName: 'Losartán de prueba', dosage: '50 mg', patientId: 'pat_001', status: 'PENDING', version: 1, scheduledTime: '08:00', scheduledAt: new Date().toISOString(), instructions: 'Indicación ficticia para la auditoría.' };
    data.today = [dose];
    await route.fulfill({ response, json: data });
  });
  await patient.goto(base + '/patient-app'); await patient.getByRole('heading', { name: 'Losartán de prueba', exact: true }).waitFor();
  await snapshot(patient, '17-dose-pending', 'FIXTURE GET de toma pendiente');
  await patient.route('**/doses/audit-fixture-dose/responses', async route => {
    report.fixtureWrites.push({ kind: 'dose', path: new URL(route.request().url()).pathname });
    return route.fulfill({ status: 503, json: { message: 'Fallo controlado de auditoría al guardar' } });
  });
  await activate(patient, patient.getByTestId('dose-taken')); await patient.getByRole('alert').filter({ hasText: 'Fallo controlado' }).waitFor(); await snapshot(patient, '18-dose-save-error', 'FIXTURE POST 503');
  for (const size of [100,200]) {
    await layout(patient, `layout-patient-320-${size}`, size, { width: 320, height: 900 });
    await layout(patient, `layout-patient-landscape-${size}`, size, { width: 844, height: 390 });
  }
  await patient.goto(base + '/patient-app'); await patient.getByRole('heading', { name: 'Hola, Dacio', exact: true }).waitFor();
  await layout(patient, 'spacing-patient', 100, { width: 390, height: 900 }, true);

  const caregiver = await context('caregiver');
  for (const [id, route, title] of [['19-dashboard','/dashboard','Resumen del día'],['20-medications','/medications','Tratamiento y existencias'],['21-appointments','/appointments','Próximas citas'],['22-vitals','/vitals','Gráficas y mediciones'],['23-profile','/clinical-profile','Ficha clínica'],['24-settings','/settings','Preferencias'],['25-reports','/reports','Informes']]) {
    await caregiver.goto(base + route); await caregiver.locator('main h1').waitFor(); await caregiver.waitForFunction(route => location.pathname === route && !document.querySelector('main')?.textContent.includes('Cargando información autorizada'), route);
    // Record the actual heading instead of assuming it from the route label.
    await caregiver.waitForTimeout(250); await snapshot(caregiver,id);
  }
  await caregiver.goto(base + '/medications'); await caregiver.getByRole('heading', { name: 'Tratamiento y existencias', exact: true }).waitFor();
  const supply = caregiver.locator('details').filter({ hasText: 'Registrar reposición o conteo físico' }).first(); await supply.locator('summary').click();
  await supply.getByRole('button', { name: 'Revisar movimiento', exact: true }).click(); await supply.getByRole('alert').waitFor(); await snapshot(caregiver, '26-supply-error');
  await supply.locator('input[type="number"]').fill('5'); await supply.locator('input').last().fill('Conteo sintético auditoría'); await supply.getByRole('button', { name: 'Revisar movimiento', exact: true }).click(); await supply.getByRole('heading', { name: /Revisa el movimiento/ }).waitFor(); await snapshot(caregiver, '27-supply-review');
  await caregiver.goto(base + '/dashboard'); await caregiver.getByRole('heading', { name: 'Resumen del día', exact: true }).waitFor();
  await caregiver.locator('summary').filter({ hasText: 'Mi cuenta' }).click(); await caregiver.getByTestId('link-patient').click(); await caregiver.getByRole('dialog').waitFor(); await snapshot(caregiver, '28-pairing-dialog'); await caregiver.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await check('Vinculación devuelve foco al activador disponible', async () => ({ passed: await caregiver.evaluate(() => document.activeElement?.getClientRects().length > 0 && !document.activeElement.closest('details:not([open])')), active: await caregiver.evaluate(() => ({ tag: document.activeElement.tagName, text: document.activeElement.textContent.slice(0,100) })) }));
  for (const route of ['/dashboard','/medications','/appointments','/vitals','/clinical-profile','/settings','/reports']) {
    await caregiver.goto(base + route); await caregiver.locator('main h1').waitFor(); await caregiver.waitForTimeout(250);
    await layout(caregiver,`layout-${route.slice(1)}-320-200`,200,{width:320,height:900});
    await caregiver.goto(base + route); await caregiver.locator('main h1').waitFor(); await caregiver.waitForTimeout(200);
    await layout(caregiver,`spacing-${route.slice(1)}`,100,{width:390,height:900},true);
  }
  await caregiver.goto(base + '/dashboard'); await caregiver.getByRole('heading', { name: 'Resumen del día', exact: true }).waitFor(); await scale(caregiver,100);
  await caregiver.setViewportSize({width:320,height:900});
  await check('Menú cuidador recorre teclado y retorna foco con Escape',async()=>{
    const menu=caregiver.getByRole('button',{name:'Abrir menú de navegación',exact:true});await activate(caregiver,menu);await caregiver.waitForFunction(()=>document.activeElement?.closest('nav')?.getAttribute('aria-label')==='Módulos de seguimiento');await caregiver.keyboard.press('Escape');return{passed:await menu.evaluate(e=>e===document.activeElement)};
  });
  await caregiver.setViewportSize({width:1280,height:960});
  await check('Ruta lazy actualiza título y foco aun con módulo demorado',async()=>{
    await caregiver.route('**/features/vitals/VitalsPage.tsx',async route=>{await new Promise(resolve=>setTimeout(resolve,900));await route.continue();});
    // A separate fresh context ensures the Vitals lazy module is not cached.
    const fresh=await context('caregiver');await fresh.route('**/features/vitals/VitalsPage.tsx',async route=>{await new Promise(resolve=>setTimeout(resolve,1000));await route.continue();});
    await fresh.getByRole('navigation',{name:'Módulos de seguimiento'}).getByRole('link',{name:'Mediciones',exact:true}).click();await fresh.getByRole('heading',{name:'Gráficas y mediciones',exact:true}).waitFor();await fresh.waitForTimeout(150);
    const result=await fresh.evaluate(()=>({title:document.title,activeTag:document.activeElement.tagName,activeText:document.activeElement.textContent.slice(0,120)}));await snapshot(fresh,'29-route-focus');return{passed:result.title.startsWith('Gráficas y mediciones')&&result.activeTag==='H1'&&result.activeText==='Gráficas y mediciones',result};
  });
  report.sourceHashesAfter={};for(const[file]of Object.entries(report.sourceHashes))report.sourceHashesAfter[file]=crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex');
  report.changedSources=Object.keys(report.sourceHashes).filter(file=>report.sourceHashes[file]!==report.sourceHashesAfter[file]);
  report.complete=report.changedSources.length===0;
} catch(error) { report.errors.push({message:error.message,stack:error.stack}); if(lastPage)await lastPage.screenshot({path:path.join(out,'runner-failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1; }
finally {
  report.finishedAt=new Date().toISOString();
  await fs.writeFile(path.join(out,'audit.json'),JSON.stringify(report,null,2));
  await browser.close();
}
console.log(JSON.stringify({complete:report.complete,screens:report.screens.length,checks:report.checks,layouts:report.layouts.length,errors:report.errors,blockedWrites:report.blockedWrites}));
