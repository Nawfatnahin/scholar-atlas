"""
JARVIS — Standalone Speak Entry Point
Routes through the official vocal/sync_speak.py pipeline.
Supports subtitle overlay when main.py is running.
Usage: py speak.py "Your text here"
"""

import sys
from pathlib import Path

# Ensure JARVIS root is on sys.path
_JARVIS_ROOT = Path(__file__).resolve().parent / "JARVIS"
if str(_JARVIS_ROOT) not in sys.path:
    sys.path.insert(0, str(_JARVIS_ROOT))

try:
    from vocal.sync_speak import syncSpeak
except ImportError as e:
    # Fallback: direct edge-tts + pygame if JARVIS vocal pipeline unavailable
    print(f"[JARVIS]: WARNING — vocal pipeline unavailable ({e}). Using fallback.")
    import asyncio
    import tempfile
    import os
    import edge_tts
    import pygame

    async def _fallback_speak(text: str):
        tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
        tmp.close()
        communicate = edge_tts.Communicate(text, "en-GB-RyanNeural")
        await communicate.save(tmp.name)
        pygame.mixer.init()
        pygame.mixer.music.load(tmp.name)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.quit()
        os.unlink(tmp.name)

    def syncSpeak(text: str):
        asyncio.run(_fallback_speak(text))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py speak.py \"Your text here\"")
        sys.exit(1)
    text = " ".join(sys.argv[1:])
    syncSpeak(text)
