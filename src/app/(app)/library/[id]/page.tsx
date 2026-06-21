import { createClient } from "@/lib/supabase/server";
import { ResourceDetailView } from "@/components/library/resource-detail-view";
import { RESOURCE_BUCKET } from "@/lib/storage";
import type { FocusArea, Note, Resource } from "@/lib/types";

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

  let focusArea: FocusArea | null = null;
  let pdfUrl: string | null = null;
  let pdfDownloadUrl: string | null = null;
  let notes: Note[] = [];

  if (resource?.focus_area_id) {
    const { data } = await supabase
      .from("focus_areas")
      .select("*")
      .eq("id", resource.focus_area_id)
      .maybeSingle();
    focusArea = (data as FocusArea) ?? null;
  }

  if (resource) {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("resource_id", resource.id)
      .order("created_at", { ascending: true });
    notes = (data as Note[]) ?? [];
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
      focusArea={focusArea}
      pdfUrl={pdfUrl}
      pdfDownloadUrl={pdfDownloadUrl}
      notes={notes}
    />
  );
}
