const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');

async function run() {
  await fs.mkdir('artifacts', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const issues = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', (error) => issues.push(error.message));
    page.on('console', (msg) => { if (['warning', 'error'].includes(msg.type())) issues.push(msg.text()); });
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await page.locator('.preloader').waitFor({ state: 'detached' });
    await page.waitForTimeout(1600);
    const matrices = () => page.locator('.hero-pointer-layer').evaluateAll((elements) => elements.map((el) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return { x: matrix.m41, y: matrix.m42 };
    }));
    await page.mouse.move(1360, 610);
    await page.waitForTimeout(1200);
    const moved = await matrices();
    assert.ok(moved[0].x < -4 && moved[1].x > 8, 'Receipt and cup must move gently in opposite directions');
    await page.evaluate(() => window.scrollTo(0, 180));
    await page.waitForTimeout(1200);
    const preserved = await matrices();
    assert.ok(preserved[1].x > 8, 'Scroll transforms must not overwrite pointer transforms');
    await page.mouse.move(100, 300);
    await page.waitForTimeout(1400);
    const neutral = await matrices();
    assert.ok(neutral.every((p) => Math.abs(p.x) < 0.1 && Math.abs(p.y) < 0.1), 'Objects return to rest outside the composition');
    await page.evaluate(() => window.scrollTo(0, 0));
    const waitForDrink = (name) => page.waitForFunction((expected) => Array.from(document.querySelectorAll('.drink-slide')).some((slide) => getComputedStyle(slide).visibility === 'visible' && Number(getComputedStyle(slide).opacity) > 0.99 && slide.querySelector('strong').textContent === expected), name, { timeout: 15000 });
    for (const name of ['АВТОРСКИЙ ЛАТТЕ', 'ЭСПРЕССО', 'КАПУЧИНО', 'АВТОРСКИЙ ЛАТТЕ']) await waitForDrink(name);
    const header = await page.locator('.navigation').evaluate((el) => ({ background: getComputedStyle(el).backgroundImage, blur: getComputedStyle(el).backdropFilter, blend: getComputedStyle(el).mixBlendMode }));
    assert.ok(header.background.includes('linear-gradient'), 'Tinted glass header');
    assert.ok(header.blur.includes('blur(24px)'), 'Background is frosted');
    assert.equal(header.blend, 'normal');
    await page.screenshot({ path: 'artifacts/hero-interaction-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    assert.ok((await matrices()).every((p) => p.x === 0 && p.y === 0), 'Pointer effect disabled on mobile');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: 'artifacts/hero-interaction-mobile.png' });
    await page.getByRole('button', { name: 'Открыть меню' }).click();
    await page.locator('.mobile-navigation').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('.mobile-navigation').waitFor({ state: 'detached' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);
    await waitForDrink('АВТОРСКИЙ ЛАТТЕ');
    await page.waitForTimeout(4300);
    await waitForDrink('АВТОРСКИЙ ЛАТТЕ');
    assert.equal(await page.locator('html').evaluate((el) => el.classList.contains('lenis')), false);
    assert.deepEqual(issues, []);
    await fs.writeFile('artifacts/hero-interaction-results.json', JSON.stringify({ passed: true, moved, neutral, header, issues }, null, 2));
    console.log('PASS: mouse parallax, scroll coexistence, all three drink labels, frosted glass header, mobile menu, reduced motion, no console issues.');
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
