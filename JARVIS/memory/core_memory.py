"""
JARVIS — Core Memory
Read/write core.json preferences.
Thread-safe JSON operations for global runtime state.
"""

import json
import logging
import threading
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("CORE_MEMORY")

_ROOT = Path(__file__).resolve().parent.parent
_CORE_FILE = _ROOT / "core.json"

_lock = threading.Lock()

# ---------------------------------------------------------------------------
# Default schema
# ---------------------------------------------------------------------------
_DEFAULT_CORE = {
    "sir_name": "Sir",
    "sarcasm_mode": True,
    "explain_mode": False,
    "explain_depth": 2,
    "session_start": None,
    "last_greeting": None,
    "preferences": {},
    "active_codename": None,
}


# ---------------------------------------------------------------------------
# Core operations
# ---------------------------------------------------------------------------
def _ensure_file() -> None:
    """Create core.json with defaults if missing."""
    if not _CORE_FILE.exists():
        _CORE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(_CORE_FILE, "w", encoding="utf-8") as fh:
            json.dump(_DEFAULT_CORE, fh, indent=4)
        logger.info("✦ NOMINAL | CORE_MEMORY | Created core.json with defaults")


def load() -> dict:
    """Load the full core state."""
    with _lock:
        _ensure_file()
        try:
            with open(_CORE_FILE, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            # Merge with defaults for any missing keys
            merged = {**_DEFAULT_CORE, **data}
            return merged
        except (json.JSONDecodeError, Exception) as exc:
            logger.error("✖ CRITICAL | CORE_MEMORY | Load failed: %s — using defaults", exc)
            return dict(_DEFAULT_CORE)


def save(data: dict) -> None:
    """Save the full core state."""
    with _lock:
        _ensure_file()
        try:
            with open(_CORE_FILE, "w", encoding="utf-8") as fh:
                json.dump(data, fh, indent=4)
            logger.debug("✦ NOMINAL | CORE_MEMORY | Saved core state")
        except Exception as exc:
            logger.error("✖ CRITICAL | CORE_MEMORY | Save failed: %s", exc)


def get(key: str, default=None):
    """Get a single value from core state."""
    data = load()
    return data.get(key, default)


def set_key(key: str, value) -> None:
    """Set a single value in core state."""
    data = load()
    data[key] = value
    save(data)
    logger.debug("✦ NOMINAL | CORE_MEMORY | Set %s = %s", key, repr(value)[:50])


def get_preference(key: str, default=None):
    """Get a Sir preference."""
    data = load()
    return data.get("preferences", {}).get(key, default)


def set_preference(key: str, value) -> None:
    """Set a Sir preference."""
    data = load()
    if "preferences" not in data:
        data["preferences"] = {}
    data["preferences"][key] = value
    save(data)
    logger.info("✦ NOMINAL | CORE_MEMORY | Preference noted: %s = %s", key, repr(value)[:50])


def start_session() -> None:
    """Record session start timestamp."""
    set_key("session_start", datetime.now(timezone.utc).isoformat())
    logger.info("✦ NOMINAL | CORE_MEMORY | Session started")


def record_greeting() -> None:
    """Record last greeting timestamp."""
    set_key("last_greeting", datetime.now(timezone.utc).isoformat())


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Core memory standalone test...")

    state = load()
    print(f"  Loaded: {json.dumps(state, indent=2)}")

    set_key("sarcasm_mode", True)
    assert get("sarcasm_mode") is True

    set_preference("code_style", "minimal")
    assert get_preference("code_style") == "minimal"

    start_session()
    assert get("session_start") is not None

    print("\n[JARVIS]: ✦ NOMINAL | CORE_MEMORY | Standalone test passed.")
