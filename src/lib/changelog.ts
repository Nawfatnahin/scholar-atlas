export type ChangeType = 'NEW' | 'IMPROVED' | 'FIXED' | 'REMOVED';

export interface ChangeEntry {
  type: ChangeType;
  description: string;
}

export interface VersionEntry {
  version: string;
  date: string;        // ISO format: "YYYY-MM-DD"
  summary: string;     // one-line description of this release
  changes: ChangeEntry[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: "1.0.0",
    date: "2026-05-24",
    summary: "Initial public release of Scholar Atlas",
    changes: [
      { type: "NEW", description: "Attendance Tracker with threshold warnings" },
      { type: "NEW", description: "Task Management Kanban board" },
      { type: "NEW", description: "CGPA Manager with target forecasting" },
      { type: "NEW", description: "PDF Tools: merge, split, convert" },
      { type: "NEW", description: "Semester Progress Widget on dashboard" },
      { type: "NEW", description: "About page with version history" },
      { type: "NEW", description: "Complete rebranding to Scholar Atlas" },
    ],
  },
  // Future versions are prepended above this line — newest first
];
