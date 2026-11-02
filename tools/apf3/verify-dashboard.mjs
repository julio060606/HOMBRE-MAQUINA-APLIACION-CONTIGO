import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const out = path.resolve(import.meta.dirname, '../../output/design-dashboard/after');
await fs.mkdir(out, { recursive: true });
const report = { at: new Date().toISOString(), checks: [], reflow: [], violations: [], errors: [], mutations: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); report.checks.push(message); };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', locale: 'es-PE' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !request.url().includes('/auth/')) {
      report.mutations.push({ method: request.method(), url: request.url() }); await route.abort();
    } else await route.continue();
  });
  await page.goto('http://127.0.0.1:3001/login');
  await page.locator('input[type="email"]').fill('cuidador@contigo.example');
  await page.locator('input[type="password"]').fill('Contigo2026!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
  await page.getByTestId('select-patient-active').selectOption('pat_001');
  await page.getByRole('heading', { level: 1, name: /Dacio Ramos/ }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  const view = await page.evaluate(async () => {
    const token = sessionStorage.getItem('contigo_api_token');
    return fetch('/api/v1/patients/pat_001/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
  });
  const latest = [...view.pressures].sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0];
  if (latest) assert(await page.getByText(`${latest.systolic}/${latest.diastolic}`, { exact: true }).count() === 1, 'Latest pressure matches the central database');
  const treatment = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Tratamiento de hoy', exact: true }) });
  const active = view.today.filter(d => d.status !== 'CANCELLED');
  const pending = view.today.filter(d => ['PENDING','UNCONFIRMED'].includes(d.status));
  assert(await treatment.getByRole('listitem').count() === active.length, 'Treatment initially shows active schedule without cancelled duplicates');
  await page.getByRole('button', { name: /^Por confirmar/ }).click();
  assert(await treatment.getByRole('listitem').count() === pending.length, 'Pending filter respects real dose states');
  await page.getByRole('button', { name: 'Todas', exact: true }).click();
  const cancelled = view.today.filter(d => d.status === 'CANCELLED');
  if (cancelled.length) {
    const history = treatment.locator('details');
    await history.locator('summary').click();
    assert(await treatment.getByRole('listitem').count() === view.today.length, 'Cancelled prescription history remains available');
    await history.locator('summary').click();
  }
  await page.getByRole('button', { name: '30 días', exact: true }).click();
  assert(await page.getByRole('button', { name: '30 días', exact: true }).getAttribute('aria-pressed') === 'true', 'Measurement period can switch to 30 days');
  await page.getByRole('button', { name: '7 días', exact: true }).click();
  await page.getByTestId('select-patient-active').selectOption('pat_002');
  await page.getByRole('heading', { level: 1, name: /Rosa Martínez/ }).waitFor();
  assert(await page.getByText('No hay lecturas en estos 7 días', { exact: true }).isVisible(), 'Patient switch displays Rosa and the correct empty measurement state');
  await page.getByTestId('select-patient-active').selectOption('pat_001');
  await page.getByRole('heading', { level: 1, name: /Dacio Ramos/ }).waitFor();
  await page.getByTestId('link-patient').click();
  await page.getByRole('dialog', { name: 'Vincular a un paciente' }).waitFor();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert(await page.getByRole('dialog').count() === 0, 'Link-patient dialog opens and cancels without modifying data');
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.locator('button[aria-controls="caregiver-navigation"]');
  await menu.click();
  assert(await menu.getAttribute('aria-expanded') === 'true', 'Mobile navigation opens');
  await page.keyboard.press('Escape');
  assert(await menu.getAttribute('aria-expanded') === 'false' && await menu.evaluate(el => el === document.activeElement), 'Escape closes navigation and returns focus');
  await menu.click();
  await page.getByRole('link', { name: 'Citas médicas', exact: true }).click();
  await page.waitForURL('**/appointments');
  await page.getByRole('heading', { level: 1 }).waitFor();
  assert(await menu.getAttribute('aria-expanded') === 'false', 'Mobile navigation closes after selecting a page');
  await page.goto('http://127.0.0.1:3001/dashboard');
  await page.getByRole('heading', { level: 1, name: /Dacio Ramos/ }).waitFor();
  const reading = page.locator('.reading-options details');
  await reading.locator('summary').click();
  await reading.locator('select').selectOption('200');
  await reading.locator('summary').click();
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const geometry = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, fontSize: getComputedStyle(document.documentElement).fontSize,
      offenders: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 2).slice(0, 12).map(el => ({ tag: el.tagName, text: el.textContent.slice(0, 70), class: typeof el.className === 'string' ? el.className : '', width: el.getBoundingClientRect().width })) }));
    report.reflow.push(geometry);
    if (geometry.documentWidth > width) await page.screenshot({ path: path.join(out, `overflow-${width}.png`), fullPage: true });
    assert(geometry.documentWidth <= width, `200% text reflows at ${width}px`);
  }
  await page.getByRole('heading', { level: 1, name: /Dacio Ramos/ }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(out, 'dashboard-text-200.png'), fullPage: false });
  const pressureSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Presión registrada', exact: true }) });
  await pressureSection.screenshot({ path: path.join(out, 'dashboard-chart-200.png') });
  await reading.locator('summary').click();
  await reading.locator('select').selectOption('100');
  await reading.locator('input[type="checkbox"]').check();
  await reading.locator('summary').click();
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const contrast = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } }));
  report.violations = contrast.violations;
  await page.screenshot({ path: path.join(out, 'dashboard-high-contrast.png'), fullPage: false });
  await reading.locator('summary').click();
  await reading.locator('input[type="checkbox"]').uncheck();
  await reading.locator('summary').click();
  await page.getByTestId('btn-logout').click();
  await page.waitForURL('**/login');
  assert(true, 'Logout returns to login');
  assert(!report.errors.length && !report.mutations.length, 'No JavaScript failures or clinical data mutations');
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.failure = error.message; throw error; }
finally { await browser.close(); await fs.writeFile(path.join(out, 'functional-review.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ status: report.status, checks: report.checks.length, reflow: report.reflow, violations: report.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), failure: report.failure })); }
