"""
JARVIS — Synchronised TTS + Subtitle Engine
Uses edge-tts (Microsoft Neural voices) streamed via pygame.mixer.
Simultaneously renders subtitle text in the overlay window.
API: syncSpeak("Your text here") — callable from any module.
"""

import sys
import json
import time
import re
import asyncio
import tempfile
import logging
import threading
from pathlib import Path

import edge_tts
import pygame

# ---------------------------------------------------------------------------
# Paths & Config
# ---------------------------------------------------------------------------
_ROOT = Path(__file__).resolve().parent.parent
_SETTINGS_FILE = _ROOT / "config" / "settings.json"

logger = logging.getLogger("SYNC_SPEAK")

# Shared overlay reference — set by main.py during boot
_overlay = None
_overlay_lock = threading.Lock()


def set_overlay(overlay_instance) -> None:
    """Register the subtitle overlay instance for use during speech."""
    global _overlay
    with _overlay_lock:
        _overlay = overlay_instance


def _load_settings() -> dict:
    try:
        with open(_SETTINGS_FILE, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


# ---------------------------------------------------------------------------
# Core TTS
# ---------------------------------------------------------------------------
async def _speak_async(text: str, voice: str, rate: str = "+0%", volume: str = "+0%") -> None:
    """Generate speech via edge-tts, play through pygame.mixer, show subtitle in overlay."""
    
    # Split text into sentences for streaming
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        if text.strip():
            sentences = [text.strip()]
        else:
            return

    queue = asyncio.Queue()
    
    async def producer():
        for i, sentence in enumerate(sentences):
            tmp_path = Path(tempfile.gettempdir()) / f"jarvis_tts_{id(text)}_{i}.mp3"
            word_timings = []
            audio_data = bytearray()
            try:
                communicate = edge_tts.Communicate(sentence, voice, rate=rate, volume=volume)
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_data.extend(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        word_timings.append({
                            "text": chunk["text"],
                            "offset": chunk["offset"] / 10_000_000,
                            "duration": chunk["duration"] / 10_000_000,
                        })
                with open(tmp_path, "wb") as f:
                    f.write(audio_data)
                await queue.put((sentence, tmp_path, word_timings))
            except Exception as exc:
                logger.error("✖ CRITICAL | SYNC_SPEAK | TTS generation failed: %s", exc)
        await queue.put(None) # Sentinel

    async def consumer():
        with _overlay_lock:
            overlay = _overlay
            
        print(f"\n[JARVIS]: ", end="", flush=True)
            
        while True:
            item = await queue.get()
            if item is None:
                break
                
            sentence, tmp_path, word_timings = item
            
            if overlay:
                overlay.show(sentence)
                if word_timings:
                    overlay.set_revealed(0)
                
            try:
                if not pygame.mixer.get_init():
                    pygame.mixer.init()
                try:
                    sound = pygame.mixer.Sound(str(tmp_path))
                    audio_len = sound.get_length()
                except Exception:
                    audio_len = 0
                
                pygame.mixer.music.load(str(tmp_path))
                pygame.mixer.music.play()
                
                start_time = time.time()
                
                if word_timings:
                    revealed_len = 0
                    current_shell_len = 0
                    current_word_idx = 0
                    
                    while pygame.mixer.music.get_busy():
                        current_playback_time = time.time() - start_time
                        
                        updated = False
                        while current_word_idx < len(word_timings) and word_timings[current_word_idx]["offset"] <= current_playback_time:
                            word_text = word_timings[current_word_idx]["text"]
                            idx = sentence.lower().find(word_text.lower(), revealed_len)
                            if idx != -1:
                                revealed_len = idx + len(word_text)
                            else:
                                revealed_len += len(word_text) + 1
                            current_word_idx += 1
                            updated = True
                            
                        if updated:
                            while revealed_len < len(sentence) and sentence[revealed_len] in ".,!?;:'\" ":
                                revealed_len += 1
                            if overlay:
                                overlay.set_revealed(revealed_len)
                                
                            new_text = sentence[current_shell_len:revealed_len]
                            if new_text:
                                print(new_text, end="", flush=True)
                                current_shell_len = revealed_len
                                
                        await asyncio.sleep(0.01)
                        
                    # Print any trailing punctuation
                    if current_shell_len < len(sentence):
                        print(sentence[current_shell_len:], end="", flush=True)
                    print(" ", end="", flush=True) # Space after sentence
                else:
                    revealed_len = 0
                    current_shell_len = 0
                    while pygame.mixer.music.get_busy():
                        if audio_len > 0:
                            pos = pygame.mixer.music.get_pos() / 1000.0
                            if pos < 0: pos = 0
                            progress = min(1.0, pos / audio_len)
                            target_chars = int(progress * len(sentence))
                            idx = target_chars
                            while idx > 0 and idx < len(sentence) and sentence[idx] not in " .,!?;:'\"":
                                idx += 1
                                
                            new_revealed_len = idx
                            if new_revealed_len > revealed_len:
                                revealed_len = new_revealed_len
                                if overlay:
                                    overlay.set_revealed(revealed_len)
                                new_text = sentence[current_shell_len:revealed_len]
                                if new_text:
                                    print(new_text, end="", flush=True)
                                    current_shell_len = revealed_len
                        await asyncio.sleep(0.02)
                        
                    if current_shell_len < len(sentence):
                        if overlay:
                            overlay.set_revealed(len(sentence))
                        print(sentence[current_shell_len:], end="", flush=True)
                    print(" ", end="", flush=True)
                        
            except Exception as exc:
                logger.error("✖ CRITICAL | SYNC_SPEAK | Playback failed: %s", exc)
            finally:
                try:
                    pygame.mixer.music.unload()
                    tmp_path.unlink(missing_ok=True)
                except Exception:
                    pass
            
            if overlay:
                overlay.set_revealed(-1)
                    
        print() # Newline after all sentences
        if overlay:
            overlay.dismiss()

    prod_task = asyncio.create_task(producer())
    cons_task = asyncio.create_task(consumer())
    await asyncio.gather(prod_task, cons_task)


def syncSpeak(text: str) -> None:
    """
    Synchronous API — callable from any module.
    Speaks the text aloud via edge-tts and shows subtitle overlay.
    Thread-safe. Blocks until speech completes.
    """
    settings = _load_settings()
    voice = settings.get("tts_voice", "en-GB-RyanNeural")
    rate = settings.get("tts_rate", "+0%")
    volume = settings.get("tts_volume", "+0%")

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # We're inside an async context — schedule as a task
        future = asyncio.run_coroutine_threadsafe(_speak_async(text, voice, rate, volume), loop)
        future.result()
    else:
        # No running loop — create one
        asyncio.run(_speak_async(text, voice, rate, volume))

    logger.debug("✦ NOMINAL | SYNC_SPEAK | Spoke: %s", text[:60])


async def async_speak(text: str) -> None:
    """
    Async API — for use within async contexts.
    """
    settings = _load_settings()
    voice = settings.get("tts_voice", "en-GB-RyanNeural")
    rate = settings.get("tts_rate", "+0%")
    volume = settings.get("tts_volume", "+0%")
    await _speak_async(text, voice, rate, volume)


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) > 1:
        syncSpeak(sys.argv[1])
    else:
        print("[JARVIS]: Testing sync_speak standalone...")
        syncSpeak("Good evening, Sir. Vocal synthesis is fully operational.")
        print("[JARVIS]: ✦ NOMINAL | SYNC_SPEAK | Standalone test passed.")
