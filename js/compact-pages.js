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
  requestAnimationFrame(() => target.scrollIntoView({block: 'start'}));
 }
 window.addEventListener('hashchange', revealHash);
 revealHash();
})();
