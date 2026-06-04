"""
JARVIS — Master Boot Sequence
Parallel module launch with fault isolation.
Boot order:
  1. Load core.json + config/settings.json
  2. Start runtime.log
  3. Init wake_arbiter (mutex)
  4. Start clap_detector (thread)
  5. Start listener (thread)
  6. Announce pending tasks from task_queue
  7. Speak greeting
  8. Enter command loop (async)
"""

import sys
import json
import time
import asyncio
import logging
import threading
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
# Ensure JARVIS root is on sys.path
# ---------------------------------------------------------------------------
_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

# ---------------------------------------------------------------------------
# Logging Setup — 3-tier format
# ---------------------------------------------------------------------------
_LOGS_DIR = _ROOT / "logs"
_LOGS_DIR.mkdir(parents=True, exist_ok=True)

_LOG_FORMAT = "[%(asctime)s] | %(message)s"
_LOG_DATE_FMT = "%Y-%m-%d %H:%M:%S"

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format=_LOG_FORMAT,
    datefmt=_LOG_DATE_FMT,
    handlers=[
        logging.FileHandler(_LOGS_DIR / "runtime.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("MAIN")

# ---------------------------------------------------------------------------
# Imports — fault-isolated
# ---------------------------------------------------------------------------
try:
    from memory.core_memory import load as load_core, start_session, record_greeting, set_key
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | core_memory import failed: %s", e)
    load_core = lambda: {}
    start_session = lambda: None
    record_greeting = lambda: None
    set_key = lambda k, v: None

try:
    from vocal.sync_speak import syncSpeak, async_speak, set_overlay
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | sync_speak import failed: %s", e)
    syncSpeak = lambda t: print(f"[SPEAK]: {t}")
    async_speak = None
    set_overlay = lambda o: None

try:
    from vocal.subtitle_overlay import SubtitleOverlay
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | subtitle_overlay import failed: %s", e)
    SubtitleOverlay = None

try:
    from core.wake_arbiter import WakeArbiter
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | wake_arbiter import failed: %s", e)
    WakeArbiter = None

try:
    from core.listener import Listener
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | listener import failed: %s", e)
    Listener = None

try:
    from bridge.trigger_bus import TriggerBus
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | trigger_bus import failed: %s", e)
    TriggerBus = None

try:
    from bridge.vscode_bridge import VSCodeBridge
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | vscode_bridge import failed: %s", e)
    VSCodeBridge = None

try:
    from memory.task_queue import announce_pending, pending_blocked, list_all, resume, cancel, done
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | task_queue import failed: %s", e)
    announce_pending = lambda: "Task queue unavailable."
    pending_blocked = lambda: []
    list_all = lambda: []

try:
    from memory.session_logger import recall, recall_last_3_days, log_operation, end_session as end_log_session
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | session_logger import failed: %s", e)
    recall = lambda t: []
    recall_last_3_days = lambda: []

try:
    from memory.error_memory import top5, search as error_search
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | error_memory import failed: %s", e)
    top5 = lambda: []
    error_search = lambda w: []

try:
    from intelligence.diagnostics import run_diagnostics, spoken_diagnostics, quick_status
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | diagnostics import failed: %s", e)
    run_diagnostics = lambda: "Diagnostics unavailable."
    spoken_diagnostics = lambda: "Diagnostics unavailable."
    quick_status = lambda: {"status": "DEGRADED"}

try:
    from intelligence.briefing import daily_briefing, morning_briefing
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | briefing import failed: %s", e)
    daily_briefing = lambda: "Briefing unavailable."
    morning_briefing = lambda: "Briefing unavailable."

try:
    from intelligence.project_scanner import scan, deep_scan, pending_report, format_report
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | project_scanner import failed: %s", e)
    scan = lambda d=None: {}
    deep_scan = lambda d=None: {}
    pending_report = lambda d=None: "Scanner unavailable."

try:
    from intelligence.memory_curator import curate_memory, MemoryCurator
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | memory_curator import failed: %s", e)
    curate_memory = lambda: "Curator unavailable."
    MemoryCurator = None

try:
    from intelligence.mood_engine import MoodEngine
    from intelligence.calendar_linker import CalendarLinker
    from intelligence.file_summarizer import FileSummarizer
    from intelligence.habit_tracker import HabitTracker
    from intelligence.research_agent import ResearchAgent
    from memory.persistent_memory import PersistentMemory
    from core.system_launcher import SystemLauncher
    from core.background_tasks import BackgroundTaskManager
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | Antigravity modules import failed: %s", e)
    MoodEngine = CalendarLinker = FileSummarizer = HabitTracker = None
    ResearchAgent = PersistentMemory = SystemLauncher = BackgroundTaskManager = None

try:
    from core.reminder_engine import ReminderEngine
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | reminder_engine import failed: %s", e)
    ReminderEngine = None

try:
    from vault.vault_store import VaultStore
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | vault_store import failed: %s", e)
    VaultStore = None

try:
    from protocols.sarcasm import enable as sarcasm_enable, disable as sarcasm_disable, kill as sarcasm_kill, maybe_append
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | sarcasm import failed: %s", e)
    sarcasm_enable = lambda: "Unavailable."
    sarcasm_disable = lambda: "Unavailable."
    sarcasm_kill = lambda: "Unavailable."
    maybe_append = lambda r: r

try:
    from protocols.explain_mode import set_mode as explain_set, set_depth as explain_depth
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | explain_mode import failed: %s", e)
    explain_set = lambda m: "Unavailable."
    explain_depth = lambda d: "Unavailable."

try:
    from protocols.codename_gen import generate as gen_codename
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | codename_gen import failed: %s", e)
    gen_codename = lambda: "OPERATION UNKNOWN"

try:
    from memory.version_control import log_change, store_upgrade
except ImportError as e:
    logger.error("✖ CRITICAL | MAIN | version_control import failed: %s", e)
    log_change = lambda f, s, o="DEV": None
    store_upgrade = lambda c, s: None


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------
def _load_settings() -> dict:
    settings_file = _ROOT / "config" / "settings.json"
    try:
        with open(settings_file, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


# ---------------------------------------------------------------------------
# Greeting
# ---------------------------------------------------------------------------
def _time_greeting() -> str:
    """Generate time-appropriate greeting per Bangladesh locale."""
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

    return f"Good {period}, Sir. All systems nominal. Standing by."


# ---------------------------------------------------------------------------
# Command Router
# ---------------------------------------------------------------------------
class CommandRouter:
    """Maps voice/text commands to handlers."""

    def __init__(self):
        self._vault: VaultStore | None = None
        self._boot_time = time.time()
        self._system_launcher = None
        self._persistent_memory = None
        self._research_agent = None
        self._reminder_engine = None

    def set_vault(self, vault: VaultStore) -> None:
        self._vault = vault

    def set_reminder_engine(self, engine) -> None:
        self._reminder_engine = engine

    def set_tier_c_d(self, launcher, memory, research):
        self._system_launcher = launcher
        self._persistent_memory = memory
        self._research_agent = research

    async def route(self, text: str) -> str | None:
        """
        Route a command to its handler.
        Returns response text, or None if no match.
        """
        text_lower = text.lower().strip()

        # --- Diagnostics ---
        if "run diagnostics" in text_lower:
            report = run_diagnostics()
            spoken = spoken_diagnostics()
            await async_speak(spoken)
            return report

        # --- Briefing ---
        if "daily brief" in text_lower or "morning briefing" in text_lower or "briefing" in text_lower:
            brief = daily_briefing()
            await async_speak(brief)
            return brief

        # --- Quick status ---
        if "how are we" in text_lower:
            status = quick_status()
            uptime = status.get("uptime", "unknown")
            response = f"Systems {status.get('status', 'NOMINAL')}, Sir. Uptime: {uptime}. CPU: {status.get('cpu', 'N/A')}."
            await async_speak(response)
            return response

        # --- Session recall ---
        if "what did we do" in text_lower:
            days = recall_last_3_days()
            if not days:
                response = "No session logs found for the last 3 days, Sir."
            else:
                parts = []
                for d in days:
                    parts.append(f"{d['date']}: {d.get('summary', 'No summary')} ({d.get('operations_count', 0)} ops)")
                response = "Last 3 days: " + " | ".join(parts)
            await async_speak(response)
            return response

        # --- Topic recall ---
        if text_lower.startswith("recall "):
            topic = text[7:].strip()
            results = recall(topic)
            if not results:
                response = f"No matches found for '{topic}' in the last 7 days, Sir."
            else:
                count = sum(len(r["matches"]) for r in results)
                response = f"Found {count} match(es) for '{topic}' across {len(results)} day(s)."
            await async_speak(response)
            return response

        # --- Task queue ---
        if text_lower in ("queue", "jarvis queue"):
            tasks = list_all()
            if not tasks:
                response = "Task queue is empty, Sir."
            else:
                response = f"{len(tasks)} task(s) in queue."
                for t in tasks[:5]:
                    response += f"\n  {t['id']} {t['codename']} — {t['status']}"
            await async_speak(f"{len(tasks)} tasks in queue, Sir." if tasks else "Queue is clear, Sir.")
            return response

        if text_lower in ("status", "jarvis status"):
            announcement = announce_pending()
            await async_speak(announcement)
            return announcement

        if text_lower.startswith("resume "):
            task_id = text[7:].strip().upper()
            result = resume(task_id)
            response = f"Resumed {task_id}, Sir." if result else f"Task {task_id} not found."
            await async_speak(response)
            return response

        if text_lower.startswith("cancel "):
            task_id = text[7:].strip().upper()
            result = cancel(task_id)
            response = f"Cancelled {task_id}, Sir." if result else f"Task {task_id} not found."
            await async_speak(response)
            return response

        if text_lower.startswith("done "):
            task_id = text[5:].strip().upper()
            result = done(task_id)
            response = f"Completed {task_id}, Sir." if result else f"Task {task_id} not found."
            await async_speak(response)
            return response

        # --- Project scanner ---
        if "scan project" in text_lower:
            report = scan()
            print(format_report(report))
            spoken = pending_report()
            await async_speak(spoken)
            return format_report(report)

        if "deep scan" in text_lower:
            report = deep_scan()
            print(format_report(report))
            spoken = pending_report()
            await async_speak(spoken)
            return format_report(report)

        if "brief me on pending work" in text_lower or "pending work" in text_lower:
            spoken = pending_report()
            await async_speak(spoken)
            return spoken

        # --- Vault ---
        if text_lower.startswith("store credential ") or text_lower.startswith("store "):
            if self._vault and self._vault.is_unlocked:
                key = text.split()[-1]
                response = f"Ready to store credential '{key}'. Please provide the value."
                await async_speak(response)
                return response
            else:
                response = "Vault is locked, Sir. Unlock required."
                await async_speak(response)
                return response

        if text_lower.startswith("retrieve "):
            key = text[9:].strip()
            if self._vault and self._vault.is_unlocked:
                val = self._vault.retrieve(key)
                response = f"Retrieved '{key}', Sir." if val else f"Key '{key}' not found in vault."
            else:
                response = "Vault is locked, Sir."
            await async_speak(response)
            return response

        if text_lower == "list vault":
            if self._vault and self._vault.is_unlocked:
                keys = self._vault.list_keys()
                response = f"Vault contains {len(keys)} key(s): {', '.join(keys)}" if keys else "Vault is empty, Sir."
            else:
                response = "Vault is locked, Sir."
            await async_speak(response)
            return response

        if text_lower.startswith("purge credential ") or text_lower.startswith("purge "):
            key = text.split()[-1]
            if self._vault and self._vault.is_unlocked:
                result = self._vault.purge(key)
                response = f"Purged '{key}', Sir." if result else f"Key '{key}' not found."
            else:
                response = "Vault is locked, Sir."
            await async_speak(response)
            return response

        # --- Sarcasm ---
        if "enable sarcasm" in text_lower:
            response = sarcasm_enable()
            await async_speak(response)
            return response

        if "disable sarcasm" in text_lower:
            response = sarcasm_disable()
            await async_speak(response)
            return response

        if "enough jarvis" in text_lower:
            response = sarcasm_kill()
            await async_speak(response)
            return response

        # --- Explain mode ---
        if text_lower.startswith("explain "):
            parts = text_lower.split()
            if len(parts) >= 2:
                if parts[1] in ("on", "off", "once"):
                    response = explain_set(parts[1])
                    await async_speak(response)
                    return response
                elif parts[1] == "depth" and len(parts) >= 3:
                    try:
                        depth = int(parts[2])
                        response = explain_depth(depth)
                        await async_speak(response)
                        return response
                    except ValueError:
                        pass

        # --- Errors ---
        if text_lower in ("errors", "jarvis errors"):
            errors = top5()
            if not errors:
                response = "No errors on file, Sir."
            else:
                response = f"{len(errors)} recent error(s)."
                for e in errors:
                    response += f"\n  {e['id']}: {e['description']}"
            await async_speak(f"{len(errors)} errors on file, Sir." if errors else "Error log is clean, Sir.")
            return response

        if text_lower.startswith("errors search "):
            keyword = text[14:].strip()
            results = error_search(keyword)
            response = f"Found {len(results)} error(s) matching '{keyword}'."
            await async_speak(response)
            return response

        # --- Advanced Antigravity Router (Tiers C & D) ---
        if self._system_launcher and (text_lower.startswith("open ") or text_lower.startswith("kill ")):
            response = self._system_launcher.execute(text)
            await async_speak(response)
            return response

        if self._persistent_memory and "what do you know about me" in text_lower:
            response = self._persistent_memory.summarize_model()
            await async_speak("Here is a summary of my current contextual model of you, Sir.")
            return response

        if self._research_agent and "research " in text_lower:
            topic = text_lower.replace("research ", "").strip()
            response = self._research_agent.identify_intent(topic)
            await async_speak(response)
            return response

        # --- Version Control ---
        if text_lower == "store this upgrade":
            codename = gen_codename()
            summary = "Manual system snapshot initiated by Sir."
            try:
                archive_name = store_upgrade(codename, summary)
                response = f"Operation {codename} archived, Sir. Snapshot {archive_name} is secure."
            except Exception as e:
                response = f"Archive failed, Sir. {str(e)}"
            await async_speak(response)
            return response

        # --- Memory Curator ---
        if "curate memory" in text_lower or "curate second brain" in text_lower or "memory curation" in text_lower:
            try:
                response = curate_memory()
            except Exception as e:
                response = f"Curator failed, Sir. {str(e)}"
            await async_speak(response)
            return response

        # --- Reminder Engine ---
        if self._reminder_engine:

            # List reminders
            if text_lower in ("list reminders", "show reminders", "what reminders"):
                response = self._reminder_engine.list_reminders()
                await async_speak(response)
                return response

            # Cancel all user reminders
            if text_lower in ("cancel all reminders", "clear reminders", "remove all reminders"):
                response = self._reminder_engine.cancel_all_reminders()
                await async_speak(response)
                return response

            # Daily reminder: "remind me daily at HH:MM <message>"
            if text_lower.startswith("remind me daily at "):
                # Pattern: remind me daily at HH:MM <message>
                remainder = text[len("remind me daily at "):].strip()
                parts = remainder.split(" ", 1)
                if len(parts) >= 1:
                    time_str = parts[0].strip()
                    message  = parts[1].strip() if len(parts) > 1 else "Sir, your scheduled reminder is due."
                    # Normalise time e.g. 9:30 -> 09:30
                    try:
                        parsed = datetime.strptime(time_str, "%H:%M")
                        time_str = parsed.strftime("%H:%M")
                    except ValueError:
                        try:
                            parsed = datetime.strptime(time_str, "%I:%M%p")
                            time_str = parsed.strftime("%H:%M")
                        except ValueError:
                            response = f"Could not parse time '{time_str}', Sir. Please use HH:MM format."
                            await async_speak(response)
                            return response
                    response = self._reminder_engine.add_reminder(time_str, message, repeat=True)
                    await async_speak(response)
                    return response

            # One-time reminder: "remind me at HH:MM <message>"
            if text_lower.startswith("remind me at "):
                remainder = text[len("remind me at "):].strip()
                parts = remainder.split(" ", 1)
                if len(parts) >= 1:
                    time_str = parts[0].strip()
                    message  = parts[1].strip() if len(parts) > 1 else "Sir, your scheduled reminder is due."
                    try:
                        parsed = datetime.strptime(time_str, "%H:%M")
                        time_str = parsed.strftime("%H:%M")
                    except ValueError:
                        try:
                            parsed = datetime.strptime(time_str, "%I:%M%p")
                            time_str = parsed.strftime("%H:%M")
                        except ValueError:
                            response = f"Could not parse time '{time_str}', Sir. Please use HH:MM format."
                            await async_speak(response)
                            return response
                    response = self._reminder_engine.add_reminder(time_str, message, repeat=False)
                    await async_speak(response)
                    return response

        # --- No match ---
        return None


# ---------------------------------------------------------------------------
# JARVIS Runtime
# ---------------------------------------------------------------------------
class JarvisRuntime:
    """Master runtime controller."""

    def __init__(self):
        self._settings = _load_settings()
        self._core = load_core()
        self._overlay: SubtitleOverlay | None = None
        self._arbiter: WakeArbiter | None = None
        self._listener: Listener | None = None
        self._trigger_bus: TriggerBus | None = None
        self._vscode_bridge: VSCodeBridge | None = None
        self._vault: VaultStore | None = None
        self._router = CommandRouter()
        
        # Antigravity Subsystems
        self._mood_engine = MoodEngine() if MoodEngine else None
        self._habit_tracker = HabitTracker() if HabitTracker else None
        self._calendar_linker = CalendarLinker() if CalendarLinker else None
        self._file_summarizer = FileSummarizer() if FileSummarizer else None
        self._persistent_memory = PersistentMemory() if PersistentMemory else None
        self._research_agent = ResearchAgent() if ResearchAgent else None
        self._system_launcher = SystemLauncher() if SystemLauncher else None
        self._background_tasks = BackgroundTaskManager() if BackgroundTaskManager else None
        self._reminder_engine  = ReminderEngine() if ReminderEngine else None

        # Link Tier C and D modules to Router
        self._router.set_tier_c_d(self._system_launcher, self._persistent_memory, self._research_agent)

        # Link reminder engine to router
        if self._reminder_engine:
            self._router.set_reminder_engine(self._reminder_engine)
        
        self._running = False
        self._hourly_task = None

    async def boot(self) -> None:
        """Execute the full boot sequence."""
        logger.info("✦ NOMINAL | MAIN | ═══════════════════════════════════════")
        logger.info("✦ NOMINAL | MAIN | JARVIS Boot Sequence Initiated")
        logger.info("✦ NOMINAL | MAIN | ═══════════════════════════════════════")

        # 1. Load configs
        self._settings = _load_settings()
        self._core = load_core()
        start_session()
        logger.info("✦ NOMINAL | MAIN | Phase 1 — Configs loaded")

        # 2. Runtime log already started via logging setup
        logger.info("✦ NOMINAL | MAIN | Phase 2 — Runtime log active")

        # 3. Init subtitle overlay
        if SubtitleOverlay:
            try:
                self._overlay = SubtitleOverlay()
                overlay_thread = threading.Thread(
                    target=self._overlay.run_loop, daemon=True, name="subtitle_overlay"
                )
                overlay_thread.start()
                set_overlay(self._overlay)
                logger.info("✦ NOMINAL | MAIN | Phase 2b — Subtitle overlay started")
            except Exception as exc:
                logger.error("⚠ ADVISORY | MAIN | Subtitle overlay failed: %s", exc)

        # 3. Init wake arbiter
        if WakeArbiter:
            try:
                self._arbiter = WakeArbiter()
                self._arbiter.set_handler(self._handle_wake)
                await self._arbiter.start()
                logger.info("✦ NOMINAL | MAIN | Phase 3 — Wake arbiter initialized")
            except Exception as exc:
                logger.error("✖ CRITICAL | MAIN | Wake arbiter failed: %s", exc)

        # 4. Init trigger bus
        if TriggerBus:
            try:
                self._trigger_bus = TriggerBus()
                logger.info("✦ NOMINAL | MAIN | Phase 3b — Trigger bus initialized")
            except Exception as exc:
                logger.error("⚠ ADVISORY | MAIN | Trigger bus failed: %s", exc)

        # 5. Init VS Code bridge
        if VSCodeBridge:
            try:
                self._vscode_bridge = VSCodeBridge()
                logger.info("✦ NOMINAL | MAIN | Phase 3c — VS Code bridge initialized")
            except Exception as exc:
                logger.error("⚠ ADVISORY | MAIN | VS Code bridge failed: %s", exc)

        # 7. Start listener
        if Listener:
            try:
                self._listener = Listener(
                    on_wake=self._on_wake_event,
                    on_command=self._on_command,
                )
                self._listener.start()
                logger.info("✦ NOMINAL | MAIN | Phase 5 — STT listener started")
            except Exception as exc:
                logger.error("⚠ ADVISORY | MAIN | Listener failed: %s", exc)

        # 7b. Start reminder engine
        if self._reminder_engine:
            try:
                self._reminder_engine.start()
                logger.info("✦ NOMINAL | MAIN | Phase 5c — Reminder engine started")
            except Exception as exc:
                logger.error("⚠ ADVISORY | MAIN | Reminder engine start failed: %s", exc)

        # 8. Init vault (no auto-unlock)
        if VaultStore:
            try:
                self._vault = VaultStore()
                self._router.set_vault(self._vault)
                logger.info("✦ NOMINAL | MAIN | Phase 5b — Vault initialized (locked)")
            except Exception as exc:
                logger.error("⚠ ADVISORY | MAIN | Vault failed: %s", exc)

        # 9. Announce pending tasks
        try:
            announcement = announce_pending()
            logger.info("✦ NOMINAL | MAIN | Phase 6 — %s", announcement)
        except Exception as exc:
            logger.error("⚠ ADVISORY | MAIN | Task announcement failed: %s", exc)

        # 9.5. Run memory curator (auto-curate second brain at boot)
        try:
            if MemoryCurator:
                curator = MemoryCurator()
                curator.run_curation(auto_promote=True)
                logger.info("✦ NOMINAL | MAIN | Phase 6b — Second brain auto-curated successfully")
        except Exception as exc:
            logger.error("⚠ ADVISORY | MAIN | Second brain auto-curation failed: %s", exc)

        # 10. Speak greeting
        try:
            greeting = daily_briefing()
        except Exception as exc:
            logger.error("⚠ ADVISORY | MAIN | Daily briefing boot greeting failed: %s", exc)
            greeting = _time_greeting()
        record_greeting()
        await async_speak(greeting)
        logger.info("✦ NOMINAL | MAIN | Phase 7 — Greeting delivered")

        logger.info("✦ NOMINAL | MAIN | ═══════════════════════════════════════")
        logger.info("✦ NOMINAL | MAIN | Boot sequence complete — entering command loop")
        logger.info("✦ NOMINAL | MAIN | ═══════════════════════════════════════")

        self._running = True
        self._hourly_task = asyncio.create_task(self._hourly_briefing_loop())

    async def _hourly_briefing_loop(self) -> None:
        """Asynchronously trigger the daily briefing every hour after boot."""
        logger.info("✦ NOMINAL | MAIN | Hourly briefing loop started")
        try:
            while self._running:
                await asyncio.sleep(3600)  # Wait 1 hour
                if not self._running:
                    break
                logger.info("✦ NOMINAL | MAIN | Triggering hourly automated brief")
                try:
                    brief = daily_briefing()
                    if async_speak:
                        await async_speak(brief)
                except Exception as exc:
                    logger.error("⚠ ADVISORY | MAIN | Hourly automated brief failed: %s", exc)
        except asyncio.CancelledError:
            logger.info("✦ NOMINAL | MAIN | Hourly briefing loop cancelled")

    # -- Event Handlers ------------------------------------------------------

    def _on_wake_event(self, source: str) -> None:
        """Handle wake event from voice — route through arbiter."""
        logger.debug("✦ NOMINAL | MAIN | Wake event submission initiated from %s", source)
        if self._trigger_bus:
            self._trigger_bus.publish("WAKE", source)
        if self._arbiter:
            self._arbiter.submit_wake(source)

    def _on_command(self, text: str, source: str) -> None:
        """Handle a voice command (non-wake text)."""
        logger.info("✦ NOMINAL | MAIN | Command received [%s]: %s", source, text[:60])
        try:
            loop = asyncio.get_running_loop()
            # Non-blocking execution of command processing
            loop.create_task(self._process_command(text))
        except RuntimeError:
            # Fallback for unexpected thread context
            asyncio.run(self._process_command(text))

    async def _handle_wake(self, source: str) -> None:
        """Handle a wake event after arbitration."""
        logger.info("✦ NOMINAL | MAIN | Wake processed from: %s", source)
        await async_speak("Activating, Sir.")

        # Attempt VS Code bridge injection
        if self._vscode_bridge:
            try:
                self._vscode_bridge.handle_wake()
            except Exception as exc:
                logger.error("✖ CRITICAL | MAIN | VS Code bridge injection failed: %s", exc)

    async def _process_command(self, text: str) -> None:
        """Process a text command through the router."""
        
        if self._mood_engine:
            mood = self._mood_engine.analyze(text)
            if mood != "NEUTRAL":
                logger.info("✦ NOMINAL | MAIN | Detected User Mood: %s", mood)
                
        if self._habit_tracker:
            self._habit_tracker.log_interaction()
            nudge = self._habit_tracker.check_nudges()
            if nudge:
                logger.info("✦ NOMINAL | MAIN | Triggering Habit Nudge")
                await async_speak(nudge)
                
        response = await self._router.route(text)
        if response:
            response = maybe_append(response)
            logger.info("✦ NOMINAL | MAIN | Response: %s", response[:80])
        else:
            logger.debug("⚠ ADVISORY | MAIN | Unrecognized command: %s", text[:40])

    # -- Command Loop --------------------------------------------------------

    async def run(self) -> None:
        """Main async command loop (also accepts typed commands)."""
        await self.boot()

        try:
            while self._running:
                # Accept typed commands from terminal
                try:
                    user_input = await asyncio.get_event_loop().run_in_executor(
                        None, lambda: input("\n[JARVIS] > ").strip()
                    )
                except (EOFError, KeyboardInterrupt):
                    break

                if not user_input:
                    continue

                if user_input.lower() in ("exit", "quit", "shutdown"):
                    break

                await self._process_command(user_input)

        except KeyboardInterrupt:
            pass
        finally:
            await self.shutdown()

    async def shutdown(self) -> None:
        """Graceful shutdown sequence."""
        logger.info("⚠ ADVISORY | MAIN | Shutdown sequence initiated")
        self._running = False

        if self._hourly_task:
            self._hourly_task.cancel()
            try:
                await self._hourly_task
            except asyncio.CancelledError:
                pass
            except Exception as exc:
                logger.error("⚠ ADVISORY | MAIN | Error closing hourly briefing task: %s", exc)

        if self._listener:
            self._listener.stop()
        if self._arbiter:
            await self._arbiter.stop()
        if self._overlay:
            self._overlay.stop()
        if self._reminder_engine:
            self._reminder_engine.stop()
        if self._vault and self._vault.is_unlocked:
            self._vault.lock()

        try:
            end_log_session()
        except Exception:
            pass

        await async_speak("Shutting down, Sir. Until next time.")
        logger.info("✦ NOMINAL | MAIN | JARVIS shutdown complete")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
def main():
    """JARVIS entry point."""
    runtime = JarvisRuntime()
    try:
        asyncio.run(runtime.run())
    except KeyboardInterrupt:
        print("\n[JARVIS]: Interrupted. Shutting down.")


if __name__ == "__main__":
    main()
