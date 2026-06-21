"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import {
  RESOURCE_STATUSES,
  type ResourceStatus,
} from "@/lib/types";

export function StatusControl({
  resourceId,
  status,
  startedAt,
}: {
  resourceId: string;
  status: ResourceStatus;
  startedAt: string | null;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [current, setCurrent] = React.useState<ResourceStatus>(status);
  const [saving, setSaving] = React.useState(false);

  async function change(next: ResourceStatus) {
    if (next === current || saving) return;
    setSaving(true);
    setCurrent(next);

    const patch: Record<string, unknown> = { status: next };
    if (next === "in_progress" && !startedAt) {
      patch.started_at = new Date().toISOString();
    }
    if (next === "completed") {
      patch.completed_at = new Date().toISOString();
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("resources")
      .update(patch)
      .eq("id", resourceId);

    if (error) {
      setCurrent(status);
    } else {
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {RESOURCE_STATUSES.map((st) => (
        <button
          key={st}
          type="button"
          disabled={saving}
          onClick={() => change(st)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-60",
            current === st
              ? "border-primary bg-primary/10 text-primary"
              : "border-input hover:bg-accent",
          )}
        >
          {t(`enum.status.${st}`)}
        </button>
      ))}
    </div>
  );
}
