import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioPlayer } from '../js/audio.js';

// Minimal stand-in for an AudioContext. Sources end only when the test calls
// source.finish(), or (like real Web Audio) after stop().
function fakeContext() {
  const ctx = {
    state: 'suspended',
    resumed: 0,
    gains: [],
    sources: [],
    destination: { name: 'destination' },
    createGain() {
      const g = { gain: { value: 1 }, connectedTo: null, connect(n) { this.connectedTo = n; } };
      ctx.gains.push(g);
      return g;
    },
    createBufferSource() {
      const s = {
        buffer: null, onended: null, started: false, stopped: false, connectedTo: null,
        connect(n) { this.connectedTo = n; },
        start() { this.started = true; },
        stop() { this.stopped = true; queueMicrotask(() => this.onended?.()); },
        finish() { this.onended?.(); },
      };
      ctx.sources.push(s);
      return s;
    },
    decodeAudioData(data) { return Promise.resolve({ decoded: data }); },
    resume() { ctx.resumed++; ctx.state = 'running'; return Promise.resolve(); },
  };
  return ctx;
}

const okFetch = async (url) => ({ ok: true, arrayBuffer: async () => url });
const tick = () => new Promise((r) => setImmediate(r));

async function loadedPlayer(keys = ['a', 'b']) {
  const context = fakeContext();
  const player = createAudioPlayer({ context, fetchFn: okFetch });
  await player.load(Object.fromEntries(keys.map((k) => [k, `${k}.mp3`])));
  return { context, player };
}

test('play routes a decoded buffer through the gain node and resolves true on end', async () => {
  const { context, player } = await loadedPlayer();
  const done = player.play('a');
  const src = context.sources[0];
  assert.ok(src.started);
  assert.deepEqual(src.buffer, { decoded: 'a.mp3' });
  assert.equal(src.connectedTo, context.gains[0]);
  assert.equal(context.gains[0].connectedTo, context.destination);
  src.finish();
  assert.equal(await done, true);
});

test('a new play interrupts the current one (no overlapping audio)', async () => {
  const { context, player } = await loadedPlayer();
  const first = player.play('a');
  const second = player.play('b');
  assert.equal(context.sources[0].stopped, true);
  assert.equal(await first, false);
  context.sources[1].finish();
  assert.equal(await second, true);
});

test('playSequence plays clips in order', async () => {
  const { context, player } = await loadedPlayer();
  const seq = player.playSequence(['a', 'b']);
  assert.equal(context.sources.length, 1);
  context.sources[0].finish();
  await tick();
  assert.equal(context.sources.length, 2);
  assert.deepEqual(context.sources[1].buffer, { decoded: 'b.mp3' });
  context.sources[1].finish();
  assert.equal(await seq, true);
});

test('stop interrupts a sequence and the rest is not played', async () => {
  const { context, player } = await loadedPlayer();
  const seq = player.playSequence(['a', 'b']);
  player.stop();
  assert.equal(await seq, false);
  await tick();
  assert.equal(context.sources.length, 1);
});

test('failed loads are skipped and play resolves without sound', async () => {
  const context = fakeContext();
  const fetchFn = async (url) => {
    if (url === 'bad.mp3') throw new Error('offline');
    if (url === 'missing.mp3') return { ok: false, status: 404 };
    return okFetch(url);
  };
  const warn = console.warn;
  console.warn = () => {};
  try {
    const player = createAudioPlayer({ context, fetchFn });
    await player.load({ good: 'good.mp3', bad: 'bad.mp3', missing: 'missing.mp3' });
    assert.equal(await player.play('bad'), true);
    assert.equal(await player.play('missing'), true);
    assert.equal(await player.playSequence(['bad', 'missing']), true);
    assert.equal(context.sources.length, 0);
  } finally {
    console.warn = warn;
  }
});

test('mute sets gain to 0 and back to 1', async () => {
  const { context, player } = await loadedPlayer();
  assert.equal(player.muted, false);
  player.setMuted(true);
  assert.equal(player.muted, true);
  assert.equal(context.gains[0].gain.value, 0);
  player.setMuted(false);
  assert.equal(context.gains[0].gain.value, 1);
});

test('unlock resumes a suspended context only', async () => {
  const { context, player } = await loadedPlayer();
  await player.unlock();
  await player.unlock();
  assert.equal(context.resumed, 1);
});

test('unlock resumes an interrupted context too', async () => {
  const { context, player } = await loadedPlayer();
  context.state = 'interrupted';
  await player.unlock();
  assert.equal(context.resumed, 1);
  assert.equal(context.state, 'running');
});

test('unlock does nothing once the context is already running', async () => {
  const { context, player } = await loadedPlayer();
  context.state = 'running';
  await player.unlock();
  assert.equal(context.resumed, 0);
});

test('play resolves true via a safety timeout when the source never ends', async () => {
  // Simulates a non-running AudioContext (e.g. iOS 'interrupted'): the
  // source is started but onended never fires, so play() must not hang.
  const context = fakeContext();
  const player = createAudioPlayer({ context, fetchFn: okFetch });
  const decodeAudioData = context.decodeAudioData.bind(context);
  context.decodeAudioData = async (data) => {
    const decoded = await decodeAudioData(data);
    return { ...decoded, duration: 0.01 };
  };
  await player.load({ a: 'a.mp3' });
  const done = player.play('a');
  // Never call src.finish() / stop() -- onended must never fire.
  assert.equal(await done, true);
});

test('stopping a clip clears its safety timer so it cannot later resolve a newer clip', async () => {
  const context = fakeContext();
  const player = createAudioPlayer({ context, fetchFn: okFetch });
  const decodeAudioData = context.decodeAudioData.bind(context);
  context.decodeAudioData = async (data) => {
    const decoded = await decodeAudioData(data);
    return { ...decoded, duration: 0.01 };
  };
  await player.load({ a: 'a.mp3', b: 'b.mp3' });
  const first = player.play('a');
  const second = player.play('b'); // interrupts a; a's timer should be cleared
  assert.equal(await first, false);
  // Wait past a's safety timeout (duration*1000+500 = 510ms); b must still
  // be the live clip, unresolved until it actually ends.
  await new Promise((r) => setTimeout(r, 600));
  context.sources[1].finish();
  assert.equal(await second, true);
});
