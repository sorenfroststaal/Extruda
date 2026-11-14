// Checks that every downloadable installer has a matching .sha256 file and that
// the checksum shown on its project page is the real one.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const downloads = [
  { file: 'download/GoldfishSetup.exe', page: 'goldfish/index.html', id: 'goldfish-sha256' },
];
const failures = [];
for (const { file, page, id } of downloads) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  const listed = fs.readFileSync(path.join(root, file + '.sha256'), 'utf8').trim().split(/\s+/)[0].toLowerCase();
  const shown = (new RegExp(`id="${id}">([0-9a-f]{64})<`).exec(fs.readFileSync(path.join(root, page), 'utf8')) || [])[1];
  if (listed !== actual) failures.push(`${file}.sha256 does not match the file`);
  if (shown !== actual) failures.push(`${page} does not show the current SHA-256 of ${file}`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Downloads OK: ${downloads.length} installer(s) match their published SHA-256.`);
