"""
JARVIS — Trigger Bus (Event Bus)
JSON file-based event bus for cross-module signal passing.
Any module can publish/consume events.
Unconsumed events persist across restarts.
"""

import json
import time
import logging
import threading
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("TRIGGER_BUS")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_ROOT = Path(__file__).resolve().parent.parent
_SETTINGS_FILE = _ROOT / "config" / "settings.json"


def _load_settings() -> dict:
    try:
        with open(_SETTINGS_FILE, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _default_bus_path() -> Path:
    settings = _load_settings()
    rel = settings.get("paths", {}).get("trigger_bus_file", "bridge/trigger_bus.json")
    return _ROOT / rel


# ---------------------------------------------------------------------------
# Event Schema
# ---------------------------------------------------------------------------
def _empty_event() -> dict:
    return {
        "last_event": None,
        "timestamp": None,
        "source": None,
        "consumed": True,
        "confidence": 0.0,
    }


# ---------------------------------------------------------------------------
# Trigger Bus
# ---------------------------------------------------------------------------
class TriggerBus:
    """JSON file-based event bus for inter-module communication."""

    def __init__(self, bus_path: Path | None = None):
        self._path: Path = bus_path or _default_bus_path()
        self._lock = threading.Lock()
        self._ensure_file()

    def _ensure_file(self) -> None:
        """Create the bus file with default schema if missing."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._write(_empty_event())
            logger.info("✦ NOMINAL | TRIGGER_BUS | Created bus file at %s", self._path)

    def _read(self) -> dict:
        """Read the current bus state."""
        try:
            with open(self._path, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except (FileNotFoundError, json.JSONDecodeError):
            return _empty_event()

    def _write(self, data: dict) -> None:
        """Write bus state atomically."""
        try:
            with open(self._path, "w", encoding="utf-8") as fh:
                json.dump(data, fh, indent=2)
        except Exception as exc:
            logger.error("✖ CRITICAL | TRIGGER_BUS | Write failed: %s", exc)

    # -- Public API ----------------------------------------------------------

    def publish(self, event: str, source: str, confidence: float = 1.0) -> None:
        """Publish an event to the bus."""
        with self._lock:
            data = {
                "last_event": event,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": source,
                "consumed": False,
                "confidence": confidence,
            }
            self._write(data)
            logger.info(
                "✦ NOMINAL | TRIGGER_BUS | Published: %s from %s (conf=%.2f)",
                event, source, confidence,
            )

    def consume(self) -> dict | None:
        """
        Consume the current unconsumed event.
        Returns the event dict if unconsumed, or None.
        Marks the event as consumed.
        """
        with self._lock:
            data = self._read()
            if data.get("consumed", True):
                return None
            data["consumed"] = True
            self._write(data)
            logger.info(
                "✦ NOMINAL | TRIGGER_BUS | Consumed: %s from %s",
                data.get("last_event"), data.get("source"),
            )
            return data

    def peek(self) -> dict:
        """Peek at the current bus state without consuming."""
        with self._lock:
            return self._read()

    def clear(self) -> None:
        """Reset the bus to empty state."""
        with self._lock:
            self._write(_empty_event())
            logger.info("✦ NOMINAL | TRIGGER_BUS | Bus cleared")

    def has_unconsumed(self) -> bool:
        """Check if there's an unconsumed event."""
        with self._lock:
            data = self._read()
            return not data.get("consumed", True)


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Trigger bus standalone test...")

    bus = TriggerBus()
    bus.clear()

    # Publish
    bus.publish("WAKE", "voice_vosk", 0.95)
    assert bus.has_unconsumed(), "Should have unconsumed event"

    # Peek
    state = bus.peek()
    print(f"  Peek: {state}")

    # Consume
    event = bus.consume()
    print(f"  Consumed: {event}")
    assert not bus.has_unconsumed(), "Should be consumed now"

    # Consume again — should be None
    assert bus.consume() is None, "Should return None on second consume"

    bus.clear()
    print("\n[JARVIS]: ✦ NOMINAL | TRIGGER_BUS | Standalone test passed.")
