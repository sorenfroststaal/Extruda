/* Local copy only; no translation service or network requests. */
(() => {
  'use strict';
  function apply(language) {
    const lang = language === 'en' ? 'en' : 'da';
    document.querySelectorAll('[data-da][data-en]').forEach(el => {
      el.textContent = el.dataset[lang];
    });
    document.title = lang === 'en' ? 'Ideas for Dansk Handicap Forbund · extruda' : 'Idéer til Dansk Handicap Forbund · extruda';
  }
  window.ExtrudaCopy = {apply};
  document.addEventListener('extruda:preferences', event => apply(event.detail.language));
})();
