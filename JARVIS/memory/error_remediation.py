"""
JARVIS — Autonomic Self-Remediation System
File: memory/error_remediation.py
API and CLI tool to log solved errors and auto-commit them as dynamic system learnings.
"""

import os
import sys
import logging
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT))

logger = logging.getLogger("ERROR_REMEDIATION")

def safe_print(text: str):
    """Prints text handling potential Windows terminal Unicode encoding issues."""
    try:
        sys.stdout.write(text + "\n")
        sys.stdout.flush()
    except UnicodeEncodeError:
        encoding = sys.stdout.encoding or 'utf-8'
        sys.stdout.write(text.encode(encoding, errors='replace').decode(encoding) + "\n")
        sys.stdout.flush()

try:
    from memory.error_memory import log_error
    from memory.learning import log_learning
except ImportError:
    # Fallbacks if running out of environment
    def log_error(cat, desc, cause, rem, imp="Low"):
        safe_print(f"[FALLBACK LOG ERROR]: {cat} - {desc}")
        return "ERR-FALLBACK"
    def log_learning(summary, details=None):
        safe_print(f"[FALLBACK LOG LEARN]: {summary}")
        return True


def remedy_error(category: str, description: str, cause: str, remediation: str, impact: str = "Low") -> str | None:
    """
    Autonomically logs an error fix and commits it to the active version's manifest as a dynamic learning.
    Returns the error ID if successful, or None if duplicate.
    """
    try:
        # 1. Log to errors database
        err_id = log_error(
            category=category,
            description=description,
            cause=cause,
            remediation=remediation,
            impact=impact
        )
        
        if not err_id:
            logger.info("✦ ADVISORY | ERROR_REMEDIATION | Duplicate error skipped programmatically.")
            return None
            
        # 2. Format learning summary and details
        learning_summary = f"Autonomic Error Remediation: Solved {category} issue ({err_id}) — {description[:60]}"
        learning_details = (
            f"**Cause:** {cause}\n"
            f"  * *Remediation:* {remediation}\n"
            f"  * *Impact Level:* {impact}"
        )
        
        # 3. Commit learning to the active version manifest
        log_learning(summary=learning_summary, details=learning_details)
        
        logger.info("✦ NOMINAL | ERROR_REMEDIATION | Autonomic self-remediation completed: %s", err_id)
        return err_id
        
    except Exception as exc:
        logger.error("✖ CRITICAL | ERROR_REMEDIATION | Autonomic self-remediation failed: %s", exc)
        return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    
    # Standalone CLI invocation support
    if len(sys.argv) >= 5:
        cat = sys.argv[1]
        desc = sys.argv[2]
        cause = sys.argv[3]
        rem = sys.argv[4]
        imp = sys.argv[5] if len(sys.argv) > 5 else "Low"
        
        safe_print(f"[JARVIS]: Executing command-line error remediation logging...")
        eid = remedy_error(cat, desc, cause, rem, imp)
        if eid:
            safe_print(f"[JARVIS]: ✦ NOMINAL | ERROR_REMEDIATION | Programmatically resolved: {eid}")
        else:
            safe_print(f"[JARVIS]: ✦ ADVISORY | ERROR_REMEDIATION | Registration skipped (possible duplicate or error).")
    else:
        safe_print("[JARVIS]: Running autonomic self-remediation self-test...")
        test_eid = remedy_error(
            category="SYSTEM",
            description="VS Code active tab overflow memory leak",
            cause="Too many open files accumulating in workspace memory.",
            remediation="Updated settings.json to enforce max active tab limit of 5.",
            impact="Medium"
        )
        if test_eid:
            safe_print(f"[JARVIS]: Test complete. Generated: {test_eid}")
        else:
            safe_print("[JARVIS]: Test complete. Skipped duplicate error registry.")
        safe_print("[JARVIS]: ✦ NOMINAL | ERROR_REMEDIATION | Standalone test completed.")
