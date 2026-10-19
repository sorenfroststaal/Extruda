import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const notices = await readFile(new URL('../THIRD_PARTY_NOTICES.txt', import.meta.url), 'utf8');
await build({ stdin: { contents: "import QRCode from 'qrcode'; window.QRCode = QRCode;", resolveDir: process.cwd() }, bundle: true, platform: 'browser', format: 'iife', minify: true, outfile: 'public/qr.js', legalComments: 'eof', banner: { js: `/*!\n${notices.replaceAll('*/', '* /')}\n*/` } });
