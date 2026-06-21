import { createClient } from "@/lib/supabase/server";
import {
  DashboardView,
  type ContinueItem,
} from "@/components/dashboard/dashboard-view";
import { isoDate } from "@/lib/review";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const today = isoDate(new Date());

  const [totalRes, inProgressRes, completedRes, dueRes, continueRes] =
    await Promise.all([
      supabase.from("resources").select("id", { count: "exact", head: true }),
      supabase
        .from("resources")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress"),
      supabase
        .from("resources")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("review_cards")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .lte("next_review_at", today),
      supabase
        .from("resources")
        .select("id, title, completed_units, total_units")
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(6),
    ]);

  return (
    <DashboardView
      stats={{
        total: totalRes.count ?? 0,
        inProgress: inProgressRes.count ?? 0,
        completed: completedRes.count ?? 0,
        due: dueRes.count ?? 0,
      }}
      continueList={(continueRes.data as ContinueItem[]) ?? []}
    />
  );
}
