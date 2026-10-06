const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');

const near = (actual, expected, message, tolerance = 0.08) => assert.ok(Math.abs(actual - expected) < tolerance, `${message}: ${actual} vs ${expected}`);

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const issues = [], results = [];
  try {
    await fs.mkdir('artifacts', { recursive: true });
    for (const [width, height, touch] of [[1440,900,false],[834,1112,false],[390,844,true]]) {
      const page = await browser.newPage({ viewport: { width, height }, isMobile: touch, hasTouch: touch });
      page.on('pageerror', e => issues.push(e.message));
      page.on('console', m => { if (['error','warning'].includes(m.type())) issues.push(m.text()); });
      await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173', { waitUntil: 'networkidle' });
      await page.locator('.preloader').waitFor({ state: 'detached' });
      await page.waitForTimeout(1500);
      await page.evaluate(() => scrollTo(0, document.querySelector('.product-grid').getBoundingClientRect().top + scrollY - 180));
      await page.waitForTimeout(1000);
      const frames = page.locator('.product-card-reveal');
      assert.equal(await frames.count(), 8);
      const geometry = () => frames.evaluateAll(elements => elements.map(el => {
        const r = el.getBoundingClientRect();
        return { x:r.x,y:r.y+scrollY,width:r.width,height:r.height,transform:getComputedStyle(el).transform };
      }));
      const baseline = await geometry();
      const sample = index => frames.nth(index).evaluate(el => {
        const surface=el.querySelector('.product-card'), image=el.querySelector('.product-image-parallax');
        const m=new DOMMatrixReadOnly(getComputedStyle(surface).transform), p=new DOMMatrixReadOnly(getComputedStyle(image).transform);
        return { rx:Math.atan2(m.m23,m.m22)*180/Math.PI,ry:Math.atan2(-m.m13,m.m11)*180/Math.PI,
          x:p.m41,y:p.m42,surfaceX:m.m41,surfaceY:m.m42,scaleX:Math.hypot(m.m11,m.m12,m.m13),scaleY:Math.hypot(m.m21,m.m22,m.m23) };
      });
      const flat = state => ['rx','ry','x','y','surfaceX','surfaceY'].forEach(key => near(state[key],0,key));
      const move = async (index,nx,ny) => {
        const r=await frames.nth(index).boundingBox();
        await page.mouse.move(r.x+r.width*(nx+1)/2,r.y+r.height*(ny+1)/2);
        await page.waitForTimeout(450);
      };
      if (!touch) {
        for(let i=0;i<4;i++) {
          await move(i,0,0);
          flat(await sample(i));
          await move(i,.9,-.9);
          const state=await sample(i);
          near(state.rx,2.7,'upper-edge rotationX'); near(state.ry,3.6,'right-edge rotationY');
          near(state.x,4.5,'image x'); near(state.y,-3.6,'image y');
          near(state.surfaceX,0,'no card translation x'); near(state.surfaceY,0,'no card translation y');
          near(state.scaleX,1,'scaleX'); near(state.scaleY,1,'scaleY');
          for(let j=0;j<4;j++) if(j!==i) flat(await sample(j));
          await move(i,-.9,.9);
          const opposite=await sample(i);
          near(opposite.rx,-2.7,'lower-edge rotationX'); near(opposite.ry,-3.6,'left-edge rotationY');
          near(opposite.x,-4.5,'image reverse x'); near(opposite.y,3.6,'image reverse y');
          await page.mouse.move(5,150);
          await page.waitForTimeout(80);
          assert.ok(Math.abs((await sample(i)).ry)>.3,'Return should be smooth rather than immediate');
          await page.waitForTimeout(450);
          flat(await sample(i));
        }
        // A stationary pointer must continue to use the stationary frame during scroll.
        await move(0,.65,0);
        const before=await frames.first().boundingBox();
        const pointer={ x:before.x+before.width*.825,y:before.y+before.height*.5 };
        await page.mouse.wheel(0,55);
        await page.waitForTimeout(1700);
        const after=await frames.first().boundingBox();
        const ny=(pointer.y-after.y)/after.height*2-1;
        const scrolled=await sample(0);
        near(scrolled.rx,-ny*3,'scroll-relative cursor tilt'); near(scrolled.y,ny*4,'scroll-relative image');
        near(scrolled.ry,2.6,'horizontal tilt unchanged');
        await page.waitForTimeout(500);
        const stopped=await sample(0);
        near(stopped.rx,scrolled.rx,'no jitter after stopping');
        const current=await geometry();
        current.forEach((r,i) => {
          for(const key of ['x','y','width','height']) near(r[key],baseline[i][key],`stationary frame ${i} ${key}`,0.1);
          assert.equal(r.transform,'none');
        });
        await page.screenshot({path:`artifacts/products-hover-${width}.png`});
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.waitForTimeout(450);
        for(let i=0;i<4;i++) flat(await sample(i));
        await move(1,.9,-.9);
        flat(await sample(1));
        await page.emulateMedia({reducedMotion:'no-preference'});
        await page.waitForTimeout(450);
        await move(1,-.8,-.8);
        near((await sample(1)).ry,-3.2,'reactivate after reduced motion');
        await page.mouse.move(5,150);
        await page.waitForTimeout(500);
        // Keep the existing add-to-list behavior working inside the tilted surface.
        await page.locator('.product-image-button').first().click();
        await page.getByRole('dialog').waitFor({state:'visible'});
      } else {
        assert.equal(await page.evaluate(()=>matchMedia('(hover: hover) and (pointer: fine)').matches),false);
        await move(0,.8,-.8);
        for(let i=0;i<4;i++) flat(await sample(i));
        await page.screenshot({path:`artifacts/products-touch-${width}.png`});
      }
      results.push({width,height,touch,passed:true});
      await page.close();
    }
    assert.deepEqual(issues,[]);
    await fs.writeFile('artifacts/products-results.json',JSON.stringify({results,issues},null,2));
    console.log('PASS: independent card tilt, image parallax, smooth return, stable grid during scroll, reduced motion, touch and product selection.');
  } finally { await browser.close(); }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
