import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('index.html is Hebrew RTL and loads main.js as a module', () => {
  const html = read('index.html');
  assert.match(html, /<html lang="he" dir="rtl">/);
  assert.match(html, /<script type="module" src="js\/main.js"><\/script>/);
  assert.match(html, /<title>צבעים<\/title>/);
});

test('every element id used by main.js exists in index.html', () => {
  const html = read('index.html');
  const main = read('js/main.js');
  const ids = [...main.matchAll(/\$\('([\w-]+)'\)/g)].map((m) => m[1]);
  assert.ok(ids.length >= 10, `expected main.js to look up elements, found ${ids.length}`);
  for (const id of ids) assert.ok(html.includes(`id="${id}"`), `missing #${id} in index.html`);
});
