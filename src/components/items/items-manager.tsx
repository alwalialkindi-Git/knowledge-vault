"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  ListPlus,
  Pencil,
  Plus,
  Trash2,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import { BulkItemEditor, ItemEditor } from "@/components/items/item-editor";
import { YouTubeImporter, type YouTubeVideo } from "@/components/items/youtube-importer";
import type { ResourceItem } from "@/lib/types";
import { syncWikilinks } from "@/lib/wikilinks";

type AddMode = "single" | "bulk" | "youtube" | null;

export function ItemsManager({
  resourceId,
  initialItems,
  concepts,
  onItemChange,
  onItemsChange,
  onConceptsUpdated,
}: {
  resourceId: string;
  initialItems: ResourceItem[];
  concepts: { id: string; name: string }[];
  onItemChange?: (done: number, total: number) => void;
  onItemsChange?: (items: ResourceItem[]) => void;
  onConceptsUpdated?: (newConcepts: { id: string; name: string }[]) => void;
}) {
  const { t } = useTranslation();
  const [items, setItems] = React.useState<ResourceItem[]>(
    [...initialItems].sort((a, b) => a.order_index - b.order_index),
  );

  React.useEffect(() => {
    onItemChange?.(items.filter((i) => i.is_completed).length, items.length);
    onItemsChange?.(items);
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps
  const [addMode, setAddMode] = React.useState<AddMode>(null);
  const [saving, setSaving] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{ imported: number; skipped: number } | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const upsert = (item: ResourceItem) =>
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === item.id);
      if (i === -1)
        return [...prev, item].sort((a, b) => a.order_index - b.order_index);
      const copy = [...prev];
      copy[i] = item;
      return copy;
    });

  const removeLocal = (id: string) =>
    setItems((prev) => prev.filter((x) => x.id !== id));

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async function addItem(fields: {
    title: string;
    item_type: string;
    url: string;
    description: string;
    estimated_minutes: number | null;
  }) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("resource_items")
      .insert({
        user_id: user.id,
        resource_id: resourceId,
        title: fields.title,
        item_type: fields.item_type,
        url: fields.url || null,
        description: fields.description || null,
        estimated_minutes: fields.estimated_minutes,
        order_index: items.length,
      })
      .select("*")
      .single();
    if (error || !data) return false;
    upsert(data as ResourceItem);

    const itemContent = [fields.title, fields.description].filter(Boolean).join(" ");
    const knownIds = new Set(concepts.map((c) => c.id));
    const synced = await syncWikilinks({
      supabase,
      userId: user.id,
      entityType: "resource_item",
      entityId: (data as ResourceItem).id,
      content: itemContent,
    });
    const newOnes = synced
      .filter((s) => !knownIds.has(s.conceptId))
      .map((s) => ({ id: s.conceptId, name: s.conceptName }));
    if (newOnes.length > 0) onConceptsUpdated?.(newOnes);

    return true;
  }

  async function addBulkItems(lines: string[], itemType: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const rows = lines.map((title, i) => ({
      user_id: user.id,
      resource_id: resourceId,
      title,
      item_type: itemType,
      order_index: items.length + i,
    }));

    const { data, error } = await supabase
      .from("resource_items")
      .insert(rows)
      .select("*");

    if (error || !data) return false;
    const sorted = (data as ResourceItem[]).sort(
      (a, b) => a.order_index - b.order_index,
    );
    setItems((prev) =>
      [...prev, ...sorted].sort((a, b) => a.order_index - b.order_index),
    );
    return true;
  }

  async function importYouTubeItems(videos: YouTubeVideo[]) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const existingUrls = new Set(items.map((i) => i.url).filter(Boolean));
    const newVideos = videos.filter((v) => !existingUrls.has(v.url));

    if (newVideos.length === 0) {
      setImportResult({ imported: 0, skipped: videos.length });
      return true;
    }

    const rows = newVideos.map((v, i) => ({
      user_id: user.id,
      resource_id: resourceId,
      title: v.title,
      item_type: "video",
      url: v.url,
      description: null,
      estimated_minutes: null,
      order_index: items.length + i,
    }));

    const { data, error } = await supabase
      .from("resource_items")
      .insert(rows)
      .select("*");

    if (error || !data) return false;

    const sorted = (data as ResourceItem[]).sort(
      (a, b) => a.order_index - b.order_index,
    );
    setItems((prev) =>
      [...prev, ...sorted].sort((a, b) => a.order_index - b.order_index),
    );
    setImportResult({ imported: newVideos.length, skipped: videos.length - newVideos.length });
    return true;
  }

  async function updateItem(
    id: string,
    fields: {
      title: string;
      item_type: string;
      url: string;
      description: string;
      estimated_minutes: number | null;
    },
  ) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("resource_items")
      .update({
        title: fields.title,
        item_type: fields.item_type,
        url: fields.url || null,
        description: fields.description || null,
        estimated_minutes: fields.estimated_minutes,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return false;
    upsert(data as ResourceItem);

    if (user) {
      const itemContent = [fields.title, fields.description].filter(Boolean).join(" ");
      const knownIds = new Set(concepts.map((c) => c.id));
      const synced = await syncWikilinks({
        supabase,
        userId: user.id,
        entityType: "resource_item",
        entityId: id,
        content: itemContent,
      });
      const newOnes = synced
        .filter((s) => !knownIds.has(s.conceptId))
        .map((s) => ({ id: s.conceptId, name: s.conceptName }));
      if (newOnes.length > 0) onConceptsUpdated?.(newOnes);
    }

    return true;
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("resource_items")
      .delete()
      .eq("id", id);
    if (!error) removeLocal(id);
  }

  async function toggleComplete(item: ResourceItem) {
    const done = !item.is_completed;
    const supabase = createClient();
    const { data } = await supabase
      .from("resource_items")
      .update({
        is_completed: done,
        completed_at: done ? new Date().toISOString() : null,
      })
      .eq("id", item.id)
      .select("*")
      .single();
    if (data) upsert(data as ResourceItem);
  }

  async function moveItem(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const a = items[index];
    const b = items[targetIndex];
    const supabase = createClient();

    const [r1, r2] = await Promise.all([
      supabase
        .from("resource_items")
        .update({ order_index: b.order_index })
        .eq("id", a.id)
        .select("*")
        .single(),
      supabase
        .from("resource_items")
        .update({ order_index: a.order_index })
        .eq("id", b.id)
        .select("*")
        .single(),
    ]);

    if (r1.data && r2.data) {
      // Re-sort after swap so the rendered list reflects the new order_index values
      setItems((prev) =>
        prev
          .map((item) => {
            if (item.id === a.id) return r1.data as ResourceItem;
            if (item.id === b.id) return r2.data as ResourceItem;
            return item;
          })
          .sort((x, y) => x.order_index - y.order_index),
      );
    }
  }

  // ── derived stats ─────────────────────────────────────────────────────────

  const total = items.length;
  const done = items.filter((i) => i.is_completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Progress bar — percentage omitted here; the circular widget above shows it */}
      {total > 0 && (
        <div className="space-y-1.5">
          <span className="text-sm text-muted-foreground">
            {t("items.progress")
              .replace("{done}", String(done))
              .replace("{total}", String(total))}
          </span>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      {addMode === null && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAddMode("single")}>
            <Plus className="h-4 w-4" />
            {t("items.addItem")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAddMode("bulk")}>
            <ListPlus className="h-4 w-4" />
            {t("items.bulkAdd")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAddMode("youtube"); setImportResult(null); }}>
            <Youtube className="h-4 w-4" />
            {t("items.ytButton")}
          </Button>
        </div>
      )}

      {/* Single add form */}
      {addMode === "single" && (
        <ItemEditor
          saving={saving}
          onCancel={() => setAddMode(null)}
          onSave={async (fields) => {
            setSaving(true);
            const ok = await addItem(fields);
            setSaving(false);
            if (ok) setAddMode(null);
          }}
        />
      )}

      {/* Bulk add form */}
      {addMode === "bulk" && (
        <BulkItemEditor
          saving={saving}
          onCancel={() => setAddMode(null)}
          onSave={async (lines, itemType) => {
            setSaving(true);
            const ok = await addBulkItems(lines, itemType);
            setSaving(false);
            if (ok) setAddMode(null);
          }}
        />
      )}

      {/* YouTube import form */}
      {addMode === "youtube" && (
        <YouTubeImporter
          saving={saving}
          onCancel={() => { setAddMode(null); setImportResult(null); }}
          onImport={async (videos) => {
            setSaving(true);
            const ok = await importYouTubeItems(videos);
            setSaving(false);
            if (ok) setAddMode(null);
          }}
        />
      )}

      {/* YouTube import success banner */}
      {importResult && addMode === null && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {importResult.imported === 0
            ? t("items.ytAllDuplicates")
            : importResult.skipped > 0
              ? t("items.ytSuccessPartial")
                  .replace("{imported}", String(importResult.imported))
                  .replace("{skipped}", String(importResult.skipped))
              : t("items.ytSuccess").replace("{n}", String(importResult.imported))}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && addMode === null && (
        <p className="text-sm text-muted-foreground">{t("items.empty")}</p>
      )}

      {/* Items list */}
      {total > 0 && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              index={index}
              total={total}
              onToggle={toggleComplete}
              onUpdate={updateItem}
              onDelete={deleteItem}
              onMove={moveItem}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({
  item,
  index,
  total,
  onToggle,
  onUpdate,
  onDelete,
  onMove,
}: {
  item: ResourceItem;
  index: number;
  total: number;
  onToggle: (item: ResourceItem) => void;
  onUpdate: (
    id: string,
    fields: {
      title: string;
      item_type: string;
      url: string;
      description: string;
      estimated_minutes: number | null;
    },
  ) => Promise<boolean>;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  if (editing) {
    return (
      <li>
        <ItemEditor
          initial={item}
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={async (fields) => {
            setSaving(true);
            const ok = await onUpdate(item.id, fields);
            setSaving(false);
            if (ok) setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li
      id={`item-${item.id}`}
      className={cn(
        "rounded-lg border border-border bg-card p-3",
        item.is_completed && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Completion toggle */}
        <button
          type="button"
          aria-label={item.is_completed ? t("items.reopen") : t("items.markDone")}
          title={item.is_completed ? t("items.reopen") : t("items.markDone")}
          onClick={() => onToggle(item)}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground",
            item.is_completed && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {item.is_completed ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <span
            dir="auto"
            title={item.title}
            className={cn(
              "block text-sm font-medium [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden",
              item.is_completed && "line-through text-muted-foreground",
            )}
          >
            {item.title}
          </span>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {t(`enum.itemType.${item.item_type}`)}
            </span>
            {item.estimated_minutes != null && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {item.estimated_minutes} {t("items.min")}
              </span>
            )}
          </div>

          {item.description && (
            <p dir="auto" className="mt-0.5 text-xs text-muted-foreground">
              {item.description}
            </p>
          )}

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              dir="ltr"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {item.url.includes("youtube") || item.url.includes("youtu.be")
                ? t("items.watchYouTube")
                : t("items.openLink")}
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={t("items.moveUp")}
            title={t("items.moveUp")}
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={t("items.moveDown")}
            title={t("items.moveDown")}
            onClick={() => onMove(index, "down")}
            disabled={index === total - 1}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={t("notes.edit")}
            title={t("notes.edit")}
            onClick={() => setEditing(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={t("notes.delete")}
            title={t("notes.delete")}
            onClick={() => {
              if (window.confirm(t("notes.deleteConfirm"))) onDelete(item.id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
