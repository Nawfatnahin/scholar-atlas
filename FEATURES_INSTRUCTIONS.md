# Scholar Atlas — Feature Implementation Instructions

> **Stack**: Next.js 15 App Router · Supabase (RLS) · TypeScript · Tailwind CSS · Cloudflare Workers (OpenNext)
> **Pattern**: Always use `createClient` from `@/lib/supabase/server` for DB. Enforce RLS on every new table. Follow existing dark mode CSS variable system.

---

## FEATURE 1 — Assignment & Exam Grade Tracker

### Goal
Let students log individual assessment marks (quiz, midterm, final, assignment) per subject with weightages, and auto-calculate the weighted subject GPA contribution.

---

### Step 1 — Database Migration

Create file: `supabase/migrations/20260603001_grade_tracker.sql`

```sql
-- Grade categories per subject
CREATE TABLE public.grade_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- e.g. "Midterm", "Quiz", "Assignment"
  weight_percent NUMERIC NOT NULL CHECK (weight_percent > 0 AND weight_percent <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual assessment entries
CREATE TABLE public.grade_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.grade_categories(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                 -- e.g. "Midterm 1", "Quiz 3"
  marks_obtained NUMERIC NOT NULL,
  marks_total NUMERIC NOT NULL CHECK (marks_total > 0),
  date_taken DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.grade_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own grade_categories"
  ON public.grade_categories FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own grade_entries"
  ON public.grade_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_grade_categories_subject ON public.grade_categories(subject_id);
CREATE INDEX idx_grade_entries_subject ON public.grade_entries(subject_id);
CREATE INDEX idx_grade_entries_category ON public.grade_entries(category_id);
```

---

### Step 2 — TypeScript Types

Create file: `src/types/grades.ts`

```typescript
export interface GradeCategory {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  weight_percent: number;
  created_at: string;
}

export interface GradeEntry {
  id: string;
  user_id: string;
  category_id: string;
  subject_id: string;
  title: string;
  marks_obtained: number;
  marks_total: number;
  date_taken: string | null;
  notes: string | null;
  created_at: string;
}

export interface SubjectGradeSummary {
  subject_id: string;
  weighted_percentage: number;         // 0–100
  categories: CategorySummary[];
}

export interface CategorySummary {
  category_id: string;
  name: string;
  weight_percent: number;
  average_percent: number;             // avg of all entries in this category
  entries: GradeEntry[];
}
```

---

### Step 3 — Grade Calculation Utility

Create file: `src/lib/gradeUtils.ts`

```typescript
import type { GradeCategory, GradeEntry, SubjectGradeSummary } from "@/types/grades";

export function computeSubjectGrade(
  categories: GradeCategory[],
  entries: GradeEntry[]
): SubjectGradeSummary | null {
  if (!categories.length) return null;

  let weightedTotal = 0;
  let weightCovered = 0;

  const categorySummaries = categories.map((cat) => {
    const catEntries = entries.filter((e) => e.category_id === cat.id);
    const avgPercent =
      catEntries.length > 0
        ? catEntries.reduce((sum, e) => sum + (e.marks_obtained / e.marks_total) * 100, 0) /
          catEntries.length
        : 0;

    if (catEntries.length > 0) {
      weightedTotal += (avgPercent * cat.weight_percent) / 100;
      weightCovered += cat.weight_percent;
    }

    return {
      category_id: cat.id,
      name: cat.name,
      weight_percent: cat.weight_percent,
      average_percent: avgPercent,
      entries: catEntries,
    };
  });

  // Project grade based on covered weight only
  const projected = weightCovered > 0 ? (weightedTotal / weightCovered) * 100 : 0;

  return {
    subject_id: categories[0].subject_id,
    weighted_percentage: projected,
    categories: categorySummaries,
  };
}

export function gradeLabel(percent: number): string {
  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
}
```

---

### Step 4 — Page Route

Create file: `src/app/dashboard/grades/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GradesClient from "./GradesClient";

export default async function GradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, color")
    .eq("user_id", user.id)
    .order("name");

  const { data: categories } = await supabase
    .from("grade_categories")
    .select("*")
    .eq("user_id", user.id);

  const { data: entries } = await supabase
    .from("grade_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("date_taken", { ascending: false });

  return (
    <GradesClient
      subjects={subjects ?? []}
      initialCategories={categories ?? []}
      initialEntries={entries ?? []}
    />
  );
}
```

---

### Step 5 — Server Actions

Create file: `src/app/dashboard/grades/actions.ts`

```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addGradeCategory(formData: {
  subject_id: string;
  name: string;
  weight_percent: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("grade_categories").insert({
    ...formData,
    user_id: user.id,
  });
  if (error) throw error;
  revalidatePath("/dashboard/grades");
}

export async function addGradeEntry(formData: {
  category_id: string;
  subject_id: string;
  title: string;
  marks_obtained: number;
  marks_total: number;
  date_taken?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("grade_entries").insert({
    ...formData,
    user_id: user.id,
  });
  if (error) throw error;
  revalidatePath("/dashboard/grades");
}

export async function deleteGradeEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("grade_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/dashboard/grades");
}
```

---

### Step 6 — Add to Dashboard Nav

In your nav config (wherever you define sidebar/nav items), add:

```typescript
{ href: "/dashboard/grades", label: "Grades", icon: "GraduationCap" }
```

---

---

## FEATURE 2 — Weekly Timetable View

### Goal
Render a visual Mon–Sun timetable grid showing each subject's class schedule. Data is already stored in `subjects.schedule_days` — just visualize it.

---

### Step 1 — No Migration Needed
`schedule_days TEXT[]` already exists on `public.subjects`. Optionally add a `class_time TEXT` column if you want to show time slots.

```sql
-- Optional: add class time per subject
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS class_time TEXT;   -- e.g. "09:00 AM"
```

---

### Step 2 — Timetable Utility

Create file: `src/lib/timetableUtils.ts`

```typescript
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Day = typeof DAYS[number];

export interface SubjectSlot {
  id: string;
  name: string;
  color: string;
  class_time?: string;
}

export function buildTimetableGrid(
  subjects: { id: string; name: string; color: string; schedule_days: string[]; class_time?: string }[]
): Record<Day, SubjectSlot[]> {
  const grid = Object.fromEntries(DAYS.map((d) => [d, []])) as Record<Day, SubjectSlot[]>;

  for (const subject of subjects) {
    for (const day of subject.schedule_days ?? []) {
      const normalized = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
      if (DAYS.includes(normalized as Day)) {
        grid[normalized as Day].push({
          id: subject.id,
          name: subject.name,
          color: subject.color,
          class_time: subject.class_time,
        });
      }
    }
  }

  return grid;
}

export function getTodayName(): Day {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}
```

---

### Step 3 — Timetable Component

Create file: `src/components/timetable/TimetableGrid.tsx`

```typescript
"use client";
import { DAYS, type Day, type SubjectSlot, getTodayName } from "@/lib/timetableUtils";

interface Props {
  grid: Record<Day, SubjectSlot[]>;
}

export default function TimetableGrid({ grid }: Props) {
  const today = getTodayName();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 w-full">
      {DAYS.map((day) => {
        const isToday = day === today;
        const slots = grid[day];

        return (
          <div
            key={day}
            className={`rounded-xl border p-3 flex flex-col gap-2 min-h-[120px] transition-all
              ${isToday
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"}`}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wide
                ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                {day.slice(0, 3)}
              </span>
              {isToday && (
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            {/* Subject Slots */}
            {slots.length === 0 ? (
              <span className="text-[11px] text-gray-300 dark:text-gray-600 italic mt-auto">
                No class
              </span>
            ) : (
              slots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-lg px-2 py-1.5 text-white text-xs font-medium truncate"
                  style={{ backgroundColor: slot.color }}
                  title={slot.name}
                >
                  {slot.class_time && (
                    <div className="text-[10px] opacity-80 mb-0.5">{slot.class_time}</div>
                  )}
                  {slot.name}
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

### Step 4 — Timetable Page

Create file: `src/app/dashboard/timetable/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { buildTimetableGrid } from "@/lib/timetableUtils";
import TimetableGrid from "@/components/timetable/TimetableGrid";

export default async function TimetablePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, color, schedule_days, class_time")
    .eq("user_id", user.id);

  const grid = buildTimetableGrid(subjects ?? []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Weekly Timetable
      </h1>
      <TimetableGrid grid={grid} />
    </div>
  );
}
```

---

### Step 5 — Add Nav Entry

```typescript
{ href: "/dashboard/timetable", label: "Timetable", icon: "CalendarDays" }
```

---

---

## FEATURE 3 — Deadline Reminders / Alerts

### Goal
Browser push notifications for: tasks due within 24h, attendance dropping below threshold, upcoming exams. No external service needed — uses Web Push API + Supabase Edge Functions.

---

### Step 1 — Database Migration

Create file: `supabase/migrations/20260603002_reminders.sql`

```sql
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_due', 'attendance_low', 'exam', 'custom')),
  title TEXT NOT NULL,
  body TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  related_id UUID,                    -- task_id, subject_id, or grade_entry_id
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_reminders_remind_at ON public.reminders(remind_at)
  WHERE is_sent = false;

-- Store push subscriptions per user
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push_subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

### Step 2 — Browser Push Registration

Create file: `src/lib/pushNotifications.ts`

```typescript
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const subscription = existing ?? await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const { endpoint, keys } = subscription.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  // Save to Supabase
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth_key: keys.auth }),
  });

  return res.ok;
}
```

---

### Step 3 — Service Worker

Create file: `public/sw.js`

```javascript
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, body, icon } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon ?? "/icon-192.png",
      badge: "/badge-72.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/dashboard"));
});
```

---

### Step 4 — Register Service Worker

Add to `src/app/layout.tsx` (inside a `"use client"` component or `useEffect`):

```typescript
useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }
}, []);
```

---

### Step 5 — In-App Alert Banner (No Push Required)

For immediate in-app alerts without any push setup, add this component.

Create file: `src/components/reminders/DueSoonBanner.tsx`

```typescript
"use client";
import { useEffect, useState } from "react";

interface Task {
  id: string;
  title: string;
  due_date: string;
}

interface Props {
  tasks: Task[];
  attendanceLowSubjects: string[];   // subject names below threshold
}

export default function DueSoonBanner({ tasks, attendanceLowSubjects }: Props) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const now = new Date();
  const dueSoon = tasks.filter((t) => {
    const due = new Date(t.due_date);
    const hours = (due.getTime() - now.getTime()) / 3_600_000;
    return hours > 0 && hours <= 24 && !dismissed.includes(t.id);
  });

  const lowAttendance = attendanceLowSubjects.filter(
    (s) => !dismissed.includes(`att_${s}`)
  );

  if (!dueSoon.length && !lowAttendance.length) return null;

  return (
    <div className="space-y-2 mb-4">
      {dueSoon.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/40
                     border border-amber-300 dark:border-amber-700 px-4 py-2.5 text-sm"
        >
          <span className="text-amber-800 dark:text-amber-300">
            ⏰ <strong>{t.title}</strong> is due within 24 hours
          </span>
          <button
            onClick={() => setDismissed((d) => [...d, t.id])}
            className="text-amber-500 hover:text-amber-700 ml-4 text-xs"
          >
            Dismiss
          </button>
        </div>
      ))}
      {lowAttendance.map((name) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-950/40
                     border border-red-300 dark:border-red-700 px-4 py-2.5 text-sm"
        >
          <span className="text-red-800 dark:text-red-300">
            ⚠️ Attendance in <strong>{name}</strong> is below your threshold
          </span>
          <button
            onClick={() => setDismissed((d) => [...d, `att_${name}`])}
            className="text-red-400 hover:text-red-600 ml-4 text-xs"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

### Step 6 — Add to Dashboard

In your main dashboard server component, fetch tasks due within 24h and low-attendance subjects, then pass to `DueSoonBanner`.

```typescript
// In your dashboard page.tsx
const in24h = new Date(Date.now() + 86_400_000).toISOString();

const { data: dueTasks } = await supabase
  .from("tasks")
  .select("id, title, due_date")
  .eq("user_id", user.id)
  .lte("due_date", in24h)
  .gte("due_date", new Date().toISOString())
  .neq("status", "done");
```

---

---

## FEATURE 4 — Resource Links per Subject

### Goal
Attach links (Google Drive, YouTube, external) to each subject. Minimal UI, zero-friction.

---

### Step 1 — Database Migration

Create file: `supabase/migrations/20260603003_resource_links.sql`

```sql
CREATE TABLE public.resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'link'
    CHECK (type IN ('link', 'gdrive', 'youtube', 'pdf', 'notes', 'other')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own resource_links"
  ON public.resource_links FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_resource_links_subject ON public.resource_links(subject_id);
```

---

### Step 2 — TypeScript Types

Add to `src/types/resources.ts`

```typescript
export type ResourceType = "link" | "gdrive" | "youtube" | "pdf" | "notes" | "other";

export interface ResourceLink {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  url: string;
  type: ResourceType;
  created_at: string;
}
```

---

### Step 3 — Auto-Detect Resource Type Utility

Create file: `src/lib/resourceUtils.ts`

```typescript
import type { ResourceType } from "@/types/resources";

export function detectResourceType(url: string): ResourceType {
  if (url.includes("drive.google.com")) return "gdrive";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes(".pdf")) return "pdf";
  if (url.includes("notion.so") || url.includes("obsidian")) return "notes";
  return "link";
}

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  gdrive:  "🗂️",
  youtube: "▶️",
  pdf:     "📄",
  notes:   "📝",
  link:    "🔗",
  other:   "📎",
};
```

---

### Step 4 — Server Actions

Create file: `src/app/dashboard/resources/actions.ts`

```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { detectResourceType } from "@/lib/resourceUtils";

export async function addResourceLink(formData: {
  subject_id: string;
  title: string;
  url: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const type = detectResourceType(formData.url);

  const { error } = await supabase.from("resource_links").insert({
    ...formData,
    type,
    user_id: user.id,
  });
  if (error) throw error;
  revalidatePath("/dashboard/resources");
}

export async function deleteResourceLink(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("resource_links")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/dashboard/resources");
}
```

---

### Step 5 — Resource Card Component

Create file: `src/components/resources/ResourceCard.tsx`

```typescript
"use client";
import { RESOURCE_ICONS } from "@/lib/resourceUtils";
import type { ResourceLink } from "@/types/resources";
import { deleteResourceLink } from "@/app/dashboard/resources/actions";

interface Props {
  resource: ResourceLink;
}

export default function ResourceCard({ resource }: Props) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-gray-200
                    dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 hover:shadow-sm
                    transition-all">
      <span className="text-xl shrink-0">{RESOURCE_ICONS[resource.type]}</span>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0"
      >
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
          {resource.title}
        </p>
        <p className="text-xs text-gray-400 truncate">{resource.url}</p>
      </a>
      <button
        onClick={() => deleteResourceLink(resource.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600
                   text-xs transition-opacity shrink-0"
        aria-label="Delete"
      >
        ✕
      </button>
    </div>
  );
}
```

---

### Step 6 — Resources Page

Create file: `src/app/dashboard/resources/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResourcesClient from "./ResourcesClient";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, color")
    .eq("user_id", user.id)
    .order("name");

  const { data: resources } = await supabase
    .from("resource_links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <ResourcesClient
      subjects={subjects ?? []}
      initialResources={resources ?? []}
    />
  );
}
```

---

### Step 7 — Add Nav Entry

```typescript
{ href: "/dashboard/resources", label: "Resources", icon: "BookOpen" }
```

---

---

## Integration Checklist

Run these in order after creating each migration file:

```bash
# Apply migrations to remote Supabase
npx supabase db push

# Or run individual SQL files manually in Supabase SQL editor
# supabase/migrations/20260603001_grade_tracker.sql
# supabase/migrations/20260603002_reminders.sql
# supabase/migrations/20260603003_resource_links.sql
```

After all 4 features are added, run:

```bash
npm run build && npm run deploy
```

---

## Environment Variables to Add

```env
# For Feature 3 — Push Notifications (generate with web-push library)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your@email.com
```

Generate VAPID keys with:

```bash
npx web-push generate-vapid-keys
```

---

## File Summary

| File | Purpose |
|------|---------|
| `supabase/migrations/20260603001_grade_tracker.sql` | Tables for grade categories + entries |
| `supabase/migrations/20260603002_reminders.sql` | Reminders + push subscription tables |
| `supabase/migrations/20260603003_resource_links.sql` | Resource links table |
| `src/types/grades.ts` | Grade TypeScript types |
| `src/types/resources.ts` | Resource TypeScript types |
| `src/lib/gradeUtils.ts` | Weighted grade calculation logic |
| `src/lib/timetableUtils.ts` | Timetable grid builder |
| `src/lib/resourceUtils.ts` | URL type detection + icons |
| `src/lib/pushNotifications.ts` | Browser push subscription handler |
| `public/sw.js` | Service worker for push notifications |
| `src/components/timetable/TimetableGrid.tsx` | Timetable UI grid |
| `src/components/reminders/DueSoonBanner.tsx` | In-app alert banners |
| `src/components/resources/ResourceCard.tsx` | Resource link card |
| `src/app/dashboard/grades/page.tsx` | Grades page (server) |
| `src/app/dashboard/grades/actions.ts` | Grade server actions |
| `src/app/dashboard/timetable/page.tsx` | Timetable page |
| `src/app/dashboard/resources/page.tsx` | Resources page (server) |
| `src/app/dashboard/resources/actions.ts` | Resource server actions |
