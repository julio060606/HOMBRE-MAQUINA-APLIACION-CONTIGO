import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'output/apf3/evidence/current-2026-11-03');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 430, height: 1100 }, locale: 'es-PE', reducedMotion: 'reduce' });
const page = await context.newPage();
let blockedWrites = 0;
await page.route('**/api/v1/**', async route => {
  const request = route.request();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'].includes(new URL(request.url()).pathname)) {
    blockedWrites++;
    return route.abort('blockedbyclient');
  }
  return route.continue();
});
try {
  await page.goto('http://127.0.0.1:3001/login');
  await page.getByTestId('login-patient_dacio').click();
  await page.getByRole('button', { name: 'Entrada Rápida', exact: true }).click();
  await page.waitForURL('http://127.0.0.1:3001/patient-app');
  const form = page.locator('.measurement-form');
  await form.getByTestId('input-systolic').fill('120');
  await form.getByTestId('input-diastolic').fill('80');
  await form.getByTestId('btn-save-vitals').click();
  await form.getByTestId('measurement-review').waitFor();
  await page.evaluate(() => document.fonts.ready);
  const image = path.join(out, 'presentation-measurement-review.png');
  await form.screenshot({ path: image });
  if (blockedWrites) throw Error('Escritura inesperada bloqueada.');
  await fs.writeFile(path.join(out, 'presentation-measurement-review.json'), JSON.stringify({
    complete: true, timestamp: new Date().toISOString(), origin: 'http://127.0.0.1:3001',
    mode: 'API/PostgreSQL local, datos sintéticos', method: 'Captura nativa Playwright del locator .measurement-form, revisión 120/80 sin guardar.',
    screenshot: path.basename(image), sha256: crypto.createHash('sha256').update(await fs.readFile(image)).digest('hex'), blockedWrites,
    limitations: ['Figura de documentación; no es otra pantalla auditada ni una sesión con participantes.']
  }, null, 2));
  await page.getByRole('button', { name: /Cerrar sesión/ }).first().click();
  console.log('Captura de revisión guardada; ninguna escritura clínica.');
} finally {
  await context.close();
  await browser.close();
}
