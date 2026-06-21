import { createClient } from "@/lib/supabase/server";
import { LibraryView } from "@/components/library/library-view";
import type { FocusArea, Resource } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const supabase = createClient();

  const [resourcesRes, focusAreasRes] = await Promise.all([
    supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("focus_areas").select("*").order("sort_order"),
  ]);

  return (
    <LibraryView
      resources={(resourcesRes.data as Resource[]) ?? []}
      focusAreas={(focusAreasRes.data as FocusArea[]) ?? []}
    />
  );
}
