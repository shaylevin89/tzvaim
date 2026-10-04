#!/usr/bin/env python3
"""Generate the game's Hebrew voice clips with edge-tts.

Usage (from repo root):
    uv run --with edge-tts python tools/generate_audio.py            # all clips
    uv run --with edge-tts python tools/generate_audio.py pink end   # only some

Spoken text uses niqqud to steer pronunciation. If a word sounds wrong,
edit its text here and regenerate just that key.

Requires: ffmpeg (for silence trimming).
"""
import asyncio
import shutil
import subprocess
import sys
import tempfile
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
    "praise1": ("praise/1.mp3", "כּוֹל הַכָּבוֹד!"),
    "praise2": ("praise/2.mp3", "יֹפִי!"),
    "praise3": ("praise/3.mp3", "מְצֻיָּן!"),
    "end": ("end.mp3", "כּוֹל הַכָּבוֹד! נִגְמַר!"),
}


async def generate(key: str) -> None:
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        sys.exit("ffmpeg not found in PATH")

    rel, text = CLIPS[key]
    out = AUDIO_DIR / rel
    out.parent.mkdir(parents=True, exist_ok=True)

    # Generate temp file via edge-tts
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        temp_path = tmp.name

    try:
        await edge_tts.Communicate(text, VOICE, rate=RATE).save(temp_path)

        # Trim leading and trailing silence with ffmpeg
        silence_filter = (
            "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,"
            "areverse,"
            "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,"
            "areverse"
        )
        cmd = [
            ffmpeg_path,
            "-i", temp_path,
            "-af", silence_filter,
            "-c:a", "libmp3lame",
            "-q:a", "4",
            "-y",
            str(out),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            sys.exit(f"ffmpeg failed for {key}: {result.stderr}")
    finally:
        Path(temp_path).unlink(missing_ok=True)

    print(f"{key:8} -> audio/{rel}")


async def main(keys: list[str]) -> None:
    unknown = [k for k in keys if k not in CLIPS]
    if unknown:
        sys.exit(f"unknown keys: {', '.join(unknown)}\nvalid: {', '.join(CLIPS)}")
    for key in keys or CLIPS:
        await generate(key)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:]))
