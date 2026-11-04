import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const out = path.join(root, 'output/wcag-audit-2026-11-04/evidence');
const extension = path.join(root, 'tools/apf3/native-zoom-extension');
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'contigo-wcag-zoom-'));
const report = { startedAt: new Date().toISOString(), method: 'chrome.tabs.setZoom/getZoom, perfil Chromium temporal, ventana 1280×960, viewport:null. Sin CSS zoom ni emulación de DPR.', measurements: [], blockedWrites: [], error: null };
let context;
try {
  context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, viewport: null, locale: 'es-PE', args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, '--window-size=1280,960'] });
  await context.route('**/api/**', route => {
    const req = route.request();
    if (!['GET','HEAD','OPTIONS'].includes(req.method()) && !/\/auth\/(login|refresh|logout)$/.test(new URL(req.url()).pathname)) {
      report.blockedWrites.push(new URL(req.url()).pathname); return route.abort();
    }
    return route.continue();
  });
  let worker = context.serviceWorkers()[0]; if (!worker) worker = await context.waitForEvent('serviceworker');
  const page = context.pages()[0]; await page.goto('http://127.0.0.1:3001/login'); await page.locator('#email-input').waitFor();
  const tabId = await worker.evaluate(async () => (await chrome.tabs.query({})).find(t => t.url?.startsWith('http://127.0.0.1:3001/')).id);
  async function measure(id, factor) {
    await worker.evaluate(args => self.setLocalZoom(args), { tabId, factor }); await page.waitForTimeout(200);
    const native = await worker.evaluate(id => self.getLocalZoom(id), tabId);
    if (native.zoomFactor !== factor) throw new Error('Zoom nativo no confirmado');
    const metrics = await page.evaluate(() => ({ url: location.pathname, title: document.title, innerWidth, innerHeight, devicePixelRatio, fontSize: getComputedStyle(document.documentElement).fontSize, width: document.documentElement.scrollWidth, cssZoom: getComputedStyle(document.documentElement).zoom, h1: document.querySelector('main h1')?.textContent, clippedControls: [...document.querySelectorAll('main button, main select')].filter(e=>e.getClientRects().length && e.scrollWidth > e.clientWidth + 2).map(e=>e.textContent.trim()) }));
    const cdp = await context.newCDPSession(page); const image = await cdp.send('Page.captureScreenshot', {format:'png',fromSurface:true,captureBeyondViewport:false}); await cdp.detach();
    await fs.writeFile(path.join(out, id + '.png'), Buffer.from(image.data,'base64'));
    report.measurements.push({id,native,metrics,screenshot:id+'.png'});
  }
  await measure('zoom-login-100',1); await measure('zoom-login-200',2);
  for (const route of ['/landing','/clinic']) { await page.goto('http://127.0.0.1:3001'+route); await page.locator('main h1').waitFor(); await measure('zoom-'+route.slice(1)+'-200',2); }
  async function login(role) {
    await page.goto('http://127.0.0.1:3001/login'); await page.getByText('Cambiar cuenta de prueba',{exact:true}).click(); await page.getByTestId('login-'+role).click(); await page.getByRole('button',{name:'Entrar',exact:true}).click(); await page.waitForURL(role==='patient_dacio'?'**/patient-app':'**/dashboard'); await page.locator('main h1').waitFor();
  }
  await login('patient_dacio'); await measure('zoom-patient-200',2);
  await page.getByTestId('input-systolic').fill('120'); await page.getByTestId('input-diastolic').fill('80'); await page.getByTestId('btn-save-vitals').click(); await page.getByTestId('measurement-review').waitFor(); await measure('zoom-measurement-review-200',2);
  await page.getByRole('button',{name:/Opciones de lectura/}).click(); await page.getByRole('dialog').waitFor(); await measure('zoom-reading-dialog-200',2); await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click(); await page.waitForURL('**/login'); await login('caregiver_demo');
  for (const route of ['/dashboard','/medications','/appointments','/vitals','/clinical-profile','/settings','/reports']) { await page.goto('http://127.0.0.1:3001'+route); await page.locator('main h1').waitFor(); await page.waitForTimeout(250); await measure('zoom-'+route.slice(1)+'-200',2); }
  await measure('zoom-restored-100',1); report.zoomEvents=await worker.evaluate(()=>self.localZoomEvents); report.complete=true;
} catch(error) { report.error=error.message; report.complete=false; process.exitCode=1; }
finally { report.finishedAt=new Date().toISOString(); await fs.writeFile(path.join(out,'native-zoom.json'),JSON.stringify(report,null,2)); await context?.close(); }
console.log(JSON.stringify({complete:report.complete,error:report.error,measurements:report.measurements.map(x=>({id:x.id,zoom:x.native.zoomFactor,width:x.metrics.innerWidth,overflow:x.metrics.width-x.metrics.innerWidth,clipped:x.metrics.clippedControls}))}));
