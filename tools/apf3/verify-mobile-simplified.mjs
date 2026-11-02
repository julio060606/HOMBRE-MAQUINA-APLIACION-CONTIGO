import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const output = path.resolve(import.meta.dirname, '../../output/apf3/evidence/mobile-simplified');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { timestamp: new Date().toISOString(), method: 'Comprobación técnica de la simplificación móvil solicitada; datos sintéticos aislados.', checks: [], screenshots: [] };
report.source = await Promise.all(['frontend/src/features/patient-app/PatientAppContent.tsx', 'frontend/src/features/patient-app/PatientAppPage.tsx', 'frontend/src/features/accessibility/AccessibilityPage.tsx'].map(async file => ({ path: file, sha256: createHash('sha256').update(await fs.readFile(path.resolve(import.meta.dirname, '../..', file))).digest('hex') })));
const assert = (value, message) => { if (!value) throw Error(message); };
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-PE', reducedMotion: 'reduce' });
  await context.addInitScript(() => sessionStorage.setItem('contigo-demo-actor-v1', 'patient_dacio'));
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3001/patient-app');
  await page.waitForLoadState('networkidle');
  const app = page.locator('.patient-app');
  await app.getByRole('heading', { name: 'Mis medicamentos', exact: true }).waitFor();
  assert(await app.getByRole('navigation').count() === 0, 'Permanece la navegación del paciente');
  assert(await app.getByRole('button', { name: 'Ajustes', exact: true }).count() === 0, 'Permanece el botón Ajustes');
  assert(await app.getByRole('link', { name: 'Ver mi dashboard completo', exact: true }).count() === 0, 'Permanece el acceso al dashboard');
  assert(await app.getByRole('heading', { name: 'Mis mediciones', exact: true }).count() === 1, 'La medición no está en la misma vista');
  assert(await app.getByRole('button', { name: 'Ver citas', exact: true }).count() === 0, 'Permanece el acceso móvil a citas');
  report.checks.push('Navegación inferior, Ajustes, dashboard y citas retirados; medicamentos y mediciones en una vista.');
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert(!overflow, `Desbordamiento horizontal a ${width}px`);
    const file = `mobile-${width}.png`;
    await page.screenshot({ path: path.join(output, file), fullPage: true });
    report.screenshots.push(file);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await app.getByTestId('dose-taken').click();
  await app.getByRole('status').filter({ hasText: 'registraste que la tomaste' }).waitFor();
  await app.getByRole('button', { name: 'Revisar mi respuesta', exact: true }).click();
  assert(await app.locator('details').evaluate(element => element.open), 'No se abrió el registro de respuestas');
  await app.getByRole('button', { name: /Corregir respuesta de Losartán/ }).click();
  await app.getByRole('textbox', { name: /Motivo de la corrección/ }).fill('Corrección de prueba de la interfaz simplificada');
  await app.getByTestId('dose-not-taken').last().click();
  await app.getByRole('status').filter({ hasText: 'registraste que no la tomaste' }).waitFor();
  report.checks.push('Toma registrada, historial abierto y respuesta corregida sin navegación por pestañas.');
  await app.getByTestId('input-systolic').fill('120');
  await app.getByTestId('input-diastolic').fill('80');
  await app.getByTestId('btn-save-vitals').click();
  await app.getByTestId('measurement-review').waitFor();
  await app.getByTestId('btn-confirm-vitals').click();
  await app.getByRole('status').filter({ hasText: 'Medición guardada' }).waitFor();
  await page.screenshot({ path: path.join(output, 'measurement-saved.png'), fullPage: true });
  report.screenshots.push('measurement-saved.png');
  report.checks.push('Medición ingresada, revisada y guardada desde la misma vista.');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  report.axe = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  assert(report.axe.violations.length === 0, 'axe detectó incidencias en la vista simplificada');
  report.complete = true;
} catch (error) { report.complete = false; report.error = error.message; process.exitCode = 1; }
finally {
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ complete: report.complete, checks: report.checks, error: report.error }));
}
