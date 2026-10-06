// Run against the development server to inspect actual ScrollTrigger instances.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const issues = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (e) => issues.push(e.message));
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) issues.push(m.text()); });
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Number(document.querySelector('.preloader-count')?.textContent) >= 50);
    await page.screenshot({ path: 'artifacts/preloader-half.png' });
    const origin = await page.locator('.preloader-liquid').getAttribute('data-svg-origin');
    const [originX, originY] = origin.split(' ').map(Number);
    assert.ok(Math.abs(originX - 76) < 0.1 && Math.abs(originY - 205) < 0.1, 'Liquid must grow from the bottom of the cup');
    const liquidPosition = await page.locator('.preloader-liquid').evaluate((rect) => {
      const bounds = rect.getBoundingClientRect();
      const svgBounds = rect.ownerSVGElement.getBoundingClientRect();
      return { actualBottom: bounds.bottom, expectedBottom: svgBounds.top + svgBounds.height * 205 / 220, height: bounds.height };
    });
    assert.ok(Math.abs(liquidPosition.actualBottom - liquidPosition.expectedBottom) < 2 && liquidPosition.height > 30, 'Coffee fill must actually be visible at the bottom');
    await page.locator('.preloader').waitFor({ state: 'detached' });
    await page.waitForTimeout(1700);
    const read = () => page.evaluate(async () => {
      const { ScrollTrigger } = await import('/src/lib/animation.js');
      return { count: ScrollTrigger.getAll().length, ids: ScrollTrigger.getAll().map((t) => t.vars.id).filter(Boolean), lenis: document.documentElement.classList.contains('lenis') };
    });
    const assertActive = (state) => {
      assert.deepEqual(state.ids.sort(), ['clock-parallax', 'dark-parallax', 'hero-parallax']);
      assert.equal(state.lenis, true);
    };
    const baseline = await read();
    assertActive(baseline);
    for (let i = 0; i < 3; i++) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(300);
      const reduced = await read();
      assert.equal(reduced.count, 0, 'All animation contexts must be reverted on reduced motion');
      assert.equal(reduced.lenis, false, 'Lenis must be destroyed');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForTimeout(1700);
      const active = await read();
      assertActive(active);
      assert.equal(active.count, baseline.count, 'No accumulation of ScrollTriggers');
    }
    for (const width of [390, 834, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(700);
      assertActive(await read());
      assert.equal(await page.locator('.hero-cup-intro').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42), 0, 'Resize must not replay entrance animation');
    }
    assert.deepEqual(issues, []);
    await fs.writeFile('artifacts/lifecycle-results.json', JSON.stringify({ passed: true, baseline, preferenceCycles: 3, testedWidths: [390, 834, 1440], issues }, null, 2));
    console.log('PASS: bottom-origin fill, reduced-motion cleanup, no duplicate ScrollTriggers, resize without entrance replay.');
  } finally { await browser.close(); }
}
run().catch((e) => { console.error(e); process.exitCode = 1; });
