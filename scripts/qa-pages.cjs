const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const url = process.env.QA_URL || 'http://127.0.0.1:4183/ritm-coffee/';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const issues = [], results = [];
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
      page.on('pageerror', e => issues.push(e.message));
      page.on('console', m => { if (['warning', 'error'].includes(m.type())) issues.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400) issues.push(`${r.status()}: ${r.url()}`); });
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await page.locator('.preloader').waitFor({ state: 'detached' });
      assert.equal(await page.title(), 'РИТМ — кофе в твоём ритме');
      await page.locator('.hero-cup-intro img').evaluate(img => img.decode());
      assert.ok(await page.evaluate(() => document.fonts.check('600 20px "Golos Text"') && document.fonts.check('500 20px Caveat')));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      for (const image of await page.locator('.product-grid img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(img => img.decode());
      }
      await page.locator('.product-card--macarons button').click();
      await page.getByRole('dialog').waitFor({ state: 'visible' });
      assert.equal(await page.locator('.order-total strong').textContent(), '120 ₽');
      const downloadPromise = page.waitForEvent('download');
      await page.locator('.order-save').click();
      const download = await downloadPromise;
      assert.equal(download.suggestedFilename(), 'ritm-my-coffee.txt');
      await page.keyboard.press('Escape');
      await page.locator('#coffee-guide').scrollIntoViewIfNeeded();
      await page.getByRole('tab', { name: 'Американо', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#coffee-tab-americano').getAttribute('aria-selected') === 'true');
      await page.locator('.coffee-guide-photo.is-active img').evaluate(img => img.decode());
      await page.locator('#story').scrollIntoViewIfNeeded();
      await page.locator('.promo-cup img').evaluate(img => img.decode());
      await page.locator('.lifestyle-stage').scrollIntoViewIfNeeded();
      await page.locator('.lifestyle-image img').evaluate(img => img.decode());
      const pictures = await page.locator('img').evaluateAll(images => images.map(img => img.currentSrc).filter(Boolean));
      assert.ok(pictures.every(src => src.startsWith(new URL(url).origin + new URL(url).pathname + 'assets/')));
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `artifacts/pages-${width}.png` });
      results.push({ width, passed: true, loadedPictures: pictures.length });
      await page.close();
    }
    assert.deepEqual(issues, []);
    await fs.writeFile('artifacts/pages-results.json', JSON.stringify({ url, results, issues }, null, 2));
    console.log(JSON.stringify({ url, results, issues }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
