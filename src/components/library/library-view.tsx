"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Plus, Search, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";
import { ResourceCard } from "@/components/library/resource-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  type LearningDomain,
  type Resource,
} from "@/lib/types";

const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function LibraryView({
  resources,
  domains,
}: {
  resources: Resource[];
  domains: LearningDomain[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showDeletedToast, setShowDeletedToast] = React.useState(
    () => searchParams.get("deleted") === "1",
  );

  React.useEffect(() => {
    if (showDeletedToast) {
      // Remove the ?deleted=1 param from the URL without a page reload
      const url = new URL(window.location.href);
      url.searchParams.delete("deleted");
      router.replace(url.pathname, { scroll: false });
      const timer = setTimeout(() => setShowDeletedToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [liveDomains, setLiveDomains] = React.useState<LearningDomain[]>(domains);
  const [q, setQ] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState("");

  React.useEffect(() => {
    const supabase = createClient();
    supabase
      .from("learning_domains")
      .select("*")
      .eq("is_archived", false)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setLiveDomains(data as LearningDomain[]);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [type, setType] = React.useState("");
  const [status, setStatus] = React.useState("");

  const domainById = React.useMemo(
    () => new Map(liveDomains.map((d) => [d.id, d])),
    [liveDomains],
  );

  const hasFilters = q !== "" || domainFilter !== "" || type !== "" || status !== "";

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return resources.filter((r) => {
      if (domainFilter && r.learning_domain_id !== domainFilter) return false;
      if (type && r.type !== type) return false;
      if (status && r.status !== status) return false;
      if (needle && !r.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [resources, q, domainFilter, type, status]);

  function clearFilters() {
    setQ("");
    setDomainFilter("");
    setType("");
    setStatus("");
  }

  const count =
    filtered.length === 1
      ? t("library.countOne")
      : t("library.countOther").replace("{n}", String(filtered.length));

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      {showDeletedToast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{t("detail.deleteSuccess")}</span>
          <button
            type="button"
            onClick={() => setShowDeletedToast(false)}
            className="ms-auto opacity-60 hover:opacity-100"
            aria-label={t("common.cancel")}
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-medium">
            {t("library.title")}
          </h1>
          {resources.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{count}</p>
          )}
        </div>
        <Button asChild>
          <Link href="/library/add">
            <Plus className="h-4 w-4" />
            {t("library.add")}
          </Link>
        </Button>
      </div>

      {resources.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("library.search")}
              dir="auto"
              className="h-10 w-full rounded-md border border-input bg-background ps-9 pe-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {liveDomains.length > 0 && (
            <select
              aria-label={t("library.filterDomain")}
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">{t("library.filterDomain")}</option>
              {liveDomains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon ? `${d.icon} ${d.name}` : d.name}
                </option>
              ))}
            </select>
          )}

          <select
            aria-label={t("library.filterType")}
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={selectClass}
          >
            <option value="">{t("library.filterType")}</option>
            {RESOURCE_TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`enum.type.${ty}`)}
              </option>
            ))}
          </select>

          <select
            aria-label={t("library.filterStatus")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">{t("library.filterStatus")}</option>
            {RESOURCE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {t(`enum.status.${st}`)}
              </option>
            ))}
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              {t("library.clearFilters")}
            </Button>
          )}
        </div>
      )}

      {resources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("library.emptyTitle")}
          body={t("library.emptyBody")}
          action={
            <Button asChild>
              <Link href="/library/add">
                <Plus className="h-4 w-4" />
                {t("library.add")}
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t("library.emptyFilteredTitle")}
          body={t("library.emptyFilteredBody")}
          action={
            <Button variant="outline" onClick={clearFilters}>
              {t("library.clearFilters")}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              domain={r.learning_domain_id ? domainById.get(r.learning_domain_id) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
