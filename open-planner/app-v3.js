import {DAYS,ICONS,DEFAULT,MAX_CARDS,validate,layout,escapeXml,fitText} from './model.mjs?v=20261027-db1';
import {validateDatabase,normalizeDish,slugify,dishToCard,portableDatabase} from './catalog.mjs?v=20261027-db1';
import {foodMarkup} from './food.mjs?v=20261027-db1';
import {DatabaseFileSession} from './database-file.mjs?v=20261027-db1';
import {sheetMarkup as buildSheet} from './sheet.mjs?v=20261027-db1';

const $=id=>document.getElementById(id);
const storageKey='extruda-open-planner-v1';
const dishStorageKey='extruda-open-planner-dishes-v1';
let state=structuredClone(DEFAULT),latest=null,symbols={},embeddedFont='';
let seedDatabase={version:1,sprog:'da',opdateret:'',standardkortMm:{bredde:69,hoejde:66},retter:[]};
let database=structuredClone(seedDatabase),activeDishId='',activeDishImage=null,pendingDishImage=null;
let persistWarning=false;
let editorDirty=false,sourceChosen=false,editorEpoch=0,sourceBusy=false,seedReady=false;
const fileSession=new DatabaseFileSession(async source=>{await cacheImage(source);return imageCache.get(source);},source=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(new Error('Et billede i databasen kunne ikke åbnes. Din aktive database er bevaret.'));image.src=source;}));
const imageCache=new Map();
const metadataFreeImages=new Map();
const canvas=document.createElement('canvas').getContext('2d');
const fields={'card-width':'cardWidth','card-height':'cardHeight',orientation:'orientation',color:'color',copies:'copies'};
const numeric=new Set(['cardWidth','cardHeight','copies']);

function showError(message){$('error').textContent=message;$('error').hidden=!message;}
function feedback(message){$('add-status').textContent=message;}
function dishFeedback(message){$('dish-status').textContent=message;}
function saveLocal(){try{localStorage.setItem(storageKey,JSON.stringify(validate(state)));}catch{if(!persistWarning){feedback('Automatisk lagring er ikke tilgængelig. Brug “Gem kort og mål” for at gemme dit sæt.');persistWarning=true;}}}
function saveDatabase(message='Ændringerne er anvendt. Gem databasen for at bevare dem.',next=database){
  try{fileSession.edit(next);database=fileSession.data;editorDirty=false;updateDatabaseStatus();dishFeedback(message);return true;}catch(error){dishFeedback(error.message);return false;}
}
function syncFields(){for(const [id,key] of Object.entries(fields))$(id).value=state[key];for(const id of ['showBranding','showQr','showFooter','includeMetadata'])$(id).checked=state[id]??true;for(const id of ['paperColor','inkColor'])$(id).value=state[id]??(id==='paperColor'?'#F5F0E8':'#28645F');}

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
function cardMarkup(card,index,standalone=false,settings=state){
  const w=settings.cardWidth,h=settings.cardHeight;
  const imageHref=settings.includeMetadata===false&&metadataFreeImages.has(card.image)?metadataFreeImages.get(card.image):standalone?(imageCache.get(card.image)||card.image):card.image;
  const colors={petrol:['#edf4f1','#28645F'],apricot:['#f8e5d8','#343B3B'],mono:['#ffffff','#000000'],custom:[settings.paperColor,settings.inkColor]};
  const [bg,ink]=colors[settings.color];
  if(card.kind==='food'||card.image)return foodMarkup(card,w,h,measure,imageHref,index,{background:settings.color==='petrol'?'#F5F0E8':bg,ink,showQr:settings.showQr,showBranding:settings.showBranding,includeMetadata:settings.includeMetadata,monochrome:settings.color==='mono'});
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
  const photo=hasImage?`<defs><clipPath id="${clipId}"><circle cx="${w/2}" cy="${top+visualSize/2}" r="${visualSize/2}"/></clipPath></defs><image href="${escapeXml(imageHref)}" x="${(w-visualSize)/2}" y="${top}" width="${visualSize}" height="${visualSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/><circle cx="${w/2}" cy="${top+visualSize/2}" r="${visualSize/2}" fill="none" stroke="${ink}" stroke-width="0.45"/>`:'';
  const text=fitted.lines.map((line,i)=>`<text x="${w/2}" y="${top+visualSize+visualGap+fitted.fontSize*(.94+i*1.25)}" text-anchor="middle" fill="${ink}" font-family="Nunito, sans-serif" font-size="${fitted.fontSize}" font-weight="800">${escapeXml(line)}</text>`).join('');
  return `<g transform="translate(${card.x} ${card.y})"><rect x="0" y="0" width="${w}" height="${h}" fill="${bg}" stroke="#343B3B" stroke-width="0.2"/>${photo}${icon}${text}</g>`;
}
function sheetMarkup(cards,index,plan,standalone=false,settings=state){
  const font=standalone&&embeddedFont?`<style>@font-face{font-family:Nunito;src:url(data:font/woff2;base64,${embeddedFont}) format('woff2');font-weight:200 1000}</style>`:'';
  return buildSheet({cards,index,plan,state:settings,font,renderCard:(card,id)=>cardMarkup(card,id,standalone,settings)});
}

function render(){
  latest=null;$('print').disabled=true;$('export-settings').disabled=true;
  try{
    const plan=layout(state);const valid=validate(state);document.querySelector('.print-help p').textContent=valid.showFooter?'Print A4 i 100 % / faktisk størrelse uden sidehoved og sidefod. Mål 50 mm-kontrolstregen, før du klipper.':'Print A4 i 100 % / faktisk størrelse uden sidehoved og sidefod. Kontrollér kortenes mål, før du klipper.';for(const key of ['showBranding','showQr','showFooter','includeMetadata','paperColor','inkColor'])state[key]=valid[key];$('showQr').disabled=!state.showBranding;
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
async function cacheImage(source){if(!source||imageCache.has(source))return;if(source.startsWith('data:')){imageCache.set(source,source);return;}const response=await fetch(source);if(!response.ok)throw new Error('Et kortbillede kunne ikke hentes. Prøv igen.');let dataUrl=await blobToDataUrl(await response.blob());if(/\.webp$/i.test(source))dataUrl=dataUrl.replace(/^data:[^;]+;/,'data:image/webp;');imageCache.set(source,dataUrl);}
async function stripImageMetadata(source){
  if(!source||metadataFreeImages.has(source))return;await cacheImage(source);
  const image=await new Promise((resolve,reject)=>{const node=new Image();node.onload=()=>resolve(node);node.onerror=()=>reject(new Error('Billedet kunne ikke klargøres uden metadata.'));node.src=imageCache.get(source);});
  const surface=document.createElement('canvas');surface.width=image.naturalWidth;surface.height=image.naturalHeight;surface.getContext('2d').drawImage(image,0,0);metadataFreeImages.set(source,surface.toDataURL('image/png'));surface.width=surface.height=1;
}
async function downloadSheet(index){
  if(!latest)return;
  try{
    const settings=validate(state),plan=layout(settings);if(!plan.pages[index])return;
    if(!embeddedFont){const res=await fetch('./assets/fonts/Nunito-Variable.woff2');if(!res.ok)throw new Error('Fonten kunne ikke hentes. Prøv igen.');const bytes=new Uint8Array(await res.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));embeddedFont=btoa(binary);}
    const sources=[...new Set(plan.pages[index].map(card=>card.image).filter(Boolean))];for(const source of sources){await cacheImage(source);if(!settings.includeMetadata)await stripImageMetadata(source);}
    download('<?xml version="1.0" encoding="UTF-8"?>\n'+sheetMarkup(plan.pages[index],index,plan,true,settings),`open-planner-ark-${index+1}.svg`,'image/svg+xml;charset=utf-8');
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
  if(editorDirty&&!window.confirm('Der er rettelser i den åbne ret. Vil du skifte ret uden at anvende dem?'))return;
  editorEpoch++;
  activeDishId=item?.id||'';activeDishImage=item?.billede||null;pendingDishImage=null;
  $('dish-id').value=activeDishId;$('dish-name').value=item?.navn||'';$('dish-ingredients').value=(item?.ingredienser||[]).join('\n');$('dish-method').value=item?.fremgangsmaade||'';$('dish-image').value='';$('delete-dish').hidden=!item;
  editorDirty=false;updateDatabaseStatus();renderDishPreview();$('dish-editor').open=true;$('dish-name').focus();
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
    const actions=document.createElement('div');actions.className='dish-actions';const add=document.createElement('button');add.type='button';add.className='dish-add';add.textContent='Tilføj kort';add.setAttribute('aria-label',`Tilføj kort: ${item.navn}`);add.addEventListener('click',()=>{appendCards([dishToCard(item)]);dishFeedback(`“${item.navn}” er tilføjet til kortlisten.`);});const edit=document.createElement('button');edit.type='button';edit.className='dish-edit';edit.textContent='Rediger';edit.setAttribute('aria-label',`Rediger ${item.navn}`);edit.addEventListener('click',()=>showDishEditor(item));actions.append(add,edit);card.append(media,info,actions);$('dish-list').append(card);
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
  const epoch=editorEpoch;
  try{
    const file=$('dish-image').files[0];if(file&&!pendingDishImage){const resized=await resizeDishImage(file);if(epoch!==editorEpoch)return;pendingDishImage=resized;}
    if(epoch!==editorEpoch)return;
    const item=normalizeDish({id:activeDishId||uniqueDishId($('dish-name').value),navn:$('dish-name').value,billede:pendingDishImage||activeDishImage,ingredienser:$('dish-ingredients').value,fremgangsmaade:$('dish-method').value});
    const next=structuredClone(database);const index=next.retter.findIndex(value=>value.id===activeDishId);if(index>=0)next.retter[index]=item;else next.retter.push(item);
    if(!saveDatabase(`“${item.navn}” er anvendt. Gem databasen for at bevare ændringen.`,next))return;
    activeDishId=item.id;activeDishImage=item.billede;pendingDishImage=null;renderDishes();$('dish-editor').open=false;
  }catch(error){dishFeedback(error.message);}
}
function deleteDish(){
  const item=database.retter.find(value=>value.id===activeDishId);if(!item)return;
  if(!window.confirm(`Slet “${item.navn}” fra din lokale database?`))return;
  const next={...database,retter:database.retter.filter(value=>value.id!==activeDishId)};if(!saveDatabase(`“${item.navn}” er fjernet. Gem databasen for at bevare ændringen.`,next))return;showDishEditor();$('dish-editor').open=false;renderDishes();
}
async function loadDishDatabase(){
  const response=await fetch('./data/retter.json');if(!response.ok)throw new Error('Standarddatabasen kunne ikke hentes. Prøv at genindlæse siden.');seedDatabase=validateDatabase(await response.json());
  try{$('restore-browser').hidden=!localStorage.getItem(dishStorageKey);}catch{}
}

function updateDatabaseStatus(){
  const active=fileSession.source!=='none';
  $('database-name').textContent=active?fileSession.name:'Vælg en database';
  $('database-state').textContent=editorDirty?'En ret har rettelser, som ikke er anvendt':fileSession.dirty?'Ændringer er ikke gemt i en fil':fileSession.source==='file'?'Gemt i den valgte fil':fileSession.source==='standard'?'Standarddatabase · uændret':fileSession.source==='import'?'Importeret kopi · hent en ny kopi efter ændringer':'Klar';
  $('database-state').classList.toggle('unsaved',editorDirty||fileSession.dirty);
  $('save-file').disabled=!active||fileSession.busy||sourceBusy;$('save-as').disabled=!active||fileSession.busy||sourceBusy;
  $('use-standard').disabled=!seedReady||sourceBusy||fileSession.busy;$('download-standard').disabled=!seedReady;
  for(const id of ['open-local','new-database','restore-browser','change-source','close-source'])$(id).disabled=sourceBusy||fileSession.busy;
  for(const element of document.querySelectorAll('#dish-form input,#dish-form textarea,#dish-form button,#dish-list button,#dish-search,#new-dish'))element.disabled=sourceBusy;
  $('save-file').textContent=!filePickerSupported()?'Hent database':fileSession.source==='file'?'Gem fil':'Gem som fil';
  $('close-source').hidden=!sourceChosen;
  $('database-name').title=fileSession.source==='file'?'Din valgte lokale fil':'';
}
function activateWorkspace(){
  database=fileSession.data;sourceChosen=true;editorDirty=false;editorEpoch++;$('source-start').hidden=true;$('planner-work').hidden=false;$('database-bar').hidden=false;$('dish-editor').open=false;$('dish-search').value='';renderDishes();updateDatabaseStatus();
}
async function permitSourceChange(){
  if(fileSession.busy||sourceBusy){dishFeedback('Vent til filhandlingen er færdig.');return false;}
  if(!fileSession.dirty&&!editorDirty)return true;
  const choice=await new Promise(resolve=>{
    const dialog=$('source-confirm');const finish=value=>{dialog.close();resolve(value);};
    $('source-stay').onclick=()=>finish('stay');$('source-discard').onclick=()=>finish('discard');$('source-save').onclick=()=>finish('save');dialog.oncancel=event=>{event.preventDefault();finish('stay');};dialog.showModal();
  });
  if(choice==='save')return await saveActiveDatabase();
  return choice==='discard';
}
async function applyPendingDish(){if(!editorDirty)return true;await saveDish({preventDefault(){}});return !editorDirty;}
function filePickerSupported(){return typeof window.showOpenFilePicker==='function'&&typeof window.showSaveFilePicker==='function';}
const pickerTypes=[{description:'Open Planner-database',accept:{'application/json':['.json']}}];
function operationError(error){if(error.name==='AbortError')dishFeedback('Handlingen blev annulleret. Dine rettelser er bevaret.');else if(['SecurityError','NotAllowedError'].includes(error.name))dishFeedback('Browseren tillader ikke direkte filadgang her. Brug Importér databasefil og Hent kopi i stedet. Dine rettelser er bevaret.');else dishFeedback(error.message||'Filen kunne ikke åbnes eller gemmes.');updateDatabaseStatus();}
async function saveActiveDatabase(asNew=false){
  if(!sourceChosen||fileSession.busy)return false;
  if(!await applyPendingDish())return false;
  try{
    if(!filePickerSupported()){
      const text=await fileSession.serialize();download(text,'open-planner-database.json','application/json');
      // A download cannot prove the file was saved: retain the unsaved status.
      dishFeedback('En komplet kopi er hentet. Browseren kan ikke bekræfte, hvor filen er gemt; rettelserne beholdes her.');updateDatabaseStatus();return false;
    }
    const handle=asNew||!fileSession.handle?await window.showSaveFilePicker({suggestedName:'open-planner-database.json',types:pickerTypes}):fileSession.handle;
    const savePromise=fileSession.save(handle,{saveAs:asNew||handle!==fileSession.handle});updateDatabaseStatus();dishFeedback('Gemmer filen…');await savePromise;database=fileSession.data;updateDatabaseStatus();dishFeedback(`Gemt i ${fileSession.name}.${fileSession.dirty||editorDirty?' Der er nyere rettelser, som endnu ikke er gemt.':''}`);return !fileSession.dirty&&!editorDirty;
  }catch(error){operationError(error);return false;}
}
async function selectStandard(){try{if(!await permitSourceChange())return;fileSession.activate(structuredClone(seedDatabase));activateWorkspace();dishFeedback('Standarddatabasen er klar. Vælg retter, og print dine kort.');}catch(error){operationError(error);}}
async function openDatabase(){
  if(!filePickerSupported()){$('import-dishes').click();return;}
  if(!await permitSourceChange())return;
  sourceBusy=true;updateDatabaseStatus();
  try{const [handle]=await window.showOpenFilePicker({multiple:false,types:pickerTypes});dishFeedback('Åbner og kontrollerer databasen…');await fileSession.open(handle);activateWorkspace();dishFeedback(fileSession.dirty?'Filen er åbnet. Gem den for at opdatere til det nye komplette format.':`Åbnet: ${fileSession.name}. Rettelser gemmes kun, når du vælger Gem fil.`);}catch(error){operationError(error);}finally{sourceBusy=false;updateDatabaseStatus();}
}
async function exportComplete(value,name){const complete=await portableDatabase(value,async source=>{await cacheImage(source);return imageCache.get(source);});download(JSON.stringify(complete,null,2)+'\n',name,'application/json');}
async function newDatabase(){
  if(!await permitSourceChange())return;
  sourceBusy=true;updateDatabaseStatus();
  try{
    const empty=validateDatabase({version:1,retter:[]});
    if(filePickerSupported()){
      const handle=await window.showSaveFilePicker({suggestedName:'mine-retter.json',types:pickerTypes});
      const draft=new DatabaseFileSession(fileSession.resolveImage);draft.activate(empty,{source:'import',name:'Ny database',dirty:true});await draft.save(handle,{saveAs:true});
      fileSession.activate(draft.data,{source:draft.source,name:draft.name,handle:draft.handle,baseline:draft.baseline});
    }else fileSession.activate(empty,{source:'import',name:'Ny database · hent en kopi for at gemme',dirty:true});
    activateWorkspace();dishFeedback('Din nye database er klar. Tilføj din første ret.');
  }catch(error){operationError(error);}finally{sourceBusy=false;updateDatabaseStatus();}
}

async function init(){
  $('print').disabled=true;
  const response=await fetch('./assets/icons/ui-sprite.svg');if(!response.ok)throw new Error('Ikonerne kunne ikke hentes. Genindlæs siden.');
  const sprite=new DOMParser().parseFromString(await response.text(),'image/svg+xml');for(const [key] of Object.entries(ICONS))if(key!=='none'){const symbol=sprite.getElementById(key);if(!symbol)throw new Error(`Ikonet ${key} mangler.`);symbols[key]=symbol.innerHTML;}
  await document.fonts.load('800 16px Nunito');await document.fonts.ready;
  state.cards=[];
  try{const saved=localStorage.getItem(storageKey);if(saved)state=validate(JSON.parse(saved));}catch{feedback('Et tidligere gemt sæt kunne ikke åbnes. Tilføj kort for at begynde.');}
  DAYS.forEach((day,i)=>{const label=document.createElement('label');const box=document.createElement('input');box.type='checkbox';box.value=day;box.checked=true;box.setAttribute('aria-label',day);label.append(box,document.createTextNode(['Man','Tir','Ons','Tor','Fre','Lør','Søn'][i]));$('weekdays').append(label);});
  for(const [key,label]of Object.entries(ICONS))$('icon').add(new Option(label,key));
  syncFields();renderList();render();
  loadDishDatabase().then(()=>{seedReady=true;updateDatabaseStatus();}).catch(error=>dishFeedback(error.message));
  updateDatabaseStatus();
  for(const [id,key]of Object.entries(fields))$(id).addEventListener('input',()=>{state[key]=numeric.has(key)?Number($(id).value):$(id).value;render();});
  $('add-days').addEventListener('click',()=>appendCards([...$('weekdays').querySelectorAll('input:checked')].map(box=>({text:box.value,icon:'none',image:''}))));
  $('add-custom').addEventListener('click',()=>{const icon=$('icon').value;const lines=$('custom-text').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const cards=lines.length?lines.map(text=>({text,icon,image:''})):icon!=='none'?[{text:'',icon,image:''}]:[];appendCards(cards);});
  $('clear').addEventListener('click',()=>{state.cards=[];renderList();render();feedback('Kortlisten er ryddet. Tilføj et nyt sæt.');});
  $('print').addEventListener('click',async()=>{try{if(state.includeMetadata===false)for(const source of [...new Set(state.cards.map(c=>c.image).filter(Boolean))])await stripImageMetadata(source);render();if(latest)window.print();}catch(error){showError(error.message);}});
  $('export-settings').addEventListener('click',async()=>{try{const snapshot=validate(state);await Promise.all([...new Set(snapshot.cards.map(c=>c.image).filter(Boolean))].map(cacheImage));snapshot.cards=snapshot.cards.map(c=>({...c,image:imageCache.get(c.image)||c.image}));download(JSON.stringify(snapshot,null,2)+'\n','open-planner-kort.json','application/json');}catch(error){showError(error.message);}});
  $('import-settings').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>25000000)throw new Error('Filen er for stor. Vælg et Open Planner-kortsæt under 25 MB.');const imported=validate(JSON.parse(await file.text()));layout(imported);state=imported;syncFields();renderList();render();feedback('Dit gemte kortsæt er åbnet.');}catch(error){showError('Kortsættet kunne ikke åbnes: '+error.message);}finally{event.target.value='';}});
  $('dish-search').addEventListener('input',renderDishes);$('new-dish').addEventListener('click',()=>showDishEditor());$('dish-form').addEventListener('submit',saveDish);$('delete-dish').addEventListener('click',deleteDish);
  $('dish-image').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;const epoch=editorEpoch;try{const resized=await resizeDishImage(file);if(epoch!==editorEpoch)return;pendingDishImage=resized;renderDishPreview();dishFeedback('Billedet er klar. Vælg Anvend ret for at bruge det.');}catch(error){dishFeedback(error.message);event.target.value='';}});
  $('export-dishes').addEventListener('click',async()=>{try{if(!await applyPendingDish())return;await exportComplete(database,'open-planner-database.json');dishFeedback('En komplet database med billeder er hentet. Behold kopien, før du lukker siden.');}catch(error){operationError(error);}});
  $('import-dishes').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(!await permitSourceChange())return;sourceBusy=true;updateDatabaseStatus();dishFeedback('Åbner og kontrollerer databasen…');await fileSession.import(file);activateWorkspace();dishFeedback(`Importeret: ${file.name}. Hent en kopi, når du har lavet ændringer.`);}catch(error){operationError(error);}finally{sourceBusy=false;updateDatabaseStatus();event.target.value='';}});
  $('use-standard').addEventListener('click',selectStandard);$('open-local').addEventListener('click',openDatabase);$('new-database').addEventListener('click',newDatabase);
  $('download-standard').addEventListener('click',async()=>{try{await exportComplete(seedDatabase,'open-planner-standarddatabase.json');dishFeedback('Standarddatabasen er hentet med alle billeder. Din aktive database er ikke ændret.');}catch(error){operationError(error);}});
  $('save-file').addEventListener('click',()=>saveActiveDatabase());$('save-as').addEventListener('click',()=>saveActiveDatabase(true));
  $('change-source').addEventListener('click',()=>{$('source-start').hidden=false;$('source-start').scrollIntoView();});
  $('close-source').addEventListener('click',()=>{if(sourceChosen)$('source-start').hidden=true;});
  $('restore-browser').addEventListener('click',async()=>{try{if(!await permitSourceChange())return;const saved=localStorage.getItem(dishStorageKey);if(!saved)throw new Error('Der er ingen tidligere browserkopi.');fileSession.activate(validateDatabase(JSON.parse(saved)),{source:'browser',name:'Tidligere browserkopi',dirty:true});activateWorkspace();dishFeedback('Din tidligere browserkopi er åbnet. Gem den i en fil for at bevare den.');}catch(error){operationError(error);}});
  $('dish-form').addEventListener('input',()=>{editorDirty=true;updateDatabaseStatus();});
  $('import-dishes').tabIndex=-1;
  for(const label of document.querySelectorAll('label[for="import-dishes"]')){label.tabIndex=0;label.setAttribute('role','button');label.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();$('import-dishes').click();}});}
  for(const id of ['showBranding','showQr','showFooter','includeMetadata','paperColor','inkColor'])$(id).addEventListener('input',()=>{state[id]=$(id).type==='checkbox'?$(id).checked:$(id).value;if(id==='showBranding'&&!state.showBranding){state.showQr=false;$('showQr').checked=false;}render();});
  window.addEventListener('beforeunload',event=>{if(editorDirty||fileSession.dirty){event.preventDefault();event.returnValue='';}});
  if(!filePickerSupported()){$('file-support').textContent='Denne browser bruger import og download. Dine filer bliver på din enhed.';$('save-as').textContent='Hent som ny fil';$('save-file').textContent='Hent database';}
}
init().catch(error=>{showError(error.message);$('print').disabled=true;$('export-settings').disabled=true;});
