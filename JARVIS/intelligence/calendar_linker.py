"""
JARVIS — Calendar Context Awareness (Section 04)
Provides event linking, overlap detection, and contextual pre-event reminders.
"""

import logging
from datetime import datetime, timedelta

logger = logging.getLogger("CALENDAR_LINKER")

class CalendarLinker:
    def __init__(self):
        # In a real environment, this would hook into Google Calendar or Outlook API.
        # For now, it maintains a structured internal list of events.
        self.events = []
        self.linked_context = {}

    def add_event(self, title: str, start_time: datetime, duration_mins: int = 60) -> str:
        """Add event and detect conflicts."""
        end_time = start_time + timedelta(minutes=duration_mins)
        
        # Conflict detection
        for evt in self.events:
            evt_end = evt["start"] + timedelta(minutes=evt["duration"])
            # Overlap check
            if max(start_time, evt["start"]) < min(end_time, evt_end):
                logger.warning("Conflict detected between %s and %s", title, evt["title"])
                return f"I've noticed a scheduling conflict on {start_time.strftime('%Y-%m-%d')} at {start_time.strftime('%I:%M %p')} between '{title}' and '{evt['title']}'. Shall I suggest a resolution?"
                
        new_event = {
            "id": f"evt_{len(self.events)}",
            "title": title,
            "start": start_time,
            "duration": duration_mins
        }
        self.events.append(new_event)
        self.events.sort(key=lambda x: x["start"])
        return "Shall I link any files, notes, or tasks to this event for context retrieval?"

    def link_context(self, event_title: str, context_type: str, context_value: str) -> None:
        """Link a document, note, or task to an event."""
        if event_title not in self.linked_context:
            self.linked_context[event_title] = []
        self.linked_context[event_title].append({"type": context_type, "value": context_value})
        logger.info("Linked %s to event: %s", context_value, event_title)

    def check_pre_event_reminders(self) -> str | None:
        """Run periodically to check for upcoming events in the next 30 mins."""
        now = datetime.now()
        thirty_mins = timedelta(minutes=30)
        
        for evt in self.events:
            time_until = evt["start"] - now
            if timedelta(minutes=29) <= time_until <= thirty_mins:
                linked = self.linked_context.get(evt["title"])
                if linked:
                    docs = [l["value"] for l in linked if l["type"] == "file"]
                    if docs:
                        return f"Sir, '{evt['title']}' begins in 30 minutes. The related document — {docs[0]} — is queued. Would you like a summary before you go in?"
                return f"Sir, '{evt['title']}' begins in 30 minutes. Would you like me to prepare a quick briefing or checklist?"
        return None

    def post_event_log(self, event_title: str) -> str:
        """Triggered when an event concludes."""
        return f"The '{event_title}' session has concluded. Should I log any notes, action items, or follow-ups from this?"

    def weekly_preview(self) -> str:
        """Returns a 5-day forward view of events."""
        if not self.events:
            return "Your calendar is currently clear for the next 5 days."
        
        upcoming = [e for e in self.events if e["start"] >= datetime.now() and e["start"] <= datetime.now() + timedelta(days=5)]
        if not upcoming:
            return "No immediate events scheduled."
            
        summary = f"You have {len(upcoming)} event{'s' if len(upcoming) != 1 else ''} scheduled over the next 5 days. Next up is '{upcoming[0]['title']}' on {upcoming[0]['start'].strftime('%A')}."
        return summary
