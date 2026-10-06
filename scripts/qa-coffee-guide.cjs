const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const issues = [], results = [];
  try {
    await fs.mkdir('artifacts', { recursive: true });
    for (const [width,height] of [[1440,900],[1072,1004],[834,1112],[390,844],[320,700]]) {
      const page = await browser.newPage({ viewport:{width,height} });
      page.on('pageerror',e=>issues.push(e.message));
      page.on('console',m=>{if(['error','warning'].includes(m.type()))issues.push(m.text());});
      page.on('response',r=>{if(r.status()>=400)issues.push(`${r.status()} ${r.url()}`);});
      await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173',{waitUntil:'networkidle'});
      await page.locator('.preloader').waitFor({state:'detached'});
      await page.waitForTimeout(1500);
      const guide = page.locator('#coffee-guide');
      await page.evaluate(()=>scrollTo(0,document.getElementById('coffee-guide').getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)));
      await page.waitForTimeout(300);
      await guide.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
      assert.equal(await guide.getByRole('tab').count(),5);
      assert.equal(await guide.getByRole('tab',{selected:true}).textContent(),'Латте');
      const geometry=()=>guide.locator('.coffee-guide-frame').boundingBox();
      const initial=await geometry();
      const names=['Эспрессо','Американо','Капучино','Латте','Раф'];
      for (const name of names) {
        const tab=guide.getByRole('tab',{name,exact:true});
        await tab.click();
        await page.waitForFunction(expected=>document.querySelector('.coffee-guide-drink h3').textContent===expected,name);
        // Sample the rendered frame throughout a transition to catch empty states.
        const blankFrames=await guide.locator('.coffee-guide-photo').evaluateAll(async photos=>{
          let blank=0;
          for(let i=0;i<35;i++){
            if(!photos.some(photo=>Number(getComputedStyle(photo).opacity)>.1 && photo.querySelector('img').naturalWidth>0))blank++;
            await new Promise(resolve=>requestAnimationFrame(resolve));
          }
          return blank;
        });
        assert.equal(blankFrames,0,'No empty photo frames during crossfade');
        assert.equal(await tab.getAttribute('aria-selected'),'true');
        const panel=guide.getByRole('tabpanel');
        assert.equal(await panel.getAttribute('aria-labelledby'),await tab.getAttribute('id'));
        assert.ok((await panel.locator('p').textContent()).length>50);
        assert.ok(await panel.locator('li').count()>0);
        const current=await geometry();
        assert.ok(Math.abs(current.height-initial.height)<1,'Changing drinks must not move the following section');
        assert.ok(Math.abs(current.width-initial.width)<1);
      }
      await page.screenshot({path:`artifacts/coffee-guide-${width}-page.png`});
      await guide.screenshot({path:`artifacts/coffee-guide-${width}.png`});
      // Rapid selections and keyboard navigation should select the final request.
      await guide.getByRole('tab',{name:'Эспрессо',exact:true}).click();
      await guide.getByRole('tab',{name:'Американо',exact:true}).click();
      await guide.getByRole('tab',{name:'Латте',exact:true}).click();
      await guide.getByRole('tab',{name:'Раф',exact:true}).click();
      await page.waitForTimeout(600);
      assert.equal(await guide.getByRole('tab',{selected:true}).textContent(),'Раф');
      await page.keyboard.press('Home');await page.waitForTimeout(500);
      assert.equal(await guide.getByRole('tab',{selected:true}).textContent(),'Эспрессо');
      await page.keyboard.press('ArrowLeft');await page.waitForTimeout(500);
      assert.equal(await guide.getByRole('tab',{selected:true}).textContent(),'Раф');
      await page.keyboard.press('ArrowRight');await page.waitForTimeout(500);
      assert.equal(await guide.getByRole('tab',{selected:true}).textContent(),'Эспрессо');
      await page.keyboard.press('End');await page.waitForTimeout(500);
      assert.equal(await guide.getByRole('tab',{selected:true}).textContent(),'Раф');
      assert.equal(await guide.getByRole('tab',{name:'Раф'}).evaluate(el=>el===document.activeElement),true);
      if(width<=700) {
        const image=await guide.locator('.coffee-guide-visual').boundingBox(),copy=await guide.locator('.coffee-guide-copy').boundingBox();
        assert.ok(image.y+image.height<=copy.y+1,'Mobile image is above the copy');
      }
      await page.emulateMedia({reducedMotion:'reduce'});
      await guide.getByRole('tab',{name:'Капучино',exact:true}).click();await page.waitForTimeout(100);
      const opacities=await guide.locator('.coffee-guide-photo').evaluateAll(photos=>photos.map(p=>Number(getComputedStyle(p).opacity)));
      assert.equal(opacities.filter(n=>n===1).length,1);
      assert.equal(opacities.filter(n=>n===0).length,4);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      const neighbors=await guide.evaluate(el=>({before:el.previousElementSibling.id,after:el.nextElementSibling.id}));
      assert.deepEqual(neighbors,{before:'menu',after:'locations'});
      assert.match(await page.locator('.product-card--espresso img').getAttribute('src'),/espresso-mug/);
      await guide.locator('.coffee-guide-link').click();await page.waitForTimeout(250);
      const menuTop=await page.locator('#menu').evaluate(el=>el.getBoundingClientRect().top);
      const headerBottom=await page.locator('.navigation').evaluate(el=>el.getBoundingClientRect().bottom);
      assert.ok(menuTop>=headerBottom && menuTop<headerBottom+20,'CTA returns to the menu below the floating header');
      results.push({width,height,passed:true,blankFrames:0,stableHeight:true,keyboard:true});
      console.log(`PASS ${width}: five drinks, decoded crossfade, stable layout, keyboard, reduced motion and menu link.`);
      await page.close();
    }
    assert.deepEqual(issues,[]);
    await fs.writeFile('artifacts/coffee-guide-results.json',JSON.stringify({results,issues},null,2));
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
