import { COLORS, ROUNDS_PER_GAME, colorById, createGame } from './logic.js';
import { PICTURE_IDS, renderPicture } from './pictures.js';
import { createAudioPlayer } from './audio.js';

const NEXT_ROUND_DELAY_MS = 1500;
const PRAISE_KEYS = ['praise:1', 'praise:2', 'praise:3'];
const AUDIO_FILES = {
  ...Object.fromEntries(COLORS.map((c) => [`color:${c.id}`, `audio/colors/${c.id}.mp3`])),
  'praise:1': 'audio/praise/1.mp3',
  'praise:2': 'audio/praise/2.mp3',
  'praise:3': 'audio/praise/3.mp3',
  end: 'audio/end.mp3',
};
const CONFETTI_COLORS = COLORS.filter((c) => c.id !== 'white').map((c) => c.hex);

const $ = (id) => document.getElementById(id);
const screens = { start: $('screen-start'), game: $('screen-game'), end: $('screen-end') };

let player = null;
let audioReady = Promise.resolve();
let game = null;
let lastTargetId = null;
// Bumped on every new game and on going home, so async continuations from an
// abandoned game (praise → delay → next round) can tell they are stale.
let session = 0;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (items) => items[Math.floor(Math.random() * items.length)];

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

// Must be called synchronously inside a tap handler: mobile browsers only
// allow audio to start from a user gesture.
function ensureAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return audioReady;
  if (!player) {
    // Let iPhone play sound even when the ring/silent switch is on silent.
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    player = createAudioPlayer({ context: new Ctx() });
    audioReady = player.load(AUDIO_FILES);
  }
  return player.unlock().then(() => audioReady);
}

function play(key) {
  return player ? player.play(key) : Promise.resolve(true);
}

function playSequence(keys) {
  return player ? player.playSequence(keys) : Promise.resolve(true);
}

function restartAnimation(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // force reflow so the animation runs again
  el.classList.add(cls);
}

function renderDots() {
  $('dots').replaceChildren(...Array.from({ length: ROUNDS_PER_GAME }, (_, i) => {
    const li = document.createElement('li');
    li.classList.toggle('done', i < game.completed);
    return li;
  }));
}

function renderRound() {
  const { cards, targetId } = game.round;
  $('target-word').textContent = colorById(targetId).name;
  $('cards').replaceChildren(...cards.map((card, i) => {
    const color = colorById(card.colorId);
    const button = document.createElement('button');
    button.className = 'card';
    button.setAttribute('aria-label', color.name);
    button.innerHTML = renderPicture(card.pictureId, color.hex);
    button.addEventListener('click', () => onCardTap(i, button));
    return button;
  }));
}

function sayTarget() {
  // Don't cut off the praise sequence of a solved round.
  if (game?.state !== 'playing') return;
  play(`color:${game.round.targetId}`);
}

async function startGame() {
  const mySession = ++session;
  game = createGame({ pictureIds: PICTURE_IDS, previousTargetId: lastTargetId });
  show('game');
  renderDots();
  renderRound();
  await ensureAudio();
  if (mySession !== session) return;
  sayTarget();
}

async function onCardTap(index, el) {
  const mySession = session;
  const { result, colorId } = game.tap(index);
  if (result === 'ignored') return;

  if (result === 'wrong') {
    restartAnimation(el, 'wiggle');
    play(`color:${colorId}`);
    return;
  }

  el.classList.add('solved');
  restartAnimation(el, 'bounce');
  renderDots();
  await playSequence([`color:${colorId}`, pick(PRAISE_KEYS)]);
  await delay(NEXT_ROUND_DELAY_MS);
  if (mySession !== session) return;

  lastTargetId = game.round.targetId;
  if (game.nextRound()) {
    renderRound();
    sayTarget();
  } else {
    finishGame();
  }
}

function finishGame() {
  show('end');
  burstConfetti();
  play('end');
}

function burstConfetti() {
  $('confetti').replaceChildren(...Array.from({ length: 60 }, () => {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = pick(CONFETTI_COLORS);
    piece.style.animationDuration = `${2 + Math.random() * 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    return piece;
  }));
}

function goHome() {
  session++;
  player?.stop();
  if (game) lastTargetId = game.round.targetId;
  show('start');
}

function toggleMute() {
  if (!player) return;
  player.setMuted(!player.muted);
  $('btn-mute').textContent = player.muted ? '🔇' : '🔊';
  $('btn-mute').setAttribute('aria-label', player.muted ? 'ביטול השתקה' : 'השתקה');
}

$('btn-play').addEventListener('click', startGame);
$('btn-again').addEventListener('click', startGame);
$('btn-home').addEventListener('click', goHome);
$('btn-end-home').addEventListener('click', goHome);
$('btn-mute').addEventListener('click', toggleMute);
$('btn-say').addEventListener('click', sayTarget);
