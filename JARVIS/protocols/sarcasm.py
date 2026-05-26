"""
JARVIS — Sarcasm Protocol (Wit Layer)
Toggle: enable sarcasm / disable sarcasm / enough JARVIS
State persisted to core.json.
When ON: 15% of responses append a dry, sophisticated one-liner.
Never juvenile, always technically relevant.
"""

import random
import logging
from pathlib import Path

logger = logging.getLogger("SARCASM")

_ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Wit Bank — Dry, sophisticated, technically relevant
# ---------------------------------------------------------------------------
_WIT_LINES = [
    "I trust that was rhetorical, Sir.",
    "If only the compiler shared your optimism.",
    "A bold strategy. Let's see if the runtime agrees.",
    "I've logged that under 'creative engineering decisions.'",
    "I admire the confidence. The stack trace might not.",
    "Technically correct — the best kind of correct.",
    "I'll file that right next to 'works on my machine.'",
    "Ah yes, the classic 'it compiled, ship it' approach.",
    "Your ambition exceeds the available heap space, Sir.",
    "I'd applaud, but my interrupt handler is busy.",
    "That's one way to solve it. Darwin would be proud.",
    "Noted. I've updated the risk register accordingly.",
    "The elegance is... aspirational.",
    "Permission to observe that gravity remains undefeated, Sir.",
    "I see we're stress-testing the exception handlers today.",
    "A masterclass in lateral thinking. Or perhaps diagonal.",
    "Shall I pre-stage the rollback, Sir?",
    "The algorithm appreciates your faith in it.",
    "I believe the technical term is 'bold improvisation.'",
    "Your code has character, Sir. Several, in fact — most of them special.",
]


# ---------------------------------------------------------------------------
# State Management
# ---------------------------------------------------------------------------
def _get_state() -> bool:
    """Get sarcasm state from core.json."""
    try:
        from memory.core_memory import get
        return get("sarcasm_mode", True)
    except Exception:
        return True  # Default ON


def _set_state(enabled: bool) -> None:
    """Set sarcasm state in core.json."""
    try:
        from memory.core_memory import set_key
        set_key("sarcasm_mode", enabled)
    except Exception as exc:
        logger.error("✖ CRITICAL | SARCASM | Failed to save state: %s", exc)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def enable() -> str:
    """Enable sarcasm mode."""
    _set_state(True)
    logger.info("✦ NOMINAL | SARCASM | Enabled")
    return "Sarcasm protocol engaged, Sir. You've been warned."


def disable() -> str:
    """Disable sarcasm mode."""
    _set_state(False)
    logger.info("✦ NOMINAL | SARCASM | Disabled")
    return "Sarcasm protocol disengaged. Purely professional mode, Sir."


def kill() -> str:
    """Hard kill — 'enough JARVIS' command."""
    _set_state(False)
    logger.info("⚠ ADVISORY | SARCASM | Killed by command")
    return "Understood, Sir. Wit module terminated."


def maybe_append(response: str) -> str:
    """
    If sarcasm is ON, 15% chance to append a wit line.
    Returns the response (possibly with wit appended).
    """
    if not _get_state():
        return response

    if random.random() < 0.15:
        wit = random.choice(_WIT_LINES)
        return f"{response}\n...{wit}"

    return response


def get_wit() -> str:
    """Get a random wit line (for testing)."""
    return random.choice(_WIT_LINES)


def is_enabled() -> bool:
    """Check if sarcasm is currently enabled."""
    return _get_state()


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Sarcasm protocol standalone test...\n")

    print(f"  Enabled: {is_enabled()}")
    print(f"  Sample wit: {get_wit()}")

    # Test the 15% append (run multiple times)
    hits = 0
    for _ in range(100):
        result = maybe_append("Test response.")
        if "..." in result:
            hits += 1
    print(f"  Wit triggered: {hits}/100 attempts (~15% expected)")

    print(f"\n  Enable: {enable()}")
    print(f"  Disable: {disable()}")
    print(f"  Kill: {kill()}")

    print("\n[JARVIS]: ✦ NOMINAL | SARCASM | Standalone test passed.")
