const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const url = process.env.QA_URL || 'http://127.0.0.1:5173';
const pause = (page, ms = 1400) => page.waitForTimeout(ms);

async function run() {
  await fs.mkdir('artifacts', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const issues = [];
  const results = [];
  try {
    for (const [name, width, height, motion] of [['desktop', 1440, 900, 'no-preference'], ['tablet', 834, 1112, 'no-preference'], ['mobile', 390, 844, 'no-preference'], ['small-mobile', 320, 700, 'reduce']]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: motion, deviceScaleFactor: 1, acceptDownloads: true });
      const page = await context.newPage();
      page.on('pageerror', (e) => issues.push(`${name}: ${e.message}`));
      page.on('console', (msg) => { if (['error', 'warning'].includes(msg.type())) issues.push(`${name}: ${msg.type()} ${msg.text()}`); });
      page.on('response', (r) => { if (r.status() >= 400) issues.push(`${name}: HTTP ${r.status()} ${r.url()}`); });
      await page.goto(url, { waitUntil: 'networkidle' });
      if (name === 'desktop') {
        await page.screenshot({ path: 'artifacts/preloader.png' });
      }
      await page.locator('.preloader').waitFor({ state: 'detached', timeout: 12000 });
      await pause(page, 1800);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${name}: horizontal overflow`);
      await page.screenshot({ path: `artifacts/${name}-hero.png` });
      const baseline = await page.locator('.hero-cup-layer').evaluate((el) => getComputedStyle(el).transform);
      await page.mouse.wheel(0, 350);
      await pause(page);
      const moved = await page.locator('.hero-cup-layer').evaluate((el) => getComputedStyle(el).transform);
      assert.equal(baseline === moved, motion === 'reduce', `${name}: parallax motion preference`);
      if (name === 'desktop') await page.screenshot({ path: 'artifacts/hero-scroll.png' });
      await page.locator('#menu').scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, document.getElementById('menu').offsetTop));
      await pause(page, 1900);
      await page.screenshot({ path: `artifacts/${name}-products.png` });
      assert.equal(await page.locator('.product-card').count(), 8);
      const opacity = await page.locator('.product-card').first().evaluate((el) => Number(getComputedStyle(el).opacity));
      assert.equal(opacity, 1, `${name}: cards revealed`);
      // Visit the second carousel page before checking lazy-loaded photography.
      for (const image of await page.locator('.product-grid img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(img => img.decode());
      }
      await page.locator('.product-grid').evaluate(el => { el.scrollLeft = 0; });
      await pause(page, 400);
      const cardButton = page.locator('.product-image-button').first();
      await cardButton.click();
      await page.locator('.order-dialog[open]').waitFor();
      assert.equal(await page.locator('.order-total strong').textContent(), '190 ₽');
      await page.getByRole('button', { name: 'Добавить один эспрессо', exact: true }).click();
      assert.equal(await page.locator('.order-total strong').textContent(), '380 ₽');
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'СОХРАНИТЬ СПИСОК' }).click();
      const download = await downloadPromise;
      await download.saveAs(`artifacts/${name}-order.txt`);
      const content = await fs.readFile(`artifacts/${name}-order.txt`, 'utf8');
      assert.match(content, /380/);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.order-dialog').evaluate((el) => el.open), false);
      await page.evaluate(() => {
        const section = document.getElementById('locations');
        const anchor = section.parentElement.classList.contains('pin-spacer') ? section.parentElement : section;
        const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
        window.scrollTo(0, anchor.getBoundingClientRect().top + scrollY - header);
      });
      await pause(page);
      await page.getByRole('tab', { name: /НИКИТСКАЯ/ }).click();
      assert.match(await page.locator('.venue-panel').textContent(), /Большая Никитская/);
      await page.keyboard.press('ArrowRight');
      assert.match(await page.locator('.venue-panel').textContent(), /Новодмитровская/);
      await page.screenshot({ path: `artifacts/${name}-clock.png` });
      const clockBefore = await page.locator('.clock-face-layer').evaluate((el) => getComputedStyle(el).transform);
      const icedBefore = await page.locator('.clock-cup-layer').evaluate((el) => getComputedStyle(el).transform);
      await page.mouse.wheel(0, 180);
      await pause(page);
      const clockAfter = await page.locator('.clock-face-layer').evaluate((el) => getComputedStyle(el).transform);
      const icedAfter = await page.locator('.clock-cup-layer').evaluate((el) => getComputedStyle(el).transform);
      assert.equal(clockBefore, clockAfter, `${name}: clock dial must remain static`);
      assert.equal(icedBefore === icedAfter, motion === 'reduce', `${name}: iced latte parallax preference`);
      await page.evaluate(() => window.scrollTo(0, document.getElementById('story').offsetTop));
      await pause(page, 2200);
      await page.screenshot({ path: `artifacts/${name}-dark.png` });
      const darkBefore = await page.locator('.promo-cup').evaluate((el) => getComputedStyle(el).transform);
      const spinBefore = await page.locator('.promo-cup-spin').evaluate((el) => getComputedStyle(el).transform);
      await page.evaluate(() => window.scrollTo(0, document.getElementById('story').offsetTop + 820));
      await pause(page, 1900);
      await page.screenshot({ path: `artifacts/${name}-lifestyle.png` });
      const darkAfter = await page.locator('.promo-cup').evaluate((el) => getComputedStyle(el).transform);
      const spinAfter = await page.locator('.promo-cup-spin').evaluate((el) => getComputedStyle(el).transform);
      assert.equal(darkBefore, darkAfter, `${name}: dark cup has no extra translation or scale`);
      assert.equal(spinBefore, spinAfter, `${name}: single-view asset keeps its fixed 9-degree lean`);
      assert.equal(await page.locator('.floating-product').count(), 0, `${name}: floating card removed`);
      assert.equal(await page.locator('html').evaluate((el) => el.classList.contains('lenis')), motion !== 'reduce', `${name}: Lenis motion preference`);
      if (width < 701) {
        await page.getByRole('button', { name: 'Открыть меню' }).click();
        await page.locator('.mobile-navigation').waitFor();
        await page.locator('.mobile-navigation').getByRole('link', { name: /МЕНЮ/ }).click();
        await pause(page, 1900);
        const menuPosition = await page.locator('#menu').evaluate((el) => el.getBoundingClientRect().top);
        assert.ok(Math.abs(menuPosition - 72) < 100, `${name}: mobile anchor position ${menuPosition}`);
      } else {
        await page.locator('.nav-links').getByRole('link', { name: 'МЕНЮ', exact: true }).click();
        await pause(page, 1900);
      }
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await pause(page);
      const broken = await page.locator('img').evaluateAll((images) => images.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src));
      assert.deepEqual(broken, [], `${name}: image loading`);
      await page.screenshot({ path: `artifacts/${name}-full.png`, fullPage: true });
      const fonts = await page.evaluate(() => ({ golos: document.fonts.check('600 20px "Golos Text"'), caveat: document.fonts.check('500 20px Caveat') }));
      assert.ok(fonts.golos && fonts.caveat, `${name}: local fonts loaded`);
      results.push({ name, width, height, motion, parallaxChanges: baseline !== moved, clockChanges: clockBefore !== clockAfter, darkChanges: darkBefore !== darkAfter, fonts, brokenImages: broken.length, horizontalOverflow: overflow });
      await context.close();
    }
    assert.deepEqual(issues, [], 'Browser warnings or errors');
    await fs.writeFile('artifacts/qa-results.json', JSON.stringify({ results, issues }, null, 2));
    console.log(JSON.stringify({ results, issues }, null, 2));
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
