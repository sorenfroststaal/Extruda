/* Restore an existing public selection into the actual Jobwizard. No private settings are published. */
(() => {
 'use strict';
 const code=new URL(location.href).searchParams.get('edit');if(!code)return;
 const valid=/^[A-Za-z0-9]{4,12}$/.test(code),$=id=>document.getElementById(id);
 const state=window.JobPageEditing={code,sha:'',active:true,photo:'',load};
 const panel=document.createElement('section');panel.className='edit-existing-panel';panel.innerHTML='<h2>Rediger underside <span></span></h2><p id="edit-existing-status" role="status">Indlæser sidens tekst og valg…</p><p>Brug de samme tilvalg som i Jobwizarden nedenfor. Ændringer bliver først offentlige, når du vælger Opdater underside. Adresse og QR-kode bevares. PDF og mapper på din computer opdateres ikke automatisk.</p><label>Indlæs privat Jobwizard-kladde (JSON)<input id="edit-draft-import" type="file" accept="application/json,.json"></label>';
 panel.querySelector('span').textContent=code;document.querySelector('.builder').before(panel);
 const say=s=>$('edit-existing-status').textContent=s;
 $('share-code').value=code;$('share-code').readOnly=true;
 $('share-publish').textContent='Opdater underside '+code;$('share-publish').dataset.da='Opdater underside '+code;$('share-publish').dataset.en='Update page '+code;
 const text=n=>n?.textContent.trim()||'';
 const prose=n=>{if(!n)return '';const c=n.cloneNode(true);c.querySelectorAll('br').forEach(b=>b.replaceWith('\n'));return c.textContent.trim();};
 const paragraphs=n=>n?[...n.querySelectorAll(':scope > p')].map(prose).join('\n\n'):'';
 const decode=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
 function derive(page,source){
  const s={__fitDefaultV2:true,__contactFooterV2:true};
  $('settings').querySelectorAll('input:not([type=file]),textarea,select').forEach(n=>s[n.id]=n.type==='checkbox'?false:n.value);
  const first=page.querySelector('.sheet'),app=page.querySelector('.application-template');
  s['application-layout']=app?'template':'free';s['output-language']=page.body.dataset.outputLanguage||page.documentElement.lang||'da';const sourceText=n=>n?.getAttribute('data-'+s['output-language'])||text(n);
  for(const [id,variable] of [['primary','--output-primary'],['accent','--output-accent'],['paper','--output-paper']])s[id]=first.style.getPropertyValue(variable).trim()||s[id];
  s.mono=first.classList.contains('mono');s['section-boxes']=!first.classList.contains('no-section-boxes');s['item-boxes']=!first.classList.contains('no-item-boxes');s.shrink=true;
  s.photo=!!page.querySelector('.portrait');state.photo=page.querySelector('.portrait')?.getAttribute('src')||'portrait.jpg';
  s['application-vision-show']=!!page.querySelector('.application-vision');s['application-ronaldo-show']=!!page.querySelector('.application-ronaldo');s['application-track-strip']=!!page.querySelector('.application-tracks');
  for(let i=0;i<3;i++)s['track-'+i]=!!page.querySelectorAll('.application-track')[i]&&!page.querySelectorAll('.application-track')[i].classList.contains('is-muted');
  const position=page.querySelector('.application-position');s['application-role']=text(position?.querySelector('h2')).replace(/^(Stillingen jeg søger|Position I am applying for):?\s*/,'');s['application-match-show']=!!position?.querySelector('p');s['application-match']=text(position?.querySelector('p'));
  const sections=[...page.querySelectorAll('.application-answer')];
  const headings=[/^Hvorfor |^Why /,/^Hvad kan jeg tilbyde fagligt|^What can I contribute (as|professionally)/,/^Hvad kan jeg tilbyde som kollega|^What can I contribute as a colleague/,/^Hvad skal der til|^What do I need/,/^Hvad kan stå i vejen|^What could prevent/];
  for(let i=0;i<5;i++){const section=sections.find(n=>n.dataset.applicationSection===String(i))||sections.find(n=>headings[i].test(text(n.querySelector('h3')))&&(i!==1||!/^What can I contribute as a colleague/.test(text(n.querySelector('h3')))));s['application-section-'+i+'-show']=!!section;s['application-section-'+i]=paragraphs(section);}
  s['application-company']=text(sections.find(n=>/^Hvorfor |^Why /.test(text(n.querySelector('h3'))))?.querySelector('h3')).replace(/^(Hvorfor|Why) /,'').replace(/\?$/,'');
  s['application-heading-show']=!!page.querySelector('.application-document-title');s.title=text(page.querySelector('.application-document-title'))||'Ansøgning';s.letter=app?paragraphs(page.querySelector('.application-answer-area')):[...page.querySelectorAll('.letter')].map(prose).join('\n\n');
  s['application-track-details']=!!page.querySelector('.application-template + .section-card');
  source.querySelectorAll('[id^="skill-"]').forEach(n=>s[n.id]=false);page.querySelectorAll('[data-source-skill]').forEach(n=>s[n.dataset.sourceSkill]=true);
  const jobs=[...source.querySelectorAll('.cv-job')];jobs.forEach((n,i)=>{const summary=n.querySelector('summary'),employer=summary.querySelector('img')?.getAttribute('src').split('/').pop(),period=sourceText(summary.querySelector('.cv-row-period'));s['job-'+i]=[...page.querySelectorAll('[data-source-employer]')].some(row=>row.dataset.sourceEmployer===employer&&row.dataset.sourcePeriod===period);});
  const roles=page.querySelector('.cv-compact-list');s.roles=!!roles;s.education=[...page.querySelectorAll('.section-title img')].some(n=>n.getAttribute('src').includes('/education.svg'));
  s['cv-heading-show']=!!page.querySelector('.cv-page-heading');
  const personal=source.querySelector('.profile-disclosure-content'),parts=[];if(personal){[...personal.children].forEach(n=>{if(n.classList.contains('person-section')){parts.push([...n.children]);return;}if(n.tagName==='H4'||!parts.length)parts.push([]);parts.at(-1).push(n);});parts.forEach((nodes,i)=>s['person-'+i]=[...page.querySelectorAll('.profile-part')].some(p=>text(p.firstElementChild)===sourceText(nodes[0])));}
  const footer=page.querySelector('.footer');s['footer-enabled']=!!footer;s['footer-symbol']=!!footer?.querySelector(':scope > img');s['footer-name-show']=!!footer?.querySelector('.footer-copy > strong');s['footer-name']=text(footer?.querySelector('.footer-copy > strong'));
  for(const [kind,selector] of [['contact','a[href^="mailto:"]'],['phone','a[href^="tel:"]'],['linkedin','a[href*="linkedin.com"]']]){const n=footer?.querySelector(selector);s['footer-'+kind+'-show']=!!n;s['footer-'+kind]=kind==='linkedin'?(n?.getAttribute('href')||''):text(n);}
  s['footer-date-show']=!!footer?.querySelector('time');s['footer-date']=footer?.querySelector('time')?.getAttribute('datetime')||'';
  const share=page.querySelector('.share-card');s['share-code']=code;s['share-box']=!!share;s['share-logo']=!!share?.querySelector('.share-heading');s['share-copy-show']=!!share?.querySelector('p');s['share-copy']=text(share?.querySelector('p')).replaceAll('https://extruda.dk/'+code,'{link}').replaceAll('extruda.dk/'+code,'{link}');s['share-link']=!!share?.querySelector('a');s['share-qr']=!!share?.querySelector('.share-qr');s['share-home']=!!page.querySelector('.full-site');
  return s;
 }
 async function load(source,saved){
  if(!valid)throw Error('Ugyldig sidekode.');
  const r=await fetch('https://api.github.com/repos/sorenfroststaal/Extruda/contents/'+encodeURIComponent(code)+'/index.html?ref=main',{cache:'no-store'});if(!r.ok)throw Error('Undersiden kunne ikke hentes fra GitHub.');const file=await r.json();let raw;if(file.content)raw=decode(file.content);else{const large=await fetch('https://api.github.com/repos/sorenfroststaal/Extruda/contents/'+encodeURIComponent(code)+'/index.html?ref=main',{headers:{Accept:'application/vnd.github.raw+json'},cache:'no-store'});if(!large.ok)throw Error('Undersidens HTML kunne ikke hentes.');raw=await large.text();}const page=new DOMParser().parseFromString(raw,'text/html');if(!page.body.classList.contains('shared-application')||page.querySelectorAll('main .sheet').length!==2)throw Error('Adressen er ikke en eksisterende ansøgningsside.');
  state.sha=file.sha;const derived=derive(page,source);const same=saved.__pageSha===state.sha;const storageKey='extruda-jobwizard-v1-'+code;let previous=null;try{if(saved.__pageSha&&!same){previous=saved;localStorage.setItem(storageKey+'-previous',JSON.stringify(saved));}else previous=JSON.parse(localStorage.getItem(storageKey+'-previous')||'null');}catch{}if(previous){const restore=document.createElement('button');restore.type='button';restore.textContent='Åbn tidligere lokal kladde';restore.onclick=()=>{window.JobWizard.restore({...previous,'share-code':code},state.photo);say('Tidligere lokal kladde åbnet. Den offentlige side kan være ændret; gennemse alle valg før opdatering.');};panel.append(restore);}
  say(same?'Din lokale kladde til '+code+' er indlæst.':'Den offentlige sides viste tekst og valg er indlæst. Skjult tekst kan hentes fra din private JSON-kladde.');
  $('publish-title').textContent='Opdater underside '+code;$('publish-title').dataset.da='Opdater underside '+code;$('publish-title').dataset.en='Update page '+code;$('publish-confirm').textContent='Opdater den viste underside';$('publish-confirm').dataset.da='Opdater den viste underside';$('publish-confirm').dataset.en='Update this page';
  return same?{...derived,...saved,'share-code':code}:derived;
 }
 $('edit-draft-import').onchange=async()=>{try{const f=$('edit-draft-import').files[0];if(!f)return;if(f.size>12000000)throw Error('Kladden er for stor.');const d=JSON.parse(await f.text());if(d.format!=='extruda-job-page-v1'||d.code!==code||!d.settings)throw Error('Vælg Jobwizard-kladden for '+code+'.');if(!state.sha||!window.JobWizard)throw Error('Vent på at siden er indlæst.');const p=new DOMParser().parseFromString(d.html||'','text/html');window.JobWizard.restore({...d.settings,'share-code':code},p.querySelector('.portrait')?.getAttribute('src'));say('Din private Jobwizard-kladde er indlæst. Gennemse valgene før opdatering.');}catch(e){say(e.message);}finally{$('edit-draft-import').value='';}};
})();
