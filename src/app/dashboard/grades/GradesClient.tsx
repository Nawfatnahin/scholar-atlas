"use client";
import type { GradeCategory, GradeEntry } from "@/types/grades";

interface Props {
  subjects: { id: string; name: string; color: string }[];
  initialCategories: GradeCategory[];
  initialEntries: GradeEntry[];
}

export default function GradesClient({ subjects, initialCategories, initialEntries }: Props) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Grades Tracker</h1>
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
        <p className="text-gray-500">Grades dashboard coming soon. Use the server actions to add data.</p>
      </div>
    </div>
  );
}
