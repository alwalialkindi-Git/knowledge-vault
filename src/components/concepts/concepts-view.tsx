"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Network, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import type { Concept } from "@/lib/types";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function ConceptsView({ concepts: initial }: { concepts: Concept[] }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [concepts, setConcepts] = React.useState<Concept[]>(initial);
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));

  function resetForm() {
    setName("");
    setDescription("");
    setError(null);
    setAdding(false);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("concepts.nameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { data, error: dbError } = await supabase
      .from("concepts")
      .insert({
        user_id: user.id,
        name: trimmed,
        description: description.trim() || null,
      })
      .select("*")
      .single();

    setSaving(false);

    if (dbError) {
      // unique constraint violation → duplicate name
      setError(
        dbError.code === "23505"
          ? t("concepts.nameTaken")
          : t("concepts.saveError"),
      );
      return;
    }

    setConcepts((prev) => [data as Concept, ...prev]);
    resetForm();
    router.push(`/concepts/${data.id}`);
  }

  const count = concepts.length;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium">{t("concepts.title")}</h1>
          {count > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {count === 1
                ? t("concepts.countOne")
                : t("concepts.countOther").replace("{n}", String(count))}
            </p>
          )}
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            {t("concepts.new")}
          </Button>
        )}
      </div>

      {/* Create form */}
      {adding && (
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
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") resetForm();
              }}
              placeholder={t("concepts.namePlaceholder")}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("concepts.descriptionLabel")}
            </label>
            <textarea
              dir="auto"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("concepts.descriptionPlaceholder")}
              className={`${fieldClass} resize-none`}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={saving} onClick={handleCreate}>
              {saving ? t("common.saving") : t("concepts.create")}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {concepts.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Network className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-medium">{t("concepts.emptyTitle")}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("concepts.emptyBody")}
          </p>
        </div>
      )}

      {/* Concept list */}
      {concepts.length > 0 && (
        <ul className="space-y-2">
          {concepts.map((concept) => (
            <li key={concept.id}>
              <Link
                href={`/concepts/${concept.id}`}
                className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <span className="font-medium" dir="auto">
                  {concept.name}
                </span>
                {concept.description && (
                  <span
                    dir="auto"
                    className="line-clamp-2 text-sm text-muted-foreground"
                  >
                    {concept.description}
                  </span>
                )}
                <span className="mt-1 text-xs text-muted-foreground">
                  {fmt(concept.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
