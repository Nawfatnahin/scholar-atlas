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
