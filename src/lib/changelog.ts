export type ChangeType = 'NEW' | 'IMPROVED' | 'FIXED' | 'REMOVED';

export interface Change {
  type: ChangeType;
  description: string;
}

export interface Release {
  version: string;
  date: string;
  changes: Change[];
}

export const RELEASES: Release[] = [
  {
    version: "1.0.0",
    date: "2026-05-24",
    changes: [
      { type: 'NEW', description: 'Semester Progress Widget on dashboard' },
      { type: 'NEW', description: 'Grade Breakdown per subject with what-if simulator' },
      { type: 'IMPROVED', description: 'Attendance tracker now shows skip budget' },
      { type: 'FIXED', description: 'PDF merge failing on large files' },
    ]
  }
];
