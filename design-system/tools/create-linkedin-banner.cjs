// Build dependency: Sharp. The delivered SVG/PNG have no runtime dependencies.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
const sharp = require(process.env.EXTRUDA_SHARP_PATH || 'sharp');
const destination = path.join(root,'design-system/social');
fs.mkdirSync(destination,{recursive:true});
const logo = fs.readFileSync(path.join(root,'design-system/icons/logos/extruda-dk-horizontal-color.svg'),'utf8');
const viewBox = logo.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number);
const inner = logo.slice(logo.indexOf('>')+1,logo.lastIndexOf('</svg>'));
const background = '<rect width="1584" height="396" fill="#F5F0E8"/><path d="M1410 0h174v396h-96l-160-92 82-142Z" fill="#E8B08E" opacity=".22"/><path d="m0 0 360 0-164 96L0 210Z" fill="#619B98" opacity=".07"/>';
const scale = 760/viewBox[0];
const y = (396-viewBox[1]*scale)/2;
const wrap = (label,content) => `<svg xmlns="http://www.w3.org/2000/svg" width="1584" height="396" viewBox="0 0 1584 396" role="img" aria-label="${label}">\n${content}\n</svg>\n`;
const variants = [
  ['linkedin-banner-light',wrap('extruda.dk LinkedIn profile banner, light',background+`<g transform="translate(650 ${y}) scale(${scale})">${inner}</g>`)],
  ['linkedin-background-light',wrap('Light geometric background',background)]
];
(async()=>{
  for(const [name,svg] of variants){
    fs.writeFileSync(path.join(destination,name+'.svg'),svg);
    await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(path.join(destination,name+'.png'));
    const info=await sharp(path.join(destination,name+'.png')).metadata();
    if(info.width!==1584||info.height!==396)throw Error('Wrong LinkedIn dimensions');
    const size=fs.statSync(path.join(destination,name+'.png')).size;
    if(size>=8*1024*1024)throw Error('LinkedIn banner is too large');
    console.log(`${name}: ${info.width} × ${info.height}, ${size} bytes`);
  }
})().catch(error=>{console.error(error);process.exit(1);});
