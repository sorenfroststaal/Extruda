(()=>{'use strict';const $=s=>document.querySelector(s);let source,lang='da',ui='da',photo='portrait.jpg',saved={},storage=true;const key='extruda-jobwizard-v1';try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{storage=false}if(!saved.__fitDefaultV2)saved.shrink=true;
// Apply the requested contact footer once, including to older saved drafts.
if(!saved.__contactFooterV2){
 for(const id of ['footer-enabled','footer-contact-show','footer-phone-show','footer-linkedin-show'])saved[id]=true;
 if(!saved['footer-phone']?.trim())saved['footer-phone']=atob('KzQ1IDYwMTQxOTYx');
 if(!saved['footer-contact']?.trim())saved['footer-contact']=atob('c29yZW5mcm9zdHN0YWFsQGdtYWlsLmNvbQ==');
 if(!saved['footer-linkedin']?.trim())saved['footer-linkedin']='https://www.linkedin.com/in/sorenfroststaal/';
}
const text=n=>n?.getAttribute('data-'+lang)||n?.textContent.trim()||'';const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const tr=(a,b)=>ui==='da'?a:b;let choices=[];function check(id,name,parent,checked=true){const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.id=id;input.checked=saved[id]??checked;const span=document.createElement('span');span.textContent=name;const match=source?.querySelectorAll('[data-da]');const twin=match&&[...match].find(n=>n.getAttribute('data-da')===name);span.dataset.da=name;span.dataset.en=twin?.getAttribute('data-en')||name;label.append(input,span);parent.append(label);choices.push({id,span,name});return input}function heading(s,parent){const h=document.createElement('h3');h.textContent=s;h.dataset.da=s;h.dataset.en=[...source.querySelectorAll('[data-da]')].find(n=>n.getAttribute('data-da')===s)?.getAttribute('data-en')||s;parent.append(h)}function on(id){return document.getElementById(id)?.checked}function icon(name){return `<img src="../Assets/Icons/work/${name}.svg" alt="">`}function card(title,body,name){return `<section class="section-card"><div class="section-title">${icon(name)}<h2>${esc(title)}</h2></div>${body}</section>`}function translated(node){const copy=node.cloneNode(true);copy.querySelectorAll('[data-da]').forEach(n=>{if(n.hasAttribute('data-'+lang))n.textContent=n.getAttribute('data-'+lang)});copy.querySelectorAll('img').forEach(n=>n.src=new URL(n.getAttribute('src'),'https://extruda.dk/arbejdsliv/').href);return copy}function save(){const state={__fitDefaultV2:true,__contactFooterV2:true};$('#settings').querySelectorAll('input:not([type=file]),textarea,select').forEach(n=>state[n.id]=n.type==='checkbox'?n.checked:n.value);try{localStorage.setItem(key,JSON.stringify(state));$('#status').textContent=tr('Kladde gemt i denne browser.','Draft saved in this browser.')}catch{$('#status').textContent=tr('Browseren tillader ikke lagring. Behold siden åben; dine valg virker stadig.','Storage unavailable. Keep this page open; your choices still work.')}}function sheet(parent){
 const wrap=document.createElement('div');wrap.className='sheet-wrap';
 const page=document.createElement('article');page.className='sheet'+(on('mono')?' mono':'')+(on('section-boxes')?'':' no-section-boxes')+(on('item-boxes')?'':' no-item-boxes');
 page.style.setProperty('--output-primary',on('mono')?'#222':$('#primary').value);
 page.style.setProperty('--output-accent',on('mono')?'#999':$('#accent').value);
 page.style.setProperty('--output-paper',on('mono')?'#fff':$('#paper').value);
 const content=document.createElement('div');content.className='sheet-content';page.append(content);wrap.append(page);parent.append(wrap);
 if(on('footer-enabled')){
  const f=document.createElement('footer');f.className='footer';
  if(on('footer-symbol')){const img=document.createElement('img');img.src='../Assets/Brand/extruda-symbol-color.svg';img.alt='Extruda';f.append(img)}
  const copy=document.createElement('div');copy.className='footer-copy';
  if(on('footer-name-show')&&$('#footer-name').value){const name=document.createElement('strong');name.textContent=$('#footer-name').value;copy.append(name)}
  const contacts=document.createElement('div');contacts.className='footer-contacts';
  function contact(kind,value,href){
   if(!value.trim())return;
   const row=document.createElement('a');row.className='footer-contact';row.href=href;
   const image=document.createElement('img');image.src='../Assets/Icons/'+kind+'.svg';image.alt='';
   const label=document.createElement('span');label.textContent=value;row.append(image,label);contacts.append(row);
  }
  if(on('footer-contact-show'))contact('mail',$('#footer-contact').value,'mailto:'+$('#footer-contact').value.trim());
  if(on('footer-phone-show'))contact('phone',$('#footer-phone').value,'tel:'+$('#footer-phone').value.replace(/[^+0-9]/g,''));
  if(on('footer-linkedin-show')){
   const value=$('#footer-linkedin').value.trim();
   try{const url=new URL(value);if(url.protocol==='https:'||url.protocol==='http:')contact('linkedin',url.hostname.replace(/^www\./,'')+url.pathname,url.href)}catch{}
  }
  copy.append(contacts);
  f.append(copy);
  if(on('footer-date-show')&&$('#footer-date').value){const date=document.createElement('time');date.dateTime=$('#footer-date').value;date.textContent=new Date($('#footer-date').value+'T12:00:00').toLocaleDateString(lang==='da'?'da-DK':'en-GB',{day:'numeric',month:'long',year:'numeric'});f.append(date)}
  if(f.textContent.trim()||f.querySelector('img'))page.append(f);
 }

 return content;
}
function fit(){document.querySelectorAll('.sheet-wrap').forEach(w=>{const scale=w.clientWidth/794;w.firstElementChild.style.transform=`scale(${scale})`;w.style.height=1123*scale+'px'})}
function alignIdentity(){
 document.querySelectorAll('.identity').forEach(identity=>{
  const title=identity.querySelector('h1'),slogan=identity.querySelector('.slogan');
  if(title&&slogan){
   const range=document.createRange();range.selectNodeContents(title);
   const page=identity.closest('.sheet');
   const previewScale=page.getBoundingClientRect().width/page.offsetWidth||1;
   const width=range.getBoundingClientRect().width/previewScale;
   identity.querySelector('div').style.width=width+'px';
   slogan.style.width=width+'px';
  }
 });
}
function measure(){
 let blocked=false;const messages=[];
 document.querySelectorAll('.sheet-content').forEach((content,i)=>{
  // Reflow at the fixed paper width. Reduce typography and spacing, never the canvas.
  content.style.transform='none';
  const columns=content.querySelector('.cv-columns');
  columns?.querySelectorAll(':scope > div').forEach(n=>n.style.removeProperty('--fit'));
  const hasLeft=columns?.children[0].children.length>0;
  const hasRight=columns?.children[1].children.length>0;
  if(columns){columns.classList.toggle('one-column',!hasLeft||!hasRight);}
  function apply(density,width){
   content.style.setProperty('--fit',density);
   content.style.setProperty('--space',density*(on('shrink')?0.8:1));
   alignIdentity();
   if(columns)columns.style.gridTemplateColumns=hasLeft&&hasRight?`${width}px minmax(0,1fr)`:'minmax(0,1fr)';
  }
  const footer=content.parentElement.querySelector('.footer');
  const available=1077-(footer?footer.offsetHeight+12:0);
  function fits(){return content.scrollHeight<=available&&content.scrollWidth<=748;}
  apply(1,245);
  const overflow=!fits();
  let scale=1;
  if(on('shrink')){
   let best={density:0,width:245,height:Infinity};
   const widths=columns&&hasLeft&&hasRight?[230,250,270,290,310,330,350,370,390,410]:[245];
   for(const width of widths){
    apply(1,width);
    let low=0.1,high=1;
    if(fits())low=1;
    else for(let pass=0;pass<10;pass++){
     const mid=(low+high)/2;apply(mid,width);
     if(fits())low=mid;else high=mid;
    }
    apply(low,width);
    const height=content.scrollHeight;
    if(low>best.density+0.001||(Math.abs(low-best.density)<=0.001&&height<best.height))best={density:low,width,height};
   }
   scale=best.density;apply(scale,best.width);

  }
  const unresolved=!fits();
  content.dataset.scale=scale.toFixed(4);
  const page=content.closest('.sheet');page.classList.toggle('overfull',unresolved);
  const label=i===0?tr('Ansøgning','Application'):'CV';
  const status=document.getElementById(i===0?'application-status':'cv-status');
  const message=unresolved?tr(`${label}: for meget indhold. Vælg noget fra, eller slå skalering til.`,`${label}: too much content. Remove some content or enable scaling.`):overflow?(on('shrink')?tr(`${label}: skaleret til ${Math.floor(scale*100)} % for at passe på én A4-side.`,`${label}: scaled to ${Math.floor(scale*100)}% to fit one A4 page.`):tr(`${label}: for meget indhold til én A4-side. Vælg noget fra, eller slå skalering til.`,`${label}: too much content for one A4 page. Remove content or enable scaling.`)):tr(`${label}: passer på én A4-side.`,`${label}: fits on one A4 page.`);
  status.textContent=message;status.classList.toggle('overflow-message',overflow);messages.push(message);
  if(unresolved)blocked=true;
 });
 $('#print').disabled=blocked;
 $('#page-status').textContent=blocked?tr('PDF er ikke klar: indholdet overskrider A4-grænsen.','PDF is not ready: content exceeds the A4 boundary.'):tr('2 A4-sider i alt · ansøgning og CV','2 A4 pages total · application and CV');
 fit();
}
function appendPaged(parent,blocks){const page=sheet(parent);for(const block of blocks){const el=document.createElement('div');el.innerHTML=block;page.append(el)}}
function render(){if(!source)return;lang=$('#output-language').value;const app=$('#application-pages'),cv=$('#cv-pages');app.replaceChildren();cv.replaceChildren();const blocks=[`<div class="identity">${on('photo')?`<img class="portrait" src="${photo}" alt="Søren Frost Staal">`:''}<div><h1>Søren Frost Staal</h1><img class="slogan" src="../Assets/Brand/slogan-${lang}.svg" alt="${lang==='da'?'Jeg kan sgu nogle ting. Du kan nogle andre. Hvad kan vi sammen?':'I can do some stuff. You can too. What can we do together?'}"></div></div>${on('application-heading-show')?`<h2>${esc($('#title').value)}</h2>`:''}`];const paragraphs=$('#letter').value.split(/\n\s*\n/).filter(Boolean);paragraphs.forEach(p=>blocks.push(`<div class="letter">${esc(p)}</div>`));tracks.forEach((t,i)=>{if(on('track-'+i)){const body=translated(t.querySelector('.work-track-details')||t.lastElementChild);let group=[];[...body.querySelectorAll('h4,p')].forEach(n=>{if(n.tagName==='H4'&&group.length){blocks.push(card(text(t.querySelector('summary strong')),group.map(n=>n.outerHTML).join(''),'three-tracks'));group=[]}group.push(n)});if(group.length)blocks.push(card(text(t.querySelector('summary strong')),group.map(n=>n.outerHTML).join(''),'three-tracks'))}});appendPaged(app,blocks);let pages=[sheet(cv)];if(on('cv-heading-show')){const heading=document.createElement('h1');heading.className='cv-page-heading';heading.textContent='C.V.';pages[0].append(heading)}let cols;function newCols(){const c=document.createElement('div');c.className='cv-columns';c.innerHTML='<div></div><div></div>';pages.at(-1).append(c);return c}cols=newCols();const left=[],right=[];const categories=[...source.querySelectorAll('.cv-skill-category')];categories.forEach(cat=>{const skills=[...cat.querySelectorAll('[id^="skill-"]')].filter(n=>on(n.id));if(!skills.length)return;const title=text(cat.querySelector('h3,h4'));for(let i=0;i<skills.length;i+=12){left.push(card(title|| (lang==='da'?'Færdigheder':'Skills'),skills.slice(i,i+12).map(n=>`<div class="skill-row"><span>${esc(text(n.querySelector('.skill-name')))}</span>${n.querySelector('.skill-rating').outerHTML}</div>`).join(''),'skills'))}});const personal=source.querySelector('.profile-disclosure-content');if(personal){let html='';personParts.forEach((nodes,i)=>{if(on('person-'+i))html+=`<div class="profile-part">${nodes.map(n=>translated(n).outerHTML).join('')}</div>`});if(html)right.push(card(lang==='da'?'Personen Søren':'About Søren',html,'profile'))}const selectedJobs=jobs.filter((n,i)=>on('job-'+i));if(selectedJobs.length)right.push(card(lang==='da'?'Erhvervserfaring':'Work experience',selectedJobs.map(n=>{const s=n.querySelector('summary');return `<div class="job-row"><span class="period">${esc(text(s.querySelector('.cv-row-period')))}</span>${s.querySelector('img').outerHTML}<div><strong>${esc(text(s.querySelector('strong')))}</strong><small>${esc(text(s.querySelector('.cv-job-title')))}</small></div></div>`}).join(''),'experience'));if(on('education'))right.push(card(lang==='da'?'Uddannelse':'Education',[...source.querySelectorAll('.cv-education-row')].map(n=>`<div class="job-row">${translated(n).innerHTML}</div>`).join(''),'education'));if(on('roles')){const list=source.querySelector('.cv-compact-list');if(list)right.push(card(lang==='da'?'Andre roller':'Other roles',translated(list).outerHTML,'other-roles'))}function fill(items,col){for(const html of items){const block=document.createElement('div');block.innerHTML=html;cols.children[col].append(block)}}
fill(left,0);fill(right,1);
measure();requestAnimationFrame(measure);
document.querySelectorAll('.sheet img').forEach(img=>{if(!img.complete)img.addEventListener('load',measure,{once:true})});
save()}
let jobs=[],tracks=[],personParts=[];async function start(){try{const response=await fetch('../arbejdsliv/');if(!response.ok)throw Error();$('#print').disabled=false;personParts=[];source=new DOMParser().parseFromString(await response.text(),'text/html');source.querySelectorAll('img').forEach(n=>{const src=n.getAttribute('src');if(src)n.setAttribute('src',new URL(src,location.href.replace(/jobwizard\/.*$/,'arbejdsliv/')).href)});jobs=[...source.querySelectorAll('.cv-job')];tracks=[...source.querySelectorAll('details.work-track')].filter(n=>n.querySelector('.work-track-details'));const box=$('#choices');box.replaceChildren();heading('Erhvervserfaring',box);jobs.forEach((n,i)=>check('job-'+i,text(n.querySelector('strong'))+' · '+text(n.querySelector('.cv-row-period')),box));heading('Færdigheder',box);source.querySelectorAll('.cv-skill-category').forEach(n=>{heading(text(n.querySelector('h3,h4')),box);n.querySelectorAll('[id^="skill-"]').forEach(s=>check(s.id,text(s.querySelector('.skill-name')),box,Number(s.id.replace('skill-',''))<=22))});heading('Personen Søren',box);const personal=source.querySelector('.profile-disclosure-content');if(personal){[...personal.children].forEach(n=>{if(n.tagName==='H4'||!personParts.length)personParts.push([]);personParts.at(-1).push(n)});personParts.forEach((nodes,i)=>check('person-'+i,text(nodes[0]),box,i===0));}check('education','Uddannelse',box);check('roles','Andre roller',box);tracks.forEach((n,i)=>check('track-'+i,text(n.querySelector('summary strong')),$('#tracks'),false));$('#settings').querySelectorAll('input:not([type=file]),textarea,select').forEach(n=>{if(saved[n.id]!==undefined){if(n.type==='checkbox')n.checked=!!saved[n.id];else n.value=saved[n.id]}});render()}catch{$('#choices').innerHTML='<p>Indholdet kunne ikke hentes. Dine gemte valg bevares.</p><button type="button" id="retry">Prøv igen</button>';$('#retry').onclick=start;$('#print').disabled=true}}$('#settings').addEventListener('input',render);$('#settings').addEventListener('submit',e=>e.preventDefault());$('#upload').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;if(!/^image\/(jpeg|png|webp)$/.test(f.type)||f.size>8e6){$('#status').textContent='Vælg et JPG-, PNG- eller WebP-billede under 8 MB.';return}const reader=new FileReader();reader.onload=()=>{photo=reader.result;render()};reader.readAsDataURL(f)});$('#print').onclick=()=>{measure();if(!$('#print').disabled)window.print()};window.addEventListener('beforeprint',measure);document.fonts.ready.then(()=>{if(source)measure()});document.addEventListener('extruda:preferences',e=>{ui=e.detail.language;document.querySelectorAll('[data-da][data-en]').forEach(n=>n.textContent=n.getAttribute('data-'+ui));if(source)render()});new ResizeObserver(fit).observe($('#preview'));$('#footer-phone').value=atob('KzQ1IDYwMTQxOTYx');$('#footer-contact').value=atob('c29yZW5mcm9zdHN0YWFsQGdtYWlsLmNvbQ==');$('#footer-date').value=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Copenhagen'}).format(new Date());start()})();
