(() => {
  'use strict';
  const key = 'hundehimlen-workspace-v1';
  const model = window.HundehimlenModel;
  const calculator = document.getElementById('calculator');
  const notes = document.getElementById('notes');
  const status = document.getElementById('save-status');
  const noteKeys = ['family', 'concept', 'property', 'questions'];
  const menu = document.getElementById('menu-toggle');
  const navigation = document.getElementById('section-nav');
  function closeMenu(restoreFocus = false) {
    navigation.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const open = navigation.classList.toggle('is-open'); menu.setAttribute('aria-expanded', String(open));
  });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true); });
  let language = 'da';
  let lastInputs;
  let message = ['Ingen noter gemt endnu. Hent en fil for at dele mellem computere.', 'No notes saved yet. Download a file to share between computers.'];
  const tr = (da, en) => language === 'en' ? en : da;
  const number = (value, digits = 0) => new Intl.NumberFormat(language === 'en' ? 'en-DK' : 'da-DK', { maximumFractionDigits: digits }).format(value);
  const money = value => `${number(value)} ${tr('kr.', 'DKK')}`;
  function setStatus(da, en) { message = [da, en]; status.textContent = tr(...message); }
  function translate(next) {
    language = next === 'en' ? 'en' : 'da';
    document.querySelectorAll('[data-da][data-en]').forEach(node => { node.textContent = node.dataset[language]; });
    document.querySelector('nav').setAttribute('aria-label', tr('Afsnit', 'Sections'));
    document.title = tr('Hundehimlen · extruda', 'Hundehimlen · extruda');
    status.textContent = tr(...message);
    if (!document.getElementById('calc-error').hidden) showInvalid();
    render();
  }
  function readInputs() {
    return Object.fromEntries(Object.keys(model.bounds).map(name => [name, calculator.elements[name].value === '' ? NaN : calculator.elements[name].valueAsNumber]));
  }
  function readNotes() { return Object.fromEntries(noteKeys.map(name => [name, notes.elements[name].value])); }
  function metric(title, value, wide = false) { return `<div${wide ? ' class="wide"' : ''}><dt>${title}</dt><dd>${value}</dd></div>`; }
  function render() {
    if (!lastInputs) return;
    const r = model.calculate(lastInputs);
    const breakEven = r.breakEven === null ? tr('Kan ikke dækkes', 'Cannot be covered') : `${number(r.breakEven, 1)} %${r.breakEven > 100 ? tr(' · over kapacitet', ' · above capacity') : ''}`;
    document.getElementById('results').innerHTML = `<dl class="metrics">${metric(tr('Solgte hundedøgn / måned', 'Sold dog-nights / month'), number(r.nights, 1))}${metric(tr('Omsætning ekskl. moms / måned', 'Revenue excl. VAT / month'), money(r.revenue))}${metric(tr('Efter variable udgifter / måned', 'After variable costs / month'), money(r.contribution))}${metric(tr('Rest efter drift, lån og ejerudtræk / måned', 'Balance after operations, loans and withdrawals / month'), money(r.remaining), true)}${metric(tr('Belægning til at dække alle valgte poster', 'Occupancy needed to cover all selected items'), breakEven, true)}</dl>
      <div class="table-wrap"><table><caption>${tr('Samme forudsætninger, forskellig belægning', 'Same assumptions, different occupancy')}</caption><thead><tr><th scope="col">${tr('Belægning', 'Occupancy')}</th><th scope="col">${tr('Omsætning ekskl. moms / md.', 'Revenue excl. VAT / mo.')}</th><th scope="col">${tr('Rest / md.', 'Balance / mo.')}</th></tr></thead><tbody>${[30, 50, 70].map(occupancy => { const s = model.calculate({...lastInputs, occupancy}); return `<tr><th scope="row">${occupancy} %</th><td>${money(s.revenue)}</td><td>${money(s.remaining)}</td></tr>`; }).join('')}</tbody></table></div>`;
  }
  function showInvalid() {
    const error = document.getElementById('calc-error');
    error.hidden = false;
    error.textContent = tr('Ret de markerede tal. Resultatet nedenfor viser seneste gyldige beregning.', 'Correct the marked numbers. The result below shows the last valid calculation.');
  }
  function update() {
    const inputs = readInputs();
    if (!calculator.checkValidity() || !model.valid(inputs)) { showInvalid(); calculator.reportValidity(); return false; }
    lastInputs = inputs;
    document.getElementById('calc-error').hidden = true;
    render(); return true;
  }
  function snapshot() { return { version: 1, notes: readNotes(), inputs: lastInputs }; }
  function validate(data) {
    if (!data || data.version !== 1 || !model.valid(data.inputs) || !data.notes || !noteKeys.every(name => typeof data.notes[name] === 'string' && data.notes[name].length <= 20000)) throw new Error('Invalid workspace');
    return { version: 1, inputs: Object.fromEntries(Object.keys(model.bounds).map(name => [name, data.inputs[name]])), notes: Object.fromEntries(noteKeys.map(name => [name, data.notes[name]])) };
  }
  function restore(data) {
    const checked = validate(data);
    for (const name of noteKeys) notes.elements[name].value = checked.notes[name];
    for (const name of Object.keys(model.bounds)) calculator.elements[name].value = checked.inputs[name];
    lastInputs = checked.inputs;
    document.getElementById('calc-error').hidden = true;
    render();
  }
  calculator.addEventListener('invalid', showInvalid, true);
  calculator.addEventListener('submit', event => { event.preventDefault(); update(); });
  calculator.addEventListener('input', () => {
    document.getElementById('calc-error').hidden = true;
    setStatus('Tal ændret. Tryk Beregn for at opdatere resultatet; Gem bevarer noter og tal i browseren.', 'Numbers changed. Select Calculate to update results; Save retains notes and numbers in this browser.');
  });
  notes.addEventListener('input', event => { if (event.target.tagName === 'TEXTAREA') setStatus('Noterne er ændret og endnu ikke gemt.', 'Notes have changed and are not saved yet.'); });
  notes.addEventListener('submit', event => {
    event.preventDefault();
    if (!update()) { setStatus('Ret beregnertallene, før noter og tal gemmes. Noterne er bevaret på siden.', 'Correct calculation inputs before saving. Your notes remain on the page.'); return; }
    try { localStorage.setItem(key, JSON.stringify(snapshot())); setStatus('Noter og tal er gemt i denne browser. De deles ikke automatisk.', 'Notes and numbers are saved in this browser. They are not shared automatically.'); }
    catch { setStatus('Browseren kunne ikke gemme. Noterne er bevaret på siden; hent en fil som sikkerhedskopi.', 'The browser could not save. Your notes remain on the page; download a backup file.'); }
  });
  document.getElementById('download').addEventListener('click', () => {
    if (!update()) { setStatus('Ret beregnertallene, før filen hentes. Noterne er bevaret på siden.', 'Correct calculation inputs before downloading. Your notes remain on the page.'); return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], {type: 'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'hundehimlen-noter.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    setStatus('Filen er gjort klar til download med de viste noter og tal.', 'The file is ready to download with the displayed notes and numbers.');
  });
  document.getElementById('import').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 500000) throw new Error('File too large');
      const checked = validate(JSON.parse(await file.text()));
      restore(checked);
      setStatus('Filen er åbnet. Tryk Gem for at bevare den i denne browser.', 'File opened. Select Save to retain it in this browser.');
    } catch { setStatus('Filen kunne ikke åbnes. Vælg en gyldig Hundehimlen-JSON-fil under 500 KB. De viste noter og tal er uændrede.', 'Could not open file. Choose a valid Hundehimlen JSON file below 500 KB. Displayed notes and numbers are unchanged.'); }
    event.target.value = '';
  });
  window.ExtrudaPage = {setLanguage: translate};
  update();
  try {
    const saved = localStorage.getItem(key);
    if (saved) { restore(JSON.parse(saved)); setStatus('Gemte noter og tal er åbnet fra denne browser.', 'Saved notes and numbers have been opened from this browser.'); }
  } catch { setStatus('Gemte noter kunne ikke læses. Eksisterende browserdata er ikke overskrevet. Du kan åbne en sikkerhedskopi som fil.', 'Saved notes could not be read. Existing browser data has not been overwritten. You can open a backup file.'); }
  status.textContent = tr(...message);
})();
