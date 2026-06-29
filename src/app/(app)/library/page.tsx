import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LibraryView } from "@/components/library/library-view";
import type { LearningDomain, Resource } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const supabase = createClient();

  const [resourcesRes, domainsRes] = await Promise.all([
    supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("learning_domains")
      .select("*")
      .eq("is_archived", false)
      .order("sort_order"),
  ]);

  return (
    <Suspense>
      <LibraryView
        resources={(resourcesRes.data as Resource[]) ?? []}
        domains={(domainsRes.data as LearningDomain[]) ?? []}
      />
    </Suspense>
  );
}
