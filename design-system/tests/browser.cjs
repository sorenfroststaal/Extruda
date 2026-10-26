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
    await page.locator('#demo-language').selectOption('en');
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
    await page.waitForURL('**#setup-3');
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
        await page.locator('#demo-language').selectOption(lang);
        for(const theme of ['light','dark']){
          await page.locator('#demo-theme').selectOption(theme);
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
      await page.setViewportSize({width:1440,height:1000});await page.locator('#demo-language').selectOption('da');await page.locator('#demo-theme').selectOption('light');
      for(const [route,name]of [['app','workspace'],['tasks','overview'],['setup-1','wizard']]){
        await page.evaluate(route=>location.hash=route,route);await page.waitForFunction(route=>document.querySelector(route==='app'?'#app-view':route==='tasks'?'#tasks-view':'#setup-view').hidden===false,route);
        await page.evaluate(()=>document.activeElement.blur());
        await page.locator('#demo-window').screenshot({path:path.join(out,`ux2-${name}.png`)});
      }
      await page.setViewportSize({width:390,height:1000});await page.locator('#demo-theme').selectOption('dark');await page.evaluate(()=>location.hash='app');await page.locator('#app-view').waitFor();
      await page.evaluate(()=>document.activeElement.blur());
      await page.locator('#demo-window').screenshot({path:path.join(out,'ux2-mobile.png')});
    }
    await page.setViewportSize({width:320,height:1000});
    await page.evaluate(()=>{const nodes=[...document.querySelectorAll('body *')].filter(n=>!(n instanceof SVGElement)).map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);for(const[n,size]of nodes)n.style.fontSize=size*2+'px';});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Enlarged text reflows at 320px');

    await page.goto(local('design-system/index.html'));
    assert(await page.locator('.section-nav a').count()===4,'Reference has four main destinations');
    assert(await page.locator('.gallery-thumbnail').count()===4,'Reference carousel retained');
    await page.locator('[data-lang="en"]').click();
    assert(await page.locator('html').getAttribute('lang')==='en','Reference translation works');
    for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Reference reflows');}
    const anchors=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));
    assert(anchors.length===0,'Reference anchors exist: '+anchors.join(','));

    // Home page keeps essential project information visible even without JS/CDNs.
    await page.route('https://use.fontawesome.com/**',route=>route.fulfill({contentType:'text/javascript',body:''}));
    if(process.env.EXTRUDA_BOOTSTRAP_FILE)await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.EXTRUDA_BOOTSTRAP_FILE)}));
    await page.goto(local('index.html'));
    assert(await page.locator('.project-overview').count()===5,'Five visible project summaries');
    assert(await page.locator('.project-overview.collapse').count()===0,'No outer collapse layer');
    for(const item of await page.locator('.project-overview').all()){
      assert(await item.locator('.project-preview').isVisible(),'Project purpose visible');
      assert(await item.locator('.project-actions,.goldfish-download').first().isVisible(),'Project destination visible');
    }
    if(await page.evaluate(()=>Boolean(window.bootstrap))){
      await page.locator('.project-more-toggle').first().click();
      await page.locator('#arrayDetails.show').waitFor();
      await page.locator('.navbar-toggler').click();
      await page.locator('#navbarResponsive.show').waitFor();
      await page.locator('#navbarResponsive .nav-link').first().focus();await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.getElementById('navbarResponsive').classList.contains('show'));
    }
    assert(errors.length===0,errors.join('\n'));
    console.log(`PASS: ${combinations} responsive/language/theme/pattern combinations; form errors, drafts, review edits, history, wizard, menu, export content, reference and homepage.`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error.stack);process.exit(1);});
