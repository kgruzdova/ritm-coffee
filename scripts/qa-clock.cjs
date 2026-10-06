const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');

async function run() {
  await fs.mkdir('artifacts', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const issues = [];
  const results = [];
  try {
    for (const [width, height] of [[1440, 900], [1440, 700], [834, 1112], [768, 600], [390, 844], [320, 700]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      page.on('pageerror', (e) => issues.push(e.message));
      page.on('console', (m) => { if (['warning', 'error'].includes(m.type())) issues.push(m.text()); });
      await page.goto(process.env.QA_URL || 'http://127.0.0.1:4173', { waitUntil: 'networkidle' });
      await page.locator('.preloader').waitFor({ state: 'detached' });
      await page.waitForTimeout(1600);
      const range = await page.locator('.clock-section').evaluate((section) => {
        const rect = section.getBoundingClientRect();
        const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
        return { pinned: section.parentElement.classList.contains('pin-spacer'), start: rect.top + scrollY - innerHeight, distance: innerHeight + rect.height, anchor: rect.top + scrollY - header, header };
      });
      assert.equal(range.pinned, false, `${width}: section must scroll without pinning`);
      const snapshots = [];
      for (const progress of [0, 0.5, 1]) {
        await page.evaluate((y) => window.scrollTo(0, y), range.start + range.distance * progress);
        await page.waitForTimeout(1600);
        const state = await page.locator('.clock-section').evaluate((section) => {
          const face = section.querySelector('.clock-face-layer');
          const rect = face.getBoundingClientRect();
          const cup = new DOMMatrixReadOnly(getComputedStyle(section.querySelector('.clock-cup-layer')).transform);
          return { sectionTop: section.getBoundingClientRect().top, faceTransform: getComputedStyle(face).transform, face: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }, angle: Math.atan2(cup.m12, cup.m11) * 180 / Math.PI };
        });
        assert.equal(state.faceTransform, 'none', `${width}: dial is upright and unanimated`);
        assert.ok(Math.abs(state.sectionTop - (height - range.distance * progress)) < 2, `${width}: section moves naturally with scroll`);
        snapshots.push(state);
      }
      assert.ok(Math.abs(snapshots[0].angle) < 0.1 && Math.abs(snapshots[1].angle - 12.5) < 0.2 && Math.abs(snapshots[2].angle - 25) < 0.2, `${width}: cup tilts from 0 to +25 degrees: ${snapshots.map(s => s.angle)}`);
      assert.ok(Math.abs((snapshots[0].face.top - snapshots[0].sectionTop) - (snapshots[2].face.top - snapshots[2].sectionTop)) < 1, `${width}: dial has no independent movement`);
      await page.evaluate(y => window.scrollTo(0, y), range.anchor);
      await page.waitForTimeout(1600);
      const face = await page.locator('.clock-face-layer').boundingBox();
      assert.ok(face.x >= -1 && face.x + face.width <= width + 1 && face.y >= range.header && face.y + face.height <= height + 1, `${width}: full dial fits in viewport`);
      await page.screenshot({ path: `artifacts/clock-upright-${width}-${height}.png` });
      await page.getByRole('tab', { name: /НИКИТСКАЯ/ }).click();
      assert.match(await page.locator('.venue-panel').textContent(), /Большая Никитская/);
      await page.evaluate(() => {
        const story = document.getElementById('story');
        window.scrollTo(0, story.getBoundingClientRect().top + scrollY);
      });
      await page.waitForTimeout(1200);
      if (width <= 700) {
        await page.getByRole('button', { name: 'Открыть меню' }).click();
        await page.locator('.mobile-navigation').getByRole('link', { name: /АДРЕСА/ }).click();
      } else await page.locator('.nav-links').getByRole('link', { name: 'АДРЕСА', exact: true }).click();
      await page.waitForTimeout(1700);
      const anchoredY = await page.evaluate(() => scrollY);
      assert.ok(Math.abs(anchoredY - range.anchor) < 3, `${width}: anchor returns to section below header, actual ${anchoredY}, expected ${range.anchor}`);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(400);
      assert.equal(await page.locator('.pin-spacer').count(), 0, `${width}: no pin spacers`);
      assert.equal(await page.locator('.clock-face-layer').evaluate((el) => getComputedStyle(el).transform), 'none');
      assert.equal(await page.locator('.clock-cup-layer').evaluate((el) => getComputedStyle(el).transform), 'none');
      results.push({ width, height, range, angles: snapshots.map((state) => state.angle), fullDialVisible: true, staticDial: true, anchorWorks: true });
      await page.close();
      console.log(`PASS ${width}×${height}: full upright dial, normal scroll, 0 to +25 degree cup tilt, address navigation, reduced motion cleanup.`);
    }
    assert.deepEqual(issues, []);
    await fs.writeFile('artifacts/clock-upright-results.json', JSON.stringify({ passed: true, results, issues }, null, 2));
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
