// Test tooling only. Runtime pages have no package dependency.
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.EXTRUDA_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'../..');
const assert=(value,message)=>{if(!value)throw Error(message);};
const local=relative=>pathToFileURL(path.join(root,relative)).href;

(async()=>{
  const browser=await chromium.launch({channel:process.env.EXTRUDA_BROWSER_CHANNEL||'chrome',headless:true});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(local('design-system/dummy/index.html'));
    await page.evaluate(()=>document.fonts.ready);
    assert(await page.locator('#app-view').isVisible(),'Workspace is the default');
    assert(await page.locator('#download-svg').isVisible(),'Final action is visible without steps');
    assert(await page.locator('#output-colours').isHidden(),'Custom controls are conditional');
    await page.locator('#content-title').fill('');
    await page.locator('#download-svg').click();
    assert(await page.locator('#workspace-errors').evaluate(n=>n===document.activeElement),'Error summary receives focus');
    await page.locator('#workspace-errors a').click();
    assert(await page.locator('#content-title').evaluate(n=>n===document.activeElement),'Error link focuses input');
    await page.locator('#content-title').fill('A <test> & "title"');
    await page.locator('[name="output-mode"][value="custom"]').check();
    assert(await page.locator('#output-primary').isVisible(),'Custom colours open when chosen');
    await page.locator('#output-primary').fill('#ffffff');
    await page.locator('#output-paper').fill('#111111');
    await page.evaluate(language=>window.ExtrudaUI.setPreferences({language}),'en');
    assert(await page.locator('#content-title').inputValue()==='A <test> & "title"','Input survives language change');
    assert(await page.locator('#output-preview svg title').textContent()==='A <test> & "title"','SVG content is escaped');
    assert(await page.locator('#output-preview script').count()===0,'No injected script');
    await page.locator('[name="output-mode"][value="mono"]').check();
    assert(await page.locator('#output-preview').evaluate(n=>n.innerHTML.includes('url(#stripes)')),'Monochrome retains patterns');
    if(process.env.EXTRUDA_TEST_DOWNLOAD==='1'){
      const pending=page.waitForEvent('download');
      await page.locator('#download-svg').click();
      const download=await pending;
      assert(await download.failure()===null,'SVG download succeeds');
      const svg=fs.readFileSync(await download.path(),'utf8');
      assert(!/extruda|<script/i.test(svg),'Unbranded export has no branding or script');
      assert(svg.includes('&lt;test&gt;'),'Export escapes input');
    }
    await page.locator('#output-branding').check();
    assert((await page.locator('#output-preview').textContent()).includes('extruda'),'Branding is opt-in');
    await page.locator('#output-branding').uncheck();
    assert(!(await page.locator('#output-preview').textContent()).includes('extruda'),'Branding can be removed');

    // Tasks: drafts, validation, explicit save and direct review edits.
    await page.locator('a[data-destination="tasks"]').click();
    assert((await page.locator('#task-progress').textContent()).includes('0 of 3'),'Task status initially incomplete');
    await page.locator('a[href="#task-description"]').click();
    await page.locator('#task-form button[type="submit"]').click();
    assert(await page.locator('#task-errors').evaluate(n=>n===document.activeElement),'Task error summary focuses');
    await page.locator('#task-errors a').click();
    assert(await page.locator('#task-name').evaluate(n=>n===document.activeElement),'Task error link works');
    await page.locator('#task-name').fill('A draft');
    await page.locator('.task-back-link').click();
    assert(await page.locator('#task-description-status').textContent()==='In progress','Draft is not marked saved');
    await page.locator('a[href="#task-description"]').click();
    assert(await page.locator('#task-name').inputValue()==='A draft','Draft retained');
    await page.locator('#task-form button[type="submit"]').click();
    await page.locator('#task-overview').waitFor();
    assert(await page.locator('#task-description-status').textContent()==='Ready','Explicitly saved answer is ready');
    await page.locator('a[href="#task-review"]').click();
    await page.locator('#task-form button[type="submit"]').click();
    assert(await page.locator('#task-errors a').count()===1,'Review points to the missing section');
    await page.locator('#task-errors a').click();
    await page.locator('[name="task-mode"][value="mono"]').check();
    await page.locator('#task-form button[type="submit"]').click();
    assert(page.url().endsWith('#task-review'),'Save returns directly to review');
    await page.locator('a[href="#task-description?return=review"]').click();
    await page.locator('#task-name').fill('Corrected name');
    await page.locator('#task-form button[type="submit"]').click();
    assert(page.url().endsWith('#task-review'),'Edited answer returns directly to review');
    assert((await page.locator('.review-list').textContent()).includes('Corrected name'),'Review reflects correction');
    await page.locator('#task-form button[type="submit"]').click();
    assert((await page.locator('#task-progress').textContent()).includes('3 of 3'),'All sections explicitly completed');
    await page.goBack();
    assert(await page.locator('#task-edit-screen h2').textContent()==='Review your choices','Browser Back restores view');

    // Setup: a real step sequence, direct change and cancellation.
    await page.locator('.demo-reference-links a[href="#setup-1"]').click();
    assert(await page.locator('#shortcut-start').isChecked(),'Start shortcut defaults on');
    assert(!await page.locator('#shortcut-desktop').isChecked(),'Desktop shortcut defaults off');
    await page.locator('#shortcut-start').uncheck();
    await page.locator('#shortcut-desktop').check();
    await page.locator('#setup-next').click();
    await page.locator('#setup-body .review-list').waitFor();
    assert((await page.locator('#setup-body .review-list').textContent()).includes('Start menu: no. Desktop: yes.'),'Setup review matches choices');
    await page.locator('#setup-body .review-list a').click();
    assert(!await page.locator('#shortcut-start').isChecked(),'Direct change preserves choices');
    await page.locator('#setup-next').click();
    await page.locator('#setup-next').click();
    await page.locator('#setup-cancel').click();
    assert(await page.locator('#setup-next').isEnabled(),'Cancelled setup can recover');
    await page.locator('#setup-next').click();
    // Same-page hash change: check location directly (waitForURL misses it in some Playwright versions).
    await page.waitForFunction(()=>location.hash==='#setup-3');
    await page.locator('#setup-next').click();
    await page.locator('#app-view').waitFor();

    // Mobile disclosure navigation, without an ARIA menu or overlay.
    await page.setViewportSize({width:390,height:1000});
    await page.locator('#demo-menu-toggle').click();
    assert(await page.locator('#demo-menu-links').isVisible(),'Mobile links open');
    await page.keyboard.press('Escape');
    assert(await page.locator('#demo-menu-links').isHidden(),'Escape closes mobile menu');
    assert(await page.locator('#demo-menu-toggle').evaluate(n=>n===document.activeElement),'Escape restores focus');

    let combinations=0;
    for(const width of [1440,1024,960,768,390,320]){
      await page.setViewportSize({width,height:1000});
      for(const lang of ['da','en']){
        await page.evaluate(language=>window.ExtrudaUI.setPreferences({language}),lang);
        for(const theme of ['light','dark']){
          await page.evaluate(theme=>window.ExtrudaUI.setPreferences({theme}),theme);
          for(const route of ['app','tasks','setup-1']){
            await page.evaluate(route=>location.hash=route,route);
            await page.waitForFunction(route=>document.querySelector(route==='app'?'#app-view':route==='tasks'?'#tasks-view':'#setup-view').hidden===false,route);
            assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow: ${width}/${lang}/${theme}/${route}`);
            combinations++;
          }
        }
      }
    }
    if(process.env.EXTRUDA_SCREENSHOT_DIR){
      const out=process.env.EXTRUDA_SCREENSHOT_DIR;
      await page.setViewportSize({width:1440,height:1000});await page.evaluate(language=>window.ExtrudaUI.setPreferences({language}),'da');await page.evaluate(theme=>window.ExtrudaUI.setPreferences({theme}),'light');
      for(const [route,name]of [['app','workspace'],['tasks','overview'],['setup-1','wizard']]){
        await page.evaluate(route=>location.hash=route,route);await page.waitForFunction(route=>document.querySelector(route==='app'?'#app-view':route==='tasks'?'#tasks-view':'#setup-view').hidden===false,route);
        await page.evaluate(()=>document.activeElement.blur());
        await page.locator('#demo-window').screenshot({path:path.join(out,`ux2-${name}.png`)});
      }
      await page.setViewportSize({width:390,height:1000});await page.evaluate(theme=>window.ExtrudaUI.setPreferences({theme}),'dark');await page.evaluate(()=>location.hash='app');await page.locator('#app-view').waitFor();
      await page.evaluate(()=>document.activeElement.blur());
      await page.locator('#demo-window').screenshot({path:path.join(out,'ux2-mobile.png')});
    }
    await page.setViewportSize({width:320,height:1000});
    await page.evaluate(()=>{const nodes=[...document.querySelectorAll('body *')].filter(n=>!(n instanceof SVGElement)).map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);for(const[n,size]of nodes)n.style.fontSize=size*2+'px';});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Enlarged text reflows at 320px');

    await page.goto(local('design-system/index.html'));
    assert(await page.locator('.section-nav a').count()===4,'Reference has four main destinations');
    assert(await page.locator('.gallery-thumbnail').count()===4,'Reference carousel retained');
    await page.evaluate(()=>window.ExtrudaUI.setPreferences({language:'en'}));
    assert(await page.locator('html').getAttribute('lang')==='en','Reference translation works');
    for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Reference reflows');}
    const anchors=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));
    assert(anchors.length===0,'Reference anchors exist: '+anchors.join(','));

    // Home page and Projekter: everything local (no CDNs), destinations and projects visible,
    // and the local script (js/extruda-site.js) runs disclosures and image switching.
    const external=[];
    page.on('request',request=>{if(/^https?:/.test(request.url()))external.push(request.url());});
    await page.addInitScript(()=>{try{localStorage.setItem('extruda-intro-seen','1');}catch{}});
    await page.goto(local('index.html'));
    assert(await page.locator('.short-choice').count()===3,'Home page shows three destinations');
    for(const choice of await page.locator('.short-choice').all())assert(await choice.isVisible(),'Destination visible');
    assert(await page.locator('h1').count()===1,'Home page has one main heading');
    await page.goto(local('projekter/index.html'));
    assert(await page.locator('h1').count()===1,'Projekter has one main heading');
    const names=await page.locator('.project-title strong').allTextContents();
    assert(JSON.stringify(names)===JSON.stringify(['Array Lamp Shade','Mobile as Webcam','Goldfish (FreeCAD)','Learning Books','Open Planner']),'Project names: '+names.join(', '));
    const toggle=page.locator('[data-bs-toggle="collapse"]').first();
    const target=page.locator(await toggle.getAttribute('data-bs-target'));
    assert(!(await target.isVisible()),'Project details start closed');
    await toggle.click();
    assert(await target.isVisible()&&await toggle.getAttribute('aria-expanded')==='true','Project details open with the local script');
    const carousel=target.locator('.carousel[id]').first();
    const id=await carousel.getAttribute('id');
    assert(await page.locator(`[data-bs-slide="prev"][data-bs-target="#${id}"]`).isDisabled(),'Image switching does not wrap at the first image');
    await toggle.click();
    assert(!(await target.isVisible()),'Project details close again');
    assert(external.length===0,'No external requests: '+external.join(', '));
    assert(errors.length===0,errors.join('\n'));
    console.log(`PASS: ${combinations} responsive/language/theme/pattern combinations; form errors, drafts, review edits, history, wizard, menu, export content, reference, home page and Projekter.`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error.stack);process.exit(1);});
