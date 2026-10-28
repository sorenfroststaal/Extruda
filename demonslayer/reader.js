(() => {
  'use strict';
  const key = 'lantern-road-reader-v1';
  const allowed = ['01-the-man-beneath-the-wisteria.html','02-the-fight-that-changes-nothing.html','03-a-name-he-cannot-say.html'];
  let state = {}, available = true, language = 'en';
  const applyCopy = lang => {
    language = lang;
    document.querySelectorAll('[data-da][data-en]').forEach(n => { n.textContent = n.dataset[lang]; });
    updateStorageNote();
  };
  function updateStorageNote() {
    const note = document.querySelector('.save-note');
    if (!note) return;
    note.textContent = available
      ? (language === 'da' ? 'Læsested og tekststørrelse huskes i denne browser. Historien er på engelsk.' : 'Your place and text size are remembered in this browser. The story stays in English.')
      : (language === 'da' ? 'Browserlagring er blokeret. Du kan læse og ændre tekststørrelse, men valgene huskes ikke efter genindlæsning.' : 'Browser storage is blocked. You can read and change text size, but your choices cannot be remembered after reloading.');
    note.classList.toggle('storage-warning', !available);
  }
  try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) state = saved; }
  catch { available = false; }
  function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch { available = false; updateStorageNote(); } }
  window.ExtrudaPage = { setLanguage: applyCopy };
  const size = document.getElementById('reading-size');
  const validSizes = ['19','22','25'];
  const currentSize = validSizes.includes(String(state.size)) ? String(state.size) : '19';
  document.documentElement.style.setProperty('--reading-size', currentSize + 'px');
  if (size) {
    size.value = currentSize;
    size.addEventListener('change', () => {
      if (!validSizes.includes(size.value)) return;
      state.size = size.value;
      document.documentElement.style.setProperty('--reading-size', size.value + 'px');
      save();
    });
  }
  const resume = document.querySelector('.resume');
  if (resume && allowed.includes(state.chapter)) {
    const anchor = /^p-\d+$/.test(state.anchor || '') ? '#' + state.anchor : '';
    resume.href = '/demonslayer/' + state.chapter + anchor;
    resume.hidden = false;
  }
  const chapter = document.body.dataset.chapter;
  if (allowed.includes(chapter) && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      state.chapter = chapter;
      state.anchor = visible[0].target.id;
      save();
    }, {rootMargin:'-10% 0px -65% 0px', threshold:0});
    document.querySelectorAll('.story p[id]').forEach(p => observer.observe(p));
  }
  applyCopy('en');
})();
