"""
JARVIS — Reminder Engine
Handles scheduled time reminders and interval-based reminders.

Features:
  - Exact-time reminders (one-time or daily repeating)
  - Built-in interval reminders:
      * Drink water  — every 2 hours, 09:00–21:00
      * Take a break — every 25 minutes, 09:00–17:00
  - pycaw: raises system master volume before speaking, then restores
  - pyttsx3: local SAPI5 TTS (no conflict with edge-tts/pygame pipeline)
  - schedule: runs in a dedicated daemon thread (no asyncio interference)
  - Thread-safe speech queue (reminders never block the schedule tick)
"""

import logging
import queue
import threading
import time
from datetime import datetime
from typing import List, Optional

logger = logging.getLogger("REMINDER_ENGINE")

# ---------------------------------------------------------------------------
# Optional dependency imports — fault-isolated
# ---------------------------------------------------------------------------
try:
    import schedule as _schedule
    _SCHEDULE_OK = True
except ImportError:
    logger.error("✖ CRITICAL | REMINDER_ENGINE | 'schedule' not installed.")
    _SCHEDULE_OK = False

try:
    import pyttsx3 as _pyttsx3
    _PYTTSX3_OK = True
except ImportError:
    logger.error("✖ CRITICAL | REMINDER_ENGINE | 'pyttsx3' not installed.")
    _PYTTSX3_OK = False

try:
    from pycaw.pycaw import AudioUtilities
    _PYCAW_OK = True
except Exception:
    logger.warning("⚠ ADVISORY | REMINDER_ENGINE | pycaw unavailable — volume control disabled.")
    _PYCAW_OK = False


# ---------------------------------------------------------------------------
# Volume Controller
# ---------------------------------------------------------------------------
class _VolumeController:
    """Raises master volume before a reminder, restores after."""

    TARGET_VOLUME = 0.80   # 80 % scalar (0.0–1.0)
    MIN_RAISE    = 0.50    # Only raise if below this threshold

    def __init__(self):
        self._interface: Optional[object] = None
        if _PYCAW_OK:
            try:
                device = AudioUtilities.GetSpeakers()
                self._interface = device.EndpointVolume
                logger.info("✦ NOMINAL | REMINDER_ENGINE | Volume controller ready.")
            except Exception as exc:
                logger.warning("⚠ ADVISORY | REMINDER_ENGINE | Volume controller init failed: %s", exc)
                self._interface = None

    def get_volume(self) -> float:
        if self._interface:
            try:
                return self._interface.GetMasterVolumeLevelScalar()
            except Exception:
                pass
        return 1.0

    def set_volume(self, level: float) -> None:
        if self._interface:
            try:
                level = max(0.0, min(1.0, level))
                self._interface.SetMasterVolumeLevelScalar(level, None)
            except Exception as exc:
                logger.warning("⚠ ADVISORY | REMINDER_ENGINE | set_volume failed: %s", exc)

    def raise_and_restore(self, speak_fn, text: str) -> None:
        """Raise volume → speak → restore. Blocking within the speech worker."""
        original = self.get_volume()
        raised   = False
        if original < self.MIN_RAISE:
            self.set_volume(self.TARGET_VOLUME)
            raised = True
        try:
            speak_fn(text)
        finally:
            if raised:
                self.set_volume(original)


# ---------------------------------------------------------------------------
# Reminder Engine
# ---------------------------------------------------------------------------
class ReminderEngine:
    """
    Manages all reminder jobs.
    Call start() after boot, stop() on shutdown.
    """

    # Window constants (24-hour)
    _WATER_WINDOW  = (9, 21)   # 09:00 – 21:00
    _BREAK_WINDOW  = (9, 17)   # 09:00 – 17:00

    # Spoken messages
    _WATER_MSG = (
        "Sir, hydration check. It has been two hours — "
        "please drink a glass of water. Staying hydrated keeps the mind sharp."
    )
    _BREAK_MSG = (
        "Sir, your twenty-five-minute focus block is complete. "
        "Step away for a short break. Your productivity will thank you."
    )

    def __init__(self):
        self._running       = False
        self._thread: Optional[threading.Thread] = None
        self._speech_thread: Optional[threading.Thread] = None
        self._speech_queue:  queue.Queue = queue.Queue()
        self._volume_ctrl    = _VolumeController()
        self._user_reminders: List[dict] = []   # {time_str, message, repeat}
        self._tts_engine     = None
        self._tts_lock       = threading.Lock()

        # Initialise pyttsx3 engine once (must be created in the thread it runs in)
        self._tts_ready      = threading.Event()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add_reminder(self, time_str: str, message: str, repeat: bool = True) -> str:
        """
        Add a user-defined reminder.

        Args:
            time_str: "HH:MM" in 24-hour format (e.g. "14:30")
            message:  Spoken text when the reminder fires
            repeat:   True = daily, False = one-time

        Returns:
            Confirmation string for CommandRouter to speak.
        """
        if not _SCHEDULE_OK:
            return "Reminder engine unavailable, Sir — schedule library not installed."

        entry = {"time_str": time_str, "message": message, "repeat": repeat}
        self._user_reminders.append(entry)

        if repeat:
            _schedule.every().day.at(time_str).do(self._fire_reminder, message=message)
            label = f"daily at {time_str}"
        else:
            _schedule.every().day.at(time_str).do(
                self._fire_once, message=message, time_str=time_str
            )
            label = f"once at {time_str}"

        logger.info("✦ NOMINAL | REMINDER_ENGINE | Reminder added — %s: %s", label, message[:40])
        return f"Reminder set, Sir — {label}. I will alert you on schedule."

    def list_reminders(self) -> str:
        """Return human-readable list of user-defined reminders."""
        if not self._user_reminders:
            return "No custom reminders are set, Sir. Built-in hydration and break alerts remain active."
        parts = []
        for r in self._user_reminders:
            kind = "daily" if r["repeat"] else "one-time"
            parts.append(f"{r['time_str']} ({kind}): {r['message'][:40]}")
        count = len(self._user_reminders)
        summary = f"{count} reminder(s) active, Sir. " + " | ".join(parts)
        return summary

    def cancel_all_reminders(self) -> str:
        """Clear all user-defined reminders (built-ins are re-registered on next run)."""
        if not _SCHEDULE_OK:
            return "Reminder engine unavailable, Sir."
        # Cancel only user jobs — identify by tag
        _schedule.clear("user_reminder")
        self._user_reminders.clear()
        logger.info("✦ NOMINAL | REMINDER_ENGINE | All user reminders cancelled.")
        return "All custom reminders cleared, Sir. Hydration and break alerts remain active."

    def start(self) -> None:
        """Start the schedule loop and speech worker threads."""
        if not _SCHEDULE_OK:
            logger.error("✖ CRITICAL | REMINDER_ENGINE | Cannot start — schedule unavailable.")
            return

        self._running = True

        # Register built-in interval reminders
        self._register_interval_reminders()

        # Speech worker thread (pyttsx3 must live in one thread)
        self._speech_thread = threading.Thread(
            target=self._speech_worker,
            daemon=True,
            name="reminder_speech_worker",
        )
        self._speech_thread.start()

        # Wait for TTS engine to be ready
        self._tts_ready.wait(timeout=10)

        # Schedule loop thread
        self._thread = threading.Thread(
            target=self._schedule_loop,
            daemon=True,
            name="reminder_schedule_loop",
        )
        self._thread.start()

        logger.info("✦ NOMINAL | REMINDER_ENGINE | Reminder engine started.")

    def stop(self) -> None:
        """Stop the reminder engine gracefully."""
        self._running = False
        # Poison pill for speech worker
        self._speech_queue.put(None)
        if _SCHEDULE_OK:
            _schedule.clear()
        logger.info("✦ NOMINAL | REMINDER_ENGINE | Reminder engine stopped.")

    # ------------------------------------------------------------------
    # Private — schedule loop
    # ------------------------------------------------------------------

    def _schedule_loop(self) -> None:
        """Main schedule tick — runs every 1 second in its own thread."""
        logger.info("✦ NOMINAL | REMINDER_ENGINE | Schedule loop running.")
        while self._running:
            if _SCHEDULE_OK:
                try:
                    _schedule.run_pending()
                except Exception as exc:
                    logger.error("⚠ ADVISORY | REMINDER_ENGINE | Schedule tick error: %s", exc)
            time.sleep(1)

    # ------------------------------------------------------------------
    # Private — built-in interval reminders
    # ------------------------------------------------------------------

    def _register_interval_reminders(self) -> None:
        """Register water and break reminders with the schedule library."""
        if not _SCHEDULE_OK:
            return

        _schedule.every(2).hours.do(self._water_reminder_job)
        _schedule.every(25).minutes.do(self._break_reminder_job)

        logger.info(
            "✦ NOMINAL | REMINDER_ENGINE | Built-in reminders registered "
            "(water every 2h, break every 25m)."
        )

    def _water_reminder_job(self) -> None:
        """Fire water reminder only within the defined window."""
        hour = datetime.now().hour
        if self._WATER_WINDOW[0] <= hour < self._WATER_WINDOW[1]:
            logger.info("✦ NOMINAL | REMINDER_ENGINE | Firing water reminder.")
            self._enqueue_speech(self._WATER_MSG)
        else:
            logger.debug("✦ NOMINAL | REMINDER_ENGINE | Water reminder skipped — outside window.")

    def _break_reminder_job(self) -> None:
        """Fire break reminder only within the defined window."""
        hour = datetime.now().hour
        if self._BREAK_WINDOW[0] <= hour < self._BREAK_WINDOW[1]:
            logger.info("✦ NOMINAL | REMINDER_ENGINE | Firing break reminder.")
            self._enqueue_speech(self._BREAK_MSG)
        else:
            logger.debug("✦ NOMINAL | REMINDER_ENGINE | Break reminder skipped — outside window.")

    # ------------------------------------------------------------------
    # Private — user reminder callbacks
    # ------------------------------------------------------------------

    def _fire_reminder(self, message: str) -> None:
        """Daily reminder callback."""
        logger.info("✦ NOMINAL | REMINDER_ENGINE | Firing daily reminder: %s", message[:40])
        self._enqueue_speech(message)

    def _fire_once(self, message: str, time_str: str) -> _schedule.CancelJob:
        """One-time reminder callback — cancels itself after firing."""
        logger.info("✦ NOMINAL | REMINDER_ENGINE | Firing one-time reminder: %s", message[:40])
        self._enqueue_speech(message)
        # Remove from user_reminders list
        self._user_reminders = [
            r for r in self._user_reminders
            if not (r["time_str"] == time_str and not r["repeat"])
        ]
        return _schedule.CancelJob

    # ------------------------------------------------------------------
    # Private — TTS / speech worker
    # ------------------------------------------------------------------

    def _enqueue_speech(self, text: str) -> None:
        """Thread-safe: put text on the speech queue."""
        self._speech_queue.put(text)

    def _speech_worker(self) -> None:
        """
        Runs in its own thread.
        Consumes from the speech queue, raises volume, speaks, restores.
        """
        # Initialise pyttsx3 in this thread
        if _PYTTSX3_OK:
            try:
                engine = _pyttsx3.init()
                # Prefer en-GB voice to match JARVIS tone
                voices = engine.getProperty("voices")
                for v in voices:
                    if "english" in v.name.lower() and "united kingdom" in v.name.lower():
                        engine.setProperty("voice", v.id)
                        break
                engine.setProperty("rate", 170)
                engine.setProperty("volume", 1.0)
                self._tts_engine = engine
                logger.info("✦ NOMINAL | REMINDER_ENGINE | pyttsx3 TTS engine ready.")
            except Exception as exc:
                logger.error("✖ CRITICAL | REMINDER_ENGINE | pyttsx3 init failed: %s", exc)
                self._tts_engine = None
        else:
            self._tts_engine = None

        self._tts_ready.set()  # Signal start() that engine is ready

        while True:
            item = self._speech_queue.get()
            if item is None:  # Poison pill — shutdown
                break
            try:
                self._volume_ctrl.raise_and_restore(self._tts_speak, item)
            except Exception as exc:
                logger.error("⚠ ADVISORY | REMINDER_ENGINE | Speech worker error: %s", exc)
            finally:
                self._speech_queue.task_done()

    def _tts_speak(self, text: str) -> None:
        """Synchronous pyttsx3 speech. Fallback to print if engine unavailable."""
        if self._tts_engine:
            try:
                self._tts_engine.say(text)
                self._tts_engine.runAndWait()
            except Exception as exc:
                logger.error("⚠ ADVISORY | REMINDER_ENGINE | pyttsx3 speak error: %s", exc)
                print(f"[REMINDER]: {text}")
        else:
            print(f"[REMINDER]: {text}")
