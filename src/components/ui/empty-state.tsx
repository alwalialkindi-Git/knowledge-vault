import * as React from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  tone = "muted",
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  tone?: "muted" | "primary";
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <span
        className={
          tone === "primary"
            ? "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            : "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
      >
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-medium">{title}</h2>
      {body && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
