import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const base = process.argv[2] || 'http://127.0.0.1:3013';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw Error('Local test origin required');
const output = path.resolve(import.meta.dirname, '../../output/apf3/evidence/current-2026-11-03/flows');
await fs.mkdir(output, { recursive: true });
const report = { timestamp: new Date().toISOString(), base, method: 'Technical keyboard traversal in fresh isolated Chrome contexts with local synthetic demo data',
  limitations: ['No recruited participants or usability metrics.', 'Headless keyboard verification is not a screen-reader test.', 'Synthetic writes, when made, exist only in this new browser context; HTTP API requests are blocked.'],
  sourceHashes: {}, steps: [], checks: [], errors: [], externalApiRequests: [] };
for (const file of ['frontend/src/features/patient-app/PatientAppContent.tsx', 'frontend/src/features/patient-app/MeasurementForm.tsx', 'frontend/src/features/patient-app/DoseCard.tsx', 'frontend/src/features/patient-app/PatientHelp.tsx', 'frontend/src/features/medications/MedicationsPage.tsx', 'frontend/src/features/appointments/AppointmentsPage.tsx', 'frontend/src/styles/index.css']) {
  report.sourceHashes[file] = crypto.createHash('sha256').update(await fs.readFile(path.resolve(import.meta.dirname, '../..', file))).digest('hex');
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browser = browser.version();
function assert(value, message) { if (!value) throw Error(message); }
async function focus(page) { return page.evaluate(() => { const element = document.activeElement; return { tag: element.tagName, text: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 200), id: element.id, testid: element.getAttribute('data-testid') }; }); }
async function key(page, value) { assert(new URL(page.url()).origin === new URL(base).origin, 'Origin changed'); await page.keyboard.press(value); }
async function tabTo(page, selector, reverse = false) {
  const target = page.locator(selector).first();
  for (let i = 0; i < 160; i++) {
    if (await target.evaluate(element => element === document.activeElement)) return;
    await key(page, reverse ? 'Shift+Tab' : 'Tab');
  }
  throw Error('Control not reachable by keyboard: ' + selector);
}
async function activate(page, selector, name, reverse = false) { await tabTo(page, selector, reverse); const before = await focus(page); await key(page, 'Enter'); report.steps.push({ name, key: 'Enter', activated: before }); }
async function write(page, selector, value, name, reverse = false) { await tabTo(page, selector, reverse); await key(page, 'Control+A'); await page.keyboard.type(value); report.steps.push({ name, input: value, focus: await focus(page) }); }
async function state(page) { return page.evaluate(() => new Promise((resolve, reject) => { const request = indexedDB.open('contigo-synthetic-demo', 1); request.onsuccess = () => { const db = request.result, tx = db.transaction('datasets', 'readonly'), get = tx.objectStore('datasets').get('default'); get.onsuccess = () => resolve({ alerts: get.result.alerts.length, pressures: get.result.pressures.length, taken: get.result.intakes.filter(d => d.status === 'TAKEN').length }); tx.oncomplete = () => db.close(); }; request.onerror = () => reject(request.error); })); }
async function picture(page, name) { await page.screenshot({ path: path.join(output, name), fullPage: true }); return name; }
async function session(actor, route) {
  const context = await browser.newContext({ locale: 'es-PE', viewport: { width: 1280, height: 960 }, reducedMotion: 'reduce' });
  await context.addInitScript(id => sessionStorage.setItem('contigo-demo-actor-v1', id), actor);
  await context.route('**/api/**', route => { report.externalApiRequests.push(route.request().url()); return route.abort('blockedbyclient'); });
  const page = await context.newPage(); await page.goto(base + route); await page.waitForLoadState('networkidle'); return { page, context };
}
try {
  const patient = await session('patient_dacio', '/patient-app'), page = patient.page;
  await page.getByRole('heading', { name: 'Mis medicamentos', exact: true }).waitFor();
  const initial = await state(page);
  await activate(page, '[data-testid="dose-taken"]', 'T1 record isolated synthetic response');
  await page.getByRole('status').filter({ hasText: 'registraste que la tomaste' }).waitFor();
  const recorded = await state(page); assert(recorded.taken === initial.taken + 1, 'T1 did not record exactly one isolated synthetic dose');
  await activate(page, 'button:has-text("Revisar mi respuesta")', 'T1 open recorded response');
  await activate(page, 'button[aria-label^="Corregir respuesta de"]', 'T1 open correction');
  assert((await focus(page)).tag === 'INPUT', 'T1 reason did not receive focus');
  await activate(page, 'button:has-text("Cancelar corrección")', 'T1 cancel correction');
  assert((await focus(page)).text.startsWith('Corregir respuesta de'), 'T1 cancel did not return focus');
  assert((await state(page)).taken === recorded.taken, 'T1 cancellation changed response');
  report.checks.push({ task: 'T1', passed: true, result: 'Keyboard response and cancellation of correction; only isolated synthetic data changed.', initial, recorded, screenshot: await picture(page, '01-t1-response-cancel.png') });

  const beforeSos = await state(page);
  await activate(page, '[data-testid="patient-sos"]', 'T2 open SOS', true);
  const dialog = page.getByRole('dialog'); await dialog.waitFor({ state: 'visible' });
  assert((await focus(page)).text.includes('Cancelar y volver'), 'T2 initial focus not cancel');
  assert((await dialog.innerText()).includes('No llama a emergencias'), 'T2 scope missing');
  const sosScreenshot = await picture(page, '02-t2-sos-scope.png');
  await key(page, 'Escape'); await dialog.waitFor({ state: 'hidden' });
  assert((await focus(page)).testid === 'patient-sos', 'T2 Escape failed to return focus');
  assert((await state(page)).alerts === beforeSos.alerts, 'T2 cancel created alert');
  report.checks.push({ task: 'T2', passed: true, result: 'SOS dialog reached, scope read as DOM evidence and Escape canceled without saving.', screenshot: sosScreenshot });

  const form = page.locator('.measurement-form'); await form.waitFor();
  await write(page, '[data-testid="input-systolic"]', '80', 'T4 upper value');
  await write(page, '[data-testid="input-diastolic"]', '120', 'T4 invalid lower value');
  await activate(page, '[data-testid="btn-save-vitals"]', 'T4 request review with invalid values');
  await form.getByText('El número de abajo debe ser menor que el de arriba. Revisa ambos.').waitFor();
  assert(await form.getByTestId('input-diastolic').getAttribute('aria-invalid') === 'true', 'T4 invalid field not marked');
  const errorFocus = await focus(page);
  assert(await form.getByTestId('input-systolic').inputValue() === '80' && await form.getByTestId('input-diastolic').inputValue() === '120', 'T4 error lost values');
  const errorScreenshot = await picture(page, '03-t4-invalid.png');
  await write(page, '[data-testid="input-systolic"]', '120', 'T4 correct upper value', true);
  await key(page, 'Enter');
  await page.waitForFunction(() => document.activeElement?.getAttribute('data-testid') === 'input-diastolic', null, { timeout: 2000 });
  await key(page, 'Control+A'); await page.keyboard.type('80');
  const beforeReview = await state(page);
  await activate(page, '[data-testid="btn-save-vitals"]', 'T4 review valid values');
  await form.getByTestId('measurement-review').waitFor();
  const reviewFocus = await focus(page); assert(reviewFocus.text === '¿Los valores son correctos?', 'T4 review heading did not receive focus');
  assert((await form.innerText()).includes('Pulso: no registrado'), 'T4 optional pulse invents data');
  assert((await state(page)).pressures === beforeReview.pressures, 'T4 review already saved data');
  const reviewScreenshot = await picture(page, '04-t4-review.png');
  await activate(page, 'button:has-text("Corregir números")', 'T4 return without saving');
  assert((await focus(page)).testid === 'input-systolic', 'T4 return focus incorrect');
  assert(await form.getByTestId('input-systolic').inputValue() === '120' && await form.getByTestId('input-diastolic').inputValue() === '80', 'T4 review correction lost values');
  report.checks.push({ task: 'T4', passed: true, result: 'Invalid values identified; keyboard correction, review and return preserve values without saving.', errorFocus, reviewFocus, screenshots: [errorScreenshot, reviewScreenshot] });
  await patient.context.close();

  const caregiver = await session('caregiver_demo', '/dashboard');
  await caregiver.page.getByRole('heading', { level: 1 }).waitFor();
  await activate(caregiver.page, 'a[href="/medications"]', 'T3 treatment');
  await caregiver.page.getByRole('heading', { level: 1, name: 'Tratamiento y existencias' }).waitFor();
  const treatment = await caregiver.page.locator('main').innerText();
  assert(treatment.includes('Losartán') && treatment.includes('50 mg') && treatment.includes('30 tabletas'), 'T3 Losartan data not found');
  assert(treatment.includes('Vitamina D3') && treatment.includes('2000 UI') && treatment.includes('3 tabletas'), 'T3 vitamin data not found');
  const treatmentScreenshot = await picture(caregiver.page, '05-t3-treatment.png');
  await activate(caregiver.page, 'a[href="/appointments"]', 'T3 appointments', true);
  await caregiver.page.getByRole('heading', { level: 1, name: 'Citas médicas' }).waitFor();
  const appointments = await caregiver.page.locator('main').innerText();
  assert(appointments.includes('Geriatría') && appointments.includes('10:30') && appointments.includes('hora de Lima'), 'T3 next appointment values missing');
  report.checks.push({ task: 'T3', passed: true, result: 'Treatment, units and upcoming appointment reached by keyboard. Text is DOM evidence, not screen-reader output.', treatment, appointments, focus: await focus(caregiver.page), screenshots: [treatmentScreenshot, await picture(caregiver.page, '06-t3-appointments.png')] });
  await caregiver.context.close();
  assert(report.externalApiRequests.length === 0, 'Application attempted HTTP API access; local demo assumption failed');
  report.complete = report.checks.length === 4;
} catch (error) { report.complete = false; report.errors.push({ message: error.message, stack: error.stack }); process.exitCode = 1; }
finally { await browser.close(); await fs.writeFile(path.join(output, 'keyboard-current.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ complete: report.complete, tasks: report.checks.map(check => check.task), errors: report.errors.map(error => error.message) })); }
