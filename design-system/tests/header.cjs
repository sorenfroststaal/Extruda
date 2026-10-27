// Development-only browser checks for shared controls and existing app state.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.EXTRUDA_PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '../..');
const assert = (condition, message) => {if (!condition) throw Error(message);};
const pages = ['index.html','design-system/index.html','design-system/dummy/index.html','open-planner/index.html','learning-books/index.html','learning-books/app.html','learning-books/beta-0.2.html','learning-books/beta-ux.html','learning-books/beta-workspace.html','arraylampshade/index.html'];
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'};
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    const context = await browser.newContext({reducedMotion:'reduce'});
    const page = await context.newPage();
    const errors = [], missing = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('http://extruda.test/**', async route => {
      const url = new URL(route.request().url());
      let relative = decodeURIComponent(url.pathname).replace(/^\//,'');
      if (!relative || relative.endsWith('/')) relative += 'index.html';
      const file = path.resolve(root, relative);
      if (!file.startsWith(root+path.sep) || !fs.existsSync(file)) {missing.push(relative); return route.fulfill({status:404,body:'Missing'});}
      await route.fulfill({contentType:mime[path.extname(file)] || 'application/octet-stream',body:fs.readFileSync(file)});
    });
    await page.route('https://**', async route => {
      if (route.request().url().includes('cdn.jsdelivr.net') && process.env.EXTRUDA_BOOTSTRAP_FILE) return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.EXTRUDA_BOOTSTRAP_FILE)});
      return route.fulfill({contentType:'text/javascript',body:''});
    });
    for (const file of pages) {
      await page.setViewportSize({width:1440,height:1000});
      await page.goto('http://extruda.test/'+file);
      await page.waitForFunction(() => Boolean(window.ExtrudaUI));
      await page.evaluate(() => window.ExtrudaUI.setPreferences({language:'da',theme:'light'}));
      assert(await page.locator('.ex-utility-button').count() === 3,file+': three buttons');
      assert(await page.locator('.ex-utility-button').first().innerText() === 'DA',file+': DA label');
      const globe = page.locator('[data-utility=language]');
      await globe.click();
      await page.locator('[name=ex-ui-language][value=en]').check();
      assert(await page.locator('html').getAttribute('lang') === 'en',file+': language changes');
      assert(await globe.getAttribute('aria-expanded') === 'false',file+': language choice closes');
      assert(await globe.evaluate(n => n === document.activeElement),file+': language restores focus');
      await page.locator('[data-utility=theme]').click();
      await page.locator('[name=ex-ui-theme][value=dark]').check();
      assert(await page.locator('html').getAttribute('data-theme') === 'dark',file+': dark theme');
      await page.locator('[data-utility=theme]').click();
      await page.keyboard.press('Escape');
      assert(await page.locator('#ex-theme-panel').isHidden(),file+': Escape closes choices');
      const info = page.locator('[data-utility=info]');
      await info.click();
      assert(await page.locator('.ex-about-dialog').isVisible(),file+': about opens');
      assert((await page.locator('.ex-about-content').innerText()).includes('Dependencies'),file+': dependency information');
      await page.keyboard.press('Escape');
      assert(await info.evaluate(n => n === document.activeElement),file+': dialog restores focus');
      await page.reload();
      assert(await page.locator('html').getAttribute('lang') === 'en',file+': language survives reload');
      assert(await page.locator('html').getAttribute('data-theme') === 'dark',file+': theme survives reload');
      for (const width of [390,320]) {
        await page.setViewportSize({width,height:1000});
        for (const language of ['da','en']) {
          await page.evaluate(language => window.ExtrudaUI.setPreferences({language}),language);
          const bounds = await page.locator('.ex-utilities').boundingBox();
          assert(bounds.x >= 0 && bounds.x+bounds.width <= width+1,file+': controls fit '+width);
          await globe.click();
          const panel = await page.locator('#ex-language-panel').boundingBox();
          assert(panel.x >= 0 && panel.x+panel.width <= width+1,file+': choices fit '+width);
          await page.keyboard.press('Escape');
        }
      }
      if (process.env.EXTRUDA_SCREENSHOT_DIR && ['index.html','design-system/index.html','design-system/dummy/index.html','open-planner/index.html','learning-books/app.html'].includes(file)) {
        await page.setViewportSize({width:1440,height:1000});
        await page.evaluate(() => window.ExtrudaUI.setPreferences({language:'da',theme:'light'}));
        await page.screenshot({path:path.join(process.env.EXTRUDA_SCREENSHOT_DIR,'header-'+file.replaceAll('/','-')+'.png')});
        await page.setViewportSize({width:390,height:1000});
        await page.evaluate(() => window.ExtrudaUI.setPreferences({theme:'dark'}));
        await page.screenshot({path:path.join(process.env.EXTRUDA_SCREENSHOT_DIR,'header-mobile-'+file.replaceAll('/','-')+'.png')});
      }
      console.log('PASS header: '+file);
    }
    // Theme follows system until a deliberate choice is made.
    await page.goto('http://extruda.test/design-system/dummy/index.html');
    await page.locator('#content-title').fill('Bevar denne tekst');
    await page.evaluate(() => window.ExtrudaUI.setPreferences({theme:'system',language:'en'}));
    await page.emulateMedia({colorScheme:'dark'});
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.emulateMedia({colorScheme:'light'});
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    assert(await page.locator('#content-title').inputValue() === 'Bevar denne tekst','Form survives language and theme');
    await page.goto('http://extruda.test/learning-books/app.html');
    const languageBefore = await page.locator('[name=language]:checked').inputValue();
    const outputBefore = await page.locator('#live-page').innerHTML();
    await page.evaluate(() => window.ExtrudaUI.setPreferences({theme:'dark',language:'da'}));
    assert(await page.locator('[name=language]:checked').inputValue() === languageBefore,'Header language does not change worksheet language');
    assert(await page.locator('#live-page').innerHTML() === outputBefore,'Header preferences do not change generated worksheet');
    assert(await page.locator('.sheet').first().evaluate(n => getComputedStyle(n).backgroundColor) === 'rgb(255, 255, 255)','Dark UI retains white paper');
    const isolated = await browser.newContext();
    await isolated.addInitScript(() => Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}}));
    const blocked = await isolated.newPage();
    const offlineFile = path.join(process.env.EXTRUDA_SCREENSHOT_DIR || os.tmpdir(),'extruda-offline-header-test.html');
    fs.copyFileSync(path.join(root,'learning-books/app.html'),offlineFile);
    const offlineErrors = [], requests = [];
    blocked.on('pageerror', error => offlineErrors.push(error.message));
    blocked.on('request', request => requests.push(request.url()));
    try {
      await blocked.goto(pathToFileURL(offlineFile).href);
      await blocked.waitForFunction(() => Boolean(window.ExtrudaUI));
      await blocked.locator('[data-utility=language]').click();
      await blocked.locator('[name=ex-ui-language][value=en]').check();
      await blocked.locator('[data-utility=theme]').click();
      await blocked.locator('[name=ex-ui-theme][value=dark]').check();
      await blocked.locator('[data-utility=info]').click();
      assert((await blocked.locator('.ex-preference-note').innerText()).includes('does not allow saving'),'Blocked storage is explained');
      assert(offlineErrors.length === 0,'Standalone app works with blocked storage: '+offlineErrors.join(', '));
      assert(requests.every(url => url === pathToFileURL(offlineFile).href || url.startsWith('data:')),'Standalone app needs no sibling files or network');
    } finally {await isolated.close();fs.unlinkSync(offlineFile);}
    assert(errors.length === 0,'Browser errors: '+errors.join('\n'));
    assert(missing.length === 0,'Missing local assets: '+missing.join(', '));
    console.log('PASS: all 10 pages, keyboard, language, themes, storage, mobile controls and unchanged output.');
  } finally {await browser.close();}
})().catch(error => {console.error(error.stack);process.exit(1);});
