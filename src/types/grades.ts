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
