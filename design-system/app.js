(() => {
const root=document.documentElement;
const logoFiles=[
  'extruda-logo-horizontal-black','extruda-logo-horizontal-color','extruda-logo-horizontal-white',
  'extruda-logo-stacked-black','extruda-logo-stacked-color','extruda-logo-stacked-white',
  'extruda-symbol-black','extruda-symbol-color','extruda-symbol-white',
  'extruda-symbol-micro-black','extruda-symbol-micro-color','extruda-symbol-micro-white',
  'extruda-wordmark-black','extruda-wordmark-color','extruda-wordmark-white'
];
const domainLogoFiles=['horizontal','wordmark','stacked'].flatMap(layout=>['color','black','white','cream','graphite','petrol','teal','apricot'].map(variant=>`extruda-dk-${layout}-${variant}`));
const appIconNames=['archive','calculator','calendar','camera','code','convert','files','goldfish','guides','hub','images','notes','pdf','tasks','tools'];
const uiIconGroups=[
  {da:'Navigation',en:'Navigation',names:['arrow-left','arrow-right','chevron-down','chevron-right','external-link','globe','grid','home','menu','search']},
  {da:'Handlinger',en:'Actions',names:['check','close','copy','delete','download','edit','link','minus','play','plus','refresh','settings','share','upload']},
  {da:'Indhold og værktøjer',en:'Content and tools',names:['archive','calculator','calendar','code','community','convert','files','guides','images','notes','pdf','tasks','tools']},
  {da:'Status, sikkerhed og tema',en:'Status, safety and theme',names:['help','info','lock','moon','sun','warning']}
];

function humanise(name){return name.replace(/^extruda-dk-/,'extruda.dk · ').replace(/^extruda-/,'').replaceAll('-',' ');}
function makeIconCard({path,name,tone='light'}){
  const card=document.createElement('article');
  card.className=`icon-asset-card ${tone==='dark'?'dark-preview':''}`;
  const preview=document.createElement('div');
  preview.className='icon-asset-preview';
  const img=document.createElement('img');
  img.src=path;
  img.alt=humanise(name);
  img.loading='lazy';
  preview.append(img);
  const meta=document.createElement('div');
  const label=document.createElement('span');
  label.textContent=humanise(name);
  const link=document.createElement('a');
  link.href=path;
  link.download=`${name}.svg`;
  link.textContent='SVG ↓';
  link.setAttribute('aria-label',`Download ${humanise(name)} SVG`);
  meta.append(label,link);
  card.append(preview,meta);
  return card;
}
function makeLibraryGroup({da,en,items}){
  const section=document.createElement('section');
  section.className='icon-category';
  const heading=document.createElement('div');
  heading.className='icon-category-heading';
  const title=document.createElement('h3');
  title.dataset.da=da;
  title.dataset.en=en;
  title.textContent=da;
  const count=document.createElement('span');
  count.textContent=String(items.length).padStart(2,'0');
  heading.append(title,count);
  const grid=document.createElement('div');
  grid.className='icon-asset-grid';
  items.forEach(item=>grid.append(makeIconCard(item)));
  section.append(heading,grid);
  return section;
}
function renderIconLibrary(){
  const container=document.getElementById('icon-library-content');
  if(!container)return;
  container.append(makeLibraryGroup({da:'Logoer og symboler',en:'Logos and symbols',items:logoFiles.map(name=>({name,path:`./icons/logos/${name}.svg`,tone:name.endsWith('-white')?'dark':'light'}))}));
  container.append(makeLibraryGroup({da:'extruda.dk · logoer',en:'extruda.dk · logos',items:domainLogoFiles.map(name=>({name,path:`./icons/logos/${name}.svg`,tone:/-(white|cream|apricot)$/.test(name)?'dark':'light'}))}));
  const variants=[{key:'color',da:'Programikoner · farve',en:'App icons · colour'},{key:'black',da:'Programikoner · sort',en:'App icons · black'},{key:'white',da:'Programikoner · hvid',en:'App icons · white'}];
  variants.forEach(variant=>container.append(makeLibraryGroup({da:variant.da,en:variant.en,items:appIconNames.map(icon=>({name:`extruda-${icon}-${variant.key}`,path:`./icons/apps/${variant.key}/extruda-${icon}.svg`,tone:variant.key==='white'?'dark':'light'}))})));
  uiIconGroups.forEach(group=>container.append(makeLibraryGroup({da:`UI · ${group.da}`,en:`UI · ${group.en}`,items:group.names.map(name=>({name,path:`./icons/ui/${name}.svg`}))})));
}

function updateLanguage(language){
  const selected=language==='en'?'en':'da';
  root.lang=selected;
  document.querySelectorAll('[data-da][data-en]').forEach(element=>{element.textContent=element.dataset[selected];});
  document.querySelectorAll('[data-aria-da][data-aria-en]').forEach(element=>{element.setAttribute('aria-label',element.dataset[selected==='da'?'ariaDa':'ariaEn']);});
  document.querySelectorAll('[data-alt-da][data-alt-en]').forEach(element=>{element.alt=element.dataset[selected==='da'?'altDa':'altEn'];});
  document.dispatchEvent(new Event('extruda:language'));
  document.title=selected==='da'?'Visuel identitet · extruda':'Visual identity · extruda';
  document.querySelector('meta[name="description"]')?.setAttribute('content',selected==='da'?'Extrudas visuelle identitet og fælles UI/UX-principper for farver, typografi, komponenter, temaer, sprog og tilgængelighed.':'Extruda’s visual identity and shared UI/UX principles for colour, typography, components, themes, language and accessibility.');
}

renderIconLibrary();
window.ExtrudaPage={setLanguage:updateLanguage};
updateLanguage('da');

const navLinks=[...document.querySelectorAll('.section-nav a')];
const sections=navLinks.map(link=>document.querySelector(link.hash)).filter(Boolean);
const observer=new IntersectionObserver(entries=>{
  const current=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(!current)return;
  navLinks.forEach(link=>{const active=link.hash===`#${current.target.id}`;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
},{rootMargin:'-25% 0px -65%',threshold:[0,.15,.4]});
sections.forEach(section=>observer.observe(section));

document.getElementById('year').textContent=new Date().getFullYear();

})();
