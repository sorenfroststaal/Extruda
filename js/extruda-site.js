/* Extruda: lokale fold-ud og billedskift til forsiderne.
   Erstatter Bootstrap-JavaScript fra CDN. Markup med data-bs-* virker uændret,
   og de samme hændelser (shown.bs.collapse / hidden.bs.collapse) sendes stadig.
   Ingen netværkskald, ingen lagring. */
(() => {
  'use strict';

  // Fold-ud: knapper med data-bs-toggle="collapse" åbner og lukker deres mål.
  function setCollapse(target, open) {
    target.classList.toggle('show', open);
    document.querySelectorAll(`[data-bs-toggle="collapse"][data-bs-target="#${CSS.escape(target.id)}"]`).forEach(button => {
      button.setAttribute('aria-expanded', String(open));
      button.classList.toggle('collapsed', !open);
    });
    target.dispatchEvent(new Event(open ? 'shown.bs.collapse' : 'hidden.bs.collapse', { bubbles: true }));
  }

  // Billedskift: aldrig automatisk og ingen stille omløb ved første/sidste billede.
  function updateCarousel(carousel) {
    const items = [...carousel.querySelectorAll('.carousel-item')];
    const index = Math.max(0, items.findIndex(item => item.classList.contains('active')));
    document.querySelectorAll(`[data-bs-slide][data-bs-target="#${CSS.escape(carousel.id)}"]`).forEach(button => {
      button.disabled = button.dataset.bsSlide === 'prev' ? index === 0 : index === items.length - 1;
      button.hidden = items.length < 2;
    });
  }
  function slide(carousel, direction) {
    const items = [...carousel.querySelectorAll('.carousel-item')];
    const index = Math.max(0, items.findIndex(item => item.classList.contains('active')));
    const next = direction === 'prev' ? index - 1 : index + 1;
    if (next < 0 || next >= items.length) return;
    items[index].classList.remove('active');
    items[next].classList.add('active');
    updateCarousel(carousel);
  }

  document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-bs-toggle="collapse"]');
    if (toggle) {
      const target = document.querySelector(toggle.dataset.bsTarget);
      if (target) { event.preventDefault(); setCollapse(target, !target.classList.contains('show')); }
      return;
    }
    const control = event.target.closest('[data-bs-slide]');
    if (control) {
      const carousel = document.querySelector(control.dataset.bsTarget);
      if (carousel) { event.preventDefault(); slide(carousel, control.dataset.bsSlide); }
    }
  });

  document.addEventListener('keydown', event => {
    const carousel = event.target.closest?.('.carousel');
    if (!carousel || !carousel.id || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    slide(carousel, event.key === 'ArrowLeft' ? 'prev' : 'next');
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.carousel[id]').forEach(updateCarousel);
  });
})();
