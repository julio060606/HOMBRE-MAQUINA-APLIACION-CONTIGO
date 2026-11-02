import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const phase = process.argv[2] || 'after';
const out = path.resolve(import.meta.dirname, '../../output/design-public', phase);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { timestamp: new Date().toISOString(), phase, screens: [], errors: [] };
try {
  for (const [name, route] of [['clinic', '/clinic'], ['landing', '/landing#hero']]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', locale: 'es-PE' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto('http://127.0.0.1:3001' + route);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    for (const [label, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844], ['narrow', 320, 844]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      const file = `${name}-${label}.png`;
      await page.screenshot({ path: path.join(out, file), fullPage: false });
      const geometry = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth,
        headings: [...document.querySelectorAll('h1,h2')].map(el => el.textContent.trim()),
        images: [...document.querySelectorAll('img')].filter(el => el.complete && !el.naturalWidth).map(el => el.src),
        offending: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 2).slice(0, 10).map(el => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 90), class: el.className })) }));
      report.screens.push({ name, label, file, geometry });
    }
    if (phase !== 'before') {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({ path: path.join(out, `${name}-full.png`), fullPage: true });
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      report.screens.push({ name, label: 'axe-desktop', axe: await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })) });
    }
    await context.close();
  }
} finally { await browser.close(); await fs.writeFile(path.join(out, 'review.json'), JSON.stringify(report, null, 2)); }
console.log(JSON.stringify({ phase, screenshots: report.screens.filter(s => s.file).length,
  overflows: report.screens.filter(s => s.geometry?.documentWidth > s.geometry?.width).map(s => `${s.name}-${s.label}`), errors: report.errors }));
