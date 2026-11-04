import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
const require = createRequire(import.meta.url);

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'output/accessibility-ui-2026-11-03/options');
await fs.mkdir(out, { recursive: true });
const report = { complete: false, timestamp: new Date().toISOString(), origin: 'http://127.0.0.1:3001', checks: [], limitations: ['Vibración simulada para verificar consentimiento y solicitud; no confirma respuesta física del dispositivo.', 'No es una prueba con participantes ni con lector de pantalla.'] };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, locale: 'es-PE', reducedMotion: 'reduce' });
const page = await context.newPage();
let apiCalls = 0;
await page.route('**/api/v1/**', route => { apiCalls++; return route.abort(); });
await page.addInitScript(() => {
  window.__vibrationRequests = [];
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: value => { window.__vibrationRequests.push(value); return true; } });
});
try {
  await page.goto(report.origin + '/login');
  await page.getByRole('button', { name: 'Opciones de lectura', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Probar vibración', exact: true }).isDisabled(), true);
  assert.equal((await page.evaluate(() => window.__vibrationRequests)).length, 0);
  await page.getByLabel('Vibración al completar acciones', { exact: true }).check();
  await page.getByRole('button', { name: 'Probar vibración', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.__vibrationRequests), [120]);
  await page.getByRole('status').filter({ hasText: 'Se solicitó una vibración breve' }).waitFor();
  report.checks.push({ name: 'Vibración solo tras consentimiento y solicitud explícita, resultado visible sin prometer respuesta física', passed: true });

  await page.getByLabel('Modo sin sonido', { exact: true }).check();
  await page.getByLabel('Controles más grandes', { exact: true }).check();
  await page.getByLabel('Reducir animaciones', { exact: true }).check();
  const geometry = await page.getByRole('button', { name: 'Comunicarme', exact: true }).evaluate(element => ({ height: element.getBoundingClientRect().height, classes: document.documentElement.className }));
  assert.ok(geometry.height >= 56);
  assert.ok(geometry.classes.includes('site-large-targets') && geometry.classes.includes('site-reduced-motion'));
  await page.screenshot({ path: path.join(out, '01-options.png'), fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'Opciones de lectura', exact: true }).click();
  for (const name of ['Modo sin sonido', 'Controles más grandes', 'Reducir animaciones', 'Vibración al completar acciones']) assert.equal(await page.getByLabel(name, { exact: true }).isChecked(), true);
  report.checks.push({ name: 'Preferencias persisten tras recarga y controles tienen al menos56px', passed: true, geometry });

  await page.getByRole('button', { name: 'Restablecer ayudas', exact: true }).click();
  for (const name of ['Modo sin sonido', 'Controles más grandes', 'Reducir animaciones', 'Vibración al completar acciones']) assert.equal(await page.getByLabel(name, { exact: true }).isChecked(), false);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('site-large-targets') || document.documentElement.classList.contains('site-reduced-motion')), false);
  report.checks.push({ name: 'Restablecer revierte opciones y clases visuales', passed: true });
  await page.getByRole('button', { name: 'Texto al 200 %', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains('site-expanded-text') && getComputedStyle(document.documentElement).fontSize === '32px');
  assert.equal(await page.getByRole('button', { name: 'Texto al 200 %', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Restablecer ayudas', exact: true }).click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('site-expanded-text'));
  report.checks.push({ name: 'Selector de tamaño aplica200%, muestra selección y restablece sin perder acceso a controles', passed: true });
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  const optionsDialog = page.getByRole('dialog', { name: 'Opciones de lectura', exact: true });
  await optionsDialog.waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('button', { name: 'Opciones de lectura', exact: true }).evaluate(element => element === document.activeElement), true);
  await page.getByRole('button', { name: 'Opciones de lectura', exact: true }).focus();
  await page.keyboard.press('Enter');
  await optionsDialog.waitFor();
  for (let index = 0; index < 24; index++) {
    await page.keyboard.press(index % 2 ? 'Shift+Tab' : 'Tab');
    assert.equal(await optionsDialog.evaluate(element => element.contains(document.activeElement)), true);
  }
  await page.keyboard.press('Escape');
  await optionsDialog.waitFor({ state: 'hidden' });
  report.checks.push({ name: 'Enter abre, foco permanece en panel, Listo/Escape cierran y devuelven foco', passed: true });

  report.layouts = [];
  for (const width of [320, 390, 1280]) for (const scale of ['100', '200']) for (const contrast of [false, true]) {
    const isolated = await browser.newContext({ viewport: { width, height: 900 }, locale: 'es-PE', reducedMotion: 'reduce' });
    const current = await isolated.newPage();
    await current.route('**/api/v1/**', route => { apiCalls++; return route.abort(); });
    await current.addInitScript(({ scale, contrast }) => localStorage.setItem('contigo-reading-options', JSON.stringify({ scale, contrast })), { scale, contrast });
    await current.goto(report.origin + '/login');
    await current.getByRole('button', { name: 'Opciones de lectura', exact: true }).click();
    const panel = current.getByRole('dialog', { name: 'Opciones de lectura', exact: true });
    await panel.waitFor();
    await current.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const axe = await panel.evaluate(element => window.axe.run(element, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    const layout = await panel.evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth, document: document.documentElement.scrollWidth, viewport: innerWidth, height: element.getBoundingClientRect().height, bodyHeight: element.querySelector('[class*="body"]')?.clientHeight }));
    const screenshot = `options-${width}-${scale}-${contrast ? 'high' : 'standard'}.png`;
    await panel.screenshot({ path: path.join(out, screenshot) });
    assert.ok(layout.scroll <= layout.client + 1 && layout.document <= layout.viewport + 1, JSON.stringify({ width, scale, contrast, layout }));
    assert.ok(layout.bodyHeight >= 120, 'El cuerpo del panel no tiene espacio de lectura suficiente: ' + JSON.stringify({ width, scale, contrast, layout }));
    assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))));
    report.layouts.push({ width, scale, contrast, layout, screenshot, axe: { violations: axe.violations, incomplete: axe.incomplete } });
    await panel.getByRole('button', { name: 'Listo', exact: true }).focus();
    await current.keyboard.press('Enter');
    await panel.waitFor({ state: 'hidden' });
    assert.equal(await current.getByRole('button', { name: 'Opciones de lectura', exact: true }).evaluate(element => element === document.activeElement), true);
    await isolated.close();
  }
  report.sources = await Promise.all(['frontend/src/components/layout/ReadingOptions.tsx', 'frontend/src/components/layout/ReadingOptions.module.css', 'frontend/src/styles/index.css'].map(async file => ({ file, sha256: crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex') })));
  assert.equal(apiCalls, 0);
  report.apiCalls = apiCalls;
  report.complete = true;
} finally {
  await fs.writeFile(path.join(out, 'interaction.json'), JSON.stringify(report, null, 2));
  await context.close();
  await browser.close();
}
console.log(JSON.stringify({ complete: report.complete, checks: report.checks.length, apiCalls }));
