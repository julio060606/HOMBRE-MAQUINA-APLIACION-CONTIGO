import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '../..');
const base = 'http://127.0.0.1:3014';
const out = path.join(root, 'output/accessibility-communication-2026-11-03/sos');
await fs.mkdir(out, { recursive: true });
const report = { complete: false, timestamp: new Date().toISOString(), origin: base,
  mode: 'Demostración aislada, VITE_USE_MOCKS=true; base IndexedDB privada de un contexto Chrome nuevo.',
  limitations: ['Prueba técnica headless; no lector de pantalla ni participantes.', 'Persistencia central API/PostgreSQL no evaluada: todas las solicitudes API se bloquean.', 'Se inyecta un error controlado de repositorio en el primer SOS para verificar recuperación.'],
  checks: [], apiRequests: [], sourceHashes: {}, errors: [] };
for (const file of ['frontend/src/features/patient-app/PatientHelp.tsx', 'frontend/src/services/contracts.ts', 'frontend/src/services/sosMessage.ts', 'frontend/src/services/http/httpService.ts', 'frontend/src/services/demo/service.ts']) {
  report.sourceHashes[file] = crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex');
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, locale: 'es-PE', reducedMotion: 'reduce' });
report.browser = browser.version();
await context.addInitScript(() => sessionStorage.setItem('contigo-demo-actor-v1', 'patient_dacio'));
await context.route('**/api/**', route => { report.apiRequests.push(route.request().url()); return route.abort('blockedbyclient'); });
const page = await context.newPage();
function assert(condition, message) { if (!condition) throw Error(message); }
async function tabTo(locator) {
  for (let count = 0; count < 120; count++) {
    if (await locator.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw Error('Control no alcanzable mediante Tab.');
}
async function activate(locator) { await tabTo(locator); await page.keyboard.press('Enter'); }
async function picture(name) { await page.screenshot({ path: path.join(out, name), fullPage: true }); return name; }
async function alerts() {
  return page.evaluate(async () => {
    const { demoRepository } = await import('/src/services/demo/repository.ts');
    return demoRepository.transact(state => state.alerts.filter(alert => alert.type === 'PANIC_BUTTON'));
  });
}
try {
  await page.goto(base + '/patient-app');
  await page.getByRole('heading', { name: 'Mis medicamentos', exact: true }).waitFor();
  const initial = await alerts();
  const trigger = page.getByTestId('patient-sos');
  await activate(trigger);
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('Cancelar y volver'));
  const message = dialog.getByRole('textbox', { name: 'Mensaje para mi cuidador (opcional)' });
  assert(await message.getAttribute('maxlength') === '240', 'Límite del campo ausente.');
  await activate(dialog.getByRole('button', { name: 'Prefiero comunicarme por escrito', exact: true }));
  assert(await message.inputValue() === 'Prefiero comunicarme por escrito', 'Frase rápida no copiada.');
  const openShot = await picture('01-frase-escrita.png');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert(await trigger.evaluate(element => element === document.activeElement), 'Escape no devuelve foco al SOS.');
  assert((await alerts()).length === initial.length, 'Cancelar registró un aviso.');
  await page.keyboard.press('Enter');
  await dialog.waitFor({ state: 'visible' });
  assert(await message.inputValue() === '', 'Reabrir conserva texto privado anterior.');
  report.checks.push({ name: 'Frase rápida, cancelación y reapertura por teclado', passed: true, screenshot: openShot });

  const exactMessage = 'No puedo hablar. Por favor, escriba su respuesta.';
  await tabTo(message);
  await page.keyboard.type(exactMessage);
  await page.evaluate(async () => {
    const { demoRepository } = await import('/src/services/demo/repository.ts');
    const original = demoRepository.transact.bind(demoRepository);
    demoRepository.transact = (fn, changed) => {
      if (String(fn).includes(':sos:')) {
        demoRepository.transact = original;
        return Promise.reject(new Error('Error controlado de prueba al guardar.'));
      }
      return original(fn, changed);
    };
  });
  await activate(dialog.getByTestId('patient-sos-confirm'));
  await dialog.getByRole('alert').filter({ hasText: 'Error controlado de prueba' }).waitFor();
  assert(await message.inputValue() === exactMessage, 'El error pierde el mensaje escrito.');
  assert((await alerts()).length === initial.length, 'El intento fallido guardó un aviso.');
  report.checks.push({ name: 'Error recuperable conserva el texto y no guarda un aviso parcial', passed: true, screenshot: await picture('02-error-conserva-texto.png') });
  await activate(dialog.getByTestId('patient-sos-confirm'));
  await dialog.getByRole('status').filter({ hasText: 'Petición de prueba registrada' }).waitFor();
  assert((await dialog.innerText()).includes(exactMessage), 'Resultado visible no incluye el mensaje.');
  const saved = await alerts();
  assert(saved.length === initial.length + 1, 'El reintento no registra exactamente un aviso.');
  assert(saved.at(-1).description.endsWith('Mensaje del paciente: ' + exactMessage), 'La persistencia cambia el mensaje escrito.');
  const savedShot = await picture('03-mensaje-registrado.png');
  report.checks.push({ name: 'Reintento explícito guarda una única petición sintética y confirma texto exacto', passed: true, screenshot: savedShot });
  await activate(dialog.getByRole('button', { name: 'Entendido, volver', exact: true }));
  await dialog.waitFor({ state: 'hidden' });

  await page.evaluate(() => sessionStorage.setItem('contigo-demo-actor-v1', 'caregiver_demo'));
  await page.goto(base + '/dashboard');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.getByText(exactMessage, { exact: false }).waitFor();
  report.checks.push({ name: 'Cuidador consulta el mensaje registrado en su panel', passed: true, screenshot: await picture('04-cuidador-mensaje.png') });

  assert(report.apiRequests.length === 0, 'Se intentó acceder a API central.');
  report.complete = report.checks.length === 4;
} catch (error) { report.errors.push({ message: error.message, stack: error.stack }); process.exitCode = 1; }
finally {
  await context.close(); await browser.close();
  await fs.writeFile(path.join(out, 'interaction.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ complete: report.complete, checks: report.checks.length, apiRequests: report.apiRequests.length, errors: report.errors.map(error => error.message) }));
}
