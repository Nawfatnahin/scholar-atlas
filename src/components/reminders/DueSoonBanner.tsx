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
