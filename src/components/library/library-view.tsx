"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Plus, Search, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/language-provider";
import { ResourceCard } from "@/components/library/resource-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  focusAreaName,
  type FocusArea,
  type Resource,
} from "@/lib/types";

const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function LibraryView({
  resources,
  focusAreas,
}: {
  resources: Resource[];
  focusAreas: FocusArea[];
}) {
  const { t, locale } = useTranslation();
  const [q, setQ] = React.useState("");
  const [focusArea, setFocusArea] = React.useState("");
  const [type, setType] = React.useState("");
  const [status, setStatus] = React.useState("");

  const areaById = React.useMemo(
    () => new Map(focusAreas.map((a) => [a.id, a])),
    [focusAreas],
  );

  const hasFilters = q !== "" || focusArea !== "" || type !== "" || status !== "";

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return resources.filter((r) => {
      if (focusArea && r.focus_area_id !== focusArea) return false;
      if (type && r.type !== type) return false;
      if (status && r.status !== status) return false;
      if (needle && !r.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [resources, q, focusArea, type, status]);

  function clearFilters() {
    setQ("");
    setFocusArea("");
    setType("");
    setStatus("");
  }

  const count =
    filtered.length === 1
      ? t("library.countOne")
      : t("library.countOther").replace("{n}", String(filtered.length));

  return (
    <section className="mx-auto max-w-5xl space-y-6">
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

          <select
            aria-label={t("library.filterFocusArea")}
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            className={selectClass}
          >
            <option value="">{t("library.filterFocusArea")}</option>
            {focusAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {focusAreaName(a, locale)}
              </option>
            ))}
          </select>

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
              focusArea={
                r.focus_area_id ? areaById.get(r.focus_area_id) : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
