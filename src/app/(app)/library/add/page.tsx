import { createClient } from "@/lib/supabase/server";
import { AddResourceForm } from "@/components/library/add-resource-form";
import type { FocusArea } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AddResourcePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("focus_areas")
    .select("*")
    .order("sort_order");

  return <AddResourceForm focusAreas={(data as FocusArea[]) ?? []} />;
}
