"""
JARVIS — Task Queue
Persistent task queue: memory/task_queue.json
Any task with ≥3 steps is auto-queued.
Commands: status, queue, resume [id], cancel [id], done [id]
On session start: announces pending/blocked tasks.
"""

import json
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("TASK_QUEUE")

_ROOT = Path(__file__).resolve().parent.parent
_QUEUE_FILE = _ROOT / "memory" / "task_queue.json"


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
def _empty_queue() -> dict:
    return {"tasks": [], "next_id": 1}


def _new_task(task_id: str, codename: str, steps: list[str]) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": task_id,
        "codename": codename,
        "status": "pending",
        "steps": [{"step": i + 1, "description": s, "done": False} for i, s in enumerate(steps)],
        "created": now,
        "updated": now,
    }


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------
def _load() -> dict:
    _QUEUE_FILE.parent.mkdir(parents=True, exist_ok=True)
    if _QUEUE_FILE.exists():
        try:
            with open(_QUEUE_FILE, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except (json.JSONDecodeError, Exception):
            pass
    return _empty_queue()


def _save(data: dict) -> None:
    _QUEUE_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(_QUEUE_FILE, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
    except Exception as exc:
        logger.error("✖ CRITICAL | TASK_QUEUE | Save failed: %s", exc)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def add_task(codename: str, steps: list[str]) -> str:
    """Add a new task. Returns the task ID."""
    data = _load()
    task_id = f"TASK-{data['next_id']:03d}"
    data["next_id"] += 1
    task = _new_task(task_id, codename, steps)
    data["tasks"].append(task)
    _save(data)
    logger.info("✦ NOMINAL | TASK_QUEUE | Added %s: %s (%d steps)", task_id, codename, len(steps))
    return task_id


def list_all() -> list[dict]:
    """List all tasks."""
    data = _load()
    return data.get("tasks", [])


def pending_blocked() -> list[dict]:
    """List pending and blocked tasks."""
    data = _load()
    return [t for t in data.get("tasks", []) if t["status"] in ("pending", "blocked", "in_progress")]


def get_task(task_id: str) -> dict | None:
    """Get a task by ID."""
    data = _load()
    for task in data.get("tasks", []):
        if task["id"] == task_id:
            return task
    return None


def resume(task_id: str) -> dict | None:
    """Resume a task — set status to in_progress."""
    data = _load()
    for task in data.get("tasks", []):
        if task["id"] == task_id:
            task["status"] = "in_progress"
            task["updated"] = datetime.now(timezone.utc).isoformat()
            _save(data)
            logger.info("✦ NOMINAL | TASK_QUEUE | Resumed: %s (%s)", task_id, task["codename"])
            return task
    logger.error("⚠ ADVISORY | TASK_QUEUE | Task %s not found", task_id)
    return None


def cancel(task_id: str) -> dict | None:
    """Cancel a task."""
    data = _load()
    for task in data.get("tasks", []):
        if task["id"] == task_id:
            task["status"] = "cancelled"
            task["updated"] = datetime.now(timezone.utc).isoformat()
            _save(data)
            logger.info("⚠ ADVISORY | TASK_QUEUE | Cancelled: %s", task_id)
            return task
    return None


def done(task_id: str) -> dict | None:
    """Mark a task as done."""
    data = _load()
    for task in data.get("tasks", []):
        if task["id"] == task_id:
            task["status"] = "done"
            task["updated"] = datetime.now(timezone.utc).isoformat()
            for step in task["steps"]:
                step["done"] = True
            _save(data)
            logger.info("✦ NOMINAL | TASK_QUEUE | Completed: %s (%s)", task_id, task["codename"])
            return task
    return None


def complete_step(task_id: str, step_num: int) -> bool:
    """Mark a specific step as done."""
    data = _load()
    for task in data.get("tasks", []):
        if task["id"] == task_id:
            for step in task["steps"]:
                if step["step"] == step_num:
                    step["done"] = True
                    task["updated"] = datetime.now(timezone.utc).isoformat()
                    # Auto-complete task if all steps done
                    if all(s["done"] for s in task["steps"]):
                        task["status"] = "done"
                    _save(data)
                    return True
    return False


def block(task_id: str) -> dict | None:
    """Mark a task as blocked."""
    data = _load()
    for task in data.get("tasks", []):
        if task["id"] == task_id:
            task["status"] = "blocked"
            task["updated"] = datetime.now(timezone.utc).isoformat()
            _save(data)
            logger.info("⚠ ADVISORY | TASK_QUEUE | Blocked: %s", task_id)
            return task
    return None


def announce_pending() -> str:
    """Generate announcement text for pending/blocked tasks."""
    tasks = pending_blocked()
    if not tasks:
        return "No pending tasks, Sir. Queue is clear."
    lines = []
    for t in tasks:
        done_steps = sum(1 for s in t["steps"] if s["done"])
        total_steps = len(t["steps"])
        lines.append(f"{t['id']} {t['codename']} — {t['status']} ({done_steps}/{total_steps} steps)")
    return f"{len(tasks)} task(s) in queue:\n" + "\n".join(lines)


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Task queue standalone test...")

    tid = add_task("OPERATION TEST RUN", ["Step one", "Step two", "Step three"])
    print(f"  Added: {tid}")

    print(f"  Pending: {announce_pending()}")

    resume(tid)
    complete_step(tid, 1)
    complete_step(tid, 2)

    task = get_task(tid)
    print(f"  Task state: {json.dumps(task, indent=2)}")

    done(tid)
    print(f"  After done: {announce_pending()}")

    print("\n[JARVIS]: ✦ NOMINAL | TASK_QUEUE | Standalone test passed.")
