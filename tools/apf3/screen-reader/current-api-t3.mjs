// Read-only traversal of the CURRENT API app. Authentication is the only permitted POST.
import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
const base = 'http://127.0.0.1:3001';
const out = path.resolve('output/apf3/evidence/current-2026-11-03/flows/nvda-api-t3');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: false,
  args: ['--remote-debugging-port=9333', '--force-renderer-accessibility', '--no-first-run'] });
const context = await browser.newContext({ locale: 'es-PE', viewport: { width: 1200, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const actions = { date: new Date().toISOString(), browser: browser.version(), origin: base,
  mode: 'Current API app, local Chrome context; no clinical/dose/SOS/measurement write authorized', requests: [], events: [] };
await context.route('**/api/**', async route => {
  const request = route.request(), url = new URL(request.url());
  const allowed = ['GET', 'HEAD', 'OPTIONS'].includes(request.method()) || (request.method() === 'POST' && url.pathname.endsWith('/auth/login'));
  actions.requests.push({ utc: new Date().toISOString(), method: request.method(), path: url.pathname, allowed });
  if (!allowed) return route.abort('blockedbyclient');
  return route.continue();
});
async function record(step) {
  if (new URL(page.url()).origin !== base) throw Error('Origin changed');
  actions.events.push({ utc: new Date().toISOString(), step, url: page.url(), focus: await page.evaluate(() => ({ tag: document.activeElement.tagName, text: (document.activeElement.getAttribute('aria-label') || document.activeElement.textContent || '').trim().slice(0, 150) })) });
  await fs.writeFile(path.join(out, 'browser-actions.json'), JSON.stringify(actions, null, 2));
}
try {
  await page.goto(base + '/login');
  await page.locator('button[type="submit"]').waitFor();
  await page.locator('button[type="submit"]').press('Enter');
  await page.waitForURL(base + '/dashboard');
  await page.getByRole('link', { name: 'Tratamiento y existencias', exact: true }).press('Enter');
  await page.getByRole('heading', { level: 1, name: 'Tratamiento y existencias' }).waitFor();
  // Live API polling can keep networkidle pending. Wait for the actual values instead.
  await page.locator('main article').first().waitFor();
  await page.bringToFront();
  await record('ready-current-api-treatment');
  await page.screenshot({ path: path.join(out, '01-api-treatment.png'), fullPage: true });
  console.log(JSON.stringify({ ready: true, page: page.url(), browser: browser.version(), cdp: 9333, next: 'Use native Computer Use NVDA gestures. stdin commands: appointments, capture, close.' }));
  const input = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  for await (const line of input) {
    if (line.trim() === 'close') break;
    if (line.trim() === 'appointments') {
      await page.getByRole('link', { name: 'Citas médicas', exact: true }).press('Enter');
      await page.getByRole('heading', { level: 1, name: 'Citas médicas' }).waitFor();
      await record('current-api-appointments');
      await page.screenshot({ path: path.join(out, '02-api-appointments.png'), fullPage: true });
      console.log('APPOINTMENTS READY');
    }
    if (line.trim() === 'capture') { await record('native-reader-checkpoint'); console.log('CHECKPOINT RECORDED'); }
  }
} catch (error) { actions.error = String(error); console.error(String(error)); process.exitCode = 1; }
finally { actions.finishedAt = new Date().toISOString(); await fs.writeFile(path.join(out, 'browser-actions.json'), JSON.stringify(actions, null, 2)); await browser.close(); }
