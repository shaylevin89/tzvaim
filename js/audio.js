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
      // iOS parks the context as 'interrupted' (screen lock / app switch /
      // call) as well as 'suspended'; either way it must be resumed from a
      // user gesture or playback silently never starts.
      if (context.state !== 'running') {
        try { await context.resume(); } catch { /* stays silent; game still works */ }
      }
    },

    stop() {
      if (!current) return;
      const playing = current;
      current = null;
      clearTimeout(playing.timer);
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
        const entry = { source, finish: resolve, timer: null };
        source.onended = () => {
          if (current !== entry) return; // interrupted; already resolved false
          current = null;
          clearTimeout(entry.timer);
          resolve(true);
        };
        current = entry;
        source.start();
        // Safety net: if the context isn't actually running (e.g. iOS left
        // it 'interrupted'), a started source never fires onended and this
        // promise would hang forever, freezing the game. Resolve anyway
        // once the clip should have finished.
        const duration = Number.isFinite(buffer.duration) ? buffer.duration : 0;
        entry.timer = setTimeout(() => {
          if (current !== entry) return;
          current = null;
          resolve(true);
        }, duration * 1000 + 500);
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
