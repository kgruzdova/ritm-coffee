const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');

async function run() {
  await fs.mkdir('artifacts', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const issues = [];
  const results = [];
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', (e) => issues.push(e.message));
      page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) issues.push(m.text()); });
      await page.goto(process.env.QA_URL || 'http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
      await page.locator('.preloader').waitFor({ state: 'detached' });
      // Sample real rendered frames across initial display, every transition,
      // and the repeat boundary. Checking only settled labels misses blank frames.
      const sample = await page.evaluate(() => new Promise((resolve) => {
        const slides = Array.from(document.querySelectorAll('.drink-slide'));
        const panel = document.querySelector('.hero-sticker');
        const start = performance.now();
        const labels = [];
        let blankFrames = 0;
        let minimumOpacity = 1;
        let frames = 0;
        let firstShownAt = null;
        let firstLatteEndedAt = null;
        const frame = (now) => {
          const elapsed = now - start;
          const parentOpacity = Number(getComputedStyle(panel).opacity);
          const states = slides.map((slide) => ({
            name: slide.querySelector('strong').textContent,
            opacity: getComputedStyle(slide).visibility === 'hidden' ? 0 : Number(getComputedStyle(slide).opacity),
            y: new DOMMatrixReadOnly(getComputedStyle(slide).transform).m42,
          }));
          if (parentOpacity > 0.99) {
            frames++;
            const total = states.reduce((sum, state) => sum + state.opacity, 0);
            minimumOpacity = Math.min(minimumOpacity, total);
            if (total < 0.95 || !states.some((state) => state.opacity > 0.01 && Math.abs(state.y) < 1)) blankFrames++;
            const settled = states.find((state) => state.opacity > 0.995);
            if (settled && labels.at(-1)?.name !== settled.name) labels.push({ name: settled.name, at: elapsed });
            if (firstShownAt === null && states[0].opacity > 0.995) firstShownAt = elapsed;
            if (firstShownAt !== null && firstLatteEndedAt === null && states[0].opacity < 0.995) firstLatteEndedAt = elapsed;
          }
          if (elapsed < 27000) requestAnimationFrame(frame);
          else resolve({ frames, blankFrames, minimumOpacity, labels, firstFullHoldMs: firstLatteEndedAt - firstShownAt });
        };
        requestAnimationFrame(frame);
      }));
      assert.equal(sample.blankFrames, 0, `${width}: no empty caption at any rendered frame`);
      assert.ok(sample.firstFullHoldMs >= 6500, `${width}: initial latte must stay fully readable about 7s, got ${sample.firstFullHoldMs}`);
      assert.deepEqual(sample.labels.map((label) => label.name).slice(0, 4), ['АВТОРСКИЙ ЛАТТЕ', 'ЭСПРЕССО', 'КАПУЧИНО', 'АВТОРСКИЙ ЛАТТЕ']);
      assert.equal(await page.getByText('ДОМАШНИЙ ЛАТТЕ', { exact: true }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `artifacts/drink-ticker-${width}.png` });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(100);
      const reduced = await page.locator('.drink-slide').evaluateAll((slides) => slides.filter((slide) => getComputedStyle(slide).visibility === 'visible' && Number(getComputedStyle(slide).opacity) > 0.99).map((slide) => slide.querySelector('strong').textContent));
      assert.deepEqual(reduced, ['АВТОРСКИЙ ЛАТТЕ']);
      results.push({ width, ...sample, reduced });
      await page.close();
      console.log(`PASS ${width}px: ${sample.frames} frames, zero empty frames, first latte ${Math.round(sample.firstFullHoldMs)}ms, complete drink cycle.`);
    }
    assert.deepEqual(issues, []);
    await fs.writeFile('artifacts/drink-ticker-results.json', JSON.stringify({ passed: true, results, issues }, null, 2));
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
