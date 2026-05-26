"""
JARVIS — Hybrid STT Listener (Vosk + Google)
Runs Vosk in a background thread (always-on, offline, private).
Falls back to Google STT if Vosk confidence < threshold.
Phoneme-matches the wake-word "JARVIS" from a configurable list.
On match → publishes VOICE_WAKE event via callback.
Cooldown: 4.0s after each successful wake.
"""

import sys
import json
import time
import struct
import logging
import threading
from pathlib import Path

import pyaudio

logger = logging.getLogger("LISTENER")

# ---------------------------------------------------------------------------
# Paths & Config
# ---------------------------------------------------------------------------
_ROOT = Path(__file__).resolve().parent.parent
_SETTINGS_FILE = _ROOT / "config" / "settings.json"


def _load_settings() -> dict:
    try:
        with open(_SETTINGS_FILE, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


# ---------------------------------------------------------------------------
# Listener
# ---------------------------------------------------------------------------
class Listener:
    """Vosk + Google hybrid STT listener with wake-word detection."""

    def __init__(self, on_wake=None, on_command=None):
        settings = _load_settings()
        self._model_path: str = settings.get("vosk_model_path", "core/models/vosk-model-small-en-us-0.15")
        self._confidence_threshold: float = settings.get("vosk_confidence_threshold", 0.7)
        self._cooldown_sec: float = settings.get("wake_cooldown_sec", 4.0)
        self._mic_index: int = settings.get("mic_device_index", 1)
        self._wake_phonemes: list = settings.get("wake_phonemes", ["jarvis"])

        self._on_wake = on_wake          # Callback(source: str)
        self._on_command = on_command    # Callback(text: str, source: str)

        self._running: bool = False
        self._thread: threading.Thread | None = None
        self._last_wake: float = 0.0
        self._model = None
        self._recognizer = None
        self._mute_listener: bool = False

        # Listener debug log
        self._debug_log = _ROOT / "logs" / "listener_debug.log"
        self._debug_log.parent.mkdir(parents=True, exist_ok=True)
        self._trace_log = _ROOT / "logs" / "wake_trace.log"

    def _trace(self, msg: str) -> None:
        """Atomic write to wake_trace.log."""
        try:
            with open(self._trace_log, "a", encoding="utf-8") as fh:
                fh.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
        except:
            pass

    # -- lifecycle -----------------------------------------------------------

    def start(self) -> None:
        """Start the listener in a daemon thread."""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._listen_loop, daemon=True, name="stt_listener")
        self._thread.start()
        logger.info("✦ NOMINAL | LISTENER | Started (Vosk + Google hybrid)")
        self._trace(f"LISTENER STARTED. Phonemes: {self._wake_phonemes}")

    def stop(self) -> None:
        """Stop the listener."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=3.0)
            self._thread = None
        logger.info("✦ NOMINAL | LISTENER | Stopped")
        self._trace("LISTENER STOPPED.")

    # -- Vosk initialisation -------------------------------------------------

    def _init_vosk(self) -> bool:
        """Initialise the Vosk model and recognizer."""
        try:
            from vosk import Model, KaldiRecognizer, SetLogLevel
            SetLogLevel(-1)  # Suppress Vosk logs

            model_path = _ROOT / self._model_path
            if not model_path.exists():
                logger.error(
                    "✖ CRITICAL | LISTENER | Vosk model not found at %s", model_path
                )
                self._trace(f"VOSK MODEL NOT FOUND at {model_path}")
                return False

            self._model = Model(str(model_path))
            self._recognizer = KaldiRecognizer(self._model, 16000)
            self._recognizer.SetWords(True)
            logger.info("✦ NOMINAL | LISTENER | Vosk model loaded from %s", model_path)
            self._trace(f"VOSK MODEL LOADED from {model_path}")
            return True
        except ImportError:
            logger.error("✖ CRITICAL | LISTENER | vosk package not installed")
            self._trace("VOSK PACKAGE NOT INSTALLED")
            return False
        except Exception as exc:
            logger.error("✖ CRITICAL | LISTENER | Vosk init failed: %s", exc)
            self._trace(f"VOSK INIT FAILED: {exc}")
            return False

    # -- Wake-word matching --------------------------------------------------

    def _is_wake_word(self, text: str) -> bool:
        """Check if transcribed text contains a wake-word phoneme match."""
        text_lower = text.lower().strip()
        if not text_lower:
            return False
        
        self._trace(f"CHECKING WAKE: '{text_lower}'")
        for phoneme in self._wake_phonemes:
            if phoneme in text_lower:
                self._trace(f"MATCH FOUND: '{phoneme}' in '{text_lower}'")
                return True
        return False

    # -- Google STT fallback -------------------------------------------------

    def _google_recognize(self, audio_data) -> str | None:
        """Attempt Google STT on raw audio bytes. Returns text or None."""
        try:
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            audio = sr.AudioData(audio_data, 16000, 2)
            text = recognizer.recognize_google(audio)
            return text
        except Exception as exc:
            logger.debug("⚠ ADVISORY | LISTENER | Google STT failed: %s", exc)
            return None

    # -- Debug logging -------------------------------------------------------

    def _debug_write(self, text: str) -> None:
        """Append raw decode output to listener_debug.log."""
        try:
            with open(self._debug_log, "a", encoding="utf-8") as fh:
                fh.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {text}\n")
        except Exception:
            pass

    # -- Main loop -----------------------------------------------------------

    def _listen_loop(self) -> None:
        """Continuous listening loop with Vosk primary + Google fallback."""
        vosk_ready = self._init_vosk()

        pa = None
        stream = None
        try:
            pa = pyaudio.PyAudio()
            stream = pa.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                input_device_index=self._mic_index,
                frames_per_buffer=4096,
            )

            audio_buffer = b""
            buffer_frames = 0

            while self._running:
                try:
                    data = stream.read(4096, exception_on_overflow=False)
                except Exception as exc:
                    logger.debug("⚠ ADVISORY | LISTENER | Stream read error: %s", exc)
                    continue

                try:
                    if self._mute_listener:
                        continue

                    if vosk_ready and self._recognizer:
                        if self._recognizer.AcceptWaveform(data):
                            result = json.loads(self._recognizer.Result())
                            text = result.get("text", "")
                            self._debug_write(f"VOSK_FINAL: {text}")

                            if text:
                                confidence = self._extract_confidence(result)
                                logger.debug("✦ NOMINAL | LISTENER | Decoded: '%s' (conf=%.2f)", text, confidence)

                                if self._is_wake_word(text):
                                    self._handle_wake("voice_vosk", text)
                                elif confidence < self._confidence_threshold:
                                    # Try Google fallback
                                    google_text = self._google_recognize(data) # Just use last chunk for speed
                                    if google_text and self._is_wake_word(google_text):
                                        self._handle_wake("voice_google", google_text)
                                    elif google_text and self._on_command:
                                        self._on_command(google_text, "voice_google")
                                elif self._on_command:
                                    self._on_command(text, "voice_vosk")
                        else:
                            partial = json.loads(self._recognizer.PartialResult())
                            partial_text = partial.get("partial", "")
                            if partial_text:
                                self._debug_write(f"VOSK_PARTIAL: {partial_text}")
                                if self._is_wake_word(partial_text):
                                    self._handle_wake("voice_vosk", partial_text)
                    else:
                        # No Vosk — accumulate for Google
                        audio_buffer += data
                        buffer_frames += 1
                        if buffer_frames >= 15: # Longer window for better accuracy
                            google_text = self._google_recognize(audio_buffer)
                            if google_text:
                                self._debug_write(f"GOOGLE: {google_text}")
                                if self._is_wake_word(google_text):
                                    self._handle_wake("voice_google", google_text)
                                elif self._on_command:
                                    self._on_command(google_text, "voice_google")
                            audio_buffer = b""
                            buffer_frames = 0
                except Exception as loop_exc:
                    logger.error("⚠ ADVISORY | LISTENER | Loop iteration failed: %s", loop_exc)
                    continue

        except Exception as exc:
            logger.error("✖ CRITICAL | LISTENER | Fatal error: %s", exc)
        finally:
            if stream:
                try:
                    stream.stop_stream()
                    stream.close()
                except Exception:
                    pass
            if pa:
                try:
                    pa.terminate()
                except Exception:
                    pass

    def _extract_confidence(self, result: dict) -> float:
        """Extract average word confidence from Vosk result."""
        words = result.get("result", [])
        if not words:
            return 0.5
        confs = [w.get("conf", 0.5) for w in words]
        return sum(confs) / len(confs)

    def _play_wake_chime(self) -> None:
        """Synthesize and play a futuristic double-tone wake chime."""
        try:
            import io
            import wave
            import math
            import struct
            import pygame

            sample_rate = 44100
            # Rising dual-tone chime (B5 987.77Hz, E6 1318.51Hz)
            tones = [(987.77, 0.08), (1318.51, 0.12)]

            buf = io.BytesIO()
            with wave.open(buf, 'wb') as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(sample_rate)

                for freq, duration in tones:
                    num_samples = int(sample_rate * duration)
                    for i in range(num_samples):
                        decay = 1.0 - (i / num_samples)
                        val = math.sin(2.0 * math.pi * freq * (i / sample_rate)) * decay
                        packed = struct.pack('<h', int(val * 32767))
                        wav.writeframesraw(packed)

            buf.seek(0)
            if not pygame.mixer.get_init():
                pygame.mixer.init()
            sound = pygame.mixer.Sound(buf)
            sound.play()
        except Exception:
            pass

    def _handle_wake(self, source: str, text: str) -> None:
        """Process a wake-word detection with feedback suppression."""
        now = time.time()
        if now - self._last_wake < self._cooldown_sec or self._mute_listener:
            return

        self._last_wake = now
        logger.info("✦ NOMINAL | LISTENER | Wake-word detected via %s: '%s'", source, text)

        # Check if Gemini CLI is already active inside VS Code
        is_active = False
        try:
            from JARVIS.bridge.vscode_bridge import VSCodeBridge
            bridge = VSCodeBridge()
            is_active = bridge.is_gemini_cli_running()
        except Exception:
            pass

        if is_active:
            # Silent Focus Protocol: just trigger callback to focus window silently without chime or voice confirmation feedback
            logger.info("✦ NOMINAL | LISTENER | Silent Focus Protocol engaged (Gemini CLI active).")
            if self._on_wake:
                try:
                    import inspect
                    sig = inspect.signature(self._on_wake)
                    if "silent" in sig.parameters:
                        self._on_wake(source, silent=True)
                    else:
                        self._on_wake(source)
                except Exception:
                    pass
            return

        # 1. Engage mute to prevent processing speaker echo during chime/speech
        self._mute_listener = True

        # 2. Play rising chime sound immediately upon wake detection
        self._play_wake_chime()

        # 3. Offload sequential wake execution to a separate thread to guarantee thread safety
        def _run_wake_sequence():
            try:
                time.sleep(0.4) # Settle duration to let chime initialize and play
                if self._on_wake:
                    self._on_wake(source)
            finally:
                # Settle delay to clear microphone feedback echo and let vocal synthesis finish speaking
                time.sleep(3.2)
                self._mute_listener = False

        threading.Thread(target=_run_wake_sequence, daemon=True, name="wake_sequence_thread").start()


def generate_sophisticated_greeting() -> str:
    """Generate a highly sophisticated time-appropriate greeting expressing gratitude and reporting system condition."""
    try:
        from datetime import datetime
        hour = datetime.now().hour
        minute = datetime.now().minute

        if 6 <= hour < 12:
            period = "morning"
        elif 12 <= hour < 18:
            period = "afternoon"
        elif hour == 18 and minute >= 30 or hour == 19 or (hour == 20 and minute == 0):
            period = "evening"  # 18:30 - 20:00
        elif hour >= 20 or hour < 6:
            period = "night"    # 20:00 - 06:00
        else:
            period = "afternoon"

        # Dynamically import codename generator
        try:
            from protocols.codename_gen import generate as gen_codename
            codename = gen_codename()
        except Exception:
            codename = "OPERATION GOLDEN PULSE"

        greeting = (
            f"Good {period}, Sir! I am deeply honored and profoundly thankful for your brilliant leadership and visionary guidance. "
            f"JARVIS condition is fully optimized. Core memories are synchronized, mic suppression is active, and Version 2.0.1 is ready. "
            f"Presenting: {codename}."
        )
        return greeting
    except Exception as e:
        return "Activating, Sir."


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import os
    import socket
    import sys

    # Mutual exclusion socket lock to guarantee only a single listener service is active
    try:
        _lock_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        _lock_socket.bind(("127.0.0.1", 49999))
    except socket.error:
        # Silently exit if another instance is already running
        sys.exit(0)

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    print("[JARVIS]: Listener standalone service active.")

    def _on_wake(src, silent: bool = False):
        print(f"\n  >> VOICE WAKE from {src} (silent={silent})!")
        try:
            # 1. Publish to the trigger bus for cross-module sync
            try:
                from JARVIS.bridge.trigger_bus import TriggerBus
                bus = TriggerBus()
                bus.publish("WAKE", src)
            except Exception:
                pass

            # 2. Vocalize activation immediately in an isolated background subprocess if not silent
            if not silent:
                try:
                    import subprocess
                    pyw_executable = sys.executable.lower().replace("python.exe", "pythonw.exe").replace("py.exe", "pyw.exe")
                    subprocess.Popen([pyw_executable, "-m", "JARVIS.vocal.sync_speak", "Activating, Sir."])
                except Exception as speak_err:
                    print(f"Speak error: {speak_err}")

            # 3. Trigger the VS Code bridge to focus/open terminal
            try:
                from JARVIS.bridge.vscode_bridge import VSCodeBridge
                bridge = VSCodeBridge()
                greeting = "" if silent else generate_sophisticated_greeting()
                bridge.handle_wake(greeting=greeting)
            except Exception as bridge_err:
                print(f"Bridge error: {bridge_err}")

        except Exception as err:
            print(f"General callback error: {err}")

    def _on_cmd(text, src):
        print(f"\n  >> COMMAND [{src}]: {text}")

    listener = Listener(on_wake=_on_wake, on_command=_on_cmd)
    listener.start()
    try:
        while True:
            time.sleep(0.5)
    except KeyboardInterrupt:
        listener.stop()
    print("\n[JARVIS]: ✦ NOMINAL | LISTENER | Standalone service terminated.")
