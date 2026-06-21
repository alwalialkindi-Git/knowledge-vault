"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";
import {
  focusAreaName,
  statusBadgeClasses,
  type FocusArea,
  type Resource,
} from "@/lib/types";

export function ResourceCard({
  resource,
  focusArea,
}: {
  resource: Resource;
  focusArea?: FocusArea;
}) {
  const { t, locale } = useTranslation();

  return (
    <Link
      href={`/library/${resource.id}`}
      className="group card-hover flex flex-col gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          dir="auto"
          className="font-medium leading-snug group-hover:text-primary"
        >
          {resource.title}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            statusBadgeClasses[resource.status],
          )}
        >
          {t(`enum.status.${resource.status}`)}
        </span>
      </div>

      {resource.author_or_creator && (
        <p dir="auto" className="text-sm text-muted-foreground">
          {resource.author_or_creator}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-md bg-muted px-2 py-0.5">
          {t(`enum.type.${resource.type}`)}
        </span>
        {focusArea && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: focusArea.color }}
            />
            {focusAreaName(focusArea, locale)}
          </span>
        )}
      </div>
    </Link>
  );
}
