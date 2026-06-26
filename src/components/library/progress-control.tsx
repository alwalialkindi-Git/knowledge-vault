"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import type { UnitLabel } from "@/lib/types";

const fieldClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function ProgressControl({
  resourceId,
  completedUnits,
  totalUnits,
  unitLabel,
  liveCompleted,
  liveTotal,
}: {
  resourceId: string;
  completedUnits: number;
  totalUnits: number | null;
  unitLabel: UnitLabel | null;
  liveCompleted?: number;
  liveTotal?: number;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [completed, setCompleted] = React.useState(String(completedUnits ?? 0));
  const [total, setTotal] = React.useState(
    totalUnits != null ? String(totalUnits) : "",
  );
  const [saving, setSaving] = React.useState(false);

  const completedNum = Math.max(0, Number(completed) || 0);
  const totalNum = total === "" ? null : Math.max(0, Number(total) || 0);

  // When items are present, the circle and text reflect live item completion.
  // The manual inputs remain unchanged for the "Save Progress" workflow.
  const displayCompleted = liveTotal != null && liveTotal > 0 ? liveCompleted! : completedNum;
  const displayTotal = liveTotal != null && liveTotal > 0 ? liveTotal : (totalNum ?? 0);
  const pct =
    displayTotal > 0
      ? Math.min(100, Math.round((displayCompleted / displayTotal) * 100))
      : 0;

  const dirty =
    completedNum !== (completedUnits ?? 0) ||
    (totalNum ?? null) !== (totalUnits ?? null);

  const unit = unitLabel ? t(`enum.unit.${unitLabel}`) : "";

  const R = 42;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    const clampedCompleted =
      totalNum && totalNum > 0 ? Math.min(completedNum, totalNum) : completedNum;

    const supabase = createClient();
    const { error } = await supabase
      .from("resources")
      .update({
        completed_units: clampedCompleted,
        total_units: totalNum,
      })
      .eq("id", resourceId);

    if (!error) router.refresh();
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-28 w-28 shrink-0 sm:mx-0">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-medium tabular-nums">{pct}%</span>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">{t("progress.completed")}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={completed}
              onChange={(e) => setCompleted(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">{t("progress.total")}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground tabular-nums">
            {displayCompleted} {t("progress.of")} {displayTotal || "—"} {unit}
          </p>
          <Button size="sm" onClick={save} disabled={!dirty || saving}>
            {saving ? t("common.saving") : t("progress.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
