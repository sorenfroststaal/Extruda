const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.EXTRUDA_PLAYWRIGHT_PATH || 'playwright');

const root = path.resolve(__dirname, '..', '..');
const routes = ['/', '/array/', '/mobile-as-webcam/', '/goldfish/', '/learning-books/', '/learning-books/app.html', '/open-planner/', '/design-system/'];
const mime = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function serve(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root)) return response.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (error, data) => {
    if (error) return response.writeHead(404).end('Not found');
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(data);
  });
}

async function scan(page) {
  return page.evaluate(() => {
    const parse = value => {
      const match = value.match(/[\d.]+/g);
      if (!match || match.length < 3) return null;
      const values = match.map(Number);
      if (value.startsWith('color(srgb')) values[0] *= 255, values[1] *= 255, values[2] *= 255;
      const [r, g, b, a = 1] = values;
      return { r, g, b, a };
    };
    const blend = (front, back) => ({ r: front.r * front.a + back.r * (1 - front.a), g: front.g * front.a + back.g * (1 - front.a), b: front.b * front.a + back.b * (1 - front.a), a: 1 });
    const background = node => {
      const layers = [];
      for (let current = node; current; current = current.parentElement) {
        const colour = parse(getComputedStyle(current).backgroundColor);
        if (colour && colour.a > 0) layers.push(colour);
      }
      return layers.reverse().reduce((result, layer) => blend(layer, result), { r: 255, g: 255, b: 255, a: 1 });
    };
    const luminance = colour => {
      const channel = value => (value /= 255) <= .03928 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4);
      return .2126 * channel(colour.r) + .7152 * channel(colour.g) + .0722 * channel(colour.b);
    };
    const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
    const selector = 'h1,h2,h3,h4,p,li,dt,dd,label,summary,button,a,.project-title strong,.section-intro,.eyebrow';
    return [...document.querySelectorAll(selector)].filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && (element.innerText || element.textContent || '').trim();
    }).map(element => {
      const style = getComputedStyle(element);
      const bg = background(element);
      const fg = parse(style.color);
      const size = parseFloat(style.fontSize);
      const weight = parseInt(style.fontWeight) || 400;
      const required = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
      const value = fg ? ratio(blend(fg, bg), bg) : 21;
      return { tag: element.tagName.toLowerCase(), text: (element.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 90), ratio: +value.toFixed(2), required };
    }).filter(result => result.ratio < result.required);
  });
}

(async () => {
  const server = http.createServer(serve);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: process.env.EXTRUDA_BROWSER_CHANNEL || 'chrome' });
  const failures = [];
  try {
    for (const theme of ['light', 'dark']) {
      for (const route of routes) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: theme });
        await page.addInitScript(value => localStorage.setItem('extruda-ui-preferences', JSON.stringify({ language: 'da', theme: value })), theme);
        await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
        await page.locator('details').evaluateAll(elements => elements.forEach(element => { element.open = true; }));
        failures.push(...(await scan(page)).map(result => ({ theme, route, ...result })));
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`Contrast OK: ${routes.length} routes checked in light and dark mode.`);
  }
})().catch(error => { console.error(error); process.exit(1); });
