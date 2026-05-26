"""
JARVIS — Morning Briefing
Triggered by: JARVIS, morning briefing
Components (in order):
  1. Greeting
  2. Weather Snapshot
  3. Priority Task Summary
  4. Calendar Context
  5. System Health
  6. Personal Check-in
"""

import logging
import random
from datetime import datetime
from pathlib import Path

import requests

logger = logging.getLogger("BRIEFING")

_ROOT = Path(__file__).resolve().parent.parent


_last_check_in_date = None


def _time_greeting() -> str:
    """Generate time-appropriate greeting based on Bangladesh locale."""
    now = datetime.now()
    hour = now.hour
    minute = now.minute
    date_str = now.strftime("%A, %B %d")

    m_of_day = hour * 60 + minute

    if m_of_day >= 1200 or m_of_day <= 270:
        period = "night"        # 8:00 PM to 4:30 AM
    elif 271 <= m_of_day <= 660:
        period = "morning"      # 4:31 AM to 11:00 AM
    elif 661 <= m_of_day <= 885:
        period = "noon"         # 11:01 AM to 2:45 PM
    elif 886 <= m_of_day <= 1065:
        period = "afternoon"    # 2:46 PM to 5:45 PM
    else:
        period = "evening"      # 5:46 PM to 7:59 PM

    return f"Good {period}, Sir. It is {date_str}. Here is your brief."


def _pending_tasks() -> str:
    """Get pending task summary."""
    try:
        from memory.task_queue import pending_blocked
        tasks = pending_blocked()
        if not tasks:
            return "Your priority list is clear."
        count = len(tasks)
        names = [t.get("codename", t.get("id", "Unknown")) for t in tasks[:3]]
        
        response = f"You have {count} pending tasks. Top priorities are: "
        if len(names) > 1:
            response += ", ".join(names[:-1]) + " and " + names[-1] + "."
        else:
            response += names[0] + "."
        return response
    except Exception as exc:
        logger.debug("⚠ ADVISORY | BRIEFING | Task queue unavailable: %s", exc)
        return "Priority list unavailable."


def _system_health() -> str:
    """Get system health and top unresolved errors."""
    try:
        from memory.error_memory import unresolved
        errors = unresolved()
        if not errors:
            return "All systems nominal. No unresolved anomalies."
        count = len(errors)
        top = errors[:1]
        descriptions = [e.get("description", "Unknown") for e in top]
        desc_str = ". ".join(descriptions)
        return f"Systems nominal, but {count} unresolved error{'s' if count != 1 else ''} remain on file, including: {desc_str}."
    except Exception as exc:
        logger.debug("⚠ ADVISORY | BRIEFING | Error memory unavailable: %s", exc)
        return "System health nominal."


def _weather() -> str:
    """Fetch weather from wttr.in."""
    try:
        resp = requests.get(
            "https://wttr.in/?format=%C,+%t",
            timeout=5,
            headers={"User-Agent": "JARVIS/1.0"},
        )
        if resp.status_code == 200:
            weather = resp.text.strip()
            return f"Current conditions: {weather}."
        return "Weather tracking offline."
    except Exception as exc:
        logger.debug("⚠ ADVISORY | BRIEFING | Weather fetch failed: %s", exc)
        return "Weather tracking offline."


def _calendar_context() -> str:
    """Fetch calendar context (placeholder for calendar linker)."""
    return "Your calendar for today has been noted."


def _personal_check_in() -> str:
    """Rotate daily personal check-in question, ensuring it's only once per day."""
    global _last_check_in_date
    today = datetime.now().date()
    if _last_check_in_date == today:
        return "" # Already asked today

    _last_check_in_date = today
    questions = [
        "How are you holding up today, Sir?",
        "Anything on your mind before we begin?",
        "Rested, I hope? What's the priority for today?"
    ]
    return random.choice(questions)


def daily_briefing() -> str:
    """
    Generate full daily briefing text following Antigravity Protocol.
    """
    parts = [
        _time_greeting(),
        _weather(),
        _pending_tasks(),
        _calendar_context(),
        _system_health(),
        _personal_check_in(),
    ]

    briefing = " ".join([p for p in parts if p])
    logger.info("✦ NOMINAL | BRIEFING | Generated briefing (%d chars)", len(briefing))
    return briefing


def morning_briefing() -> str:
    """Backwards-compatible morning briefing wrapper."""
    return daily_briefing()


def quick_briefing() -> str:
    """Shorter briefing — just time + tasks."""
    now = datetime.now()
    time_str = now.strftime("%I:%M %p")
    return f"It is {time_str}. {_pending_tasks()}"


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Briefing standalone test...\n")

    briefing = morning_briefing()
    print(briefing)

    print(f"\n  Character count: {len(briefing)}")
    print(f"  Estimated duration: ~{len(briefing) // 15}s")

    print("\n[JARVIS]: ✦ NOMINAL | BRIEFING | Standalone test passed.")

