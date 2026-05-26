"""
JARVIS — Habit Tracker & Proactive Reminders (Sections 06 & 07)
Tracks user behavior patterns silently and generates context-aware reminders.
"""

import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger("HABIT_TRACKER")

class HabitTracker:
    def __init__(self):
        self.session_start = datetime.now()
        self.active = True
        self.interactions = 0
        self.workflows = {}
        self.reminders = []
        
    def log_interaction(self, workflow_type: str = "General"):
        """Log an interaction to track dominant workflows."""
        self.interactions += 1
        self.workflows[workflow_type] = self.workflows.get(workflow_type, 0) + 1

    def check_nudges(self) -> str | None:
        """Check if any proactive nudges should be triggered."""
        elapsed = datetime.now() - self.session_start
        if elapsed > timedelta(hours=3):
            # Reset start to prevent spamming
            self.session_start = datetime.now()
            return "Sir, it's been a while. Systems are fine — are you taking care of yourself?"
        return None
        
    def generate_habit_report(self) -> str:
        """Generates the structured habit report."""
        hours_elapsed = round((datetime.now() - self.session_start).total_seconds() / 3600, 1)
        top_workflow = max(self.workflows, key=self.workflows.get) if self.workflows else "None"
        
        report = f"""┌──────────────────────────────────────────────────────┐
│  HABIT REPORT — Session Snapshot                     │
│──────────────────────────────────────────────────────│
│  Session Length        : {hours_elapsed} hours
│  Interaction Count     : {self.interactions}
│  Top Workflow          : {top_workflow}
│  Rest Pattern          : Needs tracking over days
│  Mood Trend            : Stable
└──────────────────────────────────────────────────────┘"""
        return report

    def add_reminder(self, task_name: str, trigger_time: datetime, context: str):
        """Add a time-based contextual reminder."""
        self.reminders.append({
            "task": task_name,
            "trigger": trigger_time,
            "context": context
        })
        
    def check_reminders(self) -> str | None:
        """Evaluate reminders against current time."""
        now = datetime.now()
        for i, rem in enumerate(self.reminders):
            if now >= rem["trigger"]:
                task = rem["task"]
                ctx = rem["context"]
                self.reminders.pop(i)
                return f"Sir, regarding {task}: {ctx} Shall I pull it up?"
        return None
        
    def check_dependency(self, task_b: str, task_a: str, task_a_status: bool) -> str | None:
        """Dependency-aware context flag."""
        if not task_a_status:
            return f"Before you proceed with {task_b}, you'll need {task_a} completed. Want me to sequence these for you?"
        return None
