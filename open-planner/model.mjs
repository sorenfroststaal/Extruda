export const DAYS = ['Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag','Søndag'];
export const ICONS = {none:'Uden ikon',sun:'Sol / morgen',moon:'Måne / aften',home:'Hjem',tasks:'Opgaver',calendar:'Kalender',community:'Sammen',guides:'Læsning',tools:'Praktisk',images:'Billeder',notes:'Noter',play:'Pause / leg',check:'Færdig'};
export const MAX_CARDS = 200;
export const DEFAULT = {version:1,cardWidth:69,cardHeight:66,orientation:'portrait',color:'petrol',copies:1,cards:DAYS.map((text)=>({text,icon:'none'}))};
const SAFE_IMAGE=/^(\.\/(data\/images|assets\/food)\/[a-z0-9-]+\.(png|jpe?g|webp)|data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+)$/;
export function validate(value) {
  if (!value || value.version !== 1) throw new Error('Filen skal være et Open Planner-kortsæt (version 1).');
  for (const field of ['cardWidth','cardHeight']) if (typeof value[field] !== 'number' || !Number.isFinite(value[field]) || value[field]<20 || value[field]>277) throw new Error('Kortmål skal være mellem 20 og 277 mm.');
  if (!['portrait','landscape'].includes(value.orientation)) throw new Error('Vælg stående eller liggende A4.');
  if (!['petrol','apricot','mono'].includes(value.color)) throw new Error('Vælg en af kortfarverne.');
  if (!Number.isInteger(value.copies) || value.copies<1 || value.copies>20) throw new Error('Antal kopier skal være et helt tal fra 1 til 20.');
  if (!Array.isArray(value.cards) || value.cards.length>MAX_CARDS || value.cards.length*value.copies>MAX_CARDS) throw new Error('Der er plads til højst 200 kort inklusive kopier.');
  const cards = value.cards.map(c=>{
    const image=typeof c?.image==='string'?c.image:'';
    if(!c || typeof c.text!=='string' || c.text.length>80 || !Object.hasOwn(ICONS,c.icon) || (!c.text.trim() && c.icon==='none' && !image)) throw new Error('Hvert kort skal have tekst (højst 80 tegn), et gyldigt ikon eller et billede.');
    if(image&&!SAFE_IMAGE.test(image))throw new Error('Et kort indeholder en ugyldig billedreference.');
    return {text:c.text.trim(),icon:c.icon,image,kind:c.kind==='food'||image?'food':''};
  });
  return {version:1,cardWidth:value.cardWidth,cardHeight:value.cardHeight,orientation:value.orientation,color:value.color,copies:value.copies,cards};
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
