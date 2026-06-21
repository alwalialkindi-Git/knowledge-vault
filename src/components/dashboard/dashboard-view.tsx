"use client";

import Link from "next/link";
import { ArrowRight, BookMarked, CheckCircle2, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/language-provider";

export type DashboardStats = {
  total: number;
  inProgress: number;
  completed: number;
  due: number;
};

export type ContinueItem = {
  id: string;
  title: string;
  completed_units: number | null;
  total_units: number | null;
};

export function DashboardView({
  stats,
  continueList,
}: {
  stats: DashboardStats;
  continueList: ContinueItem[];
}) {
  const { t } = useTranslation();

  const dueText =
    stats.due === 1
      ? t("dashboard.dueCountOne")
      : t("dashboard.dueCountOther").replace("{n}", String(stats.due));

  const statItems = [
    { key: "statTotal", value: stats.total, icon: Layers },
    { key: "statInProgress", value: stats.inProgress, icon: Loader2 },
    { key: "statCompleted", value: stats.completed, icon: CheckCircle2 },
    { key: "statDue", value: stats.due, icon: BookMarked },
  ] as const;

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <h1 className="font-serif text-3xl font-medium">
        {t("dashboard.title")}
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map(({ key, value, icon: Icon }) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-xs">{t(`dashboard.${key}`)}</span>
            </div>
            <p className="mt-2 text-2xl font-medium tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("dashboard.dueToday")}
        </h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-medium">
            {stats.due > 0 ? dueText : t("dashboard.nothingDue")}
          </p>
          {stats.due > 0 && (
            <Button asChild>
              <Link href="/review">
                {t("dashboard.startReview")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-lg font-medium">
          {t("dashboard.continueLearning")}
        </h2>
        {continueList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.continueEmpty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {continueList.map((item) => {
              const pct =
                item.total_units && item.total_units > 0
                  ? Math.min(
                      100,
                      Math.round(
                        ((item.completed_units ?? 0) / item.total_units) * 100,
                      ),
                    )
                  : 0;
              return (
                <li key={item.id}>
                  <Link
                    href={`/library/${item.id}`}
                    className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span dir="auto" className="font-medium">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
