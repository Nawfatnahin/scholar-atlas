"""
JARVIS — Autonomic Manifest Learning Protocol
Committed dynamic learnings directly into the active version manifest (e.g. V2.0.2.md).
"""

import os
import sys
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("LEARNING_PROTOCOL")

_ROOT = Path(__file__).resolve().parent.parent
_VERSIONS_DIR = _ROOT / "versions"

sys.path.insert(0, str(_ROOT))
try:
    from memory.core_memory import get as get_core_key
    from memory.version_control import log_change
    from vocal.sync_speak import syncSpeak
except ImportError:
    def get_core_key(k, d=None): return d
    def log_change(f, s, op): print(f"[LOG]: {s}")
    def syncSpeak(t): print(f"[SPEAK]: {t}")


def get_active_version() -> str:
    """Finds the currently active version codename of JARVIS."""
    # Method 1: Check core.json
    active_snap = get_core_key("last_active_snapshot")
    if active_snap and isinstance(active_snap, dict):
        codename = active_snap.get("codename")
        if codename:
            return codename.upper()

    # Method 2: Scan JARVIS versions directory for highest version
    if _VERSIONS_DIR.exists():
        version_files = list(_VERSIONS_DIR.glob("V*.md"))
        if version_files:
            # Sort by version number (e.g. V2.0.2 -> [2, 0, 2])
            def parse_ver(p):
                parts = p.stem[1:].split(".")
                try:
                    return [int(x) for x in parts]
                except ValueError:
                    return [0]
            version_files.sort(key=parse_ver)
            return version_files[-1].stem.upper()

    return "V2.0.2"  # Ultimate Fallback


def log_learning(summary: str, details: str = None) -> bool:
    """
    Commits a dynamic learning or capability enhancement directly to the current version manifest.
    """
    try:
        codename = get_active_version()
        manifest_file = _VERSIONS_DIR / f"{codename}.md"
        
        # Ensure versions directory exists
        _VERSIONS_DIR.mkdir(parents=True, exist_ok=True)
        
        # Determine local timestamp (Bangladesh UTC+6)
        bd_tz = timezone(timedelta(hours=6))
        timestamp_local = datetime.now(bd_tz).strftime("%Y-%m-%d %H:%M:%S")
        
        # Construct learning entry
        entry = f"* **[{timestamp_local}]** {summary}\n"
        if details:
            entry += f"  * *Details:* {details}\n"
            
        content = ""
        if manifest_file.exists():
            with open(manifest_file, "r", encoding="utf-8") as f:
                content = f.read()
                
        # Inject dynamic learnings section if missing
        section_header = "## ✦ Dynamic Learnings & Enhancements"
        if section_header not in content:
            # Append to the end
            if content and not content.endswith("\n\n"):
                if content.endswith("\n"):
                    content += "\n"
                else:
                    content += "\n\n"
            content += f"---\n\n{section_header}\n\n"
            
        # Insert learning entry right after the section header
        idx = content.find(section_header)
        insert_pos = idx + len(section_header)
        # Advance past any newlines
        while insert_pos < len(content) and content[insert_pos] in "\r\n":
            insert_pos += 1
            
        # Re-assemble content with new learning entry
        new_content = content[:insert_pos] + entry + content[insert_pos:]
        
        with open(manifest_file, "w", encoding="utf-8") as f:
            f.write(new_content)
            
        # Log to development_log.json
        log_change(f"JARVIS/versions/{codename}.md", f"Committed dynamic learning: {summary}", "LEARN")
        
        logger.info("✦ NOMINAL | LEARNING_PROTOCOL | Logged learning to %s.md: %s", codename, summary)
        return True
    except Exception as exc:
        logger.error("✖ CRITICAL | LEARNING_PROTOCOL | Failed to log learning: %s", exc)
        return False
        
if __name__ == "__main__":
    print("[JARVIS]: Testing learning standalone...")
    log_learning("Initial integration of Autonomic Manifest Learning Protocol")
