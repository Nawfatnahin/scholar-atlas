"""
JARVIS — Error Memory (Error Intelligence)
File: memory/errors.json
Auto-logs solved errors silently. Checks memory before investigating.
Commands: errors, errors search [word], errors show [id], errors purge resolved
"""

import json
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("ERROR_MEMORY")

_ROOT = Path(__file__).resolve().parent.parent
_ERRORS_FILE = _ROOT / "memory" / "errors.json"


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
def _empty_store() -> dict:
    return {"errors": [], "next_id": 1}


def _new_error(err_id: str, category: str, description: str,
               cause: str, remediation: str, impact: str) -> dict:
    return {
        "id": err_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "category": category,  # CODING | PROTOCOL | SYSTEM
        "description": description,
        "cause": cause,
        "remediation": remediation,
        "impact": impact,
        "resolved": True,
    }


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------
def _load() -> dict:
    _ERRORS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if _ERRORS_FILE.exists():
        try:
            with open(_ERRORS_FILE, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except (json.JSONDecodeError, Exception):
            pass
    return _empty_store()


def _save(data: dict) -> None:
    _ERRORS_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(_ERRORS_FILE, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
    except Exception as exc:
        logger.error("✖ CRITICAL | ERROR_MEMORY | Save failed: %s", exc)


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------
def _is_duplicate(data: dict, description: str, cause: str) -> bool:
    """Check if an error with the same description and cause already exists."""
    desc_lower = description.lower()
    cause_lower = cause.lower()
    for err in data.get("errors", []):
        if (err["description"].lower() == desc_lower and
                err["cause"].lower() == cause_lower):
            return True
    return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def log_error(category: str, description: str, cause: str,
              remediation: str, impact: str = "Low") -> str | None:
    """
    Log a solved error. Silently deduplicates.
    Returns the error ID, or None if duplicate.
    """
    data = _load()
    if _is_duplicate(data, description, cause):
        logger.debug("⚠ ADVISORY | ERROR_MEMORY | Duplicate skipped: %s", description[:40])
        return None

    err_id = f"ERR-{data['next_id']:03d}"
    data["next_id"] += 1
    error = _new_error(err_id, category.upper(), description, cause, remediation, impact)
    data["errors"].append(error)
    _save(data)
    logger.info("✦ NOMINAL | ERROR_MEMORY | Logged: %s — %s", err_id, description[:40])
    return err_id


def top5() -> list[dict]:
    """Return the 5 most recent errors."""
    data = _load()
    return data.get("errors", [])[-5:]


def search(keyword: str) -> list[dict]:
    """Search errors by keyword across all fields."""
    data = _load()
    keyword_lower = keyword.lower()
    results = []
    for err in data.get("errors", []):
        searchable = " ".join([
            err.get("description", ""),
            err.get("cause", ""),
            err.get("remediation", ""),
            err.get("category", ""),
        ]).lower()
        if keyword_lower in searchable:
            results.append(err)
    logger.info("✦ NOMINAL | ERROR_MEMORY | Search '%s': %d result(s)", keyword, len(results))
    return results


def show(err_id: str) -> dict | None:
    """Show a specific error by ID."""
    data = _load()
    for err in data.get("errors", []):
        if err["id"] == err_id:
            return err
    return None


def check_known(description: str) -> dict | None:
    """
    Check if an error is already known (before investigating).
    Returns the matching error or None.
    """
    data = _load()
    desc_lower = description.lower()
    for err in data.get("errors", []):
        if desc_lower in err.get("description", "").lower():
            return err
        if desc_lower in err.get("cause", "").lower():
            return err
    return None


def purge_resolved() -> int:
    """Remove all resolved errors. Returns count removed."""
    data = _load()
    before = len(data.get("errors", []))
    data["errors"] = [e for e in data.get("errors", []) if not e.get("resolved", False)]
    after = len(data["errors"])
    _save(data)
    removed = before - after
    logger.info("✦ NOMINAL | ERROR_MEMORY | Purged %d resolved error(s)", removed)
    return removed


def all_errors() -> list[dict]:
    """Return all errors."""
    data = _load()
    return data.get("errors", [])


def unresolved() -> list[dict]:
    """Return unresolved errors only."""
    data = _load()
    return [e for e in data.get("errors", []) if not e.get("resolved", False)]


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Error memory standalone test...")

    eid = log_error(
        "CODING",
        "ModuleNotFoundError: vosk",
        "vosk package not in venv",
        "pip install vosk",
        "Blocks STT listener"
    )
    print(f"  Logged: {eid}")

    # Duplicate test
    eid2 = log_error(
        "CODING",
        "ModuleNotFoundError: vosk",
        "vosk package not in venv",
        "pip install vosk"
    )
    assert eid2 is None, "Should detect duplicate"
    print(f"  Duplicate check: passed (returned None)")

    results = search("vosk")
    print(f"  Search 'vosk': {len(results)} result(s)")

    top = top5()
    print(f"  Top 5: {len(top)} error(s)")

    known = check_known("ModuleNotFoundError")
    print(f"  Known check: {'found' if known else 'not found'}")

    print("\n[JARVIS]: ✦ NOMINAL | ERROR_MEMORY | Standalone test passed.")
