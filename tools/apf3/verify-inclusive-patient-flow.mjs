import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '../..');
const origin = 'http://127.0.0.1:3014';
const output = path.join(root, 'output/inclusive-app-2026-11-03/patient-flow');
await fs.mkdir(output, { recursive: true });
const report = {
  complete: false, timestamp: new Date().toISOString(), origin,
  mode: 'Vite temporal3014, VITE_USE_MOCKS=true solo en proceso; contextos Chrome privados con IndexedDB sintético.',
  limitations: ['No escribe en PostgreSQL: todas las solicitudes API están bloqueadas.', 'Prueba técnica con teclado; no lector nativo ni sesiones con participantes.', 'La escala del producto no equivale al zoom nativo.'],
  cases: [], apiRequests: [], errors: [], source: [],
};
const sourceFiles = ['frontend/src/features/patient-app/PatientAppPage.tsx', 'frontend/src/features/patient-app/PatientAppContent.tsx', 'frontend/src/features/patient-app/PatientShell.module.css', 'frontend/src/features/patient-app/DoseCard.tsx', 'frontend/src/features/patient-app/DoseCard.module.css', 'frontend/src/features/patient-app/MeasurementForm.tsx', 'frontend/src/features/patient-app/MeasurementForm.module.css', 'frontend/src/components/simulator/PhoneDeviceFrame.tsx', 'frontend/src/components/simulator/PhoneDeviceFrame.module.css', 'frontend/src/components/layout/ReadingOptions.tsx', 'frontend/src/styles/index.css'];
async function hashes() { return Promise.all(sourceFiles.map(async file => ({ file, sha256: crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex') }))); }
report.source = await hashes();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browser = browser.version();
const assert = (value, message) => { if (!value) throw Error(message); };

async function state(page) {
  return page.evaluate(async () => {
    const { demoRepository } = await import('/src/services/demo/repository.ts');
    return demoRepository.transact(data => ({ intakes: data.intakes.filter(dose => dose.patientId === 'pat_001').map(({ id, status, version, reason }) => ({ id, status, version, reason })), pressures: data.pressures.filter(reading => reading.patientId === 'pat_001').map(({ id, systolic, diastolic, pulse }) => ({ id, systolic, diastolic, pulse })) }));
  });
}
async function focus(page) { return page.evaluate(() => ({ tag: document.activeElement.tagName, testid: document.activeElement.getAttribute('data-testid'), name: (document.activeElement.getAttribute('aria-label') || document.activeElement.textContent).trim().slice(0, 180) })); }
async function tabTo(page, control) {
  for (let count = 0; count < 220; count++) {
    if (await control.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw Error('No se alcanzó por Tab: ' + await control.evaluate(element => element.getAttribute('aria-label') || element.textContent));
}
async function withinPhone(control) {
  const geometry = await control.evaluate(element => {
    const surface = element.closest('[data-app-surface]');
    const control = element.getBoundingClientRect(), screen = surface?.getBoundingClientRect();
    const cx = control.x + control.width / 2, cy = control.y + control.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    return { inside: !!screen && cx >= screen.left && cx <= screen.right && cy >= Math.max(screen.top, 0) && cy <= Math.min(screen.bottom, innerHeight), unobscured: !!hit && (element === hit || element.contains(hit)), control: control.toJSON(), screen: screen?.toJSON() };
  });
  assert(geometry.inside && geometry.unobscured, 'El control enfocado no es visible dentro de la app: ' + JSON.stringify(geometry));
  return geometry;
}
async function activate(page, control) { await tabTo(page, control); const geometry = await withinPhone(control); await page.keyboard.press('Enter'); return geometry; }
async function write(page, control, value) { await tabTo(page, control); await withinPhone(control); await page.keyboard.press('Control+A'); await page.keyboard.type(value); }
async function screenshot(page, prefix, name) { const file = `${prefix}-${name}.png`; await page.screenshot({ path: path.join(output, file), fullPage: false }); return file; }

try {
  for (const scenario of [{ width: 390, scale: '100' }, { width: 320, scale: '200' }]) {
    const context = await browser.newContext({ viewport: { width: scenario.width, height: 1000 }, locale: 'es-PE', reducedMotion: 'reduce' });
    const current = { ...scenario, checks: [], screenshots: [], steps: [] };
    const prefix = `${scenario.width}-${scenario.scale}`;
    try {
      await context.addInitScript(scale => {
        sessionStorage.setItem('contigo-demo-actor-v1', 'patient_dacio');
        localStorage.setItem('contigo-reading-options', JSON.stringify({ scale, silent: true }));
      }, scenario.scale);
      await context.route('**/api/**', route => { report.apiRequests.push(route.request().url()); return route.abort('blockedbyclient'); });
      const page = await context.newPage();
      await page.goto(origin + '/patient-app');
      await page.getByRole('heading', { name: 'Mis medicamentos', exact: true }).waitFor();
      const surface = page.locator('[data-app-surface]');
      assert(await surface.count() === 1, 'Debe existir una superficie móvil principal.');
      assert(await surface.getByRole('button', { name: 'Opciones de lectura', exact: true }).count() === 1 && await surface.getByRole('button', { name: 'Comunicarme', exact: true }).count() === 1, 'Ayudas fuera del aplicativo.');
      current.screenshots.push(await screenshot(page, prefix, '01-inicio'));
      const initial = await state(page);

      const responseGeometry = await activate(page, page.getByTestId('dose-taken').first());
      const confirmation = page.getByRole('status').filter({ hasText: 'registraste que la tomaste' });
      await confirmation.waitFor();
      await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'status' && document.activeElement.textContent.includes('registraste que la tomaste'));
      await withinPhone(confirmation);
      const taken = await state(page);
      const changed = taken.intakes.filter(dose => initial.intakes.find(old => old.id === dose.id)?.status !== dose.status);
      assert(changed.length === 1 && changed[0].status === 'TAKEN', 'T1 no guardó una única respuesta.');
      current.screenshots.push(await screenshot(page, prefix, '02-toma-confirmada'));
      current.steps.push({ name: 'T1 declarar toma por teclado', geometry: responseGeometry, focused: await focus(page) });

      await activate(page, page.getByRole('button', { name: 'Revisar mi respuesta', exact: true }));
      const recordedCard = page.locator(`article[data-testid="dose-${changed[0].id}"]`);
      const correction = recordedCard.getByRole('button', { name: /^Corregir respuesta de/ });
      await activate(page, correction);
      const reason = recordedCard.getByRole('textbox', { name: /Motivo de la corrección/ });
      await page.waitForFunction(() => document.activeElement?.tagName === 'INPUT');
      assert(await recordedCard.getByTestId('dose-not-taken').isDisabled(), 'Debe exigir motivo antes de corregir.');
      await activate(page, recordedCard.getByRole('button', { name: 'Cancelar corrección', exact: true }));
      assert(await correction.evaluate(element => element === document.activeElement), 'Cancelar no devolvió foco a Corregir.');
      assert((await state(page)).intakes.find(dose => dose.id === changed[0].id).version === changed[0].version, 'Cancelar alteró el registro.');
      await activate(page, correction);
      await write(page, reason, 'Marqué tomada por error de prueba.');
      await activate(page, recordedCard.getByTestId('dose-not-taken'));
      const correctedConfirmation = page.getByRole('status').filter({ hasText: 'registraste que no la tomaste' });
      await correctedConfirmation.waitFor();
      await withinPhone(correctedConfirmation);
      const corrected = (await state(page)).intakes.find(dose => dose.id === changed[0].id);
      assert(corrected.status === 'NOT_TAKEN' && corrected.version === changed[0].version + 1 && corrected.reason === 'Marqué tomada por error de prueba.', 'Corrección no conservó estado, versión y motivo.');
      current.screenshots.push(await screenshot(page, prefix, '03-correccion-confirmada'));
      current.checks.push({ task: 'T1', passed: true, result: 'Una toma sintética y una corrección explícita con motivo; cancelar conserva registro y devuelve foco.', initialTaken: initial.intakes.filter(dose => dose.status === 'TAKEN').length, changedDoseId: changed[0].id, corrected });

      const form = page.locator('.measurement-form');
      await write(page, form.getByTestId('input-systolic'), '80');
      await write(page, form.getByTestId('input-diastolic'), '120');
      await activate(page, form.getByTestId('btn-save-vitals'));
      await form.getByText('El número de abajo debe ser menor que el de arriba. Revisa ambos.').waitFor();
      assert(await form.getByTestId('input-diastolic').getAttribute('aria-invalid') === 'true', 'Error no identifica campo.');
      assert(await form.getByTestId('input-systolic').inputValue() === '80' && await form.getByTestId('input-diastolic').inputValue() === '120', 'Error borró valores.');
      current.screenshots.push(await screenshot(page, prefix, '04-medicion-error'));
      await write(page, form.getByTestId('input-systolic'), '120');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-testid') === 'input-diastolic');
      await page.keyboard.press('Control+A'); await page.keyboard.type('80');
      const beforeReview = await state(page);
      await activate(page, form.getByTestId('btn-save-vitals'));
      await form.getByTestId('measurement-review').waitFor();
      await page.waitForFunction(() => document.activeElement?.textContent === '¿Los valores son correctos?');
      assert((await state(page)).pressures.length === beforeReview.pressures.length, 'Revisar ya guardó una medición.');
      assert((await form.innerText()).includes('Pulso: no registrado'), 'Revisión inventó pulso.');
      current.screenshots.push(await screenshot(page, prefix, '05-medicion-revision'));
      await activate(page, form.getByRole('button', { name: 'Corregir números', exact: true }));
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-testid') === 'input-systolic');
      assert(await form.getByTestId('input-systolic').inputValue() === '120' && await form.getByTestId('input-diastolic').inputValue() === '80', 'Volver a corregir perdió datos.');
      await activate(page, form.getByTestId('btn-save-vitals'));
      await form.getByTestId('measurement-review').waitFor();
      await activate(page, form.getByTestId('btn-confirm-vitals'));
      const saved = form.getByRole('status').filter({ hasText: 'Medición guardada' });
      await saved.waitFor();
      await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'status' && document.activeElement.textContent.includes('Medición guardada'));
      await withinPhone(saved);
      const final = await state(page);
      const newReadings = final.pressures.filter(reading => !beforeReview.pressures.some(old => old.id === reading.id));
      assert(newReadings.length === 1 && newReadings[0].systolic === 120 && newReadings[0].diastolic === 80 && newReadings[0].pulse === undefined, 'T4 no guardó exactamente120/80 sin pulso.');
      current.screenshots.push(await screenshot(page, prefix, '06-medicion-guardada'));
      current.checks.push({ task: 'T4', passed: true, result: 'Error visible y asociado al campo; corregir, revisar y volver conservan datos; un guardado explícito120/80 sin pulso y foco visible dentro de la app.', initialPressures: beforeReview.pressures.length, finalPressures: final.pressures.length, focused: await focus(page) });
      current.complete = true;
    } finally { report.cases.push(current); await context.close(); }
  }
  assert(report.apiRequests.length === 0, 'Se intentó usar la API central.');
  assert(JSON.stringify(report.source) === JSON.stringify(await hashes()), 'Cambió la fuente durante las comprobaciones; repetir corte final.');
  report.complete = report.cases.length === 2 && report.cases.every(item => item.complete);
} catch (error) { report.errors.push({ message: error.message, stack: error.stack }); process.exitCode = 1; }
finally {
  await browser.close();
  report.finalizedAt = new Date().toISOString();
  await fs.writeFile(path.join(output, 'patient-flow.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ complete: report.complete, cases: report.cases.map(item => ({ width: item.width, scale: item.scale, checks: item.checks.length })), apiRequests: report.apiRequests.length, errors: report.errors.map(item => item.message) }));
}
