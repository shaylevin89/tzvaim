// Pure game logic for צבעים. No DOM access, so it can be unit-tested in Node.

export const COLORS = [
  { id: 'red', name: 'אדום', hex: '#E53935' },
  { id: 'blue', name: 'כחול', hex: '#1E88E5' },
  { id: 'yellow', name: 'צהוב', hex: '#FDD835' },
  { id: 'green', name: 'ירוק', hex: '#43A047' },
  { id: 'orange', name: 'כתום', hex: '#FB8C00' },
  { id: 'purple', name: 'סגול', hex: '#8E24AA' },
  { id: 'pink', name: 'ורוד', hex: '#F06292' },
  { id: 'brown', name: 'חום', hex: '#795548' },
  { id: 'black', name: 'שחור', hex: '#212121' },
  { id: 'white', name: 'לבן', hex: '#FFFFFF' },
];

export const ROUNDS_PER_GAME = 5;
export const CHOICES_PER_ROUND = 4;

const COLORS_BY_ID = new Map(COLORS.map((c) => [c.id, c]));

export function colorById(id) {
  const color = COLORS_BY_ID.get(id);
  if (!color) throw new Error(`unknown color: ${id}`);
  return color;
}

function shuffled(items, rng) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRound(rng, pictureIds, previousTargetId = null) {
  if (pictureIds.length < CHOICES_PER_ROUND) {
    throw new Error(`need at least ${CHOICES_PER_ROUND} pictures`);
  }
  const targetPool = COLORS.filter((c) => c.id !== previousTargetId);
  const target = targetPool[Math.floor(rng() * targetPool.length)];
  const others = shuffled(COLORS.filter((c) => c.id !== target.id), rng)
    .slice(0, CHOICES_PER_ROUND - 1);
  const colors = shuffled([target, ...others], rng);
  const pictures = shuffled(pictureIds, rng).slice(0, CHOICES_PER_ROUND);
  return {
    targetId: target.id,
    cards: colors.map((c, i) => ({ colorId: c.id, pictureId: pictures[i] })),
  };
}

export function createGame({ pictureIds, rng = Math.random, previousTargetId = null }) {
  let round = pickRound(rng, pictureIds, previousTargetId);
  let roundIndex = 0;
  let completed = 0;
  let state = 'playing';

  return {
    get round() { return round; },
    get roundIndex() { return roundIndex; },
    get completed() { return completed; },
    get state() { return state; },

    tap(cardIndex) {
      if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= round.cards.length) {
        throw new RangeError(`bad card index: ${cardIndex}`);
      }
      const { colorId } = round.cards[cardIndex];
      if (state !== 'playing') return { result: 'ignored', colorId };
      if (colorId === round.targetId) {
        completed++;
        state = 'solved';
        return { result: 'correct', colorId };
      }
      return { result: 'wrong', colorId };
    },

    nextRound() {
      if (state !== 'solved') throw new Error(`nextRound called in state ${state}`);
      if (completed >= ROUNDS_PER_GAME) {
        state = 'over';
        return false;
      }
      round = pickRound(rng, pictureIds, round.targetId);
      roundIndex++;
      state = 'playing';
      return true;
    },
  };
}
