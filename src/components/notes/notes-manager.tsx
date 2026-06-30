"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import { NoteContent } from "@/components/notes/note-content";
import { NoteEditor } from "@/components/notes/note-editor";
import { NOTE_TYPES, type Note, type NoteType } from "@/lib/types";
import { syncWikilinks, type WikilinkSync, type NoteConceptLink } from "@/lib/wikilinks";

const SECTION_TITLE: Record<NoteType, string> = {
  note: "notes.sectionNote",
  takeaway: "notes.sectionTakeaway",
  quote: "notes.sectionQuote",
  action_item: "notes.sectionAction",
};
const SECTION_ADD: Record<NoteType, string> = {
  note: "notes.addNote",
  takeaway: "notes.addTakeaway",
  quote: "notes.addQuote",
  action_item: "notes.addAction",
};

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

type ConceptEntry = { id: string; name: string };

export function NotesManager({
  resourceId,
  initialNotes,
  concepts,
  initialNoteConceptLinks,
  onConceptsUpdated,
}: {
  resourceId: string;
  initialNotes: Note[];
  concepts: ConceptEntry[];
  initialNoteConceptLinks: NoteConceptLink[];
  onConceptsUpdated?: (newConcepts: ConceptEntry[]) => void;
}) {
  const [notes, setNotes] = React.useState<Note[]>(initialNotes);

  const [noteConceptLinks, setNoteConceptLinks] = React.useState<
    Map<string, WikilinkSync[]>
  >(() => {
    const m = new Map<string, WikilinkSync[]>();
    for (const link of initialNoteConceptLinks) {
      const prev = m.get(link.noteId) ?? [];
      prev.push({
        linkId: link.linkId,
        conceptId: link.conceptId,
        conceptName: link.conceptName,
      });
      m.set(link.noteId, prev);
    }
    return m;
  });

  const conceptMap = React.useMemo<
    ReadonlyMap<string, { id: string; name: string }>
  >(() => {
    const m = new Map<string, { id: string; name: string }>();
    for (const c of concepts) {
      m.set(c.name.toLowerCase(), c);
    }
    return m;
  }, [concepts]);

  const upsert = (n: Note) =>
    setNotes((prev) => {
      const i = prev.findIndex((x) => x.id === n.id);
      if (i === -1) return [...prev, n];
      const copy = [...prev];
      copy[i] = n;
      return copy;
    });
  const removeLocal = (id: string) =>
    setNotes((prev) => prev.filter((x) => x.id !== id));

  async function addNote(type: NoteType, content: string, location: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        resource_id: resourceId,
        type,
        content,
        location: location || null,
      })
      .select("*")
      .single();

    if (error || !data) return false;
    upsert(data as Note);

    const knownIds = new Set(concepts.map((c) => c.id));
    const synced = await syncWikilinks({
      supabase,
      userId: user.id,
      entityType: "note",
      entityId: (data as Note).id,
      content,
    });
    setNoteConceptLinks((prev) => new Map(prev).set((data as Note).id, synced));
    const newOnes = synced
      .filter((s) => !knownIds.has(s.conceptId))
      .map((s) => ({ id: s.conceptId, name: s.conceptName }));
    if (newOnes.length > 0) onConceptsUpdated?.(newOnes);

    return true;
  }

  async function updateNote(id: string, content: string, location: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("notes")
      .update({ content, location: location || null })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) return false;
    upsert(data as Note);

    const knownIds = new Set(concepts.map((c) => c.id));
    const synced = await syncWikilinks({
      supabase,
      userId: user.id,
      entityType: "note",
      entityId: id,
      content,
    });
    setNoteConceptLinks((prev) => new Map(prev).set(id, synced));
    const newOnes = synced
      .filter((s) => !knownIds.has(s.conceptId))
      .map((s) => ({ id: s.conceptId, name: s.conceptName }));
    if (newOnes.length > 0) onConceptsUpdated?.(newOnes);

    return true;
  }

  async function deleteNote(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (!error) {
      removeLocal(id);
      setNoteConceptLinks((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function toggleReview(note: Note) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (!note.is_review_card) {
      const { error: cardError } = await supabase.from("review_cards").insert({
        user_id: user.id,
        note_id: note.id,
        interval_days: 1,
        next_review_at: todayISODate(),
        review_count: 0,
        status: "active",
        source: "manual",
      });
      if (cardError) return;
      const { data } = await supabase
        .from("notes")
        .update({ is_review_card: true })
        .eq("id", note.id)
        .select("*")
        .single();
      if (data) upsert(data as Note);
    } else {
      await supabase.from("review_cards").delete().eq("note_id", note.id);
      const { data } = await supabase
        .from("notes")
        .update({ is_review_card: false })
        .eq("id", note.id)
        .select("*")
        .single();
      if (data) upsert(data as Note);
    }
  }

  async function toggleDone(note: Note) {
    const done = !note.is_completed;
    const supabase = createClient();
    const { data } = await supabase
      .from("notes")
      .update({
        is_completed: done,
        completed_at: done ? new Date().toISOString() : null,
      })
      .eq("id", note.id)
      .select("*")
      .single();
    if (data) upsert(data as Note);
  }

  return (
    <div className="space-y-8">
      {NOTE_TYPES.map((type) => (
        <Section
          key={type}
          type={type}
          notes={notes
            .filter((n) => n.type === type)
            .sort((a, b) => a.created_at.localeCompare(b.created_at))}
          conceptMap={conceptMap}
          noteConceptLinks={noteConceptLinks}
          onAdd={addNote}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onToggleReview={toggleReview}
          onToggleDone={toggleDone}
        />
      ))}
    </div>
  );
}

function Section({
  type,
  notes,
  conceptMap,
  noteConceptLinks,
  onAdd,
  onUpdate,
  onDelete,
  onToggleReview,
  onToggleDone,
}: {
  type: NoteType;
  notes: Note[];
  conceptMap: ReadonlyMap<string, { id: string; name: string }>;
  noteConceptLinks: Map<string, WikilinkSync[]>;
  onAdd: (type: NoteType, content: string, location: string) => Promise<boolean>;
  onUpdate: (id: string, content: string, location: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  onToggleReview: (note: Note) => void;
  onToggleDone: (note: Note) => void;
}) {
  const { t } = useTranslation();
  const [adding, setAdding] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-medium">
          {t(SECTION_TITLE[type])}
          {notes.length > 0 && (
            <span className="ms-2 text-sm font-normal text-muted-foreground">
              {notes.length}
            </span>
          )}
        </h2>
        {!adding && (
          <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            {t(SECTION_ADD[type])}
          </Button>
        )}
      </div>

      {adding && (
        <NoteEditor
          saving={saving}
          onCancel={() => setAdding(false)}
          onSave={async (content, location) => {
            setSaving(true);
            const ok = await onAdd(type, content, location);
            setSaving(false);
            if (ok) setAdding(false);
          }}
        />
      )}

      {notes.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">{t("notes.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              conceptMap={conceptMap}
              conceptLinks={noteConceptLinks.get(note.id) ?? []}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleReview={onToggleReview}
              onToggleDone={onToggleDone}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function NoteItem({
  note,
  conceptMap,
  conceptLinks,
  onUpdate,
  onDelete,
  onToggleReview,
  onToggleDone,
}: {
  note: Note;
  conceptMap: ReadonlyMap<string, { id: string; name: string }>;
  conceptLinks: WikilinkSync[];
  onUpdate: (id: string, content: string, location: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  onToggleReview: (note: Note) => void;
  onToggleDone: (note: Note) => void;
}) {
  const { t, locale } = useTranslation();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(iso),
    );

  if (editing) {
    return (
      <li>
        <NoteEditor
          initialContent={note.content}
          initialLocation={note.location ?? ""}
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={async (content, location) => {
            setSaving(true);
            const ok = await onUpdate(note.id, content, location);
            setSaving(false);
            if (ok) setEditing(false);
          }}
        />
      </li>
    );
  }

  const isAction = note.type === "action_item";
  const isTakeaway = note.type === "takeaway";

  return (
    <li
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        isAction && note.is_completed && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <NoteContent content={note.content} conceptMap={conceptMap} />

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {note.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span dir="auto">{note.location}</span>
              </span>
            )}
            {isAction && (
              <>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium",
                    note.is_completed
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {note.is_completed
                    ? t("notes.statusDone")
                    : t("notes.statusOpen")}
                </span>
                <span>
                  {t("notes.created")}: {fmt(note.created_at)}
                </span>
                {note.is_completed && note.completed_at && (
                  <span>
                    {t("notes.doneOn")}: {fmt(note.completed_at)}
                  </span>
                )}
              </>
            )}
          </div>

          {conceptLinks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {conceptLinks.map((link) => (
                <Link
                  key={link.linkId}
                  href={`/concepts/${link.conceptId}`}
                  className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  {link.conceptName}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isTakeaway && (
            <button
              type="button"
              aria-label={
                note.is_review_card
                  ? t("notes.flaggedReview")
                  : t("notes.flagReview")
              }
              title={
                note.is_review_card
                  ? t("notes.flaggedReview")
                  : t("notes.flagReview")
              }
              onClick={() => onToggleReview(note)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent",
                note.is_review_card
                  ? "text-amber-500"
                  : "text-muted-foreground",
              )}
            >
              <Star
                className={cn("h-4 w-4", note.is_review_card && "fill-current")}
              />
            </button>
          )}
          {isAction && (
            <button
              type="button"
              aria-label={
                note.is_completed ? t("notes.reopen") : t("notes.markDone")
              }
              title={
                note.is_completed ? t("notes.reopen") : t("notes.markDone")
              }
              onClick={() => onToggleDone(note)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent",
                note.is_completed ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {note.is_completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </button>
          )}
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
              if (window.confirm(t("notes.deleteConfirm"))) onDelete(note.id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isTakeaway && note.is_review_card && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <Star className="h-3 w-3 fill-current" />
          {t("notes.flaggedReview")}
        </p>
      )}
    </li>
  );
}
