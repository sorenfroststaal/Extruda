/* Apply authored translations through the existing Extruda language control. */
(() => {
  const applyLanguage = () => {
    const language = document.documentElement.lang === 'en' ? 'en' : 'da';
    document.body.dataset.outputLanguage = language;
    document.querySelector('main').lang = language;
    document.querySelectorAll('[data-da][data-en]').forEach(node => {
      const value = node.dataset[language];
      if (node.textContent !== value) node.textContent = value;
    });
    document.querySelectorAll('time[datetime]').forEach(node => {
      const formatted = new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'da-DK', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
      }).format(new Date(node.dateTime + 'T12:00:00Z'));
      if (node.textContent !== formatted) node.textContent = formatted;
    });
    const slogan = document.querySelector('.slogan');
    if (slogan) {
      slogan.src = 'https://extruda.dk/Assets/Brand/slogan-' + language + '.svg';
      slogan.alt = language === 'en' ? 'I can do some stuff. You can too. What can we do together?' : 'Jeg kan sgu nogle ting. Du kan nogle andre. Hvad kan vi sammen?';
    }
  };
  document.addEventListener('extruda:preferences', applyLanguage);
  applyLanguage();
  // Factual CV records refresh asynchronously after the initial page load.
  const observer = new MutationObserver(applyLanguage);
  observer.observe(document.querySelector('main'), { childList: true, subtree: true });
})();

