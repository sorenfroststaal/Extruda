import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('English labels translate without changing entered text or generated output', () => {
  const field = {
    value: 'Min egen ret', attrs: {placeholder: 'Søg efter en ret', 'aria-label': 'Tekst på kort 3'},
    closest: () => null,
    hasAttribute(name) {return name in this.attrs;},
    getAttribute(name) {return this.attrs[name];},
    setAttribute(name, value) {this.attrs[name] = value;}
  };
  const output = {...field, attrs: {'aria-label': 'Tekst på kort 3'}, closest: () => true};
  const document = {
    documentElement: {lang: 'da', dataset: {extrudaPage: 'planner'}}, body: {},
    createTreeWalker: () => ({nextNode: () => false}),
    querySelectorAll: selector => selector.startsWith('[placeholder]') ? [field, output] : []
  };
  const window = {};
  runInNewContext(readFileSync(new URL('../assets/shared/extruda-copy.js', import.meta.url), 'utf8'), {
    document, window, NodeFilter: {SHOW_TEXT: 4}, queueMicrotask,
    MutationObserver: class {disconnect() {} observe() {}}
  });
  window.ExtrudaCopy.apply('en');
  assert.equal(field.attrs.placeholder, 'Search for a dish');
  assert.equal(field.attrs['aria-label'], 'Text on card 3');
  assert.equal(field.value, 'Min egen ret');
  assert.equal(output.attrs['aria-label'], 'Tekst på kort 3');
  assert.equal(window.ExtrudaCopy.text('Fjern kort 3: Min egen ret'), 'Remove card 3: Min egen ret');
  assert.equal(window.ExtrudaCopy.text('Opskrift kan tilføjes'), 'A recipe can be added');
  window.ExtrudaCopy.apply('da');
  assert.equal(field.attrs.placeholder, 'Søg efter en ret');
  assert.equal(field.attrs['aria-label'], 'Tekst på kort 3');
  assert.equal(field.value, 'Min egen ret');
});
