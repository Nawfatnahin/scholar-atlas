"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { detectResourceType } from "@/lib/resourceUtils";

export async function addResourceLink(formData: {
  subject_id: string;
  title: string;
  url: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const type = detectResourceType(formData.url);

  const { error } = await supabase.from("resource_links").insert({
    ...formData,
    type,
    user_id: user.id,
  });
  if (error) throw error;
  revalidatePath("/dashboard/resources");
}

export async function deleteResourceLink(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("resource_links")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/dashboard/resources");
}
