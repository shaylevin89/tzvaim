# צבעים — משחק צבעים לילדים

A Hebrew color-finding game for toddlers. Tap the picture in the named color; every tap
says the color name aloud.

Play: https://shaylevin89.github.io/tzvaim/

## Develop

```bash
python3 -m http.server 8765   # then open http://localhost:8765/
node --test                   # unit tests
```

## Voice clips

Generated with edge-tts (`he-IL-HilaNeural`), silence-trimmed with ffmpeg:

```bash
uv run --with edge-tts python tools/generate_audio.py          # all
uv run --with edge-tts python tools/generate_audio.py pink end # some
```
