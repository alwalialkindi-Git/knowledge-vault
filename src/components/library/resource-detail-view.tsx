"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileQuestion,
  FileText,
  Play,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import { StatusControl } from "@/components/library/status-control";
import { ProgressControl } from "@/components/library/progress-control";
import { NotesManager } from "@/components/notes/notes-manager";
import { ItemsManager } from "@/components/items/items-manager";
import { RESOURCE_BUCKET, formatBytes } from "@/lib/storage";
import {
  type LearningDomain,
  type Note,
  type Resource,
  type ResourceItem,
} from "@/lib/types";

export function ResourceDetailView({
  resource,
  domain,
  pdfUrl,
  pdfDownloadUrl,
  notes,
  items,
}: {
  resource: Resource | null;
  domain: LearningDomain | null;
  pdfUrl: string | null;
  pdfDownloadUrl: string | null;
  notes: Note[];
  items: ResourceItem[];
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const [liveItems, setLiveItems] = React.useState<ResourceItem[]>(
    [...items].sort((a, b) => a.order_index - b.order_index),
  );
  const itemsDone = liveItems.filter((i) => i.is_completed).length;
  const itemsTotal = liveItems.length;

  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  async function handleDelete() {
    if (!resource) return;
    const msg = t("detail.deleteConfirm").replace("{title}", resource.title);
    if (!window.confirm(msg)) return;
    setDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    if (resource.file_key) {
      await supabase.storage.from(RESOURCE_BUCKET).remove([resource.file_key]);
    }
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resource.id);
    if (error) {
      setDeleteError(t("detail.deleteError"));
      setDeleting(false);
      return;
    }
    router.push("/library?deleted=1");
    router.refresh();
  }

  if (!resource) {
    return (
      <section className="mx-auto max-w-2xl">
        <Link
          href="/library"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("detail.back")}
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-medium">{t("detail.notFoundTitle")}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("detail.notFoundBody")}
          </p>
        </div>
      </section>
    );
  }

  const added = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(resource.created_at),
  );

  const nextItem = liveItems.find((i) => !i.is_completed) ?? null;
  const allItemsDone = itemsTotal > 0 && itemsDone === itemsTotal;

  function handleContinue() {
    if (!nextItem) return;
    if (nextItem.url) {
      window.open(nextItem.url, "_blank", "noreferrer");
    } else {
      document
        .getElementById(`item-${nextItem.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // When items exist, use live item count as the source of truth for display.
  const displayTotal = itemsTotal > 0 ? itemsTotal : resource.total_units;
  const unitText =
    displayTotal != null
      ? `${displayTotal}${
          resource.unit_label ? " " + t(`enum.unit.${resource.unit_label}`) : ""
        }`
      : null;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/library"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("detail.back")}
        </Link>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-0.5">
            {t(`enum.type.${resource.type}`)}
          </span>
          {domain && (
            <span className="inline-flex items-center gap-1.5">
              {domain.icon ? (
                <span>{domain.icon}</span>
              ) : domain.color ? (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: domain.color }}
                />
              ) : null}
              {domain.name}
            </span>
          )}
        </div>

        <h1 dir="auto" className="mt-2 font-serif text-3xl font-medium">
          {resource.title}
        </h1>
        {resource.author_or_creator && (
          <p dir="auto" className="mt-1 text-muted-foreground">
            {resource.author_or_creator}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("progress.title")}
        </h2>
        <ProgressControl
          resourceId={resource.id}
          completedUnits={resource.completed_units}
          totalUnits={resource.total_units}
          unitLabel={resource.unit_label}
          liveCompleted={itemsDone}
          liveTotal={itemsTotal}
        />
        {itemsTotal > 0 && (
          allItemsDone ? (
            <Button variant="outline" size="sm" disabled className="gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t("items.courseCompleted")}
            </Button>
          ) : (
            <Button size="sm" onClick={handleContinue} className="gap-2">
              <Play className="h-4 w-4" />
              {t("items.continueLearning")}
            </Button>
          )
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("detail.status")}
        </h2>
        <StatusControl
          resourceId={resource.id}
          status={resource.status}
          startedAt={resource.started_at}
        />
      </div>

      {resource.file_key && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("detail.pdf")}
          </h2>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span dir="auto" className="truncate font-medium">
                {resource.file_name ?? "document.pdf"}
              </span>
              {resource.file_size != null && (
                <span className="shrink-0 text-muted-foreground">
                  {formatBytes(resource.file_size)}
                </span>
              )}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              {pdfUrl && (
                <Button asChild size="sm">
                  <a href={pdfUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {t("detail.openPdf")}
                  </a>
                </Button>
              )}
              {pdfDownloadUrl && (
                <Button asChild size="sm" variant="outline">
                  <a href={pdfDownloadUrl}>
                    <Download className="h-4 w-4" />
                    {t("detail.downloadPdf")}
                  </a>
                </Button>
              )}
              {!pdfUrl && !pdfDownloadUrl && (
                <p className="text-xs text-destructive">{t("detail.pdfError")}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("detail.details")}
        </h2>
        <dl className="divide-y divide-border rounded-lg border border-border bg-card">
          <Row label={t("detail.domain")}>
            {domain ? domain.name : t("detail.noDomain")}
          </Row>
          <Row label={t("detail.priority")}>
            {t(`enum.priority.${resource.priority}`)}
          </Row>
          {unitText && <Row label={t("detail.units")}>{unitText}</Row>}
          {resource.source_url && (
            <Row label={t("detail.source")}>
              <Button asChild variant="link" className="h-auto p-0">
                <a
                  href={resource.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5"
                  dir="ltr"
                >
                  {t("detail.openLink")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </Row>
          )}
          <Row label={t("detail.added")}>{added}</Row>
        </dl>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("items.title")}
        </h2>
        <ItemsManager
          resourceId={resource.id}
          initialItems={items}
          onItemsChange={setLiveItems}
        />
      </div>

      <div className="border-t border-border pt-8">
        <NotesManager resourceId={resource.id} initialNotes={notes} />
      </div>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <h2 className="text-sm font-medium text-destructive">
          {t("detail.dangerZone")}
        </h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("detail.deleteHint")}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? t("common.saving") : t("detail.deleteResource")}
          </Button>
        </div>
        {deleteError && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {deleteError}
          </p>
        )}
      </div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd dir="auto" className="text-end font-medium">
        {children}
      </dd>
    </div>
  );
}
