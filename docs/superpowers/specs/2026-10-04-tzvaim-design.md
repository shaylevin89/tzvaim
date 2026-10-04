# צבעים (Tzvaim) — Hebrew Color Game — Design

## Goal
A toddler-friendly "find the color" game, fully in Hebrew, where every tap speaks the
color name aloud. Static site, free hosting on GitHub Pages.

**Success:** a toddler can play on a phone without reading; every color name is heard in
natural Hebrew; the game is live at `https://shaylevin89.github.io/tzvaim/`.

## Audience & constraints
- Toddlers/preschoolers, phone-first, no reading required, big tap targets.
- Entire UI in Hebrew, RTL (`<html lang="he" dir="rtl">`).
- Static files only, no build step, no backend.
- Public GitHub repo `tzvaim`, Pages served from `main` branch root.

## Colors (10)
| id | Hebrew | spoken (with niqqud) | hex |
|---|---|---|---|
| red | אדום | אָדֹם | #E53935 |
| blue | כחול | כָּחֹל | #1E88E5 |
| yellow | צהוב | צָהֹב | #FDD835 |
| green | ירוק | יָרֹק | #43A047 |
| orange | כתום | כָּתֹם | #FB8C00 |
| purple | סגול | סָגֹל | #8E24AA |
| pink | ורוד | וָרֹד | #F06292 |
| brown | חום | חוּם | #795548 |
| black | שחור | שָׁחֹר | #212121 |
| white | לבן | לָבָן | #FFFFFF |

Niqqud is a starting point; any word that sounds wrong is re-generated with adjusted text.

## Screens
1. **Start:** title "צבעים", large ▶ button. The tap unlocks audio (iOS/Android autoplay policy).
2. **Game:** top bar — 🏠 home (right), 5 progress dots (center), 🔊/🔇 mute (left).
   Below: target color word in large text (e.g. "ורוד") + 💬 button that replays the word.
   2×2 grid of white rounded cards, each showing one colored picture.
3. **End (after 5 rounds):** confetti, spoken "כל הכבוד! נגמר!", "שוב" (play again) button, 🏠 home.

🏠 during a game returns to the start screen (no confirmation).

## Game rules
- Game = 5 rounds.
- Each round: choose 4 distinct colors and 4 distinct pictures; pair them randomly; pick
  one of the 4 colors as target. Target is never the same as the previous round's target.
- Round start: show target word and speak the color name.
- **Every card tap speaks that card's color name.**
  - Correct: name → praise (random of "כל הכבוד!", "יופי!", "מצוין!"), card bounce + sparkle,
    progress dot fills, next round ~1.5s after audio ends.
  - Wrong: name + gentle wiggle; player tries again. No buzzer, no penalty.
- Input is locked while a correct-answer sequence plays. Wrong taps interrupt any
  currently playing clip (stop, then play new one) so audio never overlaps.

## Pictures
~10 inline SVG objects, color-neutral (no foods): car, heart, star, balloon, ball, flower,
fish, butterfly, kite, hat. Each is a function of the fill color returning SVG markup. All
shapes have a dark outline (#333, ~3px) so white is visible on white cards. Darker accent
details (wheels, eyes, strings) are fixed colors.

## Audio
- `tools/generate_audio.py` uses `edge-tts`, voice `he-IL-HilaNeural`, writes MP3s:
  - `audio/colors/<id>.mp3` × 10
  - `audio/praise/1.mp3`, `2.mp3`, `3.mp3`
  - `audio/end.mp3`
- Script accepts optional ids to regenerate selected files only.
- Browser: Web Audio API; all clips fetched + decoded after the start tap; one active
  source at a time; mute sets a gain node to 0. If a clip fails to load, the game still
  plays silently (no crash).

## Code structure
```
index.html          markup for 3 screens
style.css           layout, RTL, animations (bounce, wiggle, confetti)
js/logic.js         pure round logic (ES module, no DOM) — tested
js/pictures.js      SVG picture functions
js/audio.js         Web Audio loader/player/mute
js/main.js          DOM wiring, screens, game flow
tests/logic.test.js node:test unit tests
tools/generate_audio.py
audio/              generated MP3s (committed)
```
Font: Varela Round (Google Fonts), fallback system sans-serif.

## Testing
- `node --test tests/` for logic: 4 distinct colors, 4 distinct pictures, target is among
  the round's colors, target differs from previous target, game length 5.
- Manual end-to-end in Chrome at phone viewport: start, correct/wrong taps, mute, home,
  end screen, play again.
- User listens to generated audio and approves before deploy.

## Deploy
`gh repo create tzvaim --public`, push `main`, enable Pages (branch `main`, path `/`).
Verify the live URL loads and audio files are served.

## Out of scope
Offline/PWA, additional modes, scoring/levels, settings.
