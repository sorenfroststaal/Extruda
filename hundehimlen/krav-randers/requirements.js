(() => {
  'use strict';
  const menu = document.getElementById('menu-toggle');
  const nav = document.getElementById('section-nav');
  function close(restore) { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded','false'); if (restore) menu.focus(); }
  menu.addEventListener('click',()=>menu.setAttribute('aria-expanded',String(nav.classList.toggle('is-open'))));
  nav.addEventListener('click',event=>{ if(event.target.closest('a')) close(false); });
  document.addEventListener('keydown',event=>{ if(event.key==='Escape' && menu.getAttribute('aria-expanded')==='true') close(true); });
  window.ExtrudaPage = { setLanguage(language) {
    const lang = language==='en'?'en':'da';
    document.querySelectorAll('[data-da][data-en]').forEach(node=>node.textContent=node.dataset[lang]);
    document.querySelectorAll('.refs a').forEach(node=>node.setAttribute('aria-label',`${lang==='en'?'Source':'Kilde'} ${node.textContent.replace(/\D/g,'')}`));
    nav.setAttribute('aria-label',lang==='en'?'Sections':'Afsnit');
    document.title=lang==='en'?'Requirements in Randers · Hundehimlen':'Krav i Randers · Hundehimlen';
  }};
})();
