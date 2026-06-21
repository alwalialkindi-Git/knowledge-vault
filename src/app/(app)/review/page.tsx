import { createClient } from "@/lib/supabase/server";
import { ReviewSession } from "@/components/review/review-session";
import { isoDate } from "@/lib/review";
import type { DueCard } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const supabase = createClient();
  const today = isoDate(new Date());

  const { data } = await supabase
    .from("review_cards")
    .select(
      `id, interval_days, next_review_at, last_reviewed_at, review_count, status,
       note:notes!inner (
         id, content, location, type,
         resource:resources!inner (
           id, title,
           focus_area:focus_areas ( name_en, name_ar, color )
         )
       )`,
    )
    .eq("status", "active")
    .lte("next_review_at", today)
    .order("next_review_at", { ascending: true });

  return <ReviewSession cards={(data as unknown as DueCard[]) ?? []} />;
}
