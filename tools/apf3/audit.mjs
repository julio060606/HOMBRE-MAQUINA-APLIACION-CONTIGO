import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const [baseUrl = 'http://127.0.0.1:3001', variant = 'after'] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'output/apf3/evidence', variant);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, locale: 'es-PE', reducedMotion: 'reduce' });
const errors = [];
const page = await context.newPage();
page.on('pageerror', e => errors.push(e.message));
const report = {
  metadata: {
    variant, baseUrl, timestamp: new Date().toISOString(),
    baselineCommit: '4656d72365080d18b267f69d565e4d77a7ae3d56',
    currentHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    browser: await browser.version(), axeVersion: require('axe-core/package.json').version,
    playwrightVersion: require('playwright/package.json').version,
    dataset: 'Synthetic demonstration data; automated technical inspection, no human participants.',
    limitations: [
      'Automated axe checks do not establish WCAG conformance.',
      'Keyboard events are automated; no screen reader was run by this script.',
      '320 CSS px viewport and 200% root-font stress are separate from native browser zoom.',
      'No Stark/Figma, color-blindness user experience, audio comprehension or participant results are asserted.',
      'Web demo only; no clinical backend, real medical integration or SOS delivery tested.'
    ]
  }, screens: [], interactions: [], consoleErrors: errors
};
async function ready() {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(220);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
}
async function login(actor, route) {
  await page.goto(`${baseUrl}/login`);
  await page.evaluate(actor => sessionStorage.setItem('contigo-demo-actor-v1', actor), actor);
  await page.goto(`${baseUrl}${route}`);
  await ready();
}
async function capture(id, role, state, extra = {}) {
  await ready();
  const screenshot = `${id}.png`;
  await page.screenshot({ path: path.join(out, screenshot), fullPage: true });
  const axe = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  const layout = await page.evaluate(() => {
    const visible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const details = el => {
      const r = el.getBoundingClientRect(), css = getComputedStyle(el);
      return { tag: el.tagName, text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 140), testId: el.dataset.testid,
        width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100,
        fontSize: css.fontSize, color: css.color, background: css.backgroundColor, outline: css.outline,
        overflowX: css.overflowX, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    };
    return { title: document.title, viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      patientApp: document.querySelector('.patient-app') ? details(document.querySelector('.patient-app')) : null,
      patientBody: document.querySelector('.patient-body') ? details(document.querySelector('.patient-body')) : null,
      controls: [...document.querySelectorAll('button,a,input,select,textarea,summary')].filter(visible).map(el=>({...details(el),name:el.getAttribute('name'),autocomplete:el.getAttribute('autocomplete'),ariaLabel:el.getAttribute('aria-label')})),
      navigation: [...document.querySelectorAll('.patient-navigation')].map(el=>({...details(el),clippedChildren:[...el.children].filter(c=>c.getBoundingClientRect().right>el.getBoundingClientRect().right+1).map(details)})),
      horizontalOffenders: [...document.querySelectorAll('main *, .patient-app *')].filter(visible).filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 25).map(details),
      textSamples: [...document.querySelectorAll('h1,h2,label,p,nav span')].filter(visible).slice(0, 20).map(details),
      statuses: [...document.querySelectorAll('[role="status"],[role="alert"]')].filter(visible).map(el => ({role:el.getAttribute('role'),text:el.textContent.trim()})),
      headings: [...document.querySelectorAll('h1,h2,h3')].filter(visible).map(el=>({level:el.tagName,text:el.textContent.trim()}))
    };
  });
  const screen = { id, role, state, url: page.url(), screenshot: `output/apf3/evidence/${variant}/${screenshot}`, axe, layout, ...extra };
  report.screens.push(screen);
  await fs.writeFile(path.join(out, 'audit.json'), JSON.stringify(report, null, 2));
  console.log(`${variant} ${id}: ${axe.violations.length} axe rules; overflow=${layout.horizontalOverflow}; controls=${layout.controls.length}`);
  return screen;
}
async function keyboard(id, max = 16) {
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); const x=document.createElement('button'); x.id='audit-focus-start';x.style.position='fixed';document.body.prepend(x);x.focus(); });
  const steps = [];
  for (let i=0;i<max;i++) {
    await page.keyboard.press('Tab');
    const step=await page.evaluate(() => { const e=document.activeElement,r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,text:(e.innerText||e.getAttribute('aria-label')||e.getAttribute('name')||'').trim().slice(0,120),outline:s.outline,outlineOffset:s.outlineOffset,tabIndex:e.tabIndex,rect:{x:r.x,y:r.y,width:r.width,height:r.height}}; });
    if(step.text.includes('Ya la tomé')||step.text==='Ir al contenido principal'||step.text.includes('Entrar como')) {
      step.screenshot=`output/apf3/evidence/${variant}/${id}-focus-${i}.png`;
      await page.screenshot({path:path.join(out,`${id}-focus-${i}.png`),fullPage:true});
    }
    steps.push(step);
  }
  await page.screenshot({path:path.join(out,`${id}-keyboard.png`),fullPage:true});
  await page.evaluate(()=>document.getElementById('audit-focus-start')?.remove());
  report.interactions.push({id:`${id}-keyboard`,method:'Automated Tab key sequence in Chrome',steps,screenshot:`output/apf3/evidence/${variant}/${id}-keyboard.png`});
}
async function patientTab(label) {
  await page.getByRole('navigation', { name: 'Navegación del paciente' }).getByRole('button', {name:label,exact:true}).click();
  await ready();
}
try {
  await page.goto(`${baseUrl}/login`); await capture('01-login','public','normal'); await keyboard('01-login',12);
  await login('patient_dacio','/patient-app');
  await capture('02-patient-home','patient','normal'); await keyboard('02-patient-home');
  await patientTab('Tratamiento'); await capture('03-patient-treatment','patient','normal');
  await patientTab('Medición'); await capture('04-patient-measurement','patient','empty-form');
  await page.getByTestId('input-systolic').fill('80'); await page.getByTestId('input-diastolic').fill('120');
  await page.getByTestId('btn-save-vitals').click(); await capture('05-measurement-error','patient','invalid-input');
  await page.getByTestId('input-systolic').fill('120'); await page.getByTestId('input-diastolic').fill('80');
  await page.getByTestId('btn-save-vitals').click();
  const confirm = page.getByRole('button',{name:/Confirmar y guardar|Confirmar lectura|Guardar medición|Confirmar medición/i});
  if(await confirm.count()) { await capture('06-measurement-review','patient','review'); await confirm.first().click(); }
  await capture('07-measurement-saved','patient','confirmation');
  await patientTab('Citas'); await capture('08-patient-appointments','patient','normal');
  await patientTab('Mi salud'); await capture('09-patient-health','patient','normal');
  await patientTab('Mi cuidador'); await capture('10-patient-caregiver','patient','normal');
  await patientTab('Inicio');
  await page.getByTestId('dose-taken').first().click();
  const doseConfirm=page.getByRole('button',{name:/Confirmar respuesta|Confirmar toma|Guardar respuesta/i});
  if(await doseConfirm.count()) { await capture('11-dose-review','patient','review');await doseConfirm.first().click(); }
  await capture('12-dose-recorded','patient','confirmation');
  await page.getByTestId('patient-sos').click();
  const sosConfirm=page.getByRole('button',{name:/Registrar petición|Confirmar.*SOS|Registrar SOS|Confirmar solicitud|Registrar solicitud/i});
  if(await sosConfirm.count()) { await capture('13-sos-review','patient','review');await sosConfirm.first().click(); }
  await capture('14-sos-recorded','patient','confirmation');
  const closeSos=page.getByRole('button',{name:'Entendido, volver',exact:true});if(await closeSos.count())await closeSos.click();
  await page.setViewportSize({width:320,height:800});
  await patientTab('Tratamiento'); await capture('15-patient-320','patient','reflow-320-css-px');
  await page.setViewportSize({width:640,height:900});
  await page.addStyleTag({content:'html { font-size: 200% !important; }'});
  await capture('16-patient-text-200','patient','root-font-200-percent-stress',{nativeBrowserZoom:false});
  await page.setViewportSize({width:1280,height:960});
  await login('caregiver_demo','/dashboard'); await capture('17-caregiver-dashboard','caregiver','normal'); await keyboard('17-caregiver-dashboard');
  for (const [route,id] of [['/medications','18-caregiver-medications'],['/appointments','19-caregiver-appointments'],['/settings','20-caregiver-settings'],['/vitals','21-caregiver-vitals']]) {
    await page.goto(`${baseUrl}${route}`); await capture(id,'caregiver','normal');
  }
  await page.goto(`${baseUrl}/settings`); await ready();
  const contrast=page.getByRole('checkbox',{name:/Alto contraste/i});
  if(await contrast.count()) {await contrast.check();await page.getByRole('button',{name:/Guardar preferencias/i}).click();await page.getByText('Preferencias guardadas para este paciente.',{exact:true}).waitFor();}
  await login('patient_dacio','/patient-app');await capture('22-patient-high-contrast','patient','high-contrast-preference');
  await login('caregiver_unlinked','/dashboard');await capture('23-caregiver-empty','caregiver','no-linked-patients');
  await page.setViewportSize({width:320,height:800});await login('caregiver_demo','/medications');await capture('24-caregiver-320','caregiver','reflow-320-css-px');
} catch(error) {report.fatal={message:error.message,stack:error.stack};console.error(error);process.exitCode=1;}
finally { await fs.writeFile(path.join(out,'audit.json'),JSON.stringify(report,null,2));await browser.close(); }
