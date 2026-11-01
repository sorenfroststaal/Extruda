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

/* Birthday is evaluated in Denmark, including for visitors in other time zones. */
(() => {
 const field = document.querySelector('[data-person-age]');
 if (!field) return;
 function updateAge() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', {timeZone: 'Europe/Copenhagen', year: 'numeric', month: 'numeric', day: 'numeric'}).formatToParts(new Date()).map(part => [part.type, part.value]));
  const year = Number(parts.year), month = Number(parts.month), day = Number(parts.day);
  field.textContent = String(year - 1985 - (month === 1 && day < 4 ? 1 : 0));
 }
 updateAge();
 window.addEventListener('pageshow', updateAge);
 document.addEventListener('visibilitychange', () => { if (!document.hidden) updateAge(); });
 setInterval(updateAge, 60000);
})();