import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLORS, ROUNDS_PER_GAME, CHOICES_PER_ROUND, colorById, pickRound, createGame,
} from '../js/logic.js';

const PICS = ['car', 'heart', 'star', 'balloon', 'ball', 'flower', 'fish', 'butterfly', 'kite', 'hat'];

// Deterministic PRNG (mulberry32) so failures are reproducible.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Solve the current round by tapping the target card.
function solve(game) {
  const i = game.round.cards.findIndex((c) => c.colorId === game.round.targetId);
  return game.tap(i);
}

test('COLORS has the 10 spec colors with unique ids', () => {
  assert.deepEqual(
    COLORS.map((c) => c.id),
    ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'black', 'white'],
  );
  assert.equal(colorById('pink').name, 'ורוד');
  assert.equal(colorById('white').hex, '#FFFFFF');
  assert.throws(() => colorById('gold'), /unknown color/);
});

test('constants match spec', () => {
  assert.equal(ROUNDS_PER_GAME, 5);
  assert.equal(CHOICES_PER_ROUND, 4);
});

test('pickRound: 4 distinct colors, 4 distinct pictures, target among them', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const r = pickRound(seeded(seed), PICS);
    assert.equal(r.cards.length, 4);
    assert.equal(new Set(r.cards.map((c) => c.colorId)).size, 4);
    assert.equal(new Set(r.cards.map((c) => c.pictureId)).size, 4);
    assert.ok(r.cards.some((c) => c.colorId === r.targetId));
    for (const c of r.cards) assert.ok(PICS.includes(c.pictureId));
  }
});

test('pickRound never repeats the previous target', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const r = pickRound(seeded(seed), PICS, 'red');
    assert.notEqual(r.targetId, 'red');
  }
});

test('pickRound uses every color as a target eventually', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 300; seed++) seen.add(pickRound(seeded(seed), PICS).targetId);
  assert.equal(seen.size, 10);
});

test('pickRound rejects too few pictures', () => {
  assert.throws(() => pickRound(seeded(1), ['car', 'heart', 'star']), /at least 4/);
});

test('new game starts at round 0, nothing completed, playing', () => {
  const g = createGame({ pictureIds: PICS, rng: seeded(7) });
  assert.equal(g.roundIndex, 0);
  assert.equal(g.completed, 0);
  assert.equal(g.state, 'playing');
});

test('first round avoids previousTargetId', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const g = createGame({ pictureIds: PICS, rng: seeded(seed), previousTargetId: 'blue' });
    assert.notEqual(g.round.targetId, 'blue');
  }
});

test('wrong tap returns the tapped color and changes nothing', () => {
  const g = createGame({ pictureIds: PICS, rng: seeded(3) });
  const i = g.round.cards.findIndex((c) => c.colorId !== g.round.targetId);
  const res = g.tap(i);
  assert.deepEqual(res, { result: 'wrong', colorId: g.round.cards[i].colorId });
  assert.equal(g.completed, 0);
  assert.equal(g.state, 'playing');
});

test('correct tap completes the round; second tap after correct is ignored', () => {
  const g = createGame({ pictureIds: PICS, rng: seeded(4) });
  const first = solve(g);
  assert.equal(first.result, 'correct');
  assert.equal(first.colorId, g.round.targetId);
  assert.equal(g.completed, 1);
  assert.equal(g.state, 'solved');
  const again = solve(g);
  assert.equal(again.result, 'ignored');
  assert.equal(g.tap(0).result, 'ignored');
  assert.equal(g.completed, 1);
});

test('nextRound before solving throws', () => {
  const g = createGame({ pictureIds: PICS, rng: seeded(5) });
  assert.throws(() => g.nextRound(), /state playing/);
});

test('full game: 5 rounds, consecutive targets differ, then over', () => {
  const g = createGame({ pictureIds: PICS, rng: seeded(6) });
  let prev = null;
  for (let n = 1; n <= 5; n++) {
    assert.equal(g.roundIndex, n - 1);
    assert.notEqual(g.round.targetId, prev);
    prev = g.round.targetId;
    assert.equal(solve(g).result, 'correct');
    assert.equal(g.completed, n);
    const more = g.nextRound();
    assert.equal(more, n < 5);
  }
  assert.equal(g.state, 'over');
  assert.equal(g.tap(0).result, 'ignored');
  assert.throws(() => g.nextRound(), /state over/);
});

test('tap with a bad index throws RangeError', () => {
  const g = createGame({ pictureIds: PICS, rng: seeded(8) });
  assert.throws(() => g.tap(4), RangeError);
  assert.throws(() => g.tap(-1), RangeError);
  assert.throws(() => g.tap(1.5), RangeError);
});
