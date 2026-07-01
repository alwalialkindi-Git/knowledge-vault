"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileQuestion,
  Link2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import { NoteContent } from "@/components/notes/note-content";
import type { Concept, Resource } from "@/lib/types";
import type {
  ResourceLinkRow,
  NoteLinkRow,
  ItemLinkRow,
} from "@/app/(app)/concepts/[id]/page";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// ── Resource type badge colours — matches library-view convention ─────────────
const TYPE_BADGE: Record<string, string> = {
  book: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  video: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  course: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  article: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  note: "bg-muted text-muted-foreground",
};

// ── Note type label map — keys match the NoteType union ──────────────────────
const NOTE_SECTION_KEY: Record<string, string> = {
  note: "notes.sectionNote",
  takeaway: "notes.sectionTakeaway",
  quote: "notes.sectionQuote",
  action_item: "notes.sectionAction",
};

// ── main component ────────────────────────────────────────────────────────────

export function ConceptDetailView({
  concept: initial,
  resourceLinks: initialResourceLinks,
  noteLinks,
  itemLinks,
  allResources,
  concepts,
}: {
  concept: Concept | null;
  resourceLinks: ResourceLinkRow[];
  noteLinks: NoteLinkRow[];
  itemLinks: ItemLinkRow[];
  allResources: Pick<Resource, "id" | "title" | "type">[];
  concepts: { id: string; name: string }[];
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  // ── not-found guard ───────────────────────────────────────────────────────

  if (!initial) {
    return (
      <section className="mx-auto max-w-2xl">
        <Link
          href="/concepts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("concepts.back")}
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-medium">{t("concepts.notFoundTitle")}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("concepts.notFoundBody")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <ConceptDetail
      concept={initial}
      resourceLinks={initialResourceLinks}
      noteLinks={noteLinks}
      itemLinks={itemLinks}
      allResources={allResources}
      concepts={concepts}
      t={t}
      locale={locale}
      router={router}
    />
  );
}

// ── inner stateful component (avoids early-return hook violations) ─────────────

function ConceptDetail({
  concept: initial,
  resourceLinks: initialResourceLinks,
  noteLinks,
  itemLinks,
  allResources,
  concepts,
  t,
  locale,
  router,
}: {
  concept: Concept;
  resourceLinks: ResourceLinkRow[];
  noteLinks: NoteLinkRow[];
  itemLinks: ItemLinkRow[];
  allResources: Pick<Resource, "id" | "title" | "type">[];
  concepts: { id: string; name: string }[];
  t: (key: string) => string;
  locale: string;
  router: ReturnType<typeof useRouter>;
}) {
  const conceptMap = React.useMemo<ReadonlyMap<string, { id: string; name: string }>>(() => {
    const m = new Map<string, { id: string; name: string }>();
    for (const c of concepts) m.set(c.name.toLowerCase(), c);
    return m;
  }, [concepts]);
  // ── concept meta state ────────────────────────────────────────────────────
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(initial.name);
  const [description, setDescription] = React.useState(initial.description ?? "");
  const [metaSaving, setMetaSaving] = React.useState(false);
  const [metaError, setMetaError] = React.useState<string | null>(null);

  // ── linked resources state ────────────────────────────────────────────────
  const [resourceLinks, setResourceLinks] =
    React.useState<ResourceLinkRow[]>(initialResourceLinks);
  const [selectedResourceId, setSelectedResourceId] = React.useState("");
  const [linking, setLinking] = React.useState(false);
  const [linkError, setLinkError] = React.useState<string | null>(null);

  // ── delete state ──────────────────────────────────────────────────────────
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));

  // ── available resources for the link dropdown (exclude already linked) ────
  const linkedResourceIds = new Set(resourceLinks.map((rl) => rl.resource.id));
  const availableResources = allResources.filter((r) => !linkedResourceIds.has(r.id));

  // ── handlers: concept meta ────────────────────────────────────────────────

  function cancelEdit() {
    setName(initial.name);
    setDescription(initial.description ?? "");
    setMetaError(null);
    setEditing(false);
  }

  async function saveMeta() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMetaError(t("concepts.nameRequired"));
      return;
    }
    setMetaSaving(true);
    setMetaError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("concepts")
      .update({
        name: trimmedName,
        description: description.trim() || null,
      })
      .eq("id", initial.id);
    setMetaSaving(false);
    if (error) {
      setMetaError(
        error.code === "23505" ? t("concepts.nameTaken") : t("concepts.saveError"),
      );
      return;
    }
    // reflect change locally and exit edit mode
    initial.name = trimmedName;
    initial.description = description.trim() || null;
    setEditing(false);
  }

  // ── handlers: delete concept ──────────────────────────────────────────────

  async function handleDelete() {
    const msg = t("concepts.deleteConfirm").replace("{name}", initial.name);
    if (!window.confirm(msg)) return;
    setDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("concepts")
      .delete()
      .eq("id", initial.id);
    if (error) {
      setDeleteError(t("concepts.deleteError"));
      setDeleting(false);
      return;
    }
    router.push("/concepts");
    router.refresh();
  }

  // ── handlers: resource linking ────────────────────────────────────────────

  async function handleLinkResource() {
    if (!selectedResourceId) return;
    setLinking(true);
    setLinkError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLinking(false);
      return;
    }

    const { data, error } = await supabase
      .from("concept_links")
      .insert({
        user_id: user.id,
        concept_id: initial.id,
        resource_id: selectedResourceId,
      })
      .select("id, resource:resources!resource_id(id, title, type, status, priority)")
      .single();

    setLinking(false);
    if (error) {
      setLinkError(t("concepts.saveError"));
      return;
    }
    setResourceLinks((prev) => [...prev, (data as unknown) as ResourceLinkRow]);
    setSelectedResourceId("");
  }

  async function handleUnlinkResource(linkId: string) {
    if (!window.confirm(t("concepts.unlinkConfirm"))) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("concept_links")
      .delete()
      .eq("id", linkId);
    if (!error) {
      setResourceLinks((prev) => prev.filter((rl) => rl.id !== linkId));
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      {/* Back link */}
      <Link
        href="/concepts"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("concepts.back")}
      </Link>

      {/* Concept name & description */}
      {editing ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("concepts.nameLabel")}
            </label>
            <input
              type="text"
              dir="auto"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("concepts.descriptionLabel")}
            </label>
            <textarea
              dir="auto"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("concepts.descriptionPlaceholder")}
              className={`${fieldClass} resize-none`}
            />
          </div>
          {metaError && <p className="text-xs text-destructive">{metaError}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={metaSaving} onClick={saveMeta}>
              {metaSaving ? t("common.saving") : t("common.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="group flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 dir="auto" className="font-serif text-3xl font-medium">
              {initial.name}
            </h1>
            {initial.description && (
              <p dir="auto" className="mt-1 text-muted-foreground">
                {initial.description}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {fmt(initial.created_at)}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            aria-label={t("notes.edit")}
            className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Linked Resources */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("concepts.linkedResources")}
        </h2>

        {/* Link picker */}
        {availableResources.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              dir="auto"
            >
              <option value="">{t("concepts.linkResourcePlaceholder")}</option>
              {availableResources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={!selectedResourceId || linking}
              onClick={handleLinkResource}
            >
              <Link2 className="h-4 w-4" />
              {t("concepts.linkAdd")}
            </Button>
          </div>
        )}
        {linkError && <p className="text-xs text-destructive">{linkError}</p>}

        {/* Linked resource cards */}
        {resourceLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("concepts.noLinkedResources")}
          </p>
        ) : (
          <ul className="space-y-2">
            {resourceLinks.map((rl) => (
              <li
                key={rl.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                    TYPE_BADGE[rl.resource.type] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {t(`enum.type.${rl.resource.type}`)}
                </span>
                <Link
                  href={`/library/${rl.resource.id}`}
                  dir="auto"
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                >
                  {rl.resource.title}
                </Link>
                <button
                  type="button"
                  aria-label={t("concepts.unlinkConfirm")}
                  onClick={() => handleUnlinkResource(rl.id)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Linked Notes */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("concepts.linkedNotes")}
        </h2>
        {noteLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("concepts.noLinkedNotes")}
          </p>
        ) : (
          <ul className="space-y-2">
            {noteLinks.map((nl) => (
              <li
                key={nl.id}
                className="rounded-lg border border-border bg-card p-3 text-sm"
              >
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {t(NOTE_SECTION_KEY[nl.note.type] ?? "notes.sectionNote")}
                  {nl.note.resource && (
                    <>
                      {" · "}
                      <Link
                        href={`/library/${nl.note.resource.id}`}
                        className="hover:underline"
                        dir="auto"
                      >
                        {nl.note.resource.title}
                      </Link>
                    </>
                  )}
                </p>
                <NoteContent
                  content={nl.note.content}
                  conceptMap={conceptMap}
                  className="line-clamp-3 text-muted-foreground"
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Linked Items */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("concepts.linkedItems")}
        </h2>
        {itemLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("concepts.noLinkedItems")}
          </p>
        ) : (
          <ul className="space-y-2">
            {itemLinks.map((il) => (
              <li
                key={il.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {t(`enum.itemType.${il.resource_item.item_type}`) ?? il.resource_item.item_type}
                </span>
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="truncate text-sm font-medium">
                    {il.resource_item.title}
                  </p>
                  {il.resource_item.resource && (
                    <Link
                      href={`/library/${il.resource_item.resource.id}`}
                      dir="auto"
                      className="truncate text-xs text-muted-foreground hover:underline"
                    >
                      {il.resource_item.resource.title}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <h2 className="text-sm font-medium text-destructive">
          {t("concepts.dangerZone")}
        </h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t("concepts.deleteHint")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? t("common.saving") : t("concepts.deleteConcept")}
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
