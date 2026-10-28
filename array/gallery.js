(() => {
 'use strict';
 const data = window.ArrayGalleries;
 const dialog = document.getElementById('array-viewer');
 const stage = dialog.querySelector('.viewer-stage');
 const fullImage = stage.querySelector('img');
 let active = null, opener = null, zoom = false;
 const language = () => window.ExtrudaUI?.getPreferences().language || 'da';
 const word = (da, en) => language() === 'en' ? en : da;
 const caption = photo => photo[language()] || photo.da;
 const states = data.map(group => ({group, index: 0, root: document.getElementById('gallery-' + group.id)}));
 function loading(image, status, src, alt) {
  status.textContent = word('Indlæser billede…', 'Loading image…');
  image.onload = () => { status.textContent = ''; };
  image.onerror = () => { status.textContent = word('Billedet kunne ikke indlæses. Vælg et andet billede, eller prøv igen.', 'The image could not be loaded. Choose another image or try again.'); };
  image.alt = alt;
  image.src = src;
  if (image.complete && image.naturalWidth) status.textContent = '';
 }
 function renderViewer() {
  if (!active) return;
  const {group, index} = active, photo = group.photos[index];
  document.getElementById('viewer-title').textContent = group[language()];
  document.getElementById('viewer-caption').textContent = caption(photo);
  document.getElementById('viewer-count').textContent = `${index + 1} / ${group.photos.length}`;
  document.getElementById('viewer-prev').disabled = index === 0;
  document.getElementById('viewer-next').disabled = index === group.photos.length - 1;
  document.getElementById('viewer-zoom').textContent = zoom ? word('Tilpas til skærm', 'Fit to screen') : '100 %';
  document.getElementById('viewer-zoom').setAttribute('aria-pressed', String(zoom));
  stage.classList.toggle('is-zoomed', zoom);
  loading(fullImage, document.getElementById('viewer-status'), photo.src, caption(photo));
 }
 function render(state) {
  const {root, group, index} = state, photo = group.photos[index];
  root.querySelector('.gallery-count').textContent = `${index + 1} / ${group.photos.length}`;
  root.querySelector('.gallery-caption').textContent = caption(photo);
  root.querySelector('.gallery-prev').disabled = index === 0;
  root.querySelector('.gallery-next').disabled = index === group.photos.length - 1;
  root.querySelector('.gallery-open').setAttribute('aria-label', word('Åbn stort billede: ', 'Open large image: ') + caption(photo));
  root.querySelector('.gallery-thumbnails').setAttribute('aria-label', word('Vælg billede', 'Choose image'));
  loading(root.querySelector('.gallery-open img'), root.querySelector('.gallery-status'), photo.src, caption(photo));
  root.querySelectorAll('.gallery-thumbnail').forEach((button, i) => {
   button.setAttribute('aria-pressed', String(index === i));
   button.setAttribute('aria-label', `${i + 1}: ${caption(group.photos[i])}`);
  });
  if (dialog.open && active === state) renderViewer();
 }
 function move(state, delta) {
  const next = state.index + delta;
  if (next < 0 || next >= state.group.photos.length) return;
  state.index = next; zoom = false; render(state);
 }
 function swipe(element, state) {
  let x = null, y = null;
  element.addEventListener('touchstart', e => { x = e.changedTouches[0].clientX; y = e.changedTouches[0].clientY; }, {passive: true});
  element.addEventListener('touchend', e => {
   if (x === null || zoom && dialog.open) return;
   const dx = e.changedTouches[0].clientX - x, dy = e.changedTouches[0].clientY - y;
   if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) move(typeof state === 'function' ? state() : state, dx < 0 ? 1 : -1);
   x = null;
  }, {passive: true});
 }
 states.forEach(state => {
  const {root, group} = state;
  group.photos.forEach((photo, index) => {
   const button = document.createElement('button'), img = document.createElement('img');
   button.type = 'button'; button.className = 'gallery-thumbnail';
   img.src = photo.thumb; img.alt = ''; img.loading = 'lazy';
   button.append(img); button.addEventListener('click', () => { state.index = index; render(state); });
   root.querySelector('.gallery-thumbnails').append(button);
  });
  root.querySelector('.gallery-prev').addEventListener('click', () => move(state, -1));
  root.querySelector('.gallery-next').addEventListener('click', () => move(state, 1));
  root.querySelector('.gallery-open').addEventListener('click', e => { active = state; opener = e.currentTarget; zoom = false; renderViewer(); dialog.showModal(); document.getElementById('viewer-close').focus(); });
  root.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); move(state, e.key === 'ArrowRight' ? 1 : -1); } });
  swipe(root.querySelector('.gallery-open'), state); render(state);
 });
 document.getElementById('viewer-close').addEventListener('click', () => dialog.close());
 document.getElementById('viewer-prev').addEventListener('click', () => move(active, -1));
 document.getElementById('viewer-next').addEventListener('click', () => move(active, 1));
 document.getElementById('viewer-zoom').addEventListener('click', () => { zoom = !zoom; renderViewer(); });
 dialog.addEventListener('keydown', e => { if (!zoom && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); move(active, e.key === 'ArrowRight' ? 1 : -1); } });
 dialog.addEventListener('close', () => { active = null; zoom = false; opener?.focus(); });
 swipe(stage, () => active);
 document.addEventListener('extruda:preferences', () => { states.forEach(render); if (dialog.open) renderViewer(); });
})();
