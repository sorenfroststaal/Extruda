import {imageReference} from './images.mjs?v=20261027-db1';
import {DISH_BY_ID} from './dishes.mjs?v=20261027-db1';
export const DAYS = ['Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag','Søndag'];
export const ICONS = {none:'Uden ikon',sun:'Sol / morgen',moon:'Måne / aften',home:'Hjem',tasks:'Opgaver',calendar:'Kalender',community:'Sammen',guides:'Læsning',tools:'Praktisk',images:'Billeder',notes:'Noter',play:'Pause / leg',check:'Færdig'};
export const MAX_CARDS = 200;
export const DEFAULT = {version:1,cardWidth:69,cardHeight:66,orientation:'portrait',color:'petrol',copies:1,cards:DAYS.map((text)=>({text,icon:'none'}))};
const SAFE_IMAGE=/^(\.\/(data\/images|assets\/food)\/[a-z0-9-]+\.(png|jpe?g|webp)|data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+)$/;
export function validate(value) {
  if (!value || value.version !== 1) throw new Error('Filen skal være et Open Planner-kortsæt (version 1).');
  for (const field of ['cardWidth','cardHeight']) if (typeof value[field] !== 'number' || !Number.isFinite(value[field]) || value[field]<20 || value[field]>277) throw new Error('Kortmål skal være mellem 20 og 277 mm.');
  if (!['portrait','landscape'].includes(value.orientation)) throw new Error('Vælg stående eller liggende A4.');
  if (!['petrol','apricot','mono','custom'].includes(value.color)) throw new Error('Vælg en af kortfarverne.');
  const exportStyle={};
  for(const [key,fallback]of [['showBranding',true],['showQr',true],['showFooter',true],['includeMetadata',true]]){if(value[key]!==undefined&&typeof value[key]!=='boolean')throw new Error('Eksportindstillingerne er ugyldige.');exportStyle[key]=value[key]??fallback;}
  if(!exportStyle.showBranding)exportStyle.showQr=false;
  for(const [key,fallback]of [['paperColor','#F5F0E8'],['inkColor','#28645F']]){const hex=value[key]??fallback;if(typeof hex!=='string'||!/^#[0-9a-f]{6}$/i.test(hex))throw new Error('Vælg en gyldig kortfarve.');exportStyle[key]=hex;}
  if (!Number.isInteger(value.copies) || value.copies<1 || value.copies>20) throw new Error('Antal kopier skal være et helt tal fra 1 til 20.');
  if (!Array.isArray(value.cards) || value.cards.length>MAX_CARDS || value.cards.length*value.copies>MAX_CARDS) throw new Error('Der er plads til højst 200 kort inklusive kopier.');
  const cards = value.cards.map(c=>{
    let image=typeof c?.image==='string'?c.image:'';
    if(c?.dishId!==undefined){const legacyDish=DISH_BY_ID.get(c.dishId);if(!legacyDish)throw new Error('Kortsættet indeholder en ukendt ret.');if(!image&&legacyDish.image)image='./'+legacyDish.image;}
    image=image.replace(/^\.\/data\/images\/([a-z0-9-]+)-cirkel\.png$/, './assets/food/$1.webp');
    if(!c || typeof c.text!=='string' || c.text.length>80 || !Object.hasOwn(ICONS,c.icon) || (!c.text.trim() && c.icon==='none' && !image)) throw new Error('Hvert kort skal have tekst (højst 80 tegn), et gyldigt ikon eller et billede.');
    if(image&&!SAFE_IMAGE.test(image))throw new Error('Et kort indeholder en ugyldig billedreference.');
    if(image)imageReference(image);
    if((c.kind==='food'||c.dishId||image)&&(value.cardWidth<50||value.cardHeight<50))throw new Error('Madkort kræver mindst 50 × 50 mm.');
    const optional={};
    if(c.dishId)optional.dishId=c.dishId;
    for(const [key,max]of [['ingredients',5000],['recipe',10000]])if(c[key]!==undefined){if(typeof c[key]!=='string'||c[key].length>max)throw new Error('Noterne til kortet er ugyldige eller for lange.');optional[key]=c[key];}
    return {text:c.text.trim(),icon:c.icon,image,kind:c.kind==='food'||c.dishId||image?'food':'',...optional};
  });
  return {version:1,cardWidth:value.cardWidth,cardHeight:value.cardHeight,orientation:value.orientation,color:value.color,copies:value.copies,cards,...exportStyle};
}
export function layout(value) {
  const state = validate(value);
  const [pageWidth,pageHeight] = state.orientation==='landscape'?[297,210]:[210,297];
  const margin=10, gap=4, footer=10;
  const columns=Math.floor((pageWidth-2*margin+gap)/(state.cardWidth+gap));
  const rows=Math.floor((pageHeight-2*margin-footer+gap)/(state.cardHeight+gap));
  if(columns<1 || rows<1) throw new Error(`Kortet passer ikke på arket. Maksimalt ${pageWidth-20} × ${pageHeight-30} mm i denne papirretning.`);
  const cards=Array.from({length:state.copies},()=>state.cards).flat();
  const perPage=columns*rows;
  const pages=[];
  for(let i=0;i<cards.length;i+=perPage) pages.push(cards.slice(i,i+perPage).map((card,j)=>({...card,x:margin+(j%columns)*(state.cardWidth+gap),y:margin+Math.floor(j/columns)*(state.cardHeight+gap)})));
  return {pageWidth,pageHeight,margin,gap,footer,columns,rows,perPage,pages,total:cards.length};
}
export function escapeXml(text){return String(text).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));}
// Actual text metrics are supplied by the browser canvas after local fonts load.
export function fitText(text,width,height,measure,maxFontSize=7) {
  if (!text) return {fontSize:0,lines:[]};
  for(let fontSize=Math.min(maxFontSize,height/2.3);fontSize>=1.8;fontSize-=.15){
    const lines=[];let current='';
    for(const word of text.trim().split(/\s+/)){
      if(measure(word,fontSize)>width){
        if(current){lines.push(current);current='';}
        for(const char of word){if(current && measure(current+char,fontSize)>width){lines.push(current);current='';}current+=char;}
      }else if(current && measure(current+' '+word,fontSize)>width){lines.push(current);current=word;}else current+=(current?' ':'')+word;
    }
    if(current)lines.push(current);
    if(lines.length*fontSize*1.25<=height && lines.every(line=>measure(line,fontSize)<=width)) return {fontSize,lines};
  }
  throw new Error('Teksten er for lang til kortet. Forkort teksten eller vælg et større kort.');
}
