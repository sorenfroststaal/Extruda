/* Silent introduction on entry, never on returning; no browser storage. */
(() => {
 'use strict';
 const destinations = {
  '#work': 'arbejdsliv/', '#profile-heading': 'arbejdsliv/#profile-heading',
  '#projects': 'projekter/', '#core-interests-heading': 'om-mig/#core-interests-heading'
 };
 if (destinations[location.hash]) {
  location.replace(new URL(destinations[location.hash], location.href).href);
  return;
 }
 const dialog = document.querySelector('.intro-dialog');
 const navigation = performance.getEntriesByType('navigation')[0];
 let internalReturn = false;
 try { internalReturn = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin; }
 catch { /* An unavailable referrer does not prevent normal navigation. */ }
 if (!dialog || location.hash || navigation?.type === 'back_forward' || internalReturn || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 const video = dialog.querySelector('video');
 const skip = dialog.querySelector('button');
 let closed = false;
 const finish = () => {
  if (closed) return;
  closed = true;
  clearTimeout(deadline);
  video.pause();
  if (dialog.open) dialog.close();
 };
 // A failed, blocked or stalled video must never prevent access to the site.
 const deadline = setTimeout(finish, 4500);
 skip.addEventListener('click', finish);
 dialog.addEventListener('cancel', finish);
 dialog.addEventListener('close', finish);
 video.addEventListener('ended', finish);
 video.addEventListener('error', finish);
 window.addEventListener('pagehide', finish, {once: true});
 video.muted = true;
 const dark = document.documentElement.dataset.theme === 'dark';
 video.src = 'design-system/logo-animation/extruda-logo-' + (dark ? 'dark' : 'light') + '-web.webm';
 if (!dialog.showModal) { finish(); return; }
 dialog.showModal();
 video.play().catch(finish);
})();
