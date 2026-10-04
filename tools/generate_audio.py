#!/usr/bin/env python3
"""Generate the game's Hebrew voice clips with edge-tts.

Usage (from repo root):
    uv run --with edge-tts python tools/generate_audio.py            # all clips
    uv run --with edge-tts python tools/generate_audio.py pink end   # only some

Spoken text uses niqqud to steer pronunciation. If a word sounds wrong,
edit its text here and regenerate just that key.
"""
import asyncio
import sys
from pathlib import Path

import edge_tts

VOICE = "he-IL-HilaNeural"
RATE = "-10%"  # a little slower for toddlers
AUDIO_DIR = Path(__file__).resolve().parent.parent / "audio"

# key -> (output path relative to audio/, spoken text)
CLIPS = {
    "red": ("colors/red.mp3", "אָדֹם"),
    "blue": ("colors/blue.mp3", "כָּחֹל"),
    "yellow": ("colors/yellow.mp3", "צָהֹב"),
    "green": ("colors/green.mp3", "יָרֹק"),
    "orange": ("colors/orange.mp3", "כָּתֹם"),
    "purple": ("colors/purple.mp3", "סָגֹל"),
    "pink": ("colors/pink.mp3", "וָרֹד"),
    "brown": ("colors/brown.mp3", "חוּם"),
    "black": ("colors/black.mp3", "שָׁחֹר"),
    "white": ("colors/white.mp3", "לָבָן"),
    "praise1": ("praise/1.mp3", "כׇּל הַכָּבוֹד!"),
    "praise2": ("praise/2.mp3", "יֹפִי!"),
    "praise3": ("praise/3.mp3", "מְצֻיָּן!"),
    "end": ("end.mp3", "כׇּל הַכָּבוֹד! סיימת!"),
}


async def generate(key: str) -> None:
    rel, text = CLIPS[key]
    out = AUDIO_DIR / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(out))
    print(f"{key:8} -> audio/{rel}")


async def main(keys: list[str]) -> None:
    unknown = [k for k in keys if k not in CLIPS]
    if unknown:
        sys.exit(f"unknown keys: {', '.join(unknown)}\nvalid: {', '.join(CLIPS)}")
    for key in keys or CLIPS:
        await generate(key)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:]))
