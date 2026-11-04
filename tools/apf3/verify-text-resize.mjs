/** Text-reflow QA: measures rendered words, not only horizontal overflow. */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'output/text-resize-2026-11-03');
await fs.mkdir(out, { recursive: true });
const sourceFiles = [
  'frontend/src/components/layout/ReadingOptions.tsx', 'frontend/src/components/layout/ReadingOptions.module.css',
  'frontend/src/features/accessibility/CommunicationBoard.tsx', 'frontend/src/features/accessibility/CommunicationBoard.module.css',
  'frontend/src/styles/index.css', 'frontend/src/features/patient-app/PatientAppContent.tsx',
  'frontend/src/features/patient-app/PatientShell.module.css', 'frontend/src/features/patient-app/PatientAppPage.tsx',
  'frontend/src/components/simulator/PhoneDeviceFrame.tsx', 'frontend/src/components/simulator/PhoneDeviceFrame.module.css',
  'frontend/src/features/appointments/AppointmentList.tsx', 'frontend/src/features/appointments/AppointmentList.module.css',
  'frontend/src/features/patient-app/MeasurementForm.module.css', 'frontend/src/features/patient-app/DoseCard.module.css',
];
const hashes = () => Promise.all(sourceFiles.map(async file => ({ file, sha256: crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex') })));
const report = { complete: false, startedAt: new Date().toISOString(), source: await hashes(), cases: [], blockedDomainWrites: 0,
  method: 'Chrome headless, ajustes reales del producto activados por teclado; Range por carácter/palabra, geometría de encabezados y controles. API local: autenticación propia y lecturas, sin confirmar datos clínicos.',
  limitations: ['Escala del producto; no es zoom nativo ni prueba con lector de pantalla.', 'La medición de ancho natural utiliza Canvas y el estilo calculado; se conserva revisión visual.', 'El objetivo44px es una decisión de comodidad de este proyecto; no se presenta como requisito AA WCAG2.1.'] };
await fs.writeFile(path.join(out, 'audit.json'), JSON.stringify(report, null, 2));
const assert = (ok, message) => { if (!ok) throw Error(message); };
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browserVersion = browser.version();

async function metrics(scope) {
  return scope.evaluate(element => {
    const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const canvas = document.createElement('canvas').getContext('2d');
    const available = Math.max(0, element.clientWidth - 32);
    function text(node) {
      const cs = getComputedStyle(node), r = rect(node), words = [], lines = [];
      canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const letterSpacing = parseFloat(cs.letterSpacing) || 0;
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const current = walker.currentNode, parent = current.parentElement;
        if (!parent || parent.closest('.sr-only,[aria-hidden="true"],[hidden]') || !parent.getClientRects().length) continue;
        const content = current.textContent || '';
        for (const match of content.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu)) {
          const rows = [];
          for (let i = match.index; i < match.index + match[0].length; i++) {
            const range = document.createRange(); range.setStart(current, i); range.setEnd(current, i + 1);
            const box = range.getBoundingClientRect(); if (!box.width || !box.height) continue;
            let row = rows.find(value => Math.abs(value.top - box.top) < 2);
            if (!row) { row = { top: box.top, bottom: box.bottom, text: '' }; rows.push(row); }
            row.text += content[i]; row.bottom = Math.max(row.bottom, box.bottom);
            if (!lines.some(value => Math.abs(value.top - box.top) < 2)) lines.push({ top: box.top, bottom: box.bottom });
          }
          if (!rows.length) continue;
          const naturalWidth = canvas.measureText(match[0]).width + Math.max(0, match[0].length - 1) * letterSpacing;
          words.push({ text: match[0], naturalWidth, rows, broken: rows.length > 1, avoidable: rows.length > 1 && naturalWidth <= available + 3,
            severe: rows.length > 1 && match[0].length >= 5 && Math.max(...rows.map(value => value.text.length)) <= 2 });
        }
      }
      return { text: (node.innerText || node.textContent || '').trim(), ...r, fontSize: cs.fontSize, lineHeight: cs.lineHeight, words, lineCount: lines.length,
        textHeight: lines.length ? Math.max(...lines.map(value => value.bottom)) - Math.min(...lines.map(value => value.top)) : 0 };
    }
    const blocks = [...element.querySelectorAll('h1,h2,h3,button,summary')].filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden').map(node => ({ tag: node.tagName, ...text(node) }));
    const controls = [...element.querySelectorAll('button,summary')].filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden').map(node => {
      const cs = getComputedStyle(node), t = text(node);
      const paddingBorder = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((n, key) => n + (parseFloat(cs[key]) || 0), 0);
      const expectedContent = Math.max(t.textHeight, (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5) * Math.max(1, t.lineCount));
      const excess = t.height - expectedContent - paddingBorder;
      return { ...t, ariaLabel: node.getAttribute('aria-label'), disabled: node.hasAttribute('disabled'), minHeight: cs.minHeight, padding: cs.padding, excess,
        tooSmall: !node.hasAttribute('disabled') && (t.width < 43.5 || t.height < 43.5), forcedOversize: parseFloat(cs.minHeight) > 96 && t.lineCount <= 2 && excess > 24 };
    });
    return { bounds: rect(element), availableWidth: available, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
      documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, blocks, controls,
      focusInside: element.contains(document.activeElement), active: document.activeElement instanceof HTMLElement ? rect(document.activeElement) : null };
  });
}

function validate(data, id, headingRequired = false, scale = '100') {
  assert(data.scrollWidth <= data.clientWidth + 1 && data.documentWidth <= data.viewportWidth + 1, `${id}: overflow horizontal.`);
  const heading = data.blocks.find(block => block.tag === 'H2');
  if (headingRequired) {
    assert(heading, `${id}: falta encabezado.`);
    if (Number(scale) >= 150) assert(heading.width >= data.availableWidth * .6, `${id}: encabezado comprimido a${heading.width}px de${data.availableWidth}px útiles.`);
  }
  const bad = data.blocks.flatMap(block => block.words.filter(word => word.avoidable || word.severe).map(word => ({ block: block.text, word })));
  assert(!bad.length, `${id}: palabras fragmentadas evitables: ${JSON.stringify(bad.slice(0, 5))}`);
  const small = data.controls.filter(control => control.tooSmall);
  assert(!small.length, `${id}: controles menores de44px: ${JSON.stringify(small.map(c => ({ text: c.text, width: c.width, height: c.height })))}`);
  const forced = data.controls.filter(control => control.forcedOversize);
  assert(!forced.length, `${id}: altura mínima desproporcionada: ${JSON.stringify(forced.map(c => ({ text: c.text, height: c.height, minHeight: c.minHeight, excess: c.excess })))}`);
}

async function capture(page, scope, id, state, save = true, headingRequired = false) {
  await settle(page);
  const data = await metrics(scope);
  state.metrics[id] = data;
  validate(data, `${state.id}-${id}`, headingRequired, state.scale);
  if (save) { const file = `${state.id}-${id}.png`; await scope.screenshot({ path: path.join(out, file) }); state.screenshots.push(file); }
}

async function numericWidth(input, value, filename) {
  await input.fill(value);
  const result = await input.evaluate(element => {
    const style = getComputedStyle(element), canvas = document.createElement('canvas').getContext('2d');
    canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const available = element.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    const textWidth = canvas.measureText(element.value).width + Math.max(0, element.value.length - 1) * (parseFloat(style.letterSpacing) || 0);
    return { value: element.value, available, textWidth, fontSize: style.fontSize, fits: textWidth <= available + 1 };
  });
  assert(result.value === value && result.fits, `Número recortado: ${JSON.stringify(result)}`);
  await input.locator('..').screenshot({ path: path.join(out, filename) });
  return { ...result, screenshot: filename, synthetic: true, submitted: false };
}

try {
  const matrix = [320, 390, 1280].flatMap(width => ['100', '125', '150', '200'].map(scale => ({ width, scale, contrast: false })));
  matrix.push(...[320, 1280].flatMap(width => ['100', '200'].map(scale => ({ width, scale, contrast: true }))));
  for (const item of matrix) {
    const { width, scale, contrast } = item;
    const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'es-PE', reducedMotion: 'reduce' });
    await context.addInitScript(contrast => localStorage.setItem('contigo-reading-options', JSON.stringify({ scale: '100', contrast, silent: true, reducedMotion: true })), contrast);
    const page = await context.newPage(); let blocked = 0;
    const state = { id: `${width}-${scale}-${contrast ? 'high' : 'standard'}`, ...item, metrics: {}, screenshots: [] };
    report.cases.push(state);
    await page.route('**/api/v1/**', route => { const request = route.request(), url = new URL(request.url());
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'].includes(url.pathname)) { blocked++; return route.abort('blockedbyclient'); }
      return route.continue();
    });
    try {
      await page.goto('http://127.0.0.1:3001/login');
      await page.getByTestId('login-patient_dacio').click(); await page.getByRole('button', { name: 'Entrada Rápida', exact: true }).click();
      await page.waitForURL('http://127.0.0.1:3001/patient-app'); await page.locator('.measurement-form').waitFor();
      await page.getByRole('button', { name: 'Opciones de lectura', exact: true }).click();
      const reading = page.getByRole('dialog', { name: 'Opciones de lectura', exact: true });
      await reading.getByRole('button', { name: `Texto al ${scale} %`, exact: true }).focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(scale => document.documentElement.style.fontSize === `${scale}%`, scale);
      await capture(page, reading, 'reading', state, true, true);
      assert(state.metrics.reading.focusInside, `${state.id}: foco perdido al cambiar tamaño.`);
      await reading.getByRole('button', { name: 'Listo', exact: true }).focus(); await page.keyboard.press('Enter');
      await reading.waitFor({ state: 'hidden' });
      const surface = page.locator('[data-app-surface]').first();
      await capture(page, surface, 'home', state, ['100', '200'].includes(scale) && !contrast);
      const appointments = page.getByTestId('patient-appointments'); await appointments.scrollIntoViewIfNeeded();
      await capture(page, appointments, 'appointments', state, width === 1280 && ['100', '200'].includes(scale) && !contrast);
      if (width === 320 && scale === '200' && !contrast) {
        const form = page.locator('.measurement-form');
        await form.getByTestId('measurement-weight').click();
        const weight = await numericWidth(form.getByTestId('input-weight'), '1000.0', '320-200-weight-1000.png');
        await form.getByTestId('measurement-pressure').click();
        await form.locator('details summary').click();
        const pulse = await numericWidth(form.getByTestId('input-pulse'), '500', '320-200-pulse-500.png');
        state.numericChecks = { weight, pulse, note: 'Valores extremos sintéticos para comprobar ancho. No se revisaron ni guardaron mediciones.' };
      }
      await page.getByRole('button', { name: 'Comunicarme', exact: true }).focus(); await page.keyboard.press('Enter');
      const board = page.getByRole('dialog', { name: 'Comunicarme por escrito', exact: true });
      await capture(page, board, 'communication', state, true, true);
      await board.getByRole('button', { name: 'Prefiero comunicarme por escrito', exact: true }).click();
      await board.getByRole('button', { name: 'Mostrar mensaje grande', exact: true }).focus(); await page.keyboard.press('Enter');
      await board.getByRole('heading', { name: 'Mi mensaje', exact: true }).waitFor();
      await capture(page, board, 'message', state, ['100', '200'].includes(scale), true);
      await page.keyboard.press('Escape'); await board.waitFor({ state: 'hidden' });
      assert(await page.getByRole('button', { name: 'Comunicarme', exact: true }).evaluate(element => element === document.activeElement), `${state.id}: retorno de foco incorrecto.`);
      assert(blocked === 0, `${state.id}: se intentó escritura de dominio.`);
      state.complete = true; console.log(`${state.id}: palabras, encabezados y controles aprobados.`);
    } finally {
      state.blockedDomainWrites = blocked; report.blockedDomainWrites += blocked;
      for (const dialog of await page.locator('dialog[open]').all()) await dialog.evaluate(element => element.close());
      const logout = page.getByRole('button', { name: 'Cerrar sesión', exact: true }); if (await logout.count()) await logout.click();
      await context.close();
    }
  }
  assert(JSON.stringify(await hashes()) === JSON.stringify(report.source), 'Las fuentes cambiaron durante la verificación.');
  report.complete = true;
} catch (error) { report.error = error.message; console.error(error); process.exitCode = 1; }
finally {
  await browser.close(); report.finishedAt = new Date().toISOString();
  report.summary = { cases: report.cases.length, completedCases: report.cases.filter(c => c.complete).length, states: report.cases.reduce((n, c) => n + Object.keys(c.metrics).length, 0), blockedDomainWrites: report.blockedDomainWrites };
  await fs.writeFile(path.join(out, 'audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ complete: report.complete, summary: report.summary, error: report.error }));
}
