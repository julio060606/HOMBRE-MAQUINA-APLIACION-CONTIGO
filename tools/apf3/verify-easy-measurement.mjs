import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const output = path.resolve(import.meta.dirname, '../../output/apf3/evidence/easy-measurement');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { timestamp: new Date().toISOString(), method: 'Prueba técnica de formulario simplificado con datos sintéticos; no es una sesión de usabilidad.', checks: [], captures: [] };
const assert = (value, message) => { if (!value) throw Error(message); };
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-PE', reducedMotion: 'reduce' });
  await context.addInitScript(() => sessionStorage.setItem('contigo-demo-actor-v1', 'patient_dacio'));
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3001/patient-app');
  await page.waitForLoadState('networkidle');
  const form = page.locator('.measurement-form');
  await form.waitFor();
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await form.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `form-${width}.png`), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Desbordamiento a ${width}px`);
    assert(!(await form.getByTestId('input-pulse').isVisible()), 'El pulso opcional está abierto inicialmente');
    assert(await form.getByTestId('input-systolic').inputValue() === '', 'Hay una presión precargada');
    report.captures.push(`form-${width}.png`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await form.getByTestId('btn-save-vitals').click();
  await form.getByRole('alert').waitFor();
  assert(await form.getByTestId('input-systolic').getAttribute('aria-invalid') === 'true', 'El vacío no se identifica');
  await form.getByTestId('input-systolic').fill('80');
  await form.getByTestId('input-diastolic').fill('120');
  await form.getByTestId('btn-save-vitals').click();
  await form.getByText('El número de abajo debe ser menor que el de arriba. Revisa ambos.').waitFor();
  report.checks.push('Vacíos y presión invertida rechazados con explicación.');
  await form.getByTestId('input-systolic').fill('120');
  await form.getByTestId('input-systolic').press('Enter');
  assert(await form.getByTestId('input-diastolic').evaluate(element => element === document.activeElement), 'Enter no llevó al número de abajo');
  await form.getByTestId('input-diastolic').fill('80');
  await form.getByTestId('btn-save-vitals').click();
  await form.getByTestId('measurement-review').waitFor();
  await form.getByRole('button', { name: 'Corregir números', exact: true }).click();
  assert(await form.getByTestId('input-systolic').inputValue() === '120', 'Se perdió la lectura al corregir');
  await form.getByTestId('btn-save-vitals').click();
  await form.getByTestId('btn-confirm-vitals').click();
  await form.getByRole('status').filter({ hasText: 'Medición guardada' }).waitFor();
  report.checks.push('Presión revisada, editada y guardada con el pulso vacío.');
  await form.getByRole('button', { name: 'Registrar otra medición', exact: true }).click();
  await form.getByTestId('measurement-weight').click();
  assert(await form.getByTestId('measurement-weight').getAttribute('aria-pressed') === 'true', 'El botón no expresa su selección');
  await form.getByTestId('input-weight').fill('72,5');
  await form.getByTestId('btn-save-vitals').click();
  await form.getByTestId('measurement-review').waitFor();
  await form.getByTestId('btn-confirm-vitals').click();
  await form.getByRole('status').filter({ hasText: 'Medición guardada' }).waitFor();
  const stored = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('contigo-synthetic-demo', 1);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('datasets', 'readonly'), item = tx.objectStore('datasets').get('default');
      item.onsuccess = () => resolve({ weight: item.result.weights.at(-1), pressure: item.result.pressures.at(-1) });
      tx.oncomplete = () => db.close(); tx.onerror = () => reject(tx.error);
    };
  }));
  assert(stored.weight.weightKg === 72.5, 'La coma decimal no se guardó como 72.5kg');
  assert(stored.pressure.systolic === 120 && stored.pressure.diastolic === 80 && stored.pressure.pulse == null, 'La presión o el pulso vacío se alteró');
  report.stored = stored;
  report.checks.push('Peso con coma decimal guardado como 72.5kg; no se inventó un pulso.');
  await form.getByRole('button', { name: 'Registrar otra medición', exact: true }).click();
  await form.getByTestId('measurement-pressure').click();
  await form.getByTestId('input-systolic').fill('121');
  await form.getByTestId('input-diastolic').fill('81');
  await form.locator('summary').click();
  await form.getByTestId('input-pulse').fill('71');
  await form.getByTestId('btn-save-vitals').click();
  await form.getByText('Pulso: 71 latidos/min', { exact: true }).waitFor();
  report.checks.push('Pulso opcional accesible y reflejado en la revisión.');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  report.axe = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  assert(report.axe.violations.length === 0, 'Se detectaron incidencias axe');
  report.complete = true;
} catch (error) { report.complete = false; report.error = error.message; process.exitCode = 1; }
finally {
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ complete: report.complete, checks: report.checks, error: report.error }));
}
