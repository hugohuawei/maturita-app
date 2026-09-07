/* Zvýši verziu appky na všetkých miestach naraz:
   BUILD v js/app.js, V v sw.js a ?v= v index.html.
   Spusti pred každým nasadením:  node bump.mjs            */
import { readFileSync, writeFileSync } from 'node:fs';

const app = readFileSync('js/app.js', 'utf8');
const cur = Number(app.match(/const BUILD = 'v(\d+)'/)[1]);
const next = cur + 1;

const d = new Date();
const date = `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;

writeFileSync('js/app.js', app
  .replace(/const BUILD = 'v\d+'/, `const BUILD = 'v${next}'`)
  .replace(/const BUILD_DATE = '[^']*'/, `const BUILD_DATE = '${date}'`));

writeFileSync('sw.js', readFileSync('sw.js', 'utf8')
  .replace(/const V = 'maturita-v\d+'/, `const V = 'maturita-v${next}'`));

writeFileSync('index.html', readFileSync('index.html', 'utf8')
  .replace(/\?v=\d+/g, `?v=${next}`));

console.log(`v${cur} → v${next} · ${date}`);
