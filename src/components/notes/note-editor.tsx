"use client";

import * as React from "react";
import { Bold, Italic, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function NoteEditor({
  initialContent = "",
  initialLocation = "",
  saving = false,
  onSave,
  onCancel,
}: {
  initialContent?: string;
  initialLocation?: string;
  saving?: boolean;
  onSave: (content: string, location: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [content, setContent] = React.useState(initialContent);
  const [location, setLocation] = React.useState(initialLocation);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  function wrap(before: string, after: string = before) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const next =
      content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = end + before.length;
    });
  }

  function bullet() {
    const el = ref.current;
    if (!el) return;
    const pos = el.selectionStart;
    const lineStart = content.lastIndexOf("\n", pos - 1) + 1;
    const next = content.slice(0, lineStart) + "- " + content.slice(lineStart);
    setContent(next);
    requestAnimationFrame(() => el.focus());
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-background p-3">
      <div className="flex gap-1">
        <ToolbarButton label={t("notes.bold")} onClick={() => wrap("**")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label={t("notes.italic")} onClick={() => wrap("*")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label={t("notes.bullet")} onClick={bullet}>
          <List className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <textarea
        ref={ref}
        dir="auto"
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("notes.placeholder")}
        className={cn(fieldClass, "resize-y")}
      />

      <input
        type="text"
        dir="auto"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder={t("notes.location")}
        className={cn(fieldClass, "h-9")}
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!content.trim() || saving}
          onClick={() => onSave(content.trim(), location.trim())}
        >
          {saving ? t("common.saving") : t("notes.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t("notes.cancel")}
        </Button>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}
