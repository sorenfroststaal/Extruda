/* Open the existing disclosure ancestors when following a deep link. */
(() => {
 function revealHash() {
  if (!location.hash) return;
  let target;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
  catch { return; }
  if (!target) return;
  for (let node = target; node; node = node.parentElement) {
   if (node.tagName === 'DETAILS') node.open = true;
  }
  requestAnimationFrame(() => { target.scrollIntoView({block: 'start'}); if (target.matches('.cv-skill-ratings > li')) target.focus({preventScroll: true}); });
 }
 window.addEventListener('hashchange', revealHash);
 function resetDisclosures() {
  const experience = document.querySelector('.cv-experience');
  const skills = document.querySelector('.cv-skill-ratings')?.closest('details');
  if (experience) experience.open = true;
  if (skills) skills.open = false;
 }
 document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#skill-"]');
  if (link && link.hash === location.hash) revealHash();
 });
 window.addEventListener('pageshow', resetDisclosures);
 resetDisclosures();
 if (!location.hash.startsWith('#skill-')) revealHash();
})();
