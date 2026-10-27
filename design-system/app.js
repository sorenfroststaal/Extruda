(() => {
const root=document.documentElement;
function updateLanguage(language){
  const selected=language==='en'?'en':'da';
  root.lang=selected;
  document.querySelectorAll('[data-da][data-en]').forEach(element=>{element.textContent=element.dataset[selected];});
  document.querySelectorAll('[data-aria-da][data-aria-en]').forEach(element=>{element.setAttribute('aria-label',element.dataset[selected==='da'?'ariaDa':'ariaEn']);});
  document.dispatchEvent(new Event('extruda:language'));
  document.title=selected==='da'?'Visuel identitet · extruda':'Visual identity · extruda';
  document.querySelector('meta[name="description"]')?.setAttribute('content',selected==='da'?'Extrudas visuelle identitet og fælles UI/UX-principper for farver, typografi, komponenter, temaer, sprog og tilgængelighed.':'Extruda’s visual identity and shared UI/UX principles for colour, typography, components, themes, language and accessibility.');
}

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
