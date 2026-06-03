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
