/** Read-only technical QA of dialogs in the simulated phone and dashboard. */
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const quick = process.argv.includes('--quick');
const caregiverOnly = process.argv.includes('--caregiver-only');
const origin = new URL(process.argv.slice(2).find(argument => !argument.startsWith('--')) || 'http://127.0.0.1:3001');
if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(origin.hostname)) throw Error('Solo se admite el entorno local.');
const out = path.join(root, 'output/inclusive-app-2026-11-03/dialog-frame');
await fs.mkdir(out, { recursive: true });
const sourceFiles = [
  'frontend/src/components/simulator/PhoneDeviceFrame.tsx',
  'frontend/src/components/simulator/PhoneDeviceFrame.module.css',
  'frontend/src/hooks/useAppDialogFrame.ts',
  'frontend/src/components/layout/ReadingOptions.tsx',
  'frontend/src/components/layout/ReadingOptions.module.css',
  'frontend/src/features/accessibility/CommunicationBoard.tsx',
  'frontend/src/features/accessibility/CommunicationBoard.module.css',
  'frontend/src/features/patient-app/PatientAppContent.tsx',
  'frontend/src/features/patient-app/PatientAppPage.tsx',
  'frontend/src/features/patient-app/PatientShell.module.css',
  'frontend/src/features/patient-app/PatientHelp.tsx',
  'frontend/src/styles/index.css',
];
const hashes = () => Promise.all(sourceFiles.map(async file => ({ file, sha256: crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex') })));
const report = {
  complete: false, quick, caregiverOnly, startedAt: new Date().toISOString(), baseUrl: origin.origin,
  method: 'Chrome headless, API local y datos sintéticos; solo autenticación y consultas. Se abren/cancelan diálogos sin confirmar SOS ni registros clínicos.',
  limitations: ['La escala de texto del producto no es zoom nativo ni prueba con lector de pantalla.', 'La geometría y axe no sustituyen pruebas con personas mayores o tecnologías de apoyo.', 'Los incomplete de axe se conservan; cero violations no acredita conformidad completa.'],
  source: await hashes(), states: [], blockedDomainWrites: 0, sessions: [],
};
const reportPath = path.join(out, caregiverOnly ? 'caregiver-audit.json' : quick ? 'audit-quick.json' : 'audit.json');
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
const assert = (ok, message) => { if (!ok) throw Error(message); };
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browserVersion = browser.version();

async function inspectDialog(page, dialog, phone) {
  return dialog.evaluate((element, phone) => {
    const rect = r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
    const bounds = rect(element.getBoundingClientRect());
    const surfaceElement = element.closest('[data-app-surface]');
    const surface = surfaceElement ? rect(surfaceElement.getBoundingClientRect()) : null;
    const visible = surface ? { left: Math.max(0, surface.left), top: Math.max(0, surface.top), right: Math.min(innerWidth, surface.right), bottom: Math.min(innerHeight, surface.bottom) } : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const verticalScrollers = [element, ...element.querySelectorAll('*')].filter(node => {
      if (!(node instanceof HTMLElement) || node.tagName === 'TEXTAREA') return false;
      return /auto|scroll/.test(getComputedStyle(node).overflowY) && node.clientHeight > 0 && node.scrollHeight > node.clientHeight + 1;
    }).map(node => ({ tag: node.tagName, className: node.className, clientHeight: node.clientHeight, scrollHeight: node.scrollHeight }));
    const backdrop = getComputedStyle(element, '::backdrop');
    const active = document.activeElement;
    const activeBounds = active instanceof HTMLElement ? rect(active.getBoundingClientRect()) : null;
    return {
      phone, inApp: element.hasAttribute('data-dialog-in-app'), bounds, surface, visible,
      viewport: { width: innerWidth, height: innerHeight }, visualViewport: window.visualViewport ? { width: visualViewport.width, height: visualViewport.height, offsetTop: visualViewport.offsetTop, offsetLeft: visualViewport.offsetLeft } : null,
      dialogClientWidth: element.clientWidth, dialogScrollWidth: element.scrollWidth,
      documentWidth: document.documentElement.scrollWidth, verticalScrollers,
      backdrop: { clipPath: backdrop.clipPath, top: backdrop.top, left: backdrop.left, right: backdrop.right, bottom: backdrop.bottom, background: backdrop.backgroundColor },
      focusInside: element.contains(active), activeBounds,
      title: element.querySelector('h1,h2,h3')?.textContent?.trim(),
    };
  }, phone);
}

function validateGeometry(layout, id) {
  const { bounds: b, visible: v } = layout;
  assert(!layout.phone || layout.inApp, `${id}: falta data-dialog-in-app.`);
  assert(!layout.phone || layout.surface, `${id}: el diálogo no pertenece al teléfono.`);
  assert(layout.phone || !layout.inApp, `${id}: dashboard recibió límites de teléfono.`);
  assert(b.left >= v.left - 2 && b.right <= v.right + 2 && b.top >= v.top - 2 && b.bottom <= v.bottom + 2, `${id}: diálogo fuera de superficie visible: ${JSON.stringify(layout)}`);
  assert(layout.dialogScrollWidth <= layout.dialogClientWidth + 1, `${id}: scroll horizontal del diálogo.`);
  assert(layout.documentWidth <= layout.viewport.width + 1, `${id}: scroll horizontal de página.`);
  assert(layout.verticalScrollers.length <= 1, `${id}: doble desplazamiento vertical dentro del diálogo.`);
  assert(layout.focusInside, `${id}: foco fuera del diálogo.`);
  assert(layout.title, `${id}: título vacío.`);
  if (layout.phone) assert(layout.backdrop.clipPath !== 'none', `${id}: backdrop no recortado.`);
}

async function record(page, dialog, id, phone) {
  await settle(page);
  const layout = await inspectDialog(page, dialog, phone);
  validateGeometry(layout, id);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  await dialog.waitFor({ state: 'visible' });
  const axe = await dialog.evaluate(async element => window.axe.run(element, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  assert(axe.violations.length === 0, `${id}: ${axe.violations.map(v => v.id).join(', ')}.`);
  const screenshot = `${id}.png`;
  await dialog.screenshot({ path: path.join(out, screenshot) });
  let contextScreenshot;
  if (/(?:patient|caregiver)-(320|1280)-(100|200)-standard-(reading|communication-message)$/.test(id)) {
    contextScreenshot = `${id}-context.png`;
    await page.screenshot({ path: path.join(out, contextScreenshot), fullPage: false });
  }
  report.states.push({ id, url: page.url(), screenshot, contextScreenshot, layout, axe: { violations: axe.violations, incomplete: axe.incomplete } });
  console.log(`${id}: contenido, foco y geometría verificados; ${axe.incomplete.length} reglas incomplete.`);
}

async function keyboardAndClose(page, dialog, trigger, id) {
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    assert(await dialog.evaluate(element => element.contains(document.activeElement)), `${id}: Tab salió del diálogo.`);
  }
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Shift+Tab');
    assert(await dialog.evaluate(element => element.contains(document.activeElement)), `${id}: Mayús+Tab salió del diálogo.`);
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await settle(page);
  assert(await trigger.evaluate(element => element === document.activeElement), `${id}: no devolvió foco al disparador.`);
}

async function scenario(role, viewport, scale, contrast) {
  const phone = role === 'patient_dacio';
  const context = await browser.newContext({ viewport, locale: 'es-PE', reducedMotion: 'reduce' });
  await context.addInitScript(({ scale, contrast }) => localStorage.setItem('contigo-reading-options', JSON.stringify({ scale, contrast, silent: true, reducedMotion: true })), { scale, contrast });
  const page = await context.newPage();
  let blocked = 0;
  await page.route('**/api/v1/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'].includes(url.pathname)) {
      blocked++;
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  try {
    await page.goto(origin.origin + '/login');
    await page.getByTestId(`login-${role}`).click();
    await page.getByRole('button', { name: 'Entrada Rápida', exact: true }).click();
    await page.waitForURL(origin.origin + (phone ? '/patient-app' : '/dashboard'));
    await page.locator(phone ? '.measurement-form' : '[data-reading-placement="caregiver"]').first().waitFor();
    if (!phone) await page.getByTestId('select-patient-active').waitFor();
    const prefix = `${quick ? 'quick-' : ''}${phone ? 'patient' : 'caregiver'}-${viewport.width}-${scale}-${contrast ? 'high' : 'standard'}`;
    const triggers = [
      ['reading', page.getByRole('button', { name: 'Opciones de lectura', exact: true })],
      ['communication', page.getByRole('button', { name: 'Comunicarme', exact: true })],
    ];
    if (phone) triggers.push(['sos', page.getByTestId('patient-sos')]);
    for (const [name, trigger] of triggers) {
      const id = `${prefix}-${name}`;
      assert(await trigger.count() === 1, `${id}: disparador ausente o duplicado.`);
      if (phone) assert(await trigger.evaluate(element => !!element.closest('[data-app-surface]')), `${id}: disparador fuera del teléfono.`);
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.locator('dialog[open]');
      assert(await dialog.count() === 1, `${id}: más de un diálogo abierto.`);
      await dialog.waitFor();
      await record(page, dialog, id, phone);
      if (name === 'communication') {
        await dialog.getByRole('button', { name: 'Prefiero comunicarme por escrito', exact: true }).click();
        await dialog.getByRole('button', { name: 'Mostrar mensaje grande', exact: true }).focus();
        await page.keyboard.press('Enter');
        await dialog.getByRole('heading', { name: 'Mi mensaje', exact: true }).waitFor();
        await record(page, dialog, `${id}-message`, phone);
        await dialog.getByRole('button', { name: 'Escribir una respuesta', exact: true }).focus();
        await page.keyboard.press('Enter');
        const answer = dialog.getByLabel('Respuesta de la persona que está contigo');
        await answer.fill('De acuerdo. Voy a escribir los pasos.');
        assert(await answer.evaluate(element => element === document.activeElement), `${id}: foco no llegó a la respuesta.`);
        await record(page, dialog, `${id}-response`, phone);
      }
      await keyboardAndClose(page, dialog, trigger, id);
    }
    assert(blocked === 0, `${prefix}: hubo ${blocked} escrituras clínicas bloqueadas.`);
    report.sessions.push({ role, viewport, scale, contrast, blockedDomainWrites: blocked });
  } finally {
    report.blockedDomainWrites += blocked;
    for (const dialog of await page.locator('dialog[open]').all()) await dialog.evaluate(element => element.close());
    const account = page.locator('summary').filter({ hasText: 'Mi cuenta' }).first();
    if (await account.count() && !await account.evaluate(element => element.parentElement?.hasAttribute('open'))) await account.click();
    const logout = page.getByRole('button', { name: /Cerrar sesión/ }).first();
    if (await logout.count()) await logout.click();
    await context.close();
  }
}

try {
  if (!caregiverOnly) for (const viewport of quick ? [{ width: 320, height: 900 }] : [{ width: 320, height: 900 }, { width: 390, height: 900 }, { width: 430, height: 1000 }, { width: 1280, height: 900 }]) {
    for (const scale of ['100', '200']) for (const contrast of quick ? [false] : [false, true]) await scenario('patient_dacio', viewport, scale, contrast);
  }
  if (!quick) for (const viewport of [{ width: 390, height: 900 }, { width: 1280, height: 900 }]) for (const scale of ['100', '200']) await scenario('caregiver_demo', viewport, scale, false);
  assert(JSON.stringify(await hashes()) === JSON.stringify(report.source), 'Las fuentes cambiaron durante la verificación; repetir sobre una versión estable.');
  report.complete = true;
  report.summary = { states: report.states.length, violationNodes: report.states.reduce((n, s) => n + s.axe.violations.reduce((m, v) => m + v.nodes.length, 0), 0), incompleteNodes: report.states.reduce((n, s) => n + s.axe.incomplete.reduce((m, v) => m + v.nodes.length, 0), 0) };
} catch (error) {
  report.error = error.message;
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ complete: report.complete, summary: report.summary, error: report.error, blockedDomainWrites: report.blockedDomainWrites }));
}
