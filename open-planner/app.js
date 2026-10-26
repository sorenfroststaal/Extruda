import {DAYS,ICONS,DEFAULT,MAX_CARDS,validate,layout,escapeXml,fitText} from './model.mjs';

const $ = id=>document.getElementById(id);
const storageKey='extruda-open-planner-v1';
let state=structuredClone(DEFAULT), latest=null, svgPages=[], symbols={}, embeddedFont='';
let persistWarning=false;
const canvas=document.createElement('canvas').getContext('2d');
const fields={'card-width':'cardWidth','card-height':'cardHeight',orientation:'orientation',color:'color',copies:'copies'};
const numeric=new Set(['cardWidth','cardHeight','copies']);

function showError(message){$('error').textContent=message;$('error').hidden=!message;}
function feedback(message){$('add-status').textContent=message;}
function saveLocal(){try{localStorage.setItem(storageKey,JSON.stringify(validate(state)));}catch{if(!persistWarning){feedback('Automatisk lagring er ikke tilgængelig. Brug “Gem kort og mål” for at gemme dit sæt.');persistWarning=true;}}}
function syncFields(){for(const [id,key] of Object.entries(fields))$(id).value=state[key];}
function iconSvg(name){return name==='none'?'':`<svg viewBox="0 0 24 24" aria-hidden="true">${symbols[name]||''}</svg>`;}

function renderList(){
  $('list-count').textContent=state.cards.length;
  $('card-list').replaceChildren();
  if(!state.cards.length){const empty=document.createElement('li');empty.className='empty-list';empty.textContent='Din liste er tom. Tilføj ugedage eller dine egne kort.';$('card-list').append(empty);}
  state.cards.forEach((card,index)=>{
    const row=document.createElement('li');row.className='card-row';
    const input=document.createElement('input');input.id=`card-${index}`;input.value=card.text;input.maxLength=80;input.setAttribute('aria-label',`Tekst på kort ${index+1}${card.icon!=='none'?' ('+ICONS[card.icon]+')':''}`);input.placeholder=card.icon==='none'?'Korttekst':ICONS[card.icon];
    input.addEventListener('input',()=>{card.text=input.value;render();});
    const remove=document.createElement('button');remove.type='button';remove.setAttribute('aria-label',`Fjern kort ${index+1}: ${card.text||ICONS[card.icon]}`);remove.innerHTML='<svg aria-hidden="true"><use href="./assets/icons/ui-sprite.svg#close"></use></svg>';
    remove.addEventListener('click',()=>{state.cards.splice(index,1);renderList();render();const next=$(`card-${Math.min(index,state.cards.length-1)}`);(next||$('add-custom')).focus();});
    row.append(input,remove);$('card-list').append(row);
  });
}

function measure(text,size){canvas.font=`800 ${size}px Nunito`;return canvas.measureText(text).width;}
function cardMarkup(card){
  const w=state.cardWidth,h=state.cardHeight;
  const colors={petrol:['#edf4f1','#28645F'],apricot:['#f8e5d8','#343B3B'],mono:['#ffffff','#000000']};
  const [bg,ink]=colors[state.color];
  const padding=Math.min(4,w*.12,h*.12),innerW=w-padding*2,innerH=h-padding*2;
  const hasIcon=card.icon!=='none',hasText=!!card.text.trim();
  const iconSize=hasIcon?Math.min(16,innerW*.65,innerH*(hasText?.43:.85)):0;
  const iconGap=hasIcon&&hasText?Math.min(2,h*.04):0;
  const textHeight=innerH-iconSize-iconGap;
  const fitted=fitText(card.text,innerW,textHeight,measure);
  const textBlock=fitted.lines.length*fitted.fontSize*1.25;
  const totalHeight=iconSize+iconGap+textBlock;
  const top=(h-totalHeight)/2;
  const icon=hasIcon?`<g transform="translate(${(w-iconSize)/2} ${top}) scale(${iconSize/24})" color="${ink}">${symbols[card.icon]}</g>`:'';
  const text=fitted.lines.map((line,i)=>`<text x="${w/2}" y="${top+iconSize+iconGap+fitted.fontSize*(.94+i*1.25)}" text-anchor="middle" fill="${ink}" font-family="Nunito, sans-serif" font-size="${fitted.fontSize}" font-weight="800">${escapeXml(line)}</text>`).join('');
  return `<g transform="translate(${card.x} ${card.y})"><rect x="0" y="0" width="${w}" height="${h}" fill="${bg}" stroke="#343B3B" stroke-width="0.2"/>${icon}${text}</g>`;
}
function sheetMarkup(cards,index,plan,standalone=false){
  const font=standalone&&embeddedFont?`<style>@font-face{font-family:Nunito;src:url(data:font/woff2;base64,${embeddedFont}) format('woff2');font-weight:200 1000}</style>`:'';
  const {pageWidth:w,pageHeight:h,pages}=plan;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="sheet" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" role="img" aria-label="Printark ${index+1} af ${pages.length}, ${cards.length} kort">${font}<title>Open Planner · ark ${index+1} af ${pages.length}</title><rect width="${w}" height="${h}" fill="white"/>${cards.map(cardMarkup).join('')}<g fill="#343B3B" font-family="Nunito, sans-serif" font-size="2.7"><text x="10" y="${h-13}">Open Planner · ${state.cardWidth} × ${state.cardHeight} mm</text><text x="10" y="${h-8}">Ark ${index+1} / ${pages.length} · A4 · print 100 %</text><path d="M${w-60} ${h-10}h50m-50-1.5v3m50-3v3" stroke="#343B3B" stroke-width=".25" fill="none"/><text x="${w-35}" y="${h-5}" text-anchor="middle">Kontrolmål: 50 mm</text></g></svg>`;
}

function render(){
  latest=null;svgPages=[];$('print').disabled=true;$('export-settings').disabled=true;
  try{
    const plan=layout(state);
    const valid=validate(state);
    if(!plan.total){$('sheets').innerHTML='<div class="panel empty-list screen-only">Tilføj kort for at se dit første printark.</div>';$('summary').textContent='Ingen kort endnu';showError('');saveLocal();return;}
    const markup=plan.pages.map((cards,i)=>sheetMarkup(cards,i,plan));
    $('sheets').replaceChildren();
    markup.forEach((svg,i)=>{
      const shell=document.createElement('div');shell.className='sheet-shell';
      const heading=document.createElement('div');heading.className='sheet-heading screen-only';
      const label=document.createElement('span');label.textContent=`Ark ${i+1} af ${plan.pages.length} · ${plan.pages[i].length} kort`;
      const download=document.createElement('button');download.type='button';download.textContent='Hent SVG';download.setAttribute('aria-label',`Hent ark ${i+1} som SVG`);download.addEventListener('click',()=>downloadSheet(i));
      heading.append(label,download);shell.append(heading);shell.insertAdjacentHTML('beforeend',svg);$('sheets').append(shell);
    });
    document.body.classList.toggle('landscape',state.orientation==='landscape');
    let printStyle=$('page-style');if(!printStyle){printStyle=document.createElement('style');printStyle.id='page-style';document.head.append(printStyle);}printStyle.textContent=`@page {size: A4 ${state.orientation}; margin: 0;}`;
    $('summary').textContent=`${plan.total} kort · ${plan.pages.length} ${plan.pages.length===1?'ark':'ark'} · ${valid.cardWidth} × ${valid.cardHeight} mm`;
    showError('');$('print').disabled=false;$('export-settings').disabled=false;
    latest=plan;svgPages=markup;saveLocal();
  }catch(error){showError(error.message);$('summary').textContent='Ret indstillingerne for at lave printark';$('sheets').replaceChildren();}
}

function download(content,name,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
async function downloadSheet(index){
  if(!latest)return;
  try{
    if(!embeddedFont){const res=await fetch('./assets/fonts/Nunito-Variable.woff2');if(!res.ok)throw new Error('Fonten kunne ikke hentes. Prøv igen.');const bytes=new Uint8Array(await res.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));embeddedFont=btoa(binary);}
    if(!latest)return;
    download('<?xml version="1.0" encoding="UTF-8"?>\n'+sheetMarkup(latest.pages[index],index,latest,true),`open-planner-ark-${index+1}.svg`,'image/svg+xml;charset=utf-8');
  }catch(error){showError(error.message);}
}

function appendCards(cards){
  if(!cards.length){feedback('Vælg mindst én ugedag, eller skriv tekst / vælg et ikon.');return;}
  if(cards.some(card=>card.text.length>80)){feedback('Brug højst 80 tegn på hvert kort.');return;}
  if((state.cards.length+cards.length)*state.copies>MAX_CARDS){feedback('Der er plads til højst 200 kort inklusive kopier. Fjern kort eller vælg færre kopier.');return;}
  state.cards.push(...cards);renderList();render();feedback(`${cards.length} ${cards.length===1?'kort tilføjet':'kort tilføjet'}.`);
}

async function init(){
  $('print').disabled=true;
  const response=await fetch('./assets/icons/ui-sprite.svg');if(!response.ok)throw new Error('Ikonerne kunne ikke hentes. Genindlæs siden.');
  const sprite=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
  for(const [key] of Object.entries(ICONS))if(key!=='none'){const symbol=sprite.getElementById(key);if(!symbol)throw new Error(`Ikonet ${key} mangler.`);symbols[key]=symbol.innerHTML;}
  await document.fonts.load('800 16px Nunito');await document.fonts.ready;
  try{const saved=localStorage.getItem(storageKey);if(saved)state=validate(JSON.parse(saved));}catch{feedback('Et tidligere gemt sæt kunne ikke åbnes. Du starter med ugedagene.');}
  DAYS.forEach((day,i)=>{const label=document.createElement('label');const box=document.createElement('input');box.type='checkbox';box.value=day;box.checked=true;box.setAttribute('aria-label',day);label.append(box,document.createTextNode(['Man','Tir','Ons','Tor','Fre','Lør','Søn'][i]));$('weekdays').append(label);});
  for(const [key,label]of Object.entries(ICONS))$('icon').add(new Option(label,key));
  syncFields();renderList();render();
  for(const [id,key]of Object.entries(fields))$(id).addEventListener('input',()=>{state[key]=numeric.has(key)?Number($(id).value):$(id).value;render();});
  $('add-days').addEventListener('click',()=>appendCards([...$('weekdays').querySelectorAll('input:checked')].map(box=>({text:box.value,icon:'none'}))));
  $('add-custom').addEventListener('click',()=>{const icon=$('icon').value;const lines=$('custom-text').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const cards=lines.length?lines.map(text=>({text,icon})):icon!=='none'?[{text:'',icon}]:[];appendCards(cards);});
  $('clear').addEventListener('click',()=>{state.cards=[];renderList();render();feedback('Kortlisten er ryddet. Tilføj et nyt sæt.');});
  $('print').addEventListener('click',()=>{render();if(latest)window.print();});
  $('export-settings').addEventListener('click',()=>{try{const valid=validate(state);download(JSON.stringify({...valid},null,2)+'\n','open-planner-kort.json','application/json');}catch(error){showError(error.message);}});
  $('import-settings').addEventListener('change',async(event)=>{
    const file=event.target.files[0];if(!file)return;
    try{if(file.size>100000)throw new Error('Filen er for stor. Vælg et Open Planner-kortsæt under 100 kB.');const imported=validate(JSON.parse(await file.text()));layout(imported);state=imported;syncFields();renderList();render();feedback('Dit gemte kortsæt er åbnet.');}catch(error){showError('Kortsættet kunne ikke åbnes: '+error.message);}finally{event.target.value='';}
  });
}
init().catch(error=>{showError(error.message);$('print').disabled=true;$('export-settings').disabled=true;});
