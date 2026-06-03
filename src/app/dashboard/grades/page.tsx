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
