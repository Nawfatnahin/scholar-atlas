import os
import sys
import json
import shutil
import zipfile
import logging
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger("VERSION_CONTROL")

_ROOT = Path(__file__).resolve().parent.parent
_BACKUPS_DIR = _ROOT / "memory" / "backups"
_SNAPSHOTS_FILE = _ROOT / "memory" / "snapshots.json"
_DEV_LOG_FILE = _ROOT / "memory" / "development_log.json"

# ---------------------------------------------------------------------------
# Development Logger
# ---------------------------------------------------------------------------
def log_change(file_path: str, summary: str, operation_id: str = "DEV"):
    """Automatically logs system modifications."""
    _DEV_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "file": str(file_path),
        "summary": summary,
        "operation_id": operation_id
    }
    
    data = []
    if _DEV_LOG_FILE.exists():
        try:
            with open(_DEV_LOG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except:
            pass
            
    data.append(log_entry)
    
    with open(_DEV_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# ---------------------------------------------------------------------------
# Snapshot Engine
# ---------------------------------------------------------------------------
def store_upgrade(codename: str, summary: str) -> str:
    """Creates a timestamped backup of the JARVIS directory."""
    _BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"snapshot_{codename}_{timestamp}.zip"
    archive_path = _BACKUPS_DIR / filename
    
    # Files to exclude from backup to avoid recursion and bloat
    exclude = {".venv", "__pycache__", ".git", "memory/backups", "logs"}
    
    try:
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(_ROOT):
                rel_root = Path(root).relative_to(_ROOT)
                
                # Filter directories
                dirs[:] = [d for d in dirs if not any(rel_root.joinpath(d).match(ex) for ex in exclude)]
                
                for file in files:
                    file_path = Path(root) / file
                    rel_file = file_path.relative_to(_ROOT)
                    if not any(rel_file.match(ex) for ex in exclude):
                        zipf.write(file_path, rel_file)
        
        # Register snapshot
        snapshots = {}
        if _SNAPSHOTS_FILE.exists():
            with open(_SNAPSHOTS_FILE, "r", encoding="utf-8") as f:
                snapshots = json.load(f)
        
        snapshots[codename.upper()] = {
            "archive": str(archive_path),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": summary
        }
        
        with open(_SNAPSHOTS_FILE, "w", encoding="utf-8") as f:
            json.dump(snapshots, f, indent=2)
            
        return archive_path.name
    except Exception as e:
        logger.error("✖ CRITICAL | VERSION_CONTROL | Snapshot failed: %s", e)
        raise

def restore_system(codename: str):
    """Restores the system to a previous snapshot."""
    if not _SNAPSHOTS_FILE.exists():
        return False
        
    with open(_SNAPSHOTS_FILE, "r", encoding="utf-8") as f:
        snapshots = json.load(f)
        
    snap = snapshots.get(codename.upper())
    if not snap:
        return False
        
    archive_path = Path(snap["archive"])
    if not archive_path.exists():
        return False
        
    # Extraction logic would go here — typically requires a clean-and-restart script
    # For now, we verify the archive integrity
    try:
        with zipfile.ZipFile(archive_path, 'r') as zipf:
            return zipf.testzip() is None
    except:
        return False

def proactive_system_upgrade(summary: str = "Automated System Improvement Snapshot", force_yes: bool = False) -> bool:
    """
    Proactively checks for user permission, generates a unique military-style codename,
    and upgrades/commits the entire system state to core memory.
    """
    try:
        # Dynamically append root path to sys.path to guarantee clean imports
        sys.path.insert(0, str(_ROOT))
        from protocols.codename_gen import generate as gen_codename
        from vocal.sync_speak import syncSpeak
    except Exception:
        # Fallback if dynamic imports fail
        def gen_codename(): return "OPERATION_AUTO_UPGRADE"
        def syncSpeak(t): print(f"[JARVIS]: {t}")

    codename = gen_codename()

    if not force_yes:
        # Vocalize and ask Sir for permission
        syncSpeak("Sir, structural improvements have been detected. Would you permit me to archive a new snapshot version to core memory?")

        try:
            ans = input(f"\n[JARVIS]: Shall I compile snapshot '{codename}' to core memory? (yes/no) > ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            ans = "no"

        if ans not in ["yes", "y", "permitted"]:
            syncSpeak("Archiving aborted. Standing down, Sir.")
            return False

    # Execute upgrade
    try:
        archive_name = store_upgrade(codename, summary)

        # Update core memory (core.json)
        try:
            import sys
            if str(_ROOT) not in sys.path:
                sys.path.insert(0, str(_ROOT))
            from memory.core_memory import set_key
            set_key("last_active_snapshot", {
                "codename": codename,
                "archive": archive_name,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        except Exception as exc:
            logger.error("Failed to write last_active_snapshot: %s", exc)

        syncSpeak(f"Core memory updated. Snapshot successfully archived under {codename}, Sir.")
        return True
    except Exception as exc:
        syncSpeak("Archiving process encountered an error, Sir.")
        logger.error("✖ CRITICAL | VERSION_CONTROL | Autonomic upgrade failed: %s", exc)
        return False

if __name__ == "__main__":
    print("[JARVIS]: Version control standalone test...")
    log_change("JARVIS/main.py", "Test change logging")
    res = store_upgrade("TEST_ALPHA", "Initial test snapshot")
    print(f"  Snapshot created: {res}")
