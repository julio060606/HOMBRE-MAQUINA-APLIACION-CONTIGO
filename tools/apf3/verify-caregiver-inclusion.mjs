import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'output/inclusive-app-2026-11-03/caregiver');
await fs.mkdir(out, { recursive: true });
const report = { complete: false, timestamp: new Date().toISOString(), origin: 'http://127.0.0.1:3001', checks: [], screens: [], blockedWrites: 0,
  scope: 'Dashboard API local, cuentas sintéticas y contextos privados. Solo autenticación y lecturas; escala del producto no es zoom nativo. Sin sesiones con participantes ni lector real.' };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [320, 390, 1440]) for (const scale of ['100', '200']) for (const contrast of [false, true]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'es-PE', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await context.addInitScript(({ scale, contrast }) => localStorage.setItem('contigo-reading-options', JSON.stringify({ scale, contrast })), { scale, contrast });
    await page.route('**/api/v1/**', async route => {
      const request = route.request(), pathname = new URL(request.url()).pathname;
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'].includes(pathname)) {
        report.blockedWrites++; return route.abort('blockedbyclient');
      }
      return route.continue();
    });
    await page.goto(report.origin + '/login');
    await page.getByTestId('login-caregiver_demo').click();
    await page.getByRole('button', { name: 'Entrada Rápida', exact: true }).click();
    await page.waitForURL(report.origin + '/dashboard');
    await page.getByRole('heading', { name: 'Resumen del día', exact: true }).waitFor();
    await page.locator('header').filter({ has: page.getByTestId('select-patient-active') }).getByRole('button', { name: 'Opciones de lectura', exact: true }).waitFor();
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const axe = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    const layout = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    if (layout.document > layout.viewport + 1) {
      console.log(await page.evaluate(() => [...document.querySelectorAll('*')].filter(element => element.getClientRects().length && element.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(element => ({ tag: element.tagName, className: element.getAttribute('class'), width: element.getBoundingClientRect().width, right: element.getBoundingClientRect().right, text: element.textContent?.slice(0, 100) }))));
      await page.screenshot({ path: path.join(out, 'overflow-diagnostic.png'), fullPage: true });
      throw Error('Desborde dashboard: ' + JSON.stringify({ width, scale, contrast, layout }));
    }
    if (axe.violations.length) throw Error('axe dashboard: ' + JSON.stringify(axe.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))));
    const screenshot = `dashboard-${width}-${scale}-${contrast ? 'high' : 'standard'}.png`;
    await page.screenshot({ path: path.join(out, screenshot), fullPage: true });
    const menu = page.getByRole('button', { name: 'Abrir menú de navegación', exact: true });
    if (await menu.isVisible()) {
      const nav = page.getByRole('navigation', { name: 'Módulos de seguimiento' });
      if (await nav.isVisible()) throw Error('Menú cerrado permanece visible.');
      await menu.focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement?.closest('nav')?.getAttribute('aria-label') === 'Módulos de seguimiento');
      await page.keyboard.press('Escape');
      if (await nav.isVisible()) throw Error('Escape no oculta el menú.');
      if (!await menu.evaluate(element => element === document.activeElement)) throw Error('Escape no retorna foco al menú.');
    }
    const details = page.locator('details').filter({ has: page.getByText('Mediciones y evolución', { exact: true }) });
    await page.getByRole('link', { name: 'Revisar avisos', exact: true }).click();
    const notices = page.locator('details').filter({ has: page.getByText('Otros avisos', { exact: true }) });
    if (!await notices.evaluate(element => element.open && element.contains(document.activeElement))) throw Error('Revisar avisos no abre la sección ni mueve el foco.');
    await details.locator(':scope > summary').click();
    await page.getByRole('heading', { name: 'Presión registrada', exact: true }).waitFor();
    if (await page.getByRole('button', { name: 'Todas', exact: true }).count()) await page.getByRole('button', { name: 'Todas', exact: true }).click();
    report.screens.push({ width, scale, contrast, layout, screenshot, axe: { violations: axe.violations, incomplete: axe.incomplete }, menuKeyboard: true, detailsAvailable: true });
    await page.locator('summary').filter({ hasText: 'Mi cuenta' }).click();
    await page.getByTestId('btn-logout').click();
    await context.close();
  }
  report.source = await Promise.all(['frontend/src/components/layout/MainLayout.tsx', 'frontend/src/components/layout/Navbar.tsx', 'frontend/src/components/layout/Sidebar.tsx', 'frontend/src/components/layout/CaregiverLayout.module.css', 'frontend/src/features/dashboard/PatientSummary.tsx', 'frontend/src/features/dashboard/DashboardPage.tsx', 'frontend/src/features/dashboard/Dashboard.module.css'].map(async file => ({ file, sha256: crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex') })));
  if (report.blockedWrites) throw Error('Se intentó una escritura de dominio.');
  report.checks = [{ name: 'Ayudas dentro del encabezado del dashboard', passed: true }, { name: 'Menú cerrado fuera del recorrido, Enter abre, foco entra, Escape cierra y retorna', passed: true }, { name: 'Avisos y mediciones accesibles bajo demanda; filtro Todas disponible', passed: true }, { name: 'Doce combinaciones sin desborde horizontal ni violations axe', passed: true }];
  report.complete = true;
} finally {
  await browser.close();
  await fs.writeFile(path.join(out, 'audit.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ complete: report.complete, screens: report.screens.length, blockedWrites: report.blockedWrites }));
