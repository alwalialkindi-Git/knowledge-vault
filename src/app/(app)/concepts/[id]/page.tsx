import { createClient } from "@/lib/supabase/server";
import { ConceptDetailView } from "@/components/concepts/concept-detail-view";
import type { Concept, Resource } from "@/lib/types";

export const dynamic = "force-dynamic";

// ── types for relational query results ───────────────────────────────────────

export type ResourceLinkRow = {
  id: string;
  resource: {
    id: string;
    title: string;
    type: string;
    status: string;
    priority: string;
  };
};

export type NoteLinkRow = {
  id: string;
  note: {
    id: string;
    content: string;
    type: string;
    created_at: string;
    resource: { id: string; title: string } | null;
  };
};

export type ItemLinkRow = {
  id: string;
  resource_item: {
    id: string;
    title: string;
    item_type: string;
    resource: { id: string; title: string } | null;
  };
};

// ── page ──────────────────────────────────────────────────────────────────────

export default async function ConceptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [
    conceptRes,
    resourceLinksRes,
    noteLinksRes,
    itemLinksRes,
    allResourcesRes,
    allConceptsRes,
  ] = await Promise.all([
      supabase
        .from("concepts")
        .select("*")
        .eq("id", params.id)
        .maybeSingle(),

      supabase
        .from("concept_links")
        .select("id, resource:resources!resource_id(id, title, type, status, priority)")
        .eq("concept_id", params.id)
        .not("resource_id", "is", null),

      supabase
        .from("concept_links")
        .select(
          "id, note:notes!note_id(id, content, type, created_at, resource:resources!resource_id(id, title))",
        )
        .eq("concept_id", params.id)
        .not("note_id", "is", null),

      supabase
        .from("concept_links")
        .select(
          "id, resource_item:resource_items!resource_item_id(id, title, item_type, resource:resources!resource_id(id, title))",
        )
        .eq("concept_id", params.id)
        .not("resource_item_id", "is", null),

      supabase
        .from("resources")
        .select("id, title, type, status, priority")
        .order("title"),

      supabase
        .from("concepts")
        .select("id, name")
        .order("name"),
    ]);

  return (
    <ConceptDetailView
      concept={(conceptRes.data as Concept) ?? null}
      resourceLinks={
        ((resourceLinksRes.data ?? []) as unknown) as ResourceLinkRow[]
      }
      noteLinks={((noteLinksRes.data ?? []) as unknown) as NoteLinkRow[]}
      itemLinks={((itemLinksRes.data ?? []) as unknown) as ItemLinkRow[]}
      allResources={
        (allResourcesRes.data as Pick<Resource, "id" | "title" | "type">[]) ?? []
      }
      concepts={
        (allConceptsRes.data as { id: string; name: string }[]) ?? []
      }
    />
  );
}
