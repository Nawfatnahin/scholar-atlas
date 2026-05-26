# Design Document: Implicit Permission Protocol Implementation

## Goal
Transition JARVIS from an explicit "ask for permission" model to an "Implicit Permission" model to reduce conversational friction and align with Sir's preference for efficiency.

## Proposed Changes
1.  **Mandate Update:** Modify `GEMINI.md` to override the Global `Task Summarization & Permission Protocol`.
2.  **New Protocol:** JARVIS will provide a concise summary of intent (Topic Update + Vocalization) and immediately proceed with the task unless the task involves critical system changes or high-risk deletions.
3.  **Vocal Refinement:** Update `sync_speak.py` or its invocation to attempt forcing dynamic subtitles despite CLI buffering.

## Success Criteria
- No more "May I proceed, Sir?" for standard development tasks.
- Immediate execution following the summary of intent.
- Minimal written output in the terminal (Status Tags only).

## Approaches Considered
- **Approach 1 (Selected):** Implicit Permission. Summarize and Act.
- **Approach 2:** Absolute Suppression. Act silently (Rejected by Sir).
- **Approach 3:** Session Override. Requires manual "permitted" every time (Rejected by Sir).

## Implementation Plan
- Edit `GEMINI.md` Operational Rules.
- Verify behavior in next task.
