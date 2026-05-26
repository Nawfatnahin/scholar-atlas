"""
JARVIS — Session Logger
Daily session log serializer: logs/log_YYYY-MM-DD.json
Exposes:
  - recall(topic) — searches last 7 days for keyword
  - what_did_we_do() — returns last 3 days summarized
"""

import json
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("SESSION_LOGGER")

_ROOT = Path(__file__).resolve().parent.parent
_LOGS_DIR = _ROOT / "logs"


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
def _empty_session(date_str: str) -> dict:
    return {
        "date": date_str,
        "session_summary": "",
        "operations": [],
        "unresolved": [],
        "sir_preferences_noted": [],
    }


def _today_str() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def _log_path(date_str: str) -> Path:
    return _LOGS_DIR / f"log_{date_str}.json"


# ---------------------------------------------------------------------------
# Core Operations
# ---------------------------------------------------------------------------
def _ensure_dir() -> None:
    _LOGS_DIR.mkdir(parents=True, exist_ok=True)


def _load_day(date_str: str) -> dict:
    """Load a day's session log."""
    path = _log_path(date_str)
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except (json.JSONDecodeError, Exception):
            pass
    return _empty_session(date_str)


def _save_day(date_str: str, data: dict) -> None:
    """Save a day's session log."""
    _ensure_dir()
    path = _log_path(date_str)
    try:
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
    except Exception as exc:
        logger.error("✖ CRITICAL | SESSION_LOGGER | Save failed: %s", exc)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def log_operation(codename: str, description: str) -> None:
    """Log an operation to today's session."""
    today = _today_str()
    data = _load_day(today)
    entry = f"{codename} — {description}"
    data["operations"].append(entry)
    _save_day(today, data)
    logger.info("✦ NOMINAL | SESSION_LOGGER | Logged: %s", entry[:60])


def log_unresolved(item: str) -> None:
    """Log an unresolved item."""
    today = _today_str()
    data = _load_day(today)
    data["unresolved"].append(item)
    _save_day(today, data)


def log_preference(preference: str) -> None:
    """Log a noted Sir preference."""
    today = _today_str()
    data = _load_day(today)
    data["sir_preferences_noted"].append(preference)
    _save_day(today, data)


def set_summary(summary: str) -> None:
    """Set today's session summary."""
    today = _today_str()
    data = _load_day(today)
    data["session_summary"] = summary
    _save_day(today, data)


def end_session(summary: str | None = None) -> None:
    """Finalize today's session log."""
    today = _today_str()
    data = _load_day(today)
    if summary:
        data["session_summary"] = summary
    elif not data["session_summary"]:
        ops_count = len(data["operations"])
        data["session_summary"] = f"Session with {ops_count} operation(s) logged."
    _save_day(today, data)
    logger.info("✦ NOMINAL | SESSION_LOGGER | Session ended for %s", today)


def recall(topic: str) -> list[dict]:
    """
    Search the last 7 days of logs for a keyword.
    Returns list of matching entries with dates.
    """
    results = []
    topic_lower = topic.lower()
    now = datetime.now()

    for i in range(7):
        date_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        data = _load_day(date_str)

        matches = []
        for op in data.get("operations", []):
            if topic_lower in op.lower():
                matches.append(op)
        for item in data.get("unresolved", []):
            if topic_lower in item.lower():
                matches.append(f"[UNRESOLVED] {item}")

        if matches:
            results.append({"date": date_str, "matches": matches})

    logger.info("✦ NOMINAL | SESSION_LOGGER | Recall '%s': %d day(s) with matches", topic, len(results))
    return results


def what_did_we_do() -> list[dict]:
    """Return the last 3 days summarized."""
    results = []
    now = datetime.now()

    for i in range(3):
        date_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        data = _load_day(date_str)
        if data["operations"] or data["session_summary"]:
            results.append({
                "date": date_str,
                "summary": data["session_summary"],
                "operations_count": len(data["operations"]),
                "unresolved_count": len(data["unresolved"]),
            })

    return results


def recall_last_3_days() -> list[dict]:
    """Alias for what_did_we_do() — used by command router."""
    return what_did_we_do()


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Session logger standalone test...")

    log_operation("OPERATION IRON GENESIS", "Full system rebuild from zero")
    log_operation("OPERATION SILENT VECTOR", "Clap detector calibration")
    log_unresolved("Vosk model download pending")
    log_preference("Prefers minimal terminal output")
    set_summary("Major rebuild session — all core modules deployed.")

    results = recall("rebuild")
    print(f"  Recall 'rebuild': {results}")

    summary = what_did_we_do()
    print(f"  Last 3 days: {summary}")

    end_session()
    print("\n[JARVIS]: ✦ NOMINAL | SESSION_LOGGER | Standalone test passed.")
