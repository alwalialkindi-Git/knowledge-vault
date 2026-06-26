import { createClient } from "@/lib/supabase/server";
import { AddResourceForm } from "@/components/library/add-resource-form";
import type { LearningDomain } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AddResourcePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("learning_domains")
    .select("*")
    .eq("is_archived", false)
    .order("sort_order");

  return <AddResourceForm domains={(data as LearningDomain[]) ?? []} />;
}
