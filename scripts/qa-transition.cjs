const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const issues = [], results = [];
  try {
    await fs.mkdir('artifacts', { recursive: true });
    for (const [width, height] of [[1440,900],[1440,700],[834,1112],[390,844],[320,700]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      page.on('pageerror', e => issues.push(e.message));
      page.on('console', m => { if (['error','warning'].includes(m.type())) issues.push(m.text()); });
      await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173', { waitUntil: 'networkidle' });
      await page.locator('.preloader').waitFor({ state: 'detached' });
      await page.waitForTimeout(1500);
      const range = await page.evaluate(async () => {
        const { ScrollTrigger } = await import('/src/lib/animation.js');
        const root = document.querySelector('#story');
        const trigger = ScrollTrigger.getById('dark-parallax');
        return { top: root.getBoundingClientRect().top + scrollY, height:root.offsetHeight,
          start:trigger.start,end:trigger.end,scrub:trigger.vars.scrub,pin:!!trigger.pin,
          triggerCount:ScrollTrigger.getAll().filter(t=>t.trigger===root || root.contains(t.trigger)).length };
      });
      assert.equal(range.scrub, true);
      assert.equal(range.pin, false);
      assert.equal(range.triggerCount, 1);
      assert.ok(Math.abs(range.start-(range.top-height))<1 && Math.abs(range.end-(range.top+range.height))<1);
      const sample = async offset => {
        await page.evaluate(y=>scrollTo(0,y),range.top+offset);
        await page.waitForTimeout(150);
        return page.evaluate(() => {
          const root=document.querySelector('#story');
          const cup=root.querySelector('.promo-cup');
          const spin=root.querySelector('.promo-cup-spin');
          const rootRect=root.getBoundingClientRect(),rect=cup.getBoundingClientRect();
          const w=rect.width;
          const matrix=new DOMMatrixReadOnly(getComputedStyle(spin).transform);
          return { scrollY,rootTop:rootRect.top,rootBottom:rootRect.bottom,
            localX:rect.x-rootRect.x,localY:rect.y-rootRect.y,canvasWidth:w,
            lidX:rect.x-rootRect.x+w*.5,lidY:rect.y-rootRect.y+w*278/1024,
            visibleWidth:w*860.334193/1024,lean:Math.atan2(matrix.m12,matrix.m11)*180/Math.PI,
            transform:getComputedStyle(cup).transform,spinTransform:getComputedStyle(spin).transform,
            glow:getComputedStyle(root.querySelector('.promo-glow')).transform,
            sectionOverflow:getComputedStyle(root).overflow,
            nextTop:root.nextElementSibling.getBoundingClientRect().top,
            nextSeparate:root.nextElementSibling.matches('.lifestyle-stage'),
            cupImage:cup.querySelector('img').getAttribute('src'),clockImage:document.querySelector('.clock-cup-layer img').getAttribute('src') };
        });
      };
      const states=[];
      for (const [i,offset] of [-height,0,height*.4,height*.7,height*.4,0].entries()) {
        const state=await sample(offset);
        states.push(state);
        assert.equal(state.transform,'none','Cup must have no extra translation or scaling');
        assert.ok(Math.abs(state.lean-9)<0.01);
        assert.ok(Math.abs(state.nextTop-state.rootBottom)<1);
        assert.equal(state.nextSeparate,true);
        assert.equal(state.sectionOverflow,'hidden');
        if(i===1 || i===2 || i===3)await page.screenshot({path:`artifacts/transition-${width}-${height}-${i}.png`});
      }
      const initial=states[0];
      for(const state of states){
        assert.ok(Math.abs(state.localX-initial.localX)<1 && Math.abs(state.localY-initial.localY)<1);
        assert.ok(Math.abs(state.canvasWidth-initial.canvasWidth)<1);
        assert.ok(Math.abs(state.rootTop-(range.top-state.scrollY))<1,'Section, not a pinned cup, provides vertical travel');
      }
      assert.ok(Math.abs(initial.lidX/width-(width<=700?.42:.32))<0.002);
      assert.ok(Math.abs(initial.lidY/height-(width<=700?.42:.53))<0.002);
      assert.ok(Math.abs(initial.visibleWidth/width-(width<=700?.62:width<=1050?.38:.31))<0.002);
      assert.notEqual(initial.cupImage,initial.clockImage);
      assert.equal(states[2].glow,states[4].glow,'Reverse scroll restores the same timeline state');
      assert.equal(states[1].glow,states[5].glow);
      const stopped=await sample(height*.4);
      await page.waitForTimeout(1100);
      const afterStop=await page.locator('.promo-glow').evaluate(el=>getComputedStyle(el).transform);
      assert.equal(afterStop,stopped.glow,'No catch-up animation once scroll position stops');
      await sample((height+range.height)*.18-height);
      const titleBefore=await page.locator('.promo-title .line-content').evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
      await page.waitForTimeout(600);
      const titleAfter=await page.locator('.promo-title .line-content').evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
      assert.deepEqual(titleBefore,titleAfter,'Masked heading also stops with the same section timeline');
      for(let i=0;i<4;i++){await page.mouse.wheel(0,25);await page.waitForTimeout(150);}
      await page.waitForTimeout(1300);
      const afterWheel=await page.locator('.promo-cup').evaluate(el=>getComputedStyle(el).transform);
      assert.equal(afterWheel,'none');
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForTimeout(350);
      assert.equal(await page.locator('.promo-cup').evaluate(el=>getComputedStyle(el).transform),'none');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.match(await page.locator('.hero-eyebrow').textContent(),/ТОЧНО ВО ВКУС. МИМО СУЕТЫ./);
      results.push({width,height,range,placement:initial,stopStable:true,reverseStable:true});
      console.log(`PASS ${width}×${height}: alpha-aware placement, fixed cup, flowing/clipped sections, direct scrub, reverse and stop.`);
      await page.close();
    }
    assert.deepEqual(issues,[]);
    await fs.writeFile('artifacts/transition-results.json',JSON.stringify({results,issues},null,2));
  } finally { await browser.close(); }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
