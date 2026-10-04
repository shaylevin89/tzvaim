import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { COLORS } from '../js/logic.js';

const FILES = [
  ...COLORS.map((c) => `audio/colors/${c.id}.mp3`),
  'audio/praise/1.mp3', 'audio/praise/2.mp3', 'audio/praise/3.mp3',
  'audio/end.mp3',
];

test('every voice clip exists and is non-trivial', () => {
  for (const f of FILES) {
    const { size } = statSync(new URL(`../${f}`, import.meta.url));
    assert.ok(size > 2000, `${f} too small (${size} bytes)`);
  }
});
