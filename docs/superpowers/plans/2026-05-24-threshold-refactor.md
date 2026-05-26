# Threshold Removal & Personal Target Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the "Threshold %" field from subject creation and use "Personal %" as the sole, unified metric for all attendance calculations.

**Architecture:** Frontend state simplification with synchronized backend persistence to maintain database schema compatibility while refining user experience.

**Tech Stack:** Next.js (App Router), TypeScript, Supabase, Tailwind CSS.

---

### Task 1: Update Frontend State & UI

**Files:**
- Modify: `My Websites/scholar-atlas/src/components/attendance/AttendanceTracker.tsx`

- [ ] **Step 1: Simplify formData state**
Remove `requiredThreshold` and set `personalTarget` to `75` by default.

```tsx
// Around line 41
  const [formData, setFormData] = useState({
    name: '',
    courseCode: '',
    personalTarget: 75, // Now default and primary
    classDays: [] as string[],
    semesterStartDate: format(new Date(), 'yyyy-MM-dd'),
    totalWeeks: 15,
  });
```

- [ ] **Step 2: Update `handleAddSubject` logic**
Synchronize both values when sending to the server action.

```tsx
// Around line 78
      const res = await addSubject({
        name: formData.name,
        courseCode: formData.courseCode,
        requiredThreshold: Number(formData.personalTarget), // Sync
        personalTarget: Number(formData.personalTarget),    // Sync
        classDays: formData.classDays,
        semesterStartDate: formData.semesterStartDate,
        totalWeeks: Number(formData.totalWeeks)
      });
```

- [ ] **Step 3: Remove Threshold input from JSX**
Delete the "Threshold %" div and expand the "Personal %" (Target) field.

```tsx
// Around line 297-304
<div className="space-y-2 col-span-2">
  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
    <Layout className="w-3 h-3" /> Target Attendance %
  </label>
  <input 
    type="number" 
    value={formData.personalTarget} 
    onChange={(e) => setFormData({...formData, personalTarget: parseFloat(e.target.value)})} 
    placeholder="75" 
    className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong bg-bg-base font-bold text-text-primary outline-none focus:border-accent transition-all dark:bg-bg-elevated" 
    required
  />
</div>
```

---

### Task 2: Refine Calculator Logic

**Files:**
- Modify: `My Websites/scholar-atlas/src/lib/attendance/calculator.ts`

- [ ] **Step 1: Ensure Personal Target Priority**
Update `calculateStats` to explicitly favor `personal_target`.

```tsx
// Around line 51
  const threshold = subject.personal_target ?? subject.required_threshold
  const targetPct = threshold / 100
```

- [ ] **Step 2: Update Health Checks**
Ensure `isInDangerZone` and `healthStatus` use the unified `threshold`.

---

### Task 3: Global Reference Audit

**Files:**
- Modify: `My Websites/scholar-atlas/src/components/attendance/SubjectCard.tsx`
- Modify: `My Websites/scholar-atlas/src/app/dashboard/attendance/actions.ts`

- [ ] **Step 1: Update SubjectCard labels**
Change "Min:" to "Target:" in the progress bar tooltip.

- [ ] **Step 2: Verify Server Action validations**
Ensure `UpsertSubjectScheduleSchema` allows the new unified payload.

---

### Task 4: Verification & Git

- [ ] **Step 1: Manual verification**
Create a subject with an 80% target and verify calculations.

- [ ] **Step 2: Commit & Push**
```bash
git add .
git commit -m "refactor: remove threshold field and unify calculations around personal targets"
git push
```
