# Spec: Subject Creation Logic Refinement (Threshold Removal)

**Goal:** Remove the "Threshold %" field from the subject creation/edit popup and shift all attendance calculations to use the "Personal %" (personal target) as the primary and only metric.

**Technical Changes:**

1. **Frontend (AttendanceTracker.tsx):**
   - Remove `requiredThreshold` from the `formData` state.
   - Set the default for `personalTarget` to `75` (or a sensible academic default).
   - Remove the "Threshold %" input field from the UI.
   - Update the "Personal %" input field to be required and clearly labeled as the target attendance.
   - Update `handleAddSubject` to pass `formData.personalTarget` as both `requiredThreshold` and `personalTarget` to the server action (to maintain database compatibility while ensuring logic uses the same value).

2. **Logic (calculator.ts):**
   - Update `calculateStats` to use `subject.personal_target` as the primary source of truth for the `threshold`.
   - If `personal_target` is null (for legacy data), fallback to `required_threshold`.
   - Ensure all health status checks (`safe`, `caution`, `danger`, `unreachable`) are calculated against this unified target.

3. **Backend Actions (actions.ts):**
   - Update the `addSubject` action to ensure `required_threshold` and `personal_target` are synchronized if only one is provided.
   - Ensure validations in `UpsertSubjectScheduleSchema` allow for this new flow.

4. **Global Audit:**
   - Verify that any other parts of the website (dashboard widgets, analytics) that reference "threshold" are updated to reflect the new "Target" terminology or use the synchronized value.

**Verification:**
- Create a new subject and verify only one target percentage is requested.
- Verify that attendance alerts and health status are calculated correctly against the personal target.
- Check both light and dark modes for UI consistency.
- Verify that legacy subjects still function correctly.
