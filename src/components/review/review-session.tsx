"use client";

import * as React from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import { NoteContent } from "@/components/notes/note-content";
import { EmptyState } from "@/components/ui/empty-state";
import { addDays, isoDate, nextInterval } from "@/lib/review";
import type { DueCard } from "@/lib/types";

export function ReviewSession({ cards }: { cards: DueCard[] }) {
  const { t, locale } = useTranslation();
  const [index, setIndex] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  const total = cards.length;

  async function answer(remembered: boolean) {
    if (busy || index >= total) return;
    const card = cards[index];
    setBusy(true);

    const interval = remembered ? nextInterval(card.interval_days) : 1;
    const now = new Date();
    const patch = {
      interval_days: interval,
      last_reviewed_at: now.toISOString(),
      next_review_at: isoDate(addDays(now, interval)),
      review_count: card.review_count + 1,
    };

    const supabase = createClient();
    await supabase.from("review_cards").update(patch).eq("id", card.id);

    setIndex((i) => i + 1);
    setBusy(false);
  }

  if (total === 0 || index >= total) {
    return (
      <section className="mx-auto max-w-xl space-y-8">
        <h1 className="font-serif text-3xl font-medium">{t("review.title")}</h1>
        <EmptyState
          icon={PartyPopper}
          tone="primary"
          title={t("review.emptyTitle")}
          body={t("review.emptyBody")}
          action={
            <Button asChild variant="outline">
              <Link href="/">{t("nav.dashboard")}</Link>
            </Button>
          }
        />
      </section>
    );
  }

  const card = cards[index];
  const resource = card.note?.resource;
  const focus = resource?.focus_area;
  const focusName = focus
    ? locale === "ar"
      ? focus.name_ar
      : focus.name_en
    : null;

  const progress = t("review.progress")
    .replace("{i}", String(index + 1))
    .replace("{n}", String(total));

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-medium">{t("review.title")}</h1>
        <span className="text-sm text-muted-foreground tabular-nums">
          {progress}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {resource && (
            <span dir="auto" className="font-medium text-foreground">
              {resource.title}
            </span>
          )}
          {focusName && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: focus!.color }}
              />
              {focusName}
            </span>
          )}
        </div>

        <div className="mt-4 border-t border-border pt-4">
          {card.note && <NoteContent content={card.note.content} />}
          {card.note?.location && (
            <p dir="auto" className="mt-3 text-xs text-muted-foreground">
              {card.note.location}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          variant="outline"
          size="lg"
          disabled={busy}
          onClick={() => answer(false)}
        >
          <RotateCcw className="h-4 w-4" />
          {t("review.forgot")}
        </Button>
        <Button size="lg" disabled={busy} onClick={() => answer(true)}>
          <Check className="h-4 w-4" />
          {t("review.remembered")}
        </Button>
      </div>
    </section>
  );
}
