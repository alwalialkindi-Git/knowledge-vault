"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Archive, ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import type { LearningDomain } from "@/lib/types";

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function DomainsManager({
  initialDomains,
}: {
  initialDomains: LearningDomain[];
}) {
  const { t } = useTranslation();
  const [domains, setDomains] = React.useState<LearningDomain[]>(
    [...initialDomains].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [adding, setAdding] = React.useState(false);
  const [showArchived, setShowArchived] = React.useState(false);

  // Server-side fetch may return empty if the auth session isn't available
  // during SSR. Re-fetch on mount using the browser session which is always live.
  React.useEffect(() => {
    if (initialDomains.length > 0) return;
    const supabase = createClient();
    supabase
      .from("learning_domains")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDomains([...(data as LearningDomain[])].sort((a, b) => a.sort_order - b.sort_order));
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── helpers ──────────────────────────────────────────────────────────────

  const upsert = (domain: LearningDomain) =>
    setDomains((prev) => {
      const i = prev.findIndex((d) => d.id === domain.id);
      if (i === -1) return [...prev, domain].sort((a, b) => a.sort_order - b.sort_order);
      const copy = [...prev];
      copy[i] = domain;
      return copy;
    });

  const removeLocal = (id: string) =>
    setDomains((prev) => prev.filter((d) => d.id !== id));

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async function createDomain(fields: { name: string; color: string; icon: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const active = domains.filter((d) => !d.is_archived);
    const { data, error } = await supabase
      .from("learning_domains")
      .insert({
        user_id: user.id,
        name: fields.name.trim(),
        color: fields.color || null,
        icon: fields.icon.trim() || null,
        sort_order: active.length,
      })
      .select("*")
      .single();

    if (error || !data) return false;
    upsert(data as LearningDomain);
    return true;
  }

  async function updateDomain(
    id: string,
    fields: { name: string; color: string; icon: string },
  ) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("learning_domains")
      .update({
        name: fields.name.trim(),
        color: fields.color || null,
        icon: fields.icon.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return false;
    upsert(data as LearningDomain);
    return true;
  }

  async function setArchived(id: string, archived: boolean) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("learning_domains")
      .update({ is_archived: archived, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (!error && data) upsert(data as LearningDomain);
  }

  async function deleteDomain(id: string) {
    const supabase = createClient();

    // Block deletion if any resources use this domain
    const { count } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("learning_domain_id", id);

    if (count && count > 0) {
      return t("domains.deleteBlocked");
    }

    const { error } = await supabase
      .from("learning_domains")
      .delete()
      .eq("id", id);

    if (!error) removeLocal(id);
    return null;
  }

  async function moveDomain(index: number, direction: "up" | "down") {
    const active = domains.filter((d) => !d.is_archived);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= active.length) return;

    const a = active[index];
    const b = active[targetIndex];
    const supabase = createClient();

    const [r1, r2] = await Promise.all([
      supabase
        .from("learning_domains")
        .update({ sort_order: b.sort_order, updated_at: new Date().toISOString() })
        .eq("id", a.id)
        .select("*")
        .single(),
      supabase
        .from("learning_domains")
        .update({ sort_order: a.sort_order, updated_at: new Date().toISOString() })
        .eq("id", b.id)
        .select("*")
        .single(),
    ]);

    if (r1.data && r2.data) {
      setDomains((prev) =>
        prev
          .map((d) => {
            if (d.id === a.id) return r1.data as LearningDomain;
            if (d.id === b.id) return r2.data as LearningDomain;
            return d;
          })
          .sort((x, y) => x.sort_order - y.sort_order),
      );
    }
  }

  // ── derived lists ─────────────────────────────────────────────────────────

  const active = domains.filter((d) => !d.is_archived);
  const archived = domains.filter((d) => d.is_archived);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Add form */}
      {adding ? (
        <DomainForm
          onSave={async (fields) => {
            const ok = await createDomain(fields);
            if (ok) setAdding(false);
          }}
          onCancel={() => setAdding(false)}
          submitLabel={t("domains.create")}
        />
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          {t("domains.addDomain")}
        </Button>
      )}

      {/* Active domains */}
      {active.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">{t("domains.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {active.map((domain, index) => (
            <DomainRow
              key={domain.id}
              domain={domain}
              index={index}
              total={active.length}
              onUpdate={updateDomain}
              onArchive={() => setArchived(domain.id, true)}
              onDelete={deleteDomain}
              onMove={moveDomain}
            />
          ))}
        </ul>
      )}

      {/* Archived section */}
      {archived.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {t("domains.archivedSection")} ({archived.length}){" "}
            {showArchived ? "▲" : "▼"}
          </button>
          {showArchived && (
            <ul className="space-y-2">
              {archived.map((domain) => (
                <DomainRow
                  key={domain.id}
                  domain={domain}
                  index={0}
                  total={1}
                  onUpdate={updateDomain}
                  onArchive={() => setArchived(domain.id, false)}
                  onDelete={deleteDomain}
                  onMove={() => {}}
                  isArchived
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Domain row ────────────────────────────────────────────────────────────────

function DomainRow({
  domain,
  index,
  total,
  onUpdate,
  onArchive,
  onDelete,
  onMove,
  isArchived = false,
}: {
  domain: LearningDomain;
  index: number;
  total: number;
  onUpdate: (id: string, fields: { name: string; color: string; icon: string }) => Promise<boolean>;
  onArchive: () => void;
  onDelete: (id: string) => Promise<string | null>;
  onMove: (index: number, direction: "up" | "down") => void;
  isArchived?: boolean;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(t("domains.deleteConfirm"))) return;
    const err = await onDelete(domain.id);
    if (err) setDeleteError(err);
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-border bg-card p-3">
        <DomainForm
          initial={domain}
          onSave={async (fields) => {
            const ok = await onUpdate(domain.id, fields);
            if (ok) setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          submitLabel={t("domains.save")}
        />
      </li>
    );
  }

  return (
    <li className={cn(
      "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
      isArchived && "opacity-60",
    )}>
      {/* Color / icon swatch */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base">
        {domain.icon ? (
          domain.icon
        ) : domain.color ? (
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: domain.color }}
          />
        ) : (
          <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
        )}
      </span>

      {/* Name */}
      <span dir="auto" className="flex-1 text-sm font-medium">
        {domain.name}
      </span>

      {/* Error */}
      {deleteError && (
        <span className="text-xs text-destructive">{deleteError}</span>
      )}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        {!isArchived && (
          <>
            <IconButton
              title={t("domains.moveUp")}
              disabled={index === 0}
              onClick={() => onMove(index, "up")}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              title={t("domains.moveDown")}
              disabled={index === total - 1}
              onClick={() => onMove(index, "down")}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </IconButton>
          </>
        )}
        <IconButton title={t("domains.edit")} onClick={() => { setEditing(true); setDeleteError(null); }}>
          <Pencil className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton
          title={isArchived ? t("domains.unarchive") : t("domains.archive")}
          onClick={onArchive}
        >
          {isArchived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
        </IconButton>
        <IconButton
          title={t("domains.delete")}
          onClick={handleDelete}
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </li>
  );
}

// ── Domain form (create / edit) ───────────────────────────────────────────────

function DomainForm({
  initial,
  onSave,
  onCancel,
  submitLabel,
}: {
  initial?: LearningDomain;
  onSave: (fields: { name: string; color: string; icon: string }) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const { t } = useTranslation();
  const [name, setName] = React.useState(initial?.name ?? "");
  const [color, setColor] = React.useState(initial?.color ?? "#6366f1");
  const [icon, setIcon] = React.useState(initial?.icon ?? "");
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name, color, icon });
    setSaving(false);
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t("domains.name")}
          </label>
          <input
            type="text"
            dir="auto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("domains.name")}
            className={fieldClass}
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("domains.icon")}
          </label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📚"
            maxLength={4}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("domains.color")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
            />
            <span className="font-mono text-xs text-muted-foreground">{color}</span>
          </div>
        </div>

        <div className="flex items-end gap-2 pb-0.5">
          <Button
            type="button"
            size="sm"
            disabled={!name.trim() || saving}
            onClick={handleSave}
          >
            {saving ? t("common.saving") : submitLabel}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Icon button helper ────────────────────────────────────────────────────────

function IconButton({
  title,
  onClick,
  disabled,
  className,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
        className,
      )}
    >
      {children}
    </button>
  );
}
