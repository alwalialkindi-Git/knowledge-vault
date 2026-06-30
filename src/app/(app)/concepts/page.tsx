import { createClient } from "@/lib/supabase/server";
import { ConceptsView } from "@/components/concepts/concepts-view";
import type { Concept } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConceptsPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("concepts")
    .select("*")
    .order("created_at", { ascending: false });

  return <ConceptsView concepts={(data as Concept[]) ?? []} />;
}
