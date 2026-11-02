/* Local draft and QR generation. No credentials or publishing service in the browser. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s),on=id=>document.getElementById(id)?.checked;
 const codeField=$('#share-code'),status=$('#share-status');
 const bytes=crypto.getRandomValues(new Uint8Array(6));
 codeField.value=[...bytes].map(n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');
 const valid=()=>/^[A-Za-z0-9]{4,12}$/.test(codeField.value);
 const url=()=>`https://extruda.dk/${codeField.value}`;
 function error(message){status.textContent=message;codeField.setAttribute('aria-invalid','true');codeField.focus()}
 function box(){
  const section=document.createElement('section');section.className='section-card share-card';
  if(on('share-logo')){
   const heading=document.createElement('div');heading.className='section-title share-heading';
   const img=document.createElement('img');img.src='../Assets/Icons/work/extruda.svg';img.alt='';
   const title=document.createElement('h2');title.textContent='extruda.dk';heading.append(img,title);section.append(heading);
  }
  const row=document.createElement('div');row.className='share-card-body';const copy=document.createElement('div');
  if(on('share-copy-show')){const p=document.createElement('p');p.textContent=$('#share-copy').value.replaceAll('{link}',url().replace('https://',''));copy.append(p)}
  if(on('share-link')&&valid()){const a=document.createElement('a');a.href=url();a.textContent=url().replace('https://','');copy.append(a)}
  row.append(copy);
  if(on('share-qr')&&valid()&&typeof qrcode==='function'){
   const qr=qrcode(0,'M');qr.addData(url());qr.make();
   const holder=document.createElement('div');holder.className='share-qr';holder.innerHTML=qr.createSvgTag({cellSize:3,margin:12,scalable:true});
   holder.firstElementChild.setAttribute('role','img');holder.firstElementChild.setAttribute('aria-label','QR: '+url());row.append(holder);
  }
  section.append(row);return section;
 }
 function draftHtml(){
  const lang=$('#output-language').value;
  const parts=[...document.querySelectorAll('.sheet')].map(page=>{
   const copy=page.cloneNode(true);copy.removeAttribute('style');
   for(const prop of ['--output-primary','--output-accent','--output-paper'])copy.style.setProperty(prop,page.style.getPropertyValue(prop));
   copy.classList.remove('overfull');copy.querySelectorAll('[style]').forEach(n=>{if(n!==copy)n.removeAttribute('style')});
   copy.querySelectorAll('img').forEach(img=>img.src=img.src);
   return copy.outerHTML;
  }).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><base href="https://extruda.dk/jobwizard/"><title>Søren Frost Staal · ${codeField.value}</title><link rel="stylesheet" href="../design-system/styles.css"><link rel="stylesheet" href="../css/extruda-ui.css"><link rel="stylesheet" href="styles.css?v=18"><link rel="stylesheet" href="public.css?v=1"><script defer src="../js/extruda-ui.js"></script><script defer src="public-refresh.js?v=1"></script></head><body class="shared-application"><header class="site-header"><a href="https://extruda.dk/">Søren Frost Staal</a><div data-extruda-controls></div></header><main>${parts}${on('share-home')?`<p class="full-site"><a href="https://extruda.dk/">${lang==='da'?'Se hele hjemmesiden':'See the full website'} →</a></p>`:''}</main><template id="extruda-about"><p>Dette er et udvalgt udsnit af Sørens ansøgning og CV. Alle med linket kan se siden. Ingen cookies ud over lokale sprog- og temavalg.</p></template></body></html>`;
 }
 function download(value,name,type){const blob=new Blob([value],{type}),link=document.createElement('a'),href=URL.createObjectURL(blob);link.href=href;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(href),60000)}
 function buildDraft(){
  if(document.querySelectorAll('.sheet').length!==2)throw new Error('Vent på at ansøgning og CV er indlæst, og prøv igen.');
  if(!valid())throw new Error('Skriv en kode med 4–12 bogstaver eller tal.');
  const settings={};$('#settings').querySelectorAll('input:not([type=file]),textarea,select').forEach(n=>settings[n.id]=n.type==='checkbox'?n.checked:n.value);
  return {format:'extruda-job-page-v1',code:codeField.value,url:url(),createdAt:new Date().toISOString(),settings,html:draftHtml()};
 }
 window.JobSharing={buildDraft,alignColumns(content){
  const card=content.querySelector('.share-card'),qr=card?.querySelector('.share-qr');if(!qr)return;
  qr.style.width='86px';qr.style.height='86px';
  const body=card.querySelector('.share-card-body'),copy=body.firstElementChild;
  const available=body.clientHeight-copy.offsetHeight-parseFloat(getComputedStyle(body).gap||0);
  const size=Math.max(86,Math.min(body.clientWidth,available));
  qr.style.width=size+'px';qr.style.height=size+'px';
 },render(parent){
  parent.closest('.cv-columns').classList.toggle('has-share-box',on('share-box'));
  if($('#share-copy').value==='Her har jeg valgt det, jeg finder relevant for stillingen. Er du nysgerrig på hele mig, kan du se resten på extruda.dk. Denne version finder du via linket eller QR-koden.')$('#share-copy').value='I denne ansøgning har jeg udvalgt de elementer som jeg finder relevante for min ansøgning til Jer. Skulle i være interesseret i hele mig, kan i læse videre på {link} eller ved at scanne QR koden herunder.';

  codeField.removeAttribute('aria-invalid');$('#share-url').textContent=valid()?url()+' · kladde, ikke publiceret':'Brug 4–12 bogstaver eller tal til sidekoden.';
  $('#share-preview').disabled=!valid();$('#share-download').disabled=!valid();
  if(on('share-box'))parent.append(box());
 }};
 $('#share-preview').addEventListener('click',()=>{
  if(!valid())return error('Skriv en kode med 4–12 bogstaver eller tal.');
  const blob=new Blob([draftHtml()],{type:'text/html'}),href=URL.createObjectURL(blob);
  const tab=window.open(href,'_blank');if(!tab)status.textContent='Browseren blokerede forhåndsvisningen. Tillad åbning af en ny fane og prøv igen.';
  setTimeout(()=>URL.revokeObjectURL(href),60000);
 });
 $('#share-download').addEventListener('click',()=>{
  if(!valid())return error('Skriv en kode med 4–12 bogstaver eller tal.');
  const settings={};$('#settings').querySelectorAll('input:not([type=file]),textarea,select').forEach(n=>settings[n.id]=n.type==='checkbox'?n.checked:n.value);
  download(JSON.stringify({format:'extruda-job-page-v1',code:codeField.value,url:url(),createdAt:new Date().toISOString(),settings,html:draftHtml()},null,2),`extruda-${codeField.value}-kladde.json`,'application/json');
  status.textContent='Kladde hentet. Send JSON-filen i chatten for at få undersiden publiceret. Linket er først aktivt efter publicering.';
 });
})();
