import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = 'http://127.0.0.1:3001';
const output = path.resolve(import.meta.dirname, '../../output/apf3/evidence/keyboard-tasks');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { metadata: { timestamp: new Date().toISOString(), browser: browser.version(),
  method: 'Recorridos técnicos mediante Tab, Mayús+Tab, Enter, Espacio y escritura por teclado en Chrome aislado.',
  limitations: ['No es una sesión con participantes.', 'No ejecuta NVDA ni sustituye el recorrido con lector.', 'Los conteos de teclas no son tiempos ni errores de usabilidad.'],
  data: 'Demostración sintética en contexto nuevo por rol.' }, tasks: [], steps: [] };
function assert(ok, message) { if (!ok) throw Error(message); }
async function guard(page) { assert(new URL(page.url()).origin === base, 'Prueba detenida: URL fuera del origen local autorizado'); }
async function focused(page) { return page.evaluate(() => {
  const el = document.activeElement; const c = getComputedStyle(el);
  return { tag: el.tagName, text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 180),
    testId: el.getAttribute('data-testid'), href: el.getAttribute('href'), outline: c.outline, outlineOffset: c.outlineOffset };
}); }
async function key(page, value) { await guard(page); await page.keyboard.press(value); }
async function tabTo(page, selector, reverse = false) {
  for (let i = 0; i < 150; i++) {
    if (await page.evaluate(s => document.activeElement.matches(s), selector)) return;
    await key(page, reverse ? 'Shift+Tab' : 'Tab');
    report.steps.push({ key: reverse ? 'Shift+Tab' : 'Tab', focus: await focused(page) });
  }
  throw Error(`Control no alcanzable por teclado: ${selector}`);
}
async function text(page, value) { await guard(page); await page.keyboard.type(value); }
async function picture(page, file) {
  await page.screenshot({ path: path.join(output, file), fullPage: true });
  return `output/apf3/evidence/keyboard-tasks/${file}`;
}
async function state(page) { return page.evaluate(() => new Promise((resolve, reject) => {
  const request = indexedDB.open('contigo-synthetic-demo', 1);
  request.onsuccess = () => {
    const db = request.result, tx = db.transaction('datasets', 'readonly'), get = tx.objectStore('datasets').get('default');
    get.onsuccess = () => resolve({ alerts: get.result.alerts.length, pressures: get.result.pressures.length });
    tx.oncomplete = () => db.close(); tx.onerror = () => reject(tx.error);
  };
  request.onerror = () => reject(request.error);
})); }
async function session(actor, route) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, locale: 'es-PE', reducedMotion: 'reduce' });
  await context.addInitScript(id => sessionStorage.setItem('contigo-demo-actor-v1', id), actor);
  const page = await context.newPage(); await page.goto(base + route); await page.waitForLoadState('networkidle');
  return { context, page };
}
try {
  const { context, page } = await session('patient_dacio', '/patient-app');
  await tabTo(page, '[data-testid="dose-taken"]');
  const doseFocus = await focused(page);
  await key(page, 'Enter');
  await page.getByRole('status').filter({ hasText: 'registraste que la tomaste' }).waitFor();
  report.tasks.push({ task: 'T1', result: 'Registro realizado con teclado', activated: doseFocus,
    confirmation: await page.getByRole('status').filter({ hasText: 'registraste que la tomaste' }).innerText(),
    focus: await focused(page), screenshot: await picture(page, '01-toma-confirmada.png') });

  const before = await state(page);
  await tabTo(page, '[data-testid="patient-sos"]', true); await key(page, 'Enter');
  await page.getByRole('dialog').waitFor({ state: 'visible' });
  const initialDialogFocus = await focused(page);
  await key(page, 'Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  const canceled = await state(page);
  assert(canceled.alerts === before.alerts, 'Cancelar SOS creó un evento');
  assert((await focused(page)).testId === 'patient-sos', 'Escape no devolvió foco al SOS');
  await key(page, 'Enter');
  await tabTo(page, '[data-testid="patient-sos-confirm"]'); await key(page, 'Space');
  await page.getByRole('status').filter({ hasText: 'Petición de prueba registrada' }).waitFor();
  const after = await state(page);
  assert(after.alerts === before.alerts + 1, 'SOS no creó exactamente un evento al confirmar');
  report.tasks.push({ task: 'T2', result: 'Cancelación y registro ejecutados con teclado', before, canceled, after,
    initialDialogFocus, confirmationFocus: await focused(page), screenshot: await picture(page, '02-sos-confirmado.png') });
  await tabTo(page, 'dialog button'); await key(page, 'Enter');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });

  await tabTo(page, '.patient-navigation button:nth-child(3)'); await key(page, 'Enter');
  await tabTo(page, '[data-testid="input-systolic"]'); await text(page, '80');
  await key(page, 'Tab'); await text(page, '120');
  await tabTo(page, '[data-testid="btn-save-vitals"]'); await key(page, 'Enter');
  await page.getByRole('alert').filter({ hasText: 'La lectura no se guardó' }).waitFor();
  const errorFocus = await focused(page);
  const errorScreenshot = await picture(page, '03-error-medicion.png');
  await tabTo(page, '[data-testid="input-systolic"]', true); await key(page, 'Control+a'); await text(page, '120');
  await tabTo(page, '[data-testid="input-diastolic"]'); await key(page, 'Control+a'); await text(page, '80');
  const measurementsBefore = await state(page);
  await tabTo(page, '[data-testid="btn-save-vitals"]'); await key(page, 'Enter');
  await page.getByTestId('measurement-review').waitFor();
  const reviewFocus = await focused(page);
  const duringReview = await state(page);
  assert(duringReview.pressures === measurementsBefore.pressures, 'La revisión ya modificó mediciones');
  await tabTo(page, '[data-testid="btn-confirm-vitals"]'); await key(page, 'Space');
  await page.getByRole('status').filter({ hasText: 'Medición guardada' }).waitFor();
  const measurementsAfter = await state(page);
  assert(measurementsAfter.pressures === measurementsBefore.pressures + 1, 'La confirmación no guardó exactamente una medición');
  report.tasks.push({ task: 'T4', result: 'Error, corrección, revisión y guardado ejecutados con teclado', errorFocus, reviewFocus,
    savedFocus: await focused(page), measurementsBefore, duringReview, measurementsAfter,
    screenshots: [errorScreenshot, await picture(page, '04-medicion-guardada.png')] });
  await context.close();

  const caregiver = await session('caregiver_demo', '/dashboard');
  await tabTo(caregiver.page, 'a[href="/medications"]'); await key(caregiver.page, 'Enter');
  await caregiver.page.getByRole('heading', { level: 1, name: 'Tratamiento y existencias' }).waitFor();
  const medicationFocus = await focused(caregiver.page);
  const treatment = await caregiver.page.locator('main').innerText();
  const treatmentScreenshot = await picture(caregiver.page, '05-tratamiento-cuidador.png');
  await tabTo(caregiver.page, 'a[href="/appointments"]'); await key(caregiver.page, 'Enter');
  await caregiver.page.getByRole('heading', { level: 1, name: 'Citas médicas' }).waitFor();
  report.tasks.push({ task: 'T3', result: 'Consulta de tratamiento, existencias y citas alcanzada con teclado',
    medicationFocus, appointmentFocus: await focused(caregiver.page), treatment,
    appointments: await caregiver.page.locator('main').innerText(),
    screenshots: [treatmentScreenshot, await picture(caregiver.page, '06-citas-cuidador.png')] });
  await caregiver.context.close();
  assert(report.tasks.length === 4, 'No se completaron cuatro recorridos técnicos');
  report.complete = true;
} catch (error) { report.complete = false; report.error = { message: error.message, stack: error.stack }; process.exitCode = 1; }
finally {
  await fs.writeFile(path.join(output, 'keyboard-tasks.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ complete: report.complete, tasks: report.tasks.map(t => t.task), error: report.error?.message }));
}
