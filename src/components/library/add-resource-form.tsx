"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import {
  MAX_PDF_BYTES,
  RESOURCE_BUCKET,
  formatBytes,
} from "@/lib/storage";
import {
  PRIORITIES,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  UNIT_LABELS,
  type LearningDomain,
  type Priority,
  type ResourceStatus,
  type ResourceType,
  type UnitLabel,
} from "@/lib/types";

const fieldClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function AddResourceForm({ domains: initialDomains }: { domains: LearningDomain[] }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [domains, setDomains] = React.useState<LearningDomain[]>(initialDomains);
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<ResourceType | "">("");
  const [domainId, setDomainId] = React.useState("");
  const [status, setStatus] = React.useState<ResourceStatus>("not_started");
  const [author, setAuthor] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [totalUnits, setTotalUnits] = React.useState("");
  const [unitLabel, setUnitLabel] = React.useState<UnitLabel | "">("");
  const [priority, setPriority] = React.useState<Priority>("normal");
  const [file, setFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch domains client-side; server props may be empty if SSR auth didn't resolve.
  React.useEffect(() => {
    const supabase = createClient();
    supabase
      .from("learning_domains")
      .select("*")
      .eq("is_archived", false)
      .order("sort_order")
      .then(({ data, error: err }) => {
        if (err) console.error("[AddResourceForm] domains fetch:", err);
        if (data && data.length > 0) setDomains(data as LearningDomain[]);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type !== "application/pdf") {
      setError(t("add.pdfInvalid"));
      setFile(null);
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      setError(t("add.pdfTooLarge"));
      setFile(null);
      return;
    }
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !type) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    let fileFields: Record<string, unknown> = {};
    if (file) {
      const path = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from(RESOURCE_BUCKET)
        .upload(path, file, { contentType: "application/pdf", upsert: false });

      if (upErr) {
        setError(t("add.uploadError"));
        setSaving(false);
        return;
      }
      fileFields = {
        file_key: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: "application/pdf",
      };
    }

    const { data, error: insertError } = await supabase
      .from("resources")
      .insert({
        user_id: user.id,
        title: title.trim(),
        type,
        learning_domain_id: domainId || null,
        status,
        author_or_creator: author.trim() || null,
        source_url: url.trim() || null,
        total_units: totalUnits ? Number(totalUnits) : null,
        unit_label: unitLabel || null,
        priority,
        ...fileFields,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(t("add.error"));
      setSaving(false);
      return;
    }

    router.push(`/library/${data.id}`);
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-2xl">
      <Link
        href="/library"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("detail.back")}
      </Link>

      <h1 className="font-serif text-3xl font-medium">{t("add.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("add.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field label={t("add.fieldTitle")}>
          <input
            type="text"
            required
            dir="auto"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={fieldClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("add.fieldType")}>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value as ResourceType)}
              className={fieldClass}
            >
              <option value="" disabled>
                {t("add.selectType")}
              </option>
              {RESOURCE_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {t(`enum.type.${ty}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("add.fieldDomain")} hint={t("common.optional")}>
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              className={fieldClass}
            >
              <option value="">{t("common.none")}</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon ? `${d.icon} ${d.name}` : d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("add.fieldStatus")}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ResourceStatus)}
              className={fieldClass}
            >
              {RESOURCE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(`enum.status.${st}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("add.fieldPriority")}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={fieldClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`enum.priority.${p}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("add.fieldAuthor")} hint={t("common.optional")}>
            <input
              type="text"
              dir="auto"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className={fieldClass}
            />
          </Field>

          <Field label={t("add.fieldUrl")} hint={t("common.optional")}>
            <input
              type="url"
              inputMode="url"
              dir="ltr"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={fieldClass}
            />
          </Field>

          <Field label={t("add.fieldTotalUnits")} hint={t("common.optional")}>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={totalUnits}
              onChange={(e) => setTotalUnits(e.target.value)}
              className={fieldClass}
            />
          </Field>

          <Field label={t("add.fieldUnit")} hint={t("common.optional")}>
            <select
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value as UnitLabel)}
              className={fieldClass}
            >
              <option value="">{t("add.selectOption")}</option>
              {UNIT_LABELS.map((u) => (
                <option key={u} value={u}>
                  {t(`enum.unit.${u}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t("add.fieldPdf")} hint={t("common.optional")}>
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span dir="auto" className="truncate">
                  {file.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={t("add.removeFile")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={onFileChange}
              className="block w-full text-sm text-muted-foreground file:me-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
            />
          )}
          <span className="text-xs text-muted-foreground">{t("add.pdfHint")}</span>
        </Field>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving || !title.trim() || !type}>
            {saving ? t("common.saving") : t("add.save")}
          </Button>
          <Button asChild variant="ghost" type="button">
            <Link href="/library">{t("common.cancel")}</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-2 text-sm font-medium">
        {label}
        {hint && (
          <span className="text-xs font-normal text-muted-foreground">
            ({hint})
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
