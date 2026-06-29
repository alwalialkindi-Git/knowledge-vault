"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";
import { ITEM_TYPES, type ResourceItem } from "@/lib/types";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// Single-item create/edit form
export function ItemEditor({
  initial,
  saving = false,
  onSave,
  onCancel,
}: {
  initial?: Partial<ResourceItem>;
  saving?: boolean;
  onSave: (fields: {
    title: string;
    item_type: string;
    url: string;
    description: string;
    estimated_minutes: number | null;
  }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [itemType, setItemType] = React.useState<string>(
    initial?.item_type ?? "chapter",
  );
  const [url, setUrl] = React.useState(initial?.url ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? "",
  );
  const [minutes, setMinutes] = React.useState<string>(
    initial?.estimated_minutes != null
      ? String(initial.estimated_minutes)
      : "",
  );

  const valid = title.trim().length > 0;

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("items.fieldTitle")}
          </label>
          <input
            type="text"
            dir="auto"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("items.fieldTitlePlaceholder")}
            className={cn(fieldClass, "h-9")}
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("items.fieldType")}
          </label>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className={cn(fieldClass, "h-9")}
          >
            {ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`enum.itemType.${type}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("items.fieldUrl")}
        </label>
        <input
          type="text"
          dir="ltr"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className={cn(fieldClass, "h-9")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("items.fieldMinutes")}
          </label>
          <input
            type="number"
            min="1"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="—"
            className={cn(fieldClass, "h-9")}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("items.fieldDescription")}
          </label>
          <input
            type="text"
            dir="auto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="—"
            className={cn(fieldClass, "h-9")}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!valid || saving}
          onClick={() =>
            onSave({
              title: title.trim(),
              item_type: itemType,
              url: url.trim(),
              description: description.trim(),
              estimated_minutes: minutes ? parseInt(minutes, 10) : null,
            })
          }
        >
          {saving ? t("common.saving") : t("common.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}

// Bulk-create form: each non-empty line becomes one item
export function BulkItemEditor({
  saving = false,
  onSave,
  onCancel,
}: {
  saving?: boolean;
  onSave: (lines: string[], itemType: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = React.useState("");
  const [itemType, setItemType] = React.useState<string>("chapter");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("items.fieldType")}
        </label>
        <select
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
          className={cn(fieldClass, "h-9 max-w-48")}
        >
          {ITEM_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`enum.itemType.${type}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("items.bulkPasteLabel")}
        </label>
        <textarea
          dir="auto"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("items.bulkPlaceholder")}
          className={cn(fieldClass, "resize-y")}
          autoFocus
        />
        {lines.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t("items.bulkCount").replace("{n}", String(lines.length))}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={lines.length === 0 || saving}
          onClick={() => onSave(lines, itemType)}
        >
          {saving
            ? t("common.saving")
            : t("items.bulkSave").replace("{n}", String(lines.length))}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
