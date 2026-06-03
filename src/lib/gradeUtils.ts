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
