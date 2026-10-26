import {DAYS,ICONS,DEFAULT,MAX_CARDS,validate,layout,escapeXml,fitText} from './model.mjs';
import {validateDatabase,normalizeDish,slugify,dishToCard} from './catalog.mjs';

const $=id=>document.getElementById(id);
const storageKey='extruda-open-planner-v1';
const dishStorageKey='extruda-open-planner-dishes-v1';
let state=structuredClone(DEFAULT),latest=null,symbols={},embeddedFont='';
let seedDatabase={version:1,sprog:'da',opdateret:'',standardkortMm:{bredde:69,hoejde:66},retter:[]};
let database=structuredClone(seedDatabase),activeDishId='',activeDishImage=null,pendingDishImage=null;
let persistWarning=false;
const imageCache=new Map();
const canvas=document.createElement('canvas').getContext('2d');
const fields={'card-width':'cardWidth','card-height':'cardHeight',orientation:'orientation',color:'color',copies:'copies'};
const numeric=new Set(['cardWidth','cardHeight','copies']);

function showError(message){$('error').textContent=message;$('error').hidden=!message;}
function feedback(message){$('add-status').textContent=message;}
function dishFeedback(message){$('dish-status').textContent=message;}
function saveLocal(){try{localStorage.setItem(storageKey,JSON.stringify(validate(state)));}catch{if(!persistWarning){feedback('Automatisk lagring er ikke tilgængelig. Brug “Gem kort og mål” for at gemme dit sæt.');persistWarning=true;}}}
function saveDatabase(message='Databasen er gemt i denne browser.'){
  database.opdateret=new Date().toISOString().slice(0,10);
  try{database=validateDatabase(database);localStorage.setItem(dishStorageKey,JSON.stringify(database));dishFeedback(message);return true;}catch(error){dishFeedback(`Kunne ikke gemme lokalt: ${error.message} Hent databasen som JSON for at bevare den.`);return false;}
}
function syncFields(){for(const [id,key] of Object.entries(fields))$(id).value=state[key];}

function renderList(){
  $('list-count').textContent=state.cards.length;
  $('card-list').replaceChildren();
  if(!state.cards.length){const empty=document.createElement('li');empty.className='empty-list';empty.textContent='Din liste er tom. Tilføj en ret, ugedage eller dine egne kort.';$('card-list').append(empty);}
  state.cards.forEach((card,index)=>{
    const row=document.createElement('li');row.className=`card-row${card.image?' has-image':''}`;
    if(card.image){const image=document.createElement('img');image.src=card.image;image.alt='';row.append(image);}
    const input=document.createElement('input');input.id=`card-${index}`;input.value=card.text;input.maxLength=80;input.setAttribute('aria-label',`Tekst på kort ${index+1}${card.icon!=='none'?' ('+ICONS[card.icon]+')':''}`);input.placeholder=card.icon==='none'?'Korttekst':ICONS[card.icon];
    input.addEventListener('input',()=>{card.text=input.value;render();});
    const remove=document.createElement('button');remove.type='button';remove.setAttribute('aria-label',`Fjern kort ${index+1}: ${card.text||ICONS[card.icon]}`);remove.innerHTML='<svg aria-hidden="true"><use href="./assets/icons/ui-sprite.svg#close"></use></svg>';
    remove.addEventListener('click',()=>{state.cards.splice(index,1);renderList();render();const next=$(`card-${Math.min(index,state.cards.length-1)}`);(next||$('add-custom')).focus();});
    row.append(input,remove);$('card-list').append(row);
  });
}

function measure(text,size){canvas.font=`800 ${size}px Nunito`;return canvas.measureText(text).width;}
function cardMarkup(card,index,standalone=false){
  const w=state.cardWidth,h=state.cardHeight;
  const colors={petrol:['#edf4f1','#28645F'],apricot:['#f8e5d8','#343B3B'],mono:['#ffffff','#000000']};
  const [bg,ink]=colors[state.color];
  const padding=Math.min(4,w*.12,h*.12),innerW=w-padding*2,innerH=h-padding*2;
  const hasImage=!!card.image,hasIcon=!hasImage&&card.icon!=='none',hasText=!!card.text.trim();
  const visualSize=hasImage?Math.min(36,innerW*.72,innerH*(hasText?.68:.9)):hasIcon?Math.min(16,innerW*.65,innerH*(hasText?.43:.85)):0;
  const visualGap=(hasImage||hasIcon)&&hasText?Math.min(2.5,h*.045):0;
  const textHeight=innerH-visualSize-visualGap;
  const fitted=fitText(card.text,innerW,textHeight,measure);
  const textBlock=fitted.lines.length*fitted.fontSize*1.25;
  const totalHeight=visualSize+visualGap+textBlock;
  const top=(h-totalHeight)/2;
  const icon=hasIcon?`<g transform="translate(${(w-visualSize)/2} ${top}) scale(${visualSize/24})" color="${ink}">${symbols[card.icon]}</g>`:'';
  const clipId=`dish-photo-${index}`;
  const imageHref=standalone?(imageCache.get(card.image)||card.image):card.image;
  const photo=hasImage?`<defs><clipPath id="${clipId}"><circle cx="${w/2}" cy="${top+visualSize/2}" r="${visualSize/2}"/></clipPath></defs><image href="${escapeXml(imageHref)}" x="${(w-visualSize)/2}" y="${top}" width="${visualSize}" height="${visualSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/><circle cx="${w/2}" cy="${top+visualSize/2}" r="${visualSize/2}" fill="none" stroke="${ink}" stroke-width="0.45"/>`:'';
  const text=fitted.lines.map((line,i)=>`<text x="${w/2}" y="${top+visualSize+visualGap+fitted.fontSize*(.94+i*1.25)}" text-anchor="middle" fill="${ink}" font-family="Nunito, sans-serif" font-size="${fitted.fontSize}" font-weight="800">${escapeXml(line)}</text>`).join('');
  return `<g transform="translate(${card.x} ${card.y})"><rect x="0" y="0" width="${w}" height="${h}" fill="${bg}" stroke="#343B3B" stroke-width="0.2"/>${photo}${icon}${text}</g>`;
}
function sheetMarkup(cards,index,plan,standalone=false){
  const font=standalone&&embeddedFont?`<style>@font-face{font-family:Nunito;src:url(data:font/woff2;base64,${embeddedFont}) format('woff2');font-weight:200 1000}</style>`:'';
  const {pageWidth:w,pageHeight:h,pages}=plan;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="sheet" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" role="img" aria-label="Printark ${index+1} af ${pages.length}, ${cards.length} kort">${font}<title>Open Planner · ark ${index+1} af ${pages.length}</title><rect width="${w}" height="${h}" fill="white"/>${cards.map((card,cardIndex)=>cardMarkup(card,cardIndex,standalone)).join('')}<g fill="#343B3B" font-family="Nunito, sans-serif" font-size="2.7"><text x="10" y="${h-13}">Open Planner · ${state.cardWidth} × ${state.cardHeight} mm</text><text x="10" y="${h-8}">Ark ${index+1} / ${pages.length} · A4 · print 100 %</text><path d="M${w-60} ${h-10}h50m-50-1.5v3m50-3v3" stroke="#343B3B" stroke-width=".25" fill="none"/><text x="${w-35}" y="${h-5}" text-anchor="middle">Kontrolmål: 50 mm</text></g></svg>`;
}

function render(){
  latest=null;$('print').disabled=true;$('export-settings').disabled=true;
  try{
    const plan=layout(state);const valid=validate(state);
    if(!plan.total){$('sheets').innerHTML='<div class="panel empty-list screen-only">Tilføj kort for at se dit første printark.</div>';$('summary').textContent='Ingen kort endnu';showError('');saveLocal();return;}
    const markup=plan.pages.map((cards,i)=>sheetMarkup(cards,i,plan));
    $('sheets').replaceChildren();
    markup.forEach((svg,i)=>{const shell=document.createElement('div');shell.className='sheet-shell';const heading=document.createElement('div');heading.className='sheet-heading screen-only';const label=document.createElement('span');label.textContent=`Ark ${i+1} af ${plan.pages.length} · ${plan.pages[i].length} kort`;const button=document.createElement('button');button.type='button';button.textContent='Hent SVG';button.setAttribute('aria-label',`Hent ark ${i+1} som SVG`);button.addEventListener('click',()=>downloadSheet(i));heading.append(label,button);shell.append(heading);shell.insertAdjacentHTML('beforeend',svg);$('sheets').append(shell);});
    document.body.classList.toggle('landscape',state.orientation==='landscape');
    let printStyle=$('page-style');if(!printStyle){printStyle=document.createElement('style');printStyle.id='page-style';document.head.append(printStyle);}printStyle.textContent=`@page {size: A4 ${state.orientation}; margin: 0;}`;
    $('summary').textContent=`${plan.total} kort · ${plan.pages.length} ${plan.pages.length===1?'ark':'ark'} · ${valid.cardWidth} × ${valid.cardHeight} mm`;
    showError('');$('print').disabled=false;$('export-settings').disabled=false;latest=plan;saveLocal();
  }catch(error){showError(error.message);$('summary').textContent='Ret indstillingerne for at lave printark';$('sheets').replaceChildren();}
}

function download(content,name,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Billedet kunne ikke læses.'));reader.readAsDataURL(blob);});}
async function cacheImage(source){if(!source||imageCache.has(source))return;if(source.startsWith('data:')){imageCache.set(source,source);return;}const response=await fetch(source);if(!response.ok)throw new Error('Et kortbillede kunne ikke hentes. Prøv igen.');imageCache.set(source,await blobToDataUrl(await response.blob()));}
async function downloadSheet(index){
  if(!latest)return;
  try{
    if(!embeddedFont){const res=await fetch('./assets/fonts/Nunito-Variable.woff2');if(!res.ok)throw new Error('Fonten kunne ikke hentes. Prøv igen.');const bytes=new Uint8Array(await res.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));embeddedFont=btoa(binary);}
    await Promise.all([...new Set(latest.pages[index].map(card=>card.image).filter(Boolean))].map(cacheImage));
    if(!latest)return;
    download('<?xml version="1.0" encoding="UTF-8"?>\n'+sheetMarkup(latest.pages[index],index,latest,true),`open-planner-ark-${index+1}.svg`,'image/svg+xml;charset=utf-8');
  }catch(error){showError(error.message);}
}

function appendCards(cards){
  if(!cards.length){feedback('Vælg mindst én ret, ugedag, eller skriv tekst / vælg et ikon.');return;}
  if(cards.some(card=>card.text.length>80)){feedback('Brug højst 80 tegn på hvert kort.');return;}
  if((state.cards.length+cards.length)*state.copies>MAX_CARDS){feedback('Der er plads til højst 200 kort inklusive kopier. Fjern kort eller vælg færre kopier.');return;}
  state.cards.push(...cards);renderList();render();feedback(`${cards.length} ${cards.length===1?'kort tilføjet':'kort tilføjet'}.`);
}

function renderDishPreview(){
  const host=$('dish-image-preview');host.replaceChildren();const source=pendingDishImage||activeDishImage;
  if(source){const image=document.createElement('img');image.src=source;image.alt='Forhåndsvisning af rettens billede';host.append(image);}else{const empty=document.createElement('span');empty.textContent='Intet billede valgt';host.append(empty);}
}
function showDishEditor(item=null){
  activeDishId=item?.id||'';activeDishImage=item?.billede||null;pendingDishImage=null;
  $('dish-id').value=activeDishId;$('dish-name').value=item?.navn||'';$('dish-ingredients').value=(item?.ingredienser||[]).join('\n');$('dish-method').value=item?.fremgangsmaade||'';$('dish-image').value='';$('delete-dish').hidden=!item;
  renderDishPreview();$('dish-editor').open=true;$('dish-name').focus();
}
function renderDishes(){
  const filter=$('dish-search').value.trim().toLocaleLowerCase('da');
  const items=database.retter.filter(item=>item.navn.toLocaleLowerCase('da').includes(filter));
  $('dish-count').textContent=`${items.length} af ${database.retter.length} retter`;$('dish-list').replaceChildren();
  if(!items.length){const empty=document.createElement('p');empty.className='empty-list';empty.textContent='Ingen retter matcher din søgning.';$('dish-list').append(empty);return;}
  for(const item of items){
    const card=document.createElement('article');card.className='dish-row';
    const media=document.createElement('div');media.className='dish-thumb';
    if(item.billede){const image=document.createElement('img');image.src=item.billede;image.alt='';media.append(image);}else{media.textContent='Foto';}
    const info=document.createElement('div');info.className='dish-info';const title=document.createElement('h3');title.textContent=item.navn;const meta=document.createElement('p');meta.textContent=item.ingredienser.length?`${item.ingredienser.length} ingredienser`:'Opskrift kan tilføjes';info.append(title,meta);
    const actions=document.createElement('div');actions.className='dish-actions';const add=document.createElement('button');add.type='button';add.className='dish-add';add.textContent='Lav kort';add.addEventListener('click',()=>{appendCards([dishToCard(item)]);dishFeedback(`“${item.navn}” er tilføjet til kortlisten.`);});const edit=document.createElement('button');edit.type='button';edit.className='dish-edit';edit.textContent='Rediger';edit.addEventListener('click',()=>showDishEditor(item));actions.append(add,edit);card.append(media,info,actions);$('dish-list').append(card);
  }
}
async function resizeDishImage(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8000000)throw new Error('Vælg PNG, JPEG eller WebP under 8 MB.');
  const url=URL.createObjectURL(file);
  try{
    const image=await new Promise((resolve,reject)=>{const node=new Image();node.onload=()=>resolve(node);node.onerror=()=>reject(new Error('Billedet kunne ikke åbnes.'));node.src=url;});
    const side=Math.min(image.naturalWidth,image.naturalHeight),sx=(image.naturalWidth-side)/2,sy=(image.naturalHeight-side)/2,size=Math.min(640,side);
    const surface=document.createElement('canvas');surface.width=size;surface.height=size;const context=surface.getContext('2d');context.fillStyle='#F5F0E8';context.fillRect(0,0,size,size);context.drawImage(image,sx,sy,side,side,0,0,size,size);return surface.toDataURL('image/jpeg',.84);
  }finally{URL.revokeObjectURL(url);}
}
function uniqueDishId(name){const base=slugify(name);let id=base,index=2;while(database.retter.some(item=>item.id===id&&item.id!==activeDishId))id=`${base}-${index++}`;return id;}
async function saveDish(event){
  event.preventDefault();
  try{
    const file=$('dish-image').files[0];if(file&&!pendingDishImage)pendingDishImage=await resizeDishImage(file);
    const item=normalizeDish({id:activeDishId||uniqueDishId($('dish-name').value),navn:$('dish-name').value,billede:pendingDishImage||activeDishImage,ingredienser:$('dish-ingredients').value,fremgangsmaade:$('dish-method').value});
    const index=database.retter.findIndex(value=>value.id===activeDishId);if(index>=0)database.retter[index]=item;else database.retter.push(item);
    activeDishId=item.id;activeDishImage=item.billede;pendingDishImage=null;saveDatabase(`“${item.navn}” er gemt i denne browser.`);renderDishes();$('dish-editor').open=false;
  }catch(error){dishFeedback(error.message);}
}
function deleteDish(){
  const item=database.retter.find(value=>value.id===activeDishId);if(!item)return;
  if(!window.confirm(`Slet “${item.navn}” fra din lokale database?`))return;
  database.retter=database.retter.filter(value=>value.id!==activeDishId);saveDatabase(`“${item.navn}” er slettet lokalt.`);showDishEditor();$('dish-editor').open=false;renderDishes();
}
async function loadDishDatabase(){
  const response=await fetch('./data/retter.json');if(!response.ok)throw new Error('Retdatabasen kunne ikke hentes.');seedDatabase=validateDatabase(await response.json());database=structuredClone(seedDatabase);
  try{const saved=localStorage.getItem(dishStorageKey);if(saved)database=validateDatabase(JSON.parse(saved));}catch{dishFeedback('Din lokale database kunne ikke åbnes. Den offentlige database er indlæst i stedet.');}
  renderDishes();
}

async function init(){
  $('print').disabled=true;
  const response=await fetch('./assets/icons/ui-sprite.svg');if(!response.ok)throw new Error('Ikonerne kunne ikke hentes. Genindlæs siden.');
  const sprite=new DOMParser().parseFromString(await response.text(),'image/svg+xml');for(const [key] of Object.entries(ICONS))if(key!=='none'){const symbol=sprite.getElementById(key);if(!symbol)throw new Error(`Ikonet ${key} mangler.`);symbols[key]=symbol.innerHTML;}
  await document.fonts.load('800 16px Nunito');await document.fonts.ready;
  try{const saved=localStorage.getItem(storageKey);if(saved)state=validate(JSON.parse(saved));}catch{feedback('Et tidligere gemt sæt kunne ikke åbnes. Du starter med ugedagene.');}
  DAYS.forEach((day,i)=>{const label=document.createElement('label');const box=document.createElement('input');box.type='checkbox';box.value=day;box.checked=true;box.setAttribute('aria-label',day);label.append(box,document.createTextNode(['Man','Tir','Ons','Tor','Fre','Lør','Søn'][i]));$('weekdays').append(label);});
  for(const [key,label]of Object.entries(ICONS))$('icon').add(new Option(label,key));
  syncFields();renderList();render();
  try{await loadDishDatabase();}catch(error){dishFeedback(error.message);renderDishes();}
  for(const [id,key]of Object.entries(fields))$(id).addEventListener('input',()=>{state[key]=numeric.has(key)?Number($(id).value):$(id).value;render();});
  $('add-days').addEventListener('click',()=>appendCards([...$('weekdays').querySelectorAll('input:checked')].map(box=>({text:box.value,icon:'none',image:''}))));
  $('add-custom').addEventListener('click',()=>{const icon=$('icon').value;const lines=$('custom-text').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const cards=lines.length?lines.map(text=>({text,icon,image:''})):icon!=='none'?[{text:'',icon,image:''}]:[];appendCards(cards);});
  $('clear').addEventListener('click',()=>{state.cards=[];renderList();render();feedback('Kortlisten er ryddet. Tilføj et nyt sæt.');});
  $('print').addEventListener('click',()=>{render();if(latest)window.print();});
  $('export-settings').addEventListener('click',()=>{try{download(JSON.stringify(validate(state),null,2)+'\n','open-planner-kort.json','application/json');}catch(error){showError(error.message);}});
  $('import-settings').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>25000000)throw new Error('Filen er for stor. Vælg et Open Planner-kortsæt under 25 MB.');const imported=validate(JSON.parse(await file.text()));layout(imported);state=imported;syncFields();renderList();render();feedback('Dit gemte kortsæt er åbnet.');}catch(error){showError('Kortsættet kunne ikke åbnes: '+error.message);}finally{event.target.value='';}});
  $('dish-search').addEventListener('input',renderDishes);$('new-dish').addEventListener('click',()=>showDishEditor());$('dish-form').addEventListener('submit',saveDish);$('delete-dish').addEventListener('click',deleteDish);
  $('dish-image').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{pendingDishImage=await resizeDishImage(file);renderDishPreview();dishFeedback('Billedet er klar. Tryk “Gem ret” for at bevare det.');}catch(error){dishFeedback(error.message);event.target.value='';}});
  $('export-dishes').addEventListener('click',()=>{try{download(JSON.stringify(validateDatabase(database),null,2)+'\n','open-planner-retter.json','application/json');dishFeedback('Databasen er hentet som JSON.');}catch(error){dishFeedback(error.message);}});
  $('import-dishes').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>25000000)throw new Error('Vælg en database under 25 MB.');database=validateDatabase(JSON.parse(await file.text()));saveDatabase('Databasen er åbnet og gemt i denne browser.');renderDishes();}catch(error){dishFeedback(`Databasen kunne ikke åbnes: ${error.message}`);}finally{event.target.value='';}});
  $('reset-dishes').addEventListener('click',()=>{if(!window.confirm('Nulstil dine lokale retter og ændringer til den offentlige database?'))return;localStorage.removeItem(dishStorageKey);database=structuredClone(seedDatabase);renderDishes();$('dish-editor').open=false;dishFeedback('Den offentlige database er indlæst igen.');});
}
init().catch(error=>{showError(error.message);$('print').disabled=true;$('export-settings').disabled=true;});
