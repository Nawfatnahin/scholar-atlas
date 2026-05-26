# Operation CHRONO SHIFT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive upgrade to the Attendance Tracker module for Scholar Atlas, including predictive analytics, smart alerts, and schedule management.

**Architecture:** Centralized business logic in a pure utility `calculator.ts`, optimistic UI updates with React Query, and server-side validation via Next.js Server Actions.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Zustand, React Query, Framer Motion, date-fns, Lucide React, sonner, Zod, Recharts.

---

### Task 1: Database Migrations

**Files:**
- Create: `Websites/scholar-atlas/supabase/migrations/20260517001_attendance_upgrade.sql`

- [ ] **Step 1: Prepare the migration script**
Create the combined migration script containing Migrations 001, 002, and 003 from the spec.

```sql
-- Migration 001 — Extend subjects table
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS required_threshold   NUMERIC(5,2) NOT NULL DEFAULT 75.00,
  ADD COLUMN IF NOT EXISTS personal_target       NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total_classes_planned INTEGER      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS semester_start_date   DATE         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS semester_end_date     DATE         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS schedule_days         TEXT[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS schedule_time         TIME         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS color_tag             TEXT         NOT NULL DEFAULT 'blue',
  ADD CONSTRAINT chk_threshold CHECK (required_threshold BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_personal  CHECK (personal_target IS NULL OR personal_target BETWEEN 0 AND 100);

-- Migration 002 — Extend attendance_records table
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS absence_type   TEXT    NOT NULL DEFAULT 'unexcused'
    CHECK (absence_type IN ('present', 'unexcused', 'medical', 'excused', 'cancelled')),
  ADD COLUMN IF NOT EXISTS note           TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS class_date     DATE    NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS week_number    INTEGER GENERATED ALWAYS AS (EXTRACT(WEEK FROM class_date)) STORED;

CREATE INDEX IF NOT EXISTS idx_attendance_subject_date
  ON attendance_records (subject_id, class_date DESC);

-- Migration 003 — Holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  date        DATE NOT NULL,
  scope       TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'subject')),
  subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own holidays"
  ON holidays FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Commit the migration script**
```bash
git add Websites/scholar-atlas/supabase/migrations/20260517001_attendance_upgrade.sql
git commit -m "db: add attendance tracker upgrade migrations"
```

---

### Task 2: Attendance Calculator Utility

**Files:**
- Create: `Websites/scholar-atlas/src/lib/attendance/calculator.ts`
- Test: `Websites/scholar-atlas/src/lib/attendance/__tests__/calculator.test.ts`

- [ ] **Step 1: Define interfaces and initial calculator logic**
Implement `SubjectAttendanceStats` and `calculateStats` as defined in the spec.

- [ ] **Step 2: Implement "Safe Skips" and "Recovery" formulas**
Add the business logic for forecasting.

- [ ] **Step 3: Add unit tests and verify**
Run: `npm test Websites/scholar-atlas/src/lib/attendance/__tests__/calculator.test.ts`

---

### Task 3: Attendance Server Actions

**Files:**
- Create: `Websites/scholar-atlas/src/app/dashboard/attendance/actions.ts`

- [ ] **Step 1: Implement `markAttendance` with alert gate**
Include Zod validation and `requiresConfirmation` logic.

- [ ] **Step 2: Implement `bulkMarkAttendance`**
Add support for Batch Mark mode.

- [ ] **Step 3: Implement schedule and holiday actions**
`upsertSubjectSchedule`, `addHoliday`, `deleteHoliday`.

---

### Task 4: Alert Modal Component

**Files:**
- Create: `Websites/scholar-atlas/src/components/attendance/AlertModal.tsx`

- [ ] **Step 1: Build the Framer Motion modal**
Implement severity levels (warning, critical, fatal) with specified copy.

- [ ] **Step 2: Integrate with markAttendance flow**
Handle the confirmation re-submission logic.

---

### Task 5: Subject Card Enhancements

**Files:**
- Modify: `Websites/scholar-atlas/src/components/attendance/SubjectCard.tsx` (Assuming existing path)

- [ ] **Step 1: Add live stats display**
Rows for skips left, recovery info, and projections.

- [ ] **Step 2: Implement health border and dot coding**
Apply the `border-l-*` styles based on `healthStatus`.

---

### Task 6: Today's Schedule Widget

**Files:**
- Create: `Websites/scholar-atlas/src/components/attendance/TodaySchedule.tsx`

- [ ] **Step 1: Build the "Today" strip**
Filter subjects by `schedule_days` and provide quick-mark buttons.

---

### Task 7: Batch Mark Mode

**Files:**
- Modify: `Websites/scholar-atlas/src/app/dashboard/attendance/page.tsx`
- Create: `Websites/scholar-atlas/src/components/attendance/BatchMarkFooter.tsx`

- [ ] **Step 1: Add Batch Mark toggle and date grid**
Cycle through attendance types on click.

- [ ] **Step 2: Implement bulk upsert logic**
Connect footer "Save All" to `bulkMarkAttendance` action.

---

### Task 8: What-If Simulator

**Files:**
- Create: `Websites/scholar-atlas/src/components/attendance/WhatIfSimulator.tsx`

- [ ] **Step 1: Build the slide-in panel**
Add the slider and live output table using `calculateStats`.

---

### Task 9: Holiday Management Modal

**Files:**
- Create: `Websites/scholar-atlas/src/components/attendance/HolidayModal.tsx`

- [ ] **Step 1: Implement Tabs for Global and Subject-specific holidays**
CRUD operations for the `holidays` table.

---

### Task 10: Analytics & Polish

**Files:**
- Modify: `Websites/scholar-atlas/src/components/attendance/SubjectDetails.tsx`
- Modify: `Websites/scholar-atlas/src/app/dashboard/attendance/page.tsx`

- [ ] **Step 1: Implement Recharts Sparkline**
Weekly attendance trend chart.

- [ ] **Step 2: Add Overall Semester Health Score header**
Weighted health metric display.

- [ ] **Step 3: Integrate Achievements system**
`sonner` toasts for streaks and milestones.

- [ ] **Step 4: Mobile responsiveness and accessibility audit**
Verify focus rings, ARIA roles, and grid layouts.
