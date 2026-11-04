import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const origin = process.argv[2] || 'http://127.0.0.1:3001';
const parsed = new URL(origin);
if (parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname)) throw Error('La auditoría solo admite el entorno local.');
const out = path.join(root, 'output/apf3/evidence/current-2026-11-03/api-audit');
await fs.mkdir(out, { recursive: true });
const sourceFiles = ['frontend/src/features/patient-app/MeasurementForm.tsx', 'frontend/src/features/patient-app/MeasurementForm.module.css', 'frontend/src/features/patient-app/PatientAppContent.tsx', 'frontend/src/features/accessibility/AccessibilityPage.tsx', 'frontend/src/features/dashboard/PatientSummary.tsx', 'frontend/src/styles/index.css'];
async function hashes() {
  return Promise.all(sourceFiles.map(async file => ({ file, sha256: crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex') })));
}
const report = {
  metadata: { timestamp: new Date().toISOString(), baseUrl: parsed.origin, mode: 'API central y PostgreSQL, VITE_USE_MOCKS=false', axeVersion: require('axe-core/package.json').version,
    method: 'Capturas y axe sobre páginas y estados actuales. Acceso sintético por rol en navegadores aislados. No confirma mediciones, tomas, SOS ni movimientos de existencias.',
    limitations: ['No sustituye revisión manual, Stark, lector de pantalla ni sesiones con participantes.', 'Los estados de confirmación no guardados se evalúan en el laboratorio offline por separado.', 'Cero violations detectadas no acredita conformidad WCAG completa.'] },
  source: await hashes(), screens: [], complete: false,
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.metadata.browserVersion = browser.version();
await fs.writeFile(path.join(out, 'audit.json'), JSON.stringify(report, null, 2));
async function audit(page, id, title) {
  await page.waitForTimeout(180);
  const expected = id.startsWith('14-') ? '/login' : id.startsWith('15-') ? '/accessibility'
    : Number(id.slice(0, 2)) <= 7 ? '/patient-app'
    : ({ '08-caregiver-summary': '/dashboard', '09-treatment-supplies': '/medications', '10-appointments': '/appointments', '11-vitals': '/vitals', '12-profile': '/clinical-profile', '13-preferences': '/settings' })[id];
  if (new URL(page.url()).pathname !== expected) throw new Error(`Pantalla inesperada para ${id}: ${new URL(page.url()).pathname}; se esperaba ${expected}.`);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const axe = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  const screenshot = `${id}.png`;
  await page.screenshot({ path: path.join(out, screenshot), fullPage: true });
  const layout = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth }));
  report.screens.push({ id, title, url: page.url(), screenshot, layout, axe: { violations: axe.violations, incomplete: axe.incomplete, passes: axe.passes.map(p => p.id), inapplicable: axe.inapplicable.map(p => p.id) } });
  console.log(`${id}: ${axe.violations.length} violations, ${axe.incomplete.length} reglas incompletas`);
}
try {
  for (const role of ['patient_dacio', 'caregiver_demo']) {
    const context = await browser.newContext({ viewport: { width: role === 'patient_dacio' ? 390 : 1440, height: 1100 }, locale: 'es-PE', reducedMotion: 'reduce' });
    const page = await context.newPage();
    let writes = 0;
    await page.route('**/api/v1/**', async route => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'].includes(url.pathname)) {
        writes++;
        await route.abort('blockedbyclient');
        return;
      }
      await route.continue();
    });
    await page.goto(parsed.origin + '/login');
    await page.getByTestId(`login-${role}`).click();
    await page.getByRole('button', { name: 'Entrada Rápida', exact: true }).click();
    await page.waitForURL(parsed.origin + (role === 'patient_dacio' ? '/patient-app' : '/dashboard'));
    if (role === 'patient_dacio') {
      const app = page.locator('.patient-app');
      const form = page.locator('.measurement-form');
      await form.waitFor();
      await audit(page, '01-patient-home', 'Paciente, vista única con medicamentos y mediciones');
      await app.getByTestId('patient-sos').click();
      await page.getByRole('dialog').waitFor();
      await audit(page, '02-sos-review', 'SOS de demostración, revisión sin registro');
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await form.scrollIntoViewIfNeeded();
      await audit(page, '03-measurement-input', 'Medición de presión, formulario vacío');
      await form.getByTestId('btn-save-vitals').click();
      await form.getByRole('alert').waitFor();
      await audit(page, '04-measurement-error', 'Medición, errores de entrada');
      await form.getByTestId('input-systolic').fill('120');
      await form.getByTestId('input-diastolic').fill('80');
      await form.getByTestId('btn-save-vitals').click();
      await form.getByTestId('measurement-review').waitFor();
      await audit(page, '05-measurement-review', 'Presión, revisión antes de guardar');
      await form.getByRole('button', { name: 'Corregir números', exact: true }).click();
      await form.getByTestId('measurement-weight').click();
      await form.getByTestId('input-weight').fill('72,5');
      await audit(page, '06-weight-input', 'Peso, ingreso con coma decimal');
      await form.getByTestId('btn-save-vitals').click();
      await form.getByTestId('measurement-review').waitFor();
      await audit(page, '07-weight-review', 'Peso, revisión sin guardar');
    } else {
      for (const [id, url, title] of [
        ['08-caregiver-summary', '/dashboard', 'Resumen del cuidador'],
        ['09-treatment-supplies', '/medications', 'Tratamiento y existencias'],
        ['10-appointments', '/appointments', 'Citas del cuidador'],
        ['11-vitals', '/vitals', 'Gráficas y mediciones'],
        ['12-profile', '/clinical-profile', 'Ficha clínica'],
        ['13-preferences', '/settings', 'Preferencias por paciente'],
      ]) {
        await page.goto(parsed.origin + url);
        await page.locator('h1').waitFor();
        await audit(page, id, title);
      }
    }
    if (writes) throw new Error(`Se bloquearon ${writes} escrituras inesperadas; revisar el alcance de la auditoría.`);
    report[`${role}BlockedWrites`] = writes;
    const logout = page.getByRole('button', { name: /Cerrar sesión/ }).first();
    if (await logout.count()) await logout.click();
    await context.close();
  }
  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-PE', reducedMotion: 'reduce' });
  const page = await publicContext.newPage();
  for (const [id, url, title] of [['14-login', '/login', 'Acceso'], ['15-accessibility', '/accessibility', 'Declaración de accesibilidad']]) {
    await page.goto(parsed.origin + url);
    await page.locator('h1').waitFor();
    await audit(page, id, title);
  }
  await publicContext.close();
  const finalHashes = await hashes();
  if (JSON.stringify(finalHashes) !== JSON.stringify(report.source)) throw Error('El código cambió durante la auditoría; repetir para una versión coherente.');
  report.summary = {
    screens: report.screens.length,
    violationRules: report.screens.reduce((n, s) => n + s.axe.violations.length, 0),
    violationNodes: report.screens.reduce((n, s) => n + s.axe.violations.reduce((a, v) => a + v.nodes.length, 0), 0),
    incompleteNodes: report.screens.reduce((n, s) => n + s.axe.incomplete.reduce((a, v) => a + v.nodes.length, 0), 0),
  };
  report.complete = true;
} catch (error) { report.error = error.message; process.exitCode = 1; }
finally { await fs.writeFile(path.join(out, 'audit.json'), JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify({ complete: report.complete, summary: report.summary, error: report.error })); }
