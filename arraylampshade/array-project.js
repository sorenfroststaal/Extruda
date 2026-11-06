(() => {
  'use strict';
  const grid = document.querySelector('.archive-grid');
  if (!grid) return;
  const figures = [...grid.querySelectorAll('figure')];
  const more = document.querySelector('#gallery-more');
  const count = document.querySelector('#gallery-count');
  const dialog = document.querySelector('#gallery-viewer');
  const image = document.querySelector('#viewer-image');
  const caption = document.querySelector('#viewer-caption');
  const prev = document.querySelector('#viewer-prev');
  const next = document.querySelector('#viewer-next');
  const stage = dialog.querySelector('.viewer-stage');
  const scale = document.querySelector('#viewer-scale');
  let filter = 'finished', limit = 12, current = 0, opener = null;
  const lang = () => document.documentElement.lang === 'da' ? 'da' : 'en';
  const tr = (en, da) => lang() === 'da' ? da : en;
  const selected = () => figures.filter(f => filter === 'all' || f.dataset.category === filter);
  function refresh() {
    const chosen = selected();
    const visible = new Set(chosen.slice(0, limit));
    figures.forEach(f => f.hidden = !visible.has(f));
    more.hidden = limit >= chosen.length;
    count.textContent = tr(`${Math.min(limit, chosen.length)} of ${chosen.length} pictures`,`${Math.min(limit, chosen.length)} af ${chosen.length} billeder`);
    figures.forEach(f => {
      const img = f.querySelector('img');
      img.alt = img.dataset[lang() === 'da' ? 'altDa' : 'altEn'];
      f.querySelector('a').setAttribute('aria-label', tr('Open picture: ', 'Åbn billede: ') + img.alt);
    });
    document.querySelector('.gallery-filters').setAttribute('aria-label',tr('Filter pictures','Filtrér billeder'));
    if (dialog.open) show(current);
  }
  function show(index) {
    const chosen = selected();
    current = Math.max(0, Math.min(index, chosen.length - 1));
    const figure = chosen[current];
    image.src = figure.querySelector('a').href;
    image.alt = figure.querySelector('img').alt;
    const text = figure.querySelector('figcaption');
    const description = text.dataset[lang()] || text.textContent;
    caption.textContent = `${current + 1} / ${chosen.length}${description ? ' · ' + description : ''}`;
    prev.disabled = current === 0; next.disabled = current === chosen.length - 1;
    stage.classList.remove('full-size'); scale.textContent = '100%';
    stage.scrollTo(0,0);
  }
  grid.addEventListener('click', e => {
    const link = e.target.closest('.gallery-open');
    if (!link || !dialog.showModal) return;
    e.preventDefault(); opener = link;
    current = selected().indexOf(link.closest('figure'));
    show(current); dialog.showModal(); document.querySelector('#viewer-close').focus();
  });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter; limit = 12;
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    refresh();
  }));
  more.addEventListener('click', () => {
    const first = selected()[limit]; limit += 12; refresh();
    first?.querySelector('a').focus({preventScroll:true});
  });
  prev.addEventListener('click',()=>show(current-1));next.addEventListener('click',()=>show(current+1));
  document.querySelector('#viewer-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'&&!prev.disabled){e.preventDefault();show(current-1);}if(e.key==='ArrowRight'&&!next.disabled){e.preventDefault();show(current+1);}});
  scale.addEventListener('click',()=>{const full=stage.classList.toggle('full-size');scale.textContent=full?tr('Fit to screen','Tilpas til skærmen'):'100%';});
  let touchStart=null;
  stage.addEventListener('touchstart',e=>{touchStart=e.touches[0].clientX;},{passive:true});
  stage.addEventListener('touchend',e=>{if(touchStart===null||stage.classList.contains('full-size'))return;const delta=e.changedTouches[0].clientX-touchStart;if(delta>70&&!prev.disabled)show(current-1);if(delta< -70&&!next.disabled)show(current+1);touchStart=null;},{passive:true});
  document.querySelectorAll('video').forEach(video=>video.addEventListener('play',()=>{document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});}));
  document.addEventListener('extruda:preferences',refresh);
  refresh();
})();

