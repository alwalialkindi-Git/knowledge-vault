import { createClient } from "@/lib/supabase/server";
import { ResourceDetailView } from "@/components/library/resource-detail-view";
import { RESOURCE_BUCKET } from "@/lib/storage";
import type { LearningDomain, Note, Resource, ResourceItem } from "@/lib/types";
import type { NoteConceptLink } from "@/lib/wikilinks";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  let domain: LearningDomain | null = null;
  let pdfUrl: string | null = null;
  let pdfDownloadUrl: string | null = null;
  let notes: Note[] = [];
  let items: ResourceItem[] = [];
  let concepts: { id: string; name: string }[] = [];
  let noteConceptLinks: NoteConceptLink[] = [];

  if (resource?.learning_domain_id) {
    const { data } = await supabase
      .from("learning_domains")
      .select("*")
      .eq("id", resource.learning_domain_id)
      .maybeSingle();
    domain = (data as LearningDomain) ?? null;
  }

  if (resource) {
    const [notesResult, itemsResult, conceptsResult] = await Promise.all([
      supabase
        .from("notes")
        .select("*")
        .eq("resource_id", resource.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("resource_items")
        .select("*")
        .eq("resource_id", resource.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("concepts")
        .select("id, name")
        .order("name"),
    ]);
    notes = (notesResult.data as Note[]) ?? [];
    items = (itemsResult.data as ResourceItem[]) ?? [];
    concepts = (conceptsResult.data as { id: string; name: string }[]) ?? [];

    const noteIds = notes.map((n) => n.id);
    if (noteIds.length > 0) {
      type RawLink = {
        id: string;
        note_id: string;
        concept_id: string;
        concept: { id: string; name: string };
      };
      const { data: linksRaw } = await supabase
        .from("concept_links")
        .select("id, note_id, concept_id, concept:concepts!concept_id(id, name)")
        .in("note_id", noteIds);

      noteConceptLinks = ((linksRaw ?? []) as unknown as RawLink[]).map(
        (row) => ({
          noteId: row.note_id,
          linkId: row.id,
          conceptId: row.concept_id,
          conceptName: row.concept.name,
        }),
      );
    }
  }

  if (resource?.file_key) {
    const storage = supabase.storage.from(RESOURCE_BUCKET);
    const { data: openData } = await storage.createSignedUrl(
      resource.file_key,
      3600,
    );
    pdfUrl = openData?.signedUrl ?? null;

    const { data: dlData } = await storage.createSignedUrl(
      resource.file_key,
      3600,
      { download: resource.file_name ?? true },
    );
    pdfDownloadUrl = dlData?.signedUrl ?? null;
  }

  return (
    <ResourceDetailView
      resource={(resource as Resource) ?? null}
      domain={domain}
      pdfUrl={pdfUrl}
      pdfDownloadUrl={pdfDownloadUrl}
      notes={notes}
      items={items}
      concepts={concepts}
      noteConceptLinks={noteConceptLinks}
    />
  );
}
