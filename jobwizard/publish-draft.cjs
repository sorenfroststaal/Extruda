/* Run after reviewing the selected draft. Writes one new page; never pushes. */
const fs = require('fs');
const path = require('path');
const file = process.argv[2];
if (!file) throw new Error('Usage: node jobwizard/publish-draft.cjs <draft.json>');
const draft = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
if (draft.format !== 'extruda-job-page-v1' || !/^[A-Za-z0-9]{4,12}$/.test(draft.code)) throw new Error('Invalid draft or code');
if (typeof draft.html !== 'string' || draft.html.length > 12000000 || !draft.html.includes('noindex,nofollow')) throw new Error('Invalid page content');
const root = path.resolve(__dirname, '..');
if (fs.readdirSync(root).some(name => name.toLowerCase() === draft.code.toLowerCase())) throw new Error('Code is already in use; select another code.');
const destination = path.join(root, draft.code);
fs.mkdirSync(destination);
fs.writeFileSync(path.join(destination, 'index.html'), draft.html, 'utf8');
console.log(`Prepared ${draft.url}. Review, commit and publish this folder separately.`);
