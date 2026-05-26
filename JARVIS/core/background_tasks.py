"""
JARVIS — Persistent Background Tasks (Section 12)
Manages asynchronous processing, monitoring, and background research.
"""

import logging
from datetime import datetime

logger = logging.getLogger("BACKGROUND_TASKS")

class BackgroundTaskManager:
    def __init__(self):
        self.tasks = []

    def dispatch(self, task_type: str, description: str, scheduled_for: datetime = None) -> str:
        """Add a background task to the manager."""
        task_id = f"bg_{len(self.tasks) + 1}"
        new_task = {
            "id": task_id,
            "type": task_type,
            "description": description,
            "status": "QUEUED",
            "added_at": datetime.now(),
            "scheduled_for": scheduled_for
        }
        self.tasks.append(new_task)
        logger.info("Background task dispatched: %s", task_id)
        
        if scheduled_for:
            return f"I have scheduled the '{task_type}' task for {scheduled_for.strftime('%I:%M %p')}, Sir."
        return f"I have dispatched the '{task_type}' task to the background, Sir. I will alert you upon completion."

    def complete_task(self, task_id: str, result_summary: str):
        """Mark a background task as complete."""
        for t in self.tasks:
            if t["id"] == task_id:
                t["status"] = "COMPLETED"
                t["result"] = result_summary
                t["completed_at"] = datetime.now()
                logger.info("Background task %s completed.", task_id)
                return True
        return False

    def generate_log(self) -> str:
        """Generate formatted background tasks log."""
        if not self.tasks:
            return "No background tasks active."
            
        now_str = datetime.now().strftime("%Y-%m-%d")
        log_lines = [f"BACKGROUND TASKS — {now_str}"]
        log_lines.append("──────────────────────────")
        
        for t in self.tasks:
            icon = "✓" if t["status"] == "COMPLETED" else "⧖" if t["status"] == "IN_PROGRESS" else "○"
            status_text = f"Completed at {t.get('completed_at', datetime.now()).strftime('%H:%M')}. {t.get('result', '')}" if t["status"] == "COMPLETED" else "In progress." if t["status"] == "IN_PROGRESS" else "Queued."
            
            log_lines.append(f"{icon} [{t['type']}] — {t['description']} ({status_text})")
            
        return "\n".join(log_lines)
