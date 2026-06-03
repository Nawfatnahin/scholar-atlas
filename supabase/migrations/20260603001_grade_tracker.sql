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
