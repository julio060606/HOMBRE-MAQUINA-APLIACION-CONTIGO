import { chromium } from '../../tools/apf3/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = import.meta.dirname;
const origin = 'http://127.0.0.1:3001';
const report = { at: new Date().toISOString(), scope: 'Technical read-only patient UI review; synthetic project clinic data, no human participants.', checks: [], layouts: [], axe: [], errors: [], mutationsBlocked: [] };
const check = (pass, message) => { report.checks.push({ pass, message }); if (!pass) throw new Error(message); };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-PE', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    if (request.method() !== 'GET' && !request.url().endsWith('/auth/login')) {
      report.mutationsBlocked.push({ method: request.method(), path: new URL(request.url()).pathname });
      await route.abort();
    } else await route.continue();
  });
  await page.goto(origin + '/login');
  await page.locator('input[type="email"]').fill('dacio@contigo.example');
  await page.locator('input[type="password"]').fill('Contigo2026!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/patient-app');
  await page.getByRole('heading', { level: 1, name: 'Hola, Dacio' }).waitFor();
  check(page.url() === origin + '/patient-app', 'Patient authenticated through the configured API');
  const snapshot = await page.evaluate(async () => {
    const response = await fetch('/api/v1/patients/pat_001/dashboard', { headers: { Authorization: `Bearer ${sessionStorage.getItem('contigo_api_token')}` } });
    if (!response.ok) throw new Error(`Read-only dashboard failed: ${response.status}`);
    return response.json();
  });
  const pending = snapshot.today.find(item => ['PENDING', 'UNCONFIRMED'].includes(item.status));
  check(pending?.medicationName === 'Losartán' && pending.scheduledTime === '20:00', 'Future Losartán 20:00 dose remains pending');
  const card = page.locator('.patient-body').getByText(pending.doctor, { exact: true }).first();
  await card.waitFor();
  check(!!pending.diagnosis && await page.locator('.patient-body').getByText(pending.diagnosis, { exact: true }).count() > 0, 'Visible diagnosis equals the prescription snapshot received from the central API');
  check(!!pending.doctor && await card.count() > 0, 'Visible prescribing doctor equals the prescription snapshot received from the central API');
  await page.locator('.patient-body').evaluate(element => { element.scrollTop = 0; });
  await page.screenshot({ path: path.join(out, 'patient-medication.png'), fullPage: true });
  await page.getByText('Diagnóstico indicado en la receta', { exact: true }).first().evaluate(element => { const body = element.closest('.patient-body'); body.scrollTop += element.getBoundingClientRect().top - body.getBoundingClientRect().top - 16; });
  await page.screenshot({ path: path.join(out, 'patient-prescription.png'), fullPage: true });
  const appointmentSection = page.getByTestId('patient-appointments');
  const upcoming = snapshot.appointments.filter(item => item.status === 'SCHEDULED' && Date.parse(item.startsAt) >= Date.now());
  check(upcoming.length >= 2, 'The central API provides at least two future scheduled appointments');
  for (const appointment of upcoming) {
    check(await appointmentSection.getByText(appointment.specialty, { exact: true }).count() > 0 && await appointmentSection.getByText(appointment.doctor, { exact: true }).count() > 0, `Upcoming appointment rendered from source: ${appointment.specialty}`);
  }
  await appointmentSection.evaluate(element => { const body = element.closest('.patient-body'); body.scrollTop += element.getBoundingClientRect().top - body.getBoundingClientRect().top; });
  await page.screenshot({ path: path.join(out, 'patient-appointments.png'), fullPage: true });
  await page.addScriptTag({ path: path.resolve(out, '../../tools/apf3/node_modules/axe-core/axe.min.js') });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const scale of ['100', '200']) {
      await page.locator('.reading-options details').evaluate(element => { element.open = true; });
      await page.getByLabel('Tamaño del texto').selectOption(scale);
      await page.waitForFunction(expected => parseFloat(getComputedStyle(document.documentElement).fontSize) === expected, Number(scale) * 0.16);
      await page.locator('.reading-options details').evaluate(element => { element.open = false; });
      await page.locator('.patient-body').evaluate(element => { element.scrollTop = 0; });
      const layout = await page.evaluate(() => {
        const body = document.querySelector('.patient-body');
        return { width: innerWidth, rootFontPx: parseFloat(getComputedStyle(document.documentElement).fontSize), documentScrollWidth: document.documentElement.scrollWidth, patientWidth: body.clientWidth, patientScrollWidth: body.scrollWidth, offenders: [...body.querySelectorAll("*")].filter(el => el.getBoundingClientRect().right > body.getBoundingClientRect().right + 1).slice(0,15).map(el => ({tag:el.tagName, text:el.textContent.slice(0,120), class:el.className, right:el.getBoundingClientRect().right, bodyRight:body.getBoundingClientRect().right})) };
      });
      report.layouts.push({ ...layout, requestedScale: scale });
      report.checks.push({ pass: layout.documentScrollWidth <= width + 1 && layout.patientScrollWidth <= layout.patientWidth + 1, message: `${width}px at ${scale}% root text has no document or patient horizontal overflow` });
      const axe = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
      report.axe.push({ width, requestedScale: scale, violations: axe.violations.map(item => ({ id: item.id, impact: item.impact, description: item.description, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })) });
      await page.screenshot({ path: path.join(out, `patient-${width}-text-${scale}.png`), fullPage: true });
    }
  }
  check(report.mutationsBlocked.length === 0, 'No clinical mutation was attempted');
  check(report.errors.length === 0, 'No uncaught browser JavaScript errors');
  report.status = report.checks.every(item => item.pass) ? 'PASS' : 'FAIL';
} catch (error) { report.status = 'FAIL'; report.failure = error.message; throw error; }
finally {
  await browser.close();
  await fs.writeFile(path.join(out, 'patient-readonly-qa.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, failure: report.failure, checks: report.checks.length, axeViolations: report.axe.map(item => ({ width: item.width, scale: item.requestedScale, count: item.violations.length })), errors: report.errors }));
}
