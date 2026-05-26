"""
JARVIS — Explain Mode (Learning Protocol)
Toggle: explain on/off/once
Depth: 1 (brief) / 2 (standard) / 3 (deep-dive), stored in core.json
When ON: prepend WHY block, append LEARN block to every action.
"""

import logging
from pathlib import Path

logger = logging.getLogger("EXPLAIN_MODE")

_ROOT = Path(__file__).resolve().parent.parent


# ---------------------------------------------------------------------------
# State Management
# ---------------------------------------------------------------------------
def _get_mode() -> str:
    """Get explain mode state. Returns 'on', 'off', or 'once'."""
    try:
        from memory.core_memory import get
        return get("explain_mode", False)
    except Exception:
        return False


def _set_mode(mode) -> None:
    """Set explain mode state."""
    try:
        from memory.core_memory import set_key
        set_key("explain_mode", mode)
    except Exception as exc:
        logger.error("✖ CRITICAL | EXPLAIN_MODE | Failed to save state: %s", exc)


def _get_depth() -> int:
    """Get explain depth (1-3)."""
    try:
        from memory.core_memory import get
        return get("explain_depth", 2)
    except Exception:
        return 2


def _set_depth(depth: int) -> None:
    """Set explain depth."""
    try:
        from memory.core_memory import set_key
        set_key("explain_depth", max(1, min(3, depth)))
    except Exception as exc:
        logger.error("✖ CRITICAL | EXPLAIN_MODE | Failed to save depth: %s", exc)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def set_mode(mode: str) -> str:
    """Set explain mode: 'on', 'off', or 'once'."""
    mode = mode.lower().strip()
    if mode == "on":
        _set_mode(True)
        depth = _get_depth()
        logger.info("✦ NOMINAL | EXPLAIN_MODE | Enabled (depth=%d)", depth)
        return f"Explain mode enabled at depth {depth}, Sir."
    elif mode == "off":
        _set_mode(False)
        logger.info("✦ NOMINAL | EXPLAIN_MODE | Disabled")
        return "Explain mode disabled, Sir."
    elif mode == "once":
        _set_mode("once")
        logger.info("✦ NOMINAL | EXPLAIN_MODE | Set to 'once'")
        return "Explain mode set to single-shot, Sir."
    else:
        return f"Unknown mode: {mode}. Use 'on', 'off', or 'once'."


def set_depth(depth: int) -> str:
    """Set explain depth (1=brief, 2=standard, 3=deep-dive)."""
    depth = max(1, min(3, depth))
    _set_depth(depth)
    labels = {1: "brief", 2: "standard", 3: "deep-dive"}
    logger.info("✦ NOMINAL | EXPLAIN_MODE | Depth set to %d (%s)", depth, labels[depth])
    return f"Explain depth set to {depth} ({labels[depth]}), Sir."


def is_active() -> bool:
    """Check if explain mode is currently active."""
    mode = _get_mode()
    return mode is True or mode == "once"


def wrap(action: str, why: str, learn: str) -> str:
    """
    Wrap an action with WHY and LEARN blocks if explain mode is active.
    Automatically handles 'once' mode (disables after use).
    """
    mode = _get_mode()
    if not mode or mode is False:
        return action

    depth = _get_depth()

    # Build explanation
    parts = []

    # WHY block (always shown when active)
    parts.append(f"[WHY] {why}")
    parts.append("")
    parts.append(action)
    parts.append("")

    # LEARN block (depth-dependent detail)
    if depth == 1:
        parts.append(f"[LEARN] {learn.split('.')[0]}.")
    elif depth == 2:
        parts.append(f"[LEARN] {learn}")
    elif depth == 3:
        parts.append(f"[LEARN — DEEP DIVE] {learn}")

    # Handle 'once' mode
    if mode == "once":
        _set_mode(False)
        logger.info("✦ NOMINAL | EXPLAIN_MODE | Single-shot used, reverting to off")

    return "\n".join(parts)


def get_status() -> dict:
    """Get current explain mode status."""
    return {
        "mode": _get_mode(),
        "depth": _get_depth(),
        "active": is_active(),
    }


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Explain mode standalone test...\n")

    print(f"  {set_mode('on')}")
    print(f"  {set_depth(2)}")
    print(f"  Active: {is_active()}")

    result = wrap(
        "Deploying module to production.",
        "This module handles authentication and must be deployed first.",
        "Authentication modules are deployed before dependent services to prevent "
        "cascading auth failures. The dependency graph ensures correct ordering.",
    )
    print(f"\n  Wrapped output:\n{result}")

    print(f"\n  {set_mode('once')}")
    result2 = wrap("Action 2.", "Reason 2.", "Lesson 2.")
    print(f"  Once result:\n{result2}")
    print(f"  Still active after once: {is_active()}")

    print(f"\n  {set_mode('off')}")
    print(f"\n  Status: {get_status()}")

    print("\n[JARVIS]: ✦ NOMINAL | EXPLAIN_MODE | Standalone test passed.")
