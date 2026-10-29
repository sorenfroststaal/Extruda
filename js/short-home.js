/* One silent introduction per page load; no cookies or browser storage. */
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
 if (!dialog || location.hash || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
 video.muted = true;
 const dark = document.documentElement.dataset.theme === 'dark';
 video.src = 'design-system/logo-animation/extruda-logo-' + (dark ? 'dark' : 'light') + '-web.webm';
 if (!dialog.showModal) { finish(); return; }
 dialog.showModal();
 video.play().catch(finish);
})();
