import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResourcesClient from "./ResourcesClient";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, color")
    .eq("user_id", user.id)
    .order("name");

  const { data: resources } = await supabase
    .from("resource_links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <ResourcesClient
      subjects={subjects ?? []}
      initialResources={resources ?? []}
    />
  );
}
