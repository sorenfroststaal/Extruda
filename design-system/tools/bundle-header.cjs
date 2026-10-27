// Keep the downloadable Learning Books pages independent of sibling files.
// Run from any directory after changing shared header sources.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const css = read('css/extruda-ui.css')+'\n'+read('css/extruda-pages.css');
const copy = read('js/extruda-copy.js');
const ui = read('js/extruda-ui.js');
const logo = 'data:image/svg+xml;base64,'+Buffer.from(read('Assets/Brand/extruda-logo-horizontal-white.svg')).toString('base64');
for (const name of ['app','beta-0.2','beta-ux','beta-workspace']) {
  const file = path.join(root,'learning-books',name+'.html');
  let html = fs.readFileSync(file,'utf8');
  html = html.replace(/<link rel="stylesheet" href="\.\.\/css\/extruda-(?:ui|pages)\.css[^\"]*">/g,'')
    .replace(/<script defer src="\.\.\/js\/extruda-(?:copy|ui)\.js[^\"]*"><\/script>/g,'')
    .replace(/<style id="extruda-shared-header">[\s\S]*?<\/style>/,'')
    .replace(/<script id="extruda-shared-copy">[\s\S]*?<\/script>/,'')
    .replace(/<script id="extruda-shared-ui"[^>]*>[\s\S]*?<\/script>/,'');
  html = html.replace('</head>',`<style id="extruda-shared-header">${css}</style></head>`)
    .replace('</body>',`<script id="extruda-shared-copy">${copy}</script><script id="extruda-shared-ui" data-white-logo="${logo}">${ui}</script></body>`);
  fs.writeFileSync(file,html);
}
console.log('Bundled shared controls into four standalone Learning Books pages.');
