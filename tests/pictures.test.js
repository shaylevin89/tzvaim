import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PICTURE_IDS, renderPicture } from '../js/pictures.js';

test('has the 10 spec pictures', () => {
  assert.deepEqual(PICTURE_IDS,
    ['car', 'heart', 'star', 'balloon', 'ball', 'flower', 'fish', 'butterfly', 'kite', 'hat']);
});

test('every picture renders an svg filled with the given color', () => {
  for (const id of PICTURE_IDS) {
    const svg = renderPicture(id, '#ABCDEF');
    assert.match(svg, /^<svg [^>]*viewBox="0 0 100 100"/, id);
    assert.ok(svg.endsWith('</svg>'), id);
    assert.ok(svg.includes('fill="#ABCDEF"'), `${id} does not use the color`);
  }
});

test('every picture has a dark outline so white is visible on a white card', () => {
  for (const id of PICTURE_IDS) {
    const svg = renderPicture(id, '#FFFFFF');
    // The colored shape itself must carry the outline, not just some detail.
    assert.match(svg, /fill="#FFFFFF" stroke="#333"/, id);
  }
});

test('unknown picture throws', () => {
  assert.throws(() => renderPicture('banana', '#FDD835'), /unknown picture/);
});
