/* Shared, local header controls. Classic script: also works from file://. */
(() => {
  'use strict';
  const mount = document.querySelector('[data-extruda-controls]');
  if (!mount) return;
  const root = document.documentElement;
  const whiteLogo = new URL('../logos/extruda-logo-horizontal-white.svg', document.currentScript.src).href;
  const brandImages = [...document.querySelectorAll('header a img')].filter(n => n.alt.toLowerCase() === 'extruda' && !n.classList.contains('logo'));
  brandImages.forEach(n => n.dataset.originalSrc = n.getAttribute('src'));
  const media = matchMedia('(prefers-color-scheme: dark)');
  const key = 'extruda-ui-preferences';
  let prefs = { language: root.lang === 'en' ? 'en' : 'da', theme: 'system' };
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && ['da', 'en'].includes(saved.language)) prefs.language = saved.language;
    if (saved && ['system', 'light', 'dark'].includes(saved.theme)) prefs.theme = saved.theme;
  } catch { storageAvailable = false; }
  const icons = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
    light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    dark: '<path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5 8.5 8.5 0 1 0 20.5 14.4Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
  };
  const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  const tr = (da, en) => prefs.language === 'en' ? en : da;
  mount.classList.add('ex-utilities');
  mount.innerHTML = `<div class="ex-utility-wrap"><button class="ex-utility-button" type="button" data-utility="language" aria-expanded="false" aria-controls="ex-language-panel">${svg('globe')}<span class="ex-language-code">DA</span></button><div id="ex-language-panel" class="ex-utility-panel" hidden><fieldset><legend></legend><label><input type="radio" name="ex-ui-language" value="da" lang="da">Dansk <span>DA</span></label><label><input type="radio" name="ex-ui-language" value="en" lang="en">English <span>EN</span></label></fieldset></div></div><div class="ex-utility-wrap"><button class="ex-utility-button" type="button" data-utility="theme" aria-expanded="false" aria-controls="ex-theme-panel">${svg('light')}</button><div id="ex-theme-panel" class="ex-utility-panel" hidden><fieldset><legend></legend><label><input type="radio" name="ex-ui-theme" value="light"><span data-ui-da="Lys" data-ui-en="Light"></span></label><label><input type="radio" name="ex-ui-theme" value="dark"><span data-ui-da="Mørk" data-ui-en="Dark"></span></label><label><input type="radio" name="ex-ui-theme" value="system"><span data-ui-da="Følg system" data-ui-en="Follow system"></span></label></fieldset></div></div><button class="ex-utility-button" type="button" data-utility="info" aria-haspopup="dialog">${svg('info')}</button>`;
  const dialog = document.createElement('dialog');
  dialog.className = 'ex-about-dialog';
  dialog.setAttribute('aria-labelledby', 'ex-about-title');
  dialog.innerHTML = '<div class="ex-about-heading"><h2 id="ex-about-title"></h2><button type="button" class="ex-utility-close"></button></div><div class="ex-about-content"></div><p class="ex-preference-note"></p>';
  document.body.append(dialog);
  const template = document.getElementById('extruda-about');
  if (template) dialog.querySelector('.ex-about-content').append(template.content.cloneNode(true));
  const buttons = [...mount.querySelectorAll('[data-utility]')];
  let opener = null;
  function closePanels(restore = false) {
    const active = buttons.find(b => b.getAttribute('aria-expanded') === 'true');
    mount.querySelectorAll('.ex-utility-panel').forEach(p => p.hidden = true);
    buttons.filter(b => b.hasAttribute('aria-expanded')).forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (restore) active?.focus();
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(prefs)); storageAvailable = true; }
    catch { storageAvailable = false; }
  }
  function render() {
    const actual = prefs.theme === 'system' ? (media.matches ? 'dark' : 'light') : prefs.theme;
    root.dataset.theme = actual;
    root.dataset.themePreference = prefs.theme;
    root.lang = prefs.language;
    brandImages.forEach(n => n.src = actual === 'dark' ? whiteLogo : n.dataset.originalSrc);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', actual === 'dark' ? '#252C2C' : '#F5F0E8');
    mount.querySelector('.ex-language-code').textContent = prefs.language.toUpperCase();
    const languageLabel = tr('Sprog', 'Language') + ': ' + (prefs.language === 'da' ? 'Dansk' : 'English');
    buttons[0].setAttribute('aria-label', languageLabel); buttons[0].title = languageLabel;
    const themeName = prefs.theme === 'system' ? tr('Følg system', 'Follow system') : prefs.theme === 'dark' ? tr('Mørk', 'Dark') : tr('Lys', 'Light');
    buttons[1].innerHTML = svg(actual);
    buttons[1].setAttribute('aria-label', tr('Udseende', 'Appearance') + ': ' + themeName);
    buttons[1].title = buttons[1].getAttribute('aria-label');
    buttons[2].setAttribute('aria-label', tr('Om siden: data og krav', 'About this page: data and requirements')); buttons[2].title = buttons[2].getAttribute('aria-label');
    mount.querySelector('#ex-language-panel legend').textContent = tr('Sprog', 'Language');
    mount.querySelector('#ex-theme-panel legend').textContent = tr('Udseende', 'Appearance');
    mount.querySelectorAll('[data-ui-da]').forEach(n => n.textContent = n.dataset[prefs.language === 'da' ? 'uiDa' : 'uiEn']);
    mount.querySelectorAll('[name="ex-ui-language"]').forEach(n => n.checked = n.value === prefs.language);
    mount.querySelectorAll('[name="ex-ui-theme"]').forEach(n => n.checked = n.value === prefs.theme);
    dialog.querySelector('h2').textContent = tr('Om siden: data og krav', 'About this page: data and requirements');
    dialog.querySelector('.ex-utility-close').textContent = tr('Luk', 'Close');
    dialog.querySelectorAll('[data-da][data-en]').forEach(n => n.textContent = n.dataset[prefs.language]);
    dialog.querySelector('.ex-preference-note').textContent = storageAvailable ? tr('Sprog og udseende gemmes kun i denne browser. Ingen konto eller ekstra netværkstjeneste. Valgene kan være forskellige ved åbning fra lokale filer.', 'Language and appearance are saved only in this browser. No account or additional network service. Preferences may differ when opening local files.') : tr('Browseren tillader ikke lagring af valg. Sprog og udseende virker i denne åbne side og nulstilles ved genindlæsning.', 'The browser does not allow saving preferences. Language and appearance work in this open page and reset on reload.');
  }
  // Page adapters own product state. Header language never changes output-language settings.
  function apply({language = prefs.language, theme = prefs.theme} = {}, persist = true) {
    prefs.language = language === 'en' ? 'en' : 'da';
    prefs.theme = ['system', 'light', 'dark'].includes(theme) ? theme : 'system';
    if (persist) save();
    window.ExtrudaPage?.setLanguage?.(prefs.language);
    window.ExtrudaPage?.setTheme?.(prefs.theme);
    window.ExtrudaCopy?.apply?.(prefs.language);
    render();
    document.dispatchEvent(new CustomEvent('extruda:preferences', {detail: {...prefs}}));
  }
  for (const button of buttons) button.addEventListener('click', () => {
    if (button.dataset.utility === 'info') {
      closePanels(); opener = button; render(); dialog.showModal(); dialog.querySelector('.ex-utility-close').focus(); return;
    }
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    const open = panel.hidden; closePanels(); panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('input:checked')?.focus();
  });
  mount.addEventListener('change', event => {
    if (event.target.name === 'ex-ui-language') apply({language: event.target.value});
    if (event.target.name === 'ex-ui-theme') apply({theme: event.target.value});
    closePanels(true);
  });
  document.addEventListener('pointerdown', event => { if (!mount.contains(event.target)) closePanels(); });
  document.addEventListener('focusin', event => { if (!mount.contains(event.target)) closePanels(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dialog.open) closePanels(true); });
  dialog.querySelector('.ex-utility-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) {const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();} });
  dialog.addEventListener('close', () => opener?.focus());
  media.addEventListener('change', () => { if (prefs.theme === 'system') apply({}, false); });
  window.ExtrudaUI = {setPreferences: apply, getPreferences: () => ({...prefs})};
  apply({}, false);
})();
