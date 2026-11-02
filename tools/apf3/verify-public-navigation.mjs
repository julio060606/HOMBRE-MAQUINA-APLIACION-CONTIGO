import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const output = path.resolve(import.meta.dirname, '../../output/design-public', process.argv[2] || 'after');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
function assert(condition, message) { if (!condition) throw new Error(message); }
try {
  for (const [name, route] of [['clinic', '/clinic'], ['landing', '/landing#hero']]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => { errors.push(`Unexpected dialog: ${dialog.message()}`); await dialog.dismiss(); });
    await page.goto('http://127.0.0.1:3001' + route);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    assert(await page.locator('main h1').count() === 1, `${name}: exactly one main heading`);
    const menu = page.locator('header button[aria-expanded][aria-controls]').first();
    assert(await menu.isVisible(), `${name}: mobile menu visible`);
    const navId = await menu.getAttribute('aria-controls');
    const nav = page.locator(`[id="${navId}"]`);
    assert(await menu.getAttribute('aria-expanded') === 'false', `${name}: menu starts closed`);
    await menu.click();
    assert(await menu.getAttribute('aria-expanded') === 'true' && await nav.isVisible(), `${name}: menu opens`);
    await page.keyboard.press('Escape');
    assert(await menu.getAttribute('aria-expanded') === 'false', `${name}: Escape closes menu`);
    assert(await menu.evaluate(el => el === document.activeElement), `${name}: focus returns to menu button`);
    await menu.click();
    await nav.locator('a[href^="#"]').first().click();
    assert(await menu.getAttribute('aria-expanded') === 'false', `${name}: link closes menu`);
    const brokenAnchors = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(el => el.getAttribute('href')).filter(href => href.length < 2 || !document.getElementById(decodeURIComponent(href.slice(1)))));
    assert(!brokenAnchors.length, `${name}: broken anchors ${brokenAnchors.join(',')}`);
    if (name === 'clinic') {
      const accordion = page.locator('main button[aria-controls][aria-expanded]');
      assert(await accordion.count() === 6, 'clinic: six specialties');
      const search = page.getByRole('searchbox');
      assert(await search.count() === 1, 'clinic: specialty search available');
      await search.fill('cardiologia');
      assert(await accordion.count() === 1 && (await accordion.first().innerText()).includes('Cardiología'), 'clinic: search matches without accents');
      await search.fill('PEDIATRÍA');
      assert(await accordion.count() === 1 && (await accordion.first().innerText()).includes('Pediatría'), 'clinic: search ignores case');
      await search.fill('zzzzzzzz');
      assert(await accordion.count() === 0, 'clinic: empty search results');
      await page.getByRole('button', { name: /limpiar|borrar/i }).first().click();
      assert(await search.inputValue() === '' && await accordion.count() === 6, 'clinic: clearing search restores specialties');
      for (const button of await accordion.all()) {
        if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
        const id = await button.getAttribute('aria-controls');
        assert(await page.locator(`[id="${id}"]`).isVisible(), `clinic: specialty ${id} opens`);
        await button.click();
        assert(!await page.locator(`[id="${id}"]`).isVisible(), `clinic: specialty ${id} closes`);
      }
      for (const faq of await page.locator('main details').all()) {
        await faq.locator('summary').click();
        assert(await faq.getAttribute('open') !== null, 'clinic: patient question opens');
        await faq.locator('summary').click();
        assert(await faq.getAttribute('open') === null, 'clinic: patient question closes');
      }
    }
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const axe = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    const reflow = [];
    const options = page.locator('.reading-options details');
    await options.locator('summary').click();
    await options.locator('select').selectOption('200');
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const geometry = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, scale: getComputedStyle(document.documentElement).fontSize,
        offenders: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 2).slice(0, 12).map(el => ({ tag:el.tagName, text:el.textContent.slice(0, 100), parent:el.parentElement.className, class: typeof el.className === 'string' ? el.className : el.tagName, width: el.getBoundingClientRect().width, left: el.getBoundingClientRect().left })) }));
      if (geometry.documentWidth > geometry.width) { console.log(JSON.stringify({ name, geometry })); await page.screenshot({ path: path.join(output, `${name}-overflow.png`) }); }
      assert(geometry.documentWidth <= geometry.width, `${name}: 200% overflow at ${width}: ${geometry.documentWidth}`);
      reflow.push(geometry);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, `${name}-reading-200.png`), fullPage: false });
    await options.locator('select').selectOption('100');
    await options.locator('input[type="checkbox"]').check();
    const contrastAxe = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, `${name}-high-contrast.png`), fullPage: false });
    await options.locator('input[type="checkbox"]').uncheck();
    await options.locator('summary').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    let crossRoute;
    if (name === 'clinic') {
      await page.locator('main a[href="/landing#hero"]').first().click();
      await page.locator('#hero').waitFor({ state: 'attached' });
      await page.evaluate(() => document.fonts.ready);
      crossRoute = await page.locator('#hero').evaluate(el => ({ hash: location.hash, top: el.getBoundingClientRect().top }));
      assert(crossRoute.hash === '#hero' && crossRoute.top >= 0 && crossRoute.top <= 200, 'clinic: cross-route section opens in view');
      await page.goto('http://127.0.0.1:3001/clinic');
      await page.locator('#clinic-title').waitFor({ state: 'visible' });
    }
    const login = page.locator('main a[href="/login"]').first();
    await login.click();
    await page.waitForURL('**/login');
    await page.locator('form').first().waitFor({ state: 'visible' });
    assert(await page.locator('form').count() > 0, `${name}: login loads`);
    assert(!errors.length, `${name}: errors ${errors.join('; ')}`);
    report.push({ name, mobileMenu: 'open, Escape, focus return, close on link passed', brokenAnchors, specialtySearch: name === 'clinic' ? 'accent, case, no results and clear passed' : undefined, accordion: name === 'clinic' ? 'six specialties and four patient questions open/close passed' : undefined, crossRoute, login: 'passed', reflow, axeViolations: axe.violations, highContrastViolations: contrastAxe.violations, errors });
    await context.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(path.join(output, 'navigation-review.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report.map(({ name, axeViolations, highContrastViolations, reflow, errors }) => ({ name, axeViolations: axeViolations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), highContrastViolations: highContrastViolations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), reflow, errors })), null, 2));
