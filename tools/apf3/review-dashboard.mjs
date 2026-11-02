import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const phase = process.argv[2] || 'after';
const out = path.resolve(import.meta.dirname, '../../output/design-dashboard', phase);
await fs.mkdir(out, { recursive: true });
const report = { at: new Date().toISOString(), phase, screens: [], errors: [] };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', locale: 'es-PE' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto('http://127.0.0.1:3001/login');
  await page.locator('input[type="email"]').fill('cuidador@contigo.example');
  await page.locator('input[type="password"]').fill('Contigo2026!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
  await page.getByTestId('select-patient-active').selectOption('pat_001');
  await page.getByRole('heading', { level: 1, name: /Dacio Ramos/ }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (const [label, width, height] of [['desktop', 1440, 1000], ['tablet', 1024, 1000], ['mobile', 390, 844], ['narrow', 320, 844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(out, `dashboard-${label}.png`), fullPage: label === 'desktop' });
    report.screens.push({ label, geometry: await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth,
      offending: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 2).slice(0, 10).map(el => ({ tag: el.tagName, class: typeof el.className === 'string' ? el.className : '', text: el.textContent.slice(0, 60) })) })) });
  }
  if (phase !== 'before') {
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const axe = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
      report.screens.push({ label: `axe-${width}`, violations: axe.violations });
    }
  }
  await context.close();
} finally {
  await browser.close();
  await fs.writeFile(path.join(out, 'review.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ phase, overflows: report.screens.filter(s => s.geometry?.documentWidth > s.geometry?.width), axe: report.screens.filter(s => s.violations).map(s => ({ label: s.label, violations: s.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })) })), errors: report.errors }));
