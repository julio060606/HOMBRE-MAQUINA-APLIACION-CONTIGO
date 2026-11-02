import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const output = path.resolve(import.meta.dirname, '../../output/apf3/evidence/after');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, locale: 'es-PE' });
  await page.goto('http://127.0.0.1:3001/accessibility');
  await page.waitForLoadState('networkidle');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const screenshot = 'output/apf3/evidence/after/48-accessibility-updated.png';
  await page.screenshot({ path: path.join(output, '48-accessibility-updated.png'), fullPage: true });
  const axe = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  const declaration = await page.locator('main').innerText();
  if (!declaration.includes('parcialmente conforme') || !declaration.includes('lectura completa de sus valores sigue pendiente')) throw Error('La declaración perdió su alcance o limitaciones');
  const report = { timestamp: new Date().toISOString(), url: page.url(), browser: browser.version(),
    method: 'Captura real y prueba axe de la declaración actualizada después de incorporar evidencia técnica NVDA y zoom',
    screenshot, declaration, axe };
  await fs.writeFile(path.join(output, 'statement-update.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ violations: axe.violations.length, incomplete: axe.incomplete.length, screenshot }));
  if (axe.violations.length) process.exitCode = 1;
} finally { await browser.close(); }
