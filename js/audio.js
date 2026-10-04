// Web Audio clip player: preloads clips, plays one at a time, supports mute.
// The AudioContext is injected so this module has no DOM dependency.

export function createAudioPlayer({ context, fetchFn = (url) => fetch(url) }) {
  const gain = context.createGain();
  gain.connect(context.destination);
  const buffers = new Map();
  let current = null; // { source, finish(ok) }
  let muted = false;

  async function loadOne(key, url) {
    try {
      const res = await fetchFn(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      buffers.set(key, await context.decodeAudioData(await res.arrayBuffer()));
    } catch (err) {
      console.warn(`audio: could not load ${key} (${url})`, err);
    }
  }

  const player = {
    async load(map) {
      await Promise.all(Object.entries(map).map(([key, url]) => loadOne(key, url)));
    },

    async unlock() {
      if (context.state === 'suspended') {
        try { await context.resume(); } catch { /* stays silent; game still works */ }
      }
    },

    stop() {
      if (!current) return;
      const playing = current;
      current = null;
      try { playing.source.stop(); } catch { /* already stopped */ }
      playing.finish(false);
    },

    play(key) {
      player.stop();
      const buffer = buffers.get(key);
      if (!buffer) return Promise.resolve(true);
      return new Promise((resolve) => {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(gain);
        const entry = { source, finish: resolve };
        source.onended = () => {
          if (current !== entry) return; // interrupted; already resolved false
          current = null;
          resolve(true);
        };
        current = entry;
        source.start();
      });
    },

    async playSequence(keys) {
      for (const key of keys) {
        if (!(await player.play(key))) return false;
      }
      return true;
    },

    setMuted(value) {
      muted = value;
      gain.gain.value = value ? 0 : 1;
    },

    get muted() { return muted; },
  };
  return player;
}
