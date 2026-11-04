/** Reproduces the isolated headless checks used for CommunicationBoard. */
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'output/accessibility-ui-2026-11-03/communication');
const origin = 'http://127.0.0.1:3001';
await fs.mkdir(out, { recursive: true });
const report = {
  complete: false,
  method: 'Headless Chrome, tablero local en login, contextos privados sin sesión y sin escritura API. Escala del producto distinta de zoom nativo.',
  checks: [], layouts: [],
};
const keyboard = { complete: false, steps: [] };
const assert = (value, message) => { if (!value) throw Error(message); };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, locale: 'es-PE' });
  const page = await context.newPage();
  let apiRequests = 0;
  await page.route('**/api/v1/**', route => { apiRequests++; return route.abort(); });
  await page.goto(origin + '/login');
  await page.getByRole('button', { name: 'Comunicarme', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Comunicarme por escrito' });
  await dialog.waitFor();
  assert(await dialog.getByRole('heading', { name: 'Comunicarme por escrito' }).evaluate(el => el === document.activeElement), 'Foco inicial incorrecto');
  assert(await dialog.getByLabel('Respuesta de la persona que está contigo').count() === 0, 'Respuesta visible antes de solicitarla');
  await dialog.getByRole('button', { name: 'Prefiero comunicarme por escrito', exact: true }).click();
  assert(await dialog.getByLabel('Mi mensaje', { exact: true }).inputValue() === 'Prefiero comunicarme por escrito', 'Frase no copiada');
  await dialog.getByLabel('Mi mensaje', { exact: true }).fill('Necesito que escriba los pasos.');
  await dialog.getByRole('button', { name: 'Mostrar mensaje grande', exact: true }).click();
  await dialog.getByRole('heading', { name: 'Mi mensaje', exact: true }).waitFor();
  assert(await dialog.getByText('Necesito que escriba los pasos.', { exact: true }).count() === 1, 'Mensaje grande ausente');
  assert(await dialog.getByRole('heading', { name: 'Mi mensaje', exact: true }).evaluate(el => el === document.activeElement), 'Foco del mensaje incorrecto');
  await dialog.getByRole('button', { name: 'Escribir una respuesta', exact: true }).click();
  const answer = dialog.getByLabel('Respuesta de la persona que está contigo');
  assert(await answer.evaluate(el => el === document.activeElement), 'Foco de respuesta incorrecto');
  await answer.fill('Sí. Vamos paso a paso.');
  await dialog.getByRole('button', { name: 'Editar mensaje', exact: true }).click();
  assert(await dialog.getByLabel('Mi mensaje', { exact: true }).inputValue() === 'Necesito que escriba los pasos.', 'Mensaje perdido al editar');
  assert(await answer.inputValue() === 'Sí. Vamos paso a paso.', 'Respuesta perdida al editar');
  assert(await dialog.getByLabel('Mi mensaje', { exact: true }).getAttribute('maxlength') === '240', 'Límite incorrecto');
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  assert(!stored.includes('Necesito que escriba') && !stored.includes('Vamos paso'), 'Texto persistido');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert(await page.getByRole('button', { name: 'Comunicarme', exact: true }).evaluate(el => el === document.activeElement), 'Sin retorno de foco');
  await page.getByRole('button', { name: 'Comunicarme', exact: true }).click();
  assert(await dialog.getByLabel('Mi mensaje', { exact: true }).inputValue() === '' && await dialog.getByLabel('Respuesta de la persona que está contigo').count() === 0, 'Conversación conservada tras cerrar');
  await dialog.getByRole('button', { name: 'Necesito ayuda', exact: true }).click();
  await dialog.getByRole('button', { name: 'Mostrar mensaje grande', exact: true }).click();
  await dialog.getByRole('button', { name: 'Escribir una respuesta', exact: true }).click();
  assert(await dialog.getByLabel('Respuesta de la persona que está contigo').inputValue() === '', 'Respuesta conservada tras cerrar');
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: 'Opciones de lectura', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Modo sin sonido' }).check();
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await page.getByRole('button', { name: 'Comunicarme', exact: true }).click();
  await dialog.getByRole('button', { name: 'Necesito ayuda', exact: true }).click();
  assert(await dialog.getByRole('button', { name: 'Leer mi mensaje en voz alta' }).isDisabled(), 'Voz no deshabilitada en modo silencioso');
  assert(await dialog.getByText('La voz está desactivada en las opciones de accesibilidad.', { exact: true }).count() === 1, 'Falta razón visual de voz desactivada');
  await dialog.getByRole('button', { name: 'Borrar conversación' }).click();
  assert(await dialog.getByLabel('Mi mensaje', { exact: true }).inputValue() === '', 'Borrado falló');
  report.checks.push(
    { name: 'Frase, edición, mensaje grande, respuesta, borrado, ESC y retorno de foco', passed: true },
    { name: 'Sin persistencia de mensajes y sin sonido', passed: true },
  );
  report.apiRequests = apiRequests;
  assert(apiRequests === 0, 'Tablero solicitó API');
  await context.close();

  for (const width of [320, 390, 430]) for (const scale of ['100', '200']) for (const contrast of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'es-PE' });
    await ctx.addInitScript(({ scale, contrast }) => localStorage.setItem('contigo-reading-options', JSON.stringify({ scale, contrast, silent: true })), { scale, contrast });
    const p = await ctx.newPage();
    await p.route('**/api/v1/**', route => route.abort());
    await p.goto(origin + '/login');
    await p.getByRole('button', { name: 'Comunicarme', exact: true }).click();
    const d = p.getByRole('dialog', { name: 'Comunicarme por escrito' });
    await d.waitFor();
    await p.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    for (const state of ['editor', 'presentation', 'response']) {
      if (state === 'presentation') {
        await d.getByRole('button', { name: 'Prefiero comunicarme por escrito', exact: true }).click();
        await d.getByRole('button', { name: 'Mostrar mensaje grande' }).click();
        await d.getByRole('heading', { name: 'Mi mensaje', exact: true }).waitFor();
      }
      if (state === 'response') {
        await d.getByRole('button', { name: 'Escribir una respuesta', exact: true }).click();
        await d.getByLabel('Respuesta de la persona que está contigo').fill('De acuerdo. Voy a escribir los pasos.');
      }
      const axe = await d.evaluate(async el => window.axe.run(el, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
      const layout = await d.evaluate(el => {
        const visibleAreas = Array.from(el.querySelectorAll('textarea, fieldset, section')).map(node => ({ tag: node.tagName, width: node.clientWidth, height: node.clientHeight }));
        return { client: el.clientWidth, scroll: el.scrollWidth, doc: document.documentElement.scrollWidth, viewport: innerWidth, focused: el.contains(document.activeElement), visibleAreas };
      });
      assert(layout.scroll <= layout.client + 1 && layout.doc <= layout.viewport + 1, 'Desborde ' + JSON.stringify({ width, scale, contrast, state, layout }));
      assert(axe.violations.length === 0, 'axe ' + JSON.stringify({ width, scale, contrast, state, rules: axe.violations.map(v => v.id) }));
      const screenshot = `board-${width}-${scale}-${contrast ? 'high' : 'standard'}-${state}.png`;
      await d.screenshot({ path: path.join(out, screenshot) });
      report.layouts.push({ width, scale, contrast, state, layout, screenshot, axe: { violations: axe.violations, incomplete: axe.incomplete } });
    }
    await ctx.close();
  }
  report.source = await Promise.all(['CommunicationBoard.tsx', 'CommunicationBoard.module.css'].map(async file => ({
    file: 'frontend/src/features/accessibility/' + file,
    sha256: crypto.createHash('sha256').update(await fs.readFile(path.join(root, 'frontend/src/features/accessibility', file))).digest('hex'),
  })));

  const keyboardContext = await browser.newContext({ viewport: { width: 320, height: 900 } });
  const p = await keyboardContext.newPage();
  await p.route('**/api/v1/**', route => route.abort());
  await p.goto(origin + '/login');
  const trigger = p.getByRole('button', { name: 'Comunicarme', exact: true });
  await trigger.focus();
  await p.keyboard.press('Enter');
  const d = p.getByRole('dialog', { name: 'Comunicarme por escrito' });
  await d.waitFor();
  await d.getByRole('button', { name: 'Necesito ayuda', exact: true }).focus();
  await p.keyboard.press('Space');
  assert(await d.getByLabel('Mi mensaje', { exact: true }).inputValue() === 'Necesito ayuda', 'Selección por espacio falló');
  await d.getByRole('button', { name: 'Mostrar mensaje grande' }).focus();
  await p.keyboard.press('Enter');
  await d.getByRole('heading', { name: 'Mi mensaje', exact: true }).waitFor();
  for (let i = 0; i < 24; i++) {
    await p.keyboard.press('Tab');
    assert(await d.evaluate(el => el.contains(document.activeElement)), 'Tab salió de modal');
  }
  for (let i = 0; i < 24; i++) {
    await p.keyboard.press('Shift+Tab');
    assert(await d.evaluate(el => el.contains(document.activeElement)), 'Mayús+Tab salió de modal');
  }
  await p.keyboard.press('Escape');
  await d.waitFor({ state: 'hidden' });
  assert(await trigger.evaluate(el => el === document.activeElement), 'Foco no volvió al disparador');
  keyboard.steps = ['Enter abre', 'Espacio selecciona frase', 'Enter muestra mensaje', '24Tab y24MayúsTab permanecen en modal', 'Esc cierra y retorna foco'];
  keyboard.complete = true;
  keyboard.finalizedAt = new Date().toISOString();
  await keyboardContext.close();
  report.complete = true;
  report.finalizedAt = new Date().toISOString();
  console.log(JSON.stringify({ complete: true, states: report.layouts.length, apiRequests: report.apiRequests, keyboard: keyboard.complete }));
} catch (error) {
  report.error = error.message;
  if (!keyboard.complete) keyboard.error = error.message;
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await fs.writeFile(path.join(out, 'communication-board.json'), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(out, 'communication-board-keyboard.json'), JSON.stringify(keyboard, null, 2));
}
