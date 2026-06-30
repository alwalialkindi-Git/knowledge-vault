import type { SupabaseClient } from "@supabase/supabase-js";

export type WikilinkSync = {
  linkId: string;
  conceptId: string;
  conceptName: string;
};

export type NoteConceptLink = WikilinkSync & { noteId: string };

/** Extract unique concept names from [[Name]] syntax. Case-deduplicated (first occurrence wins). */
export function parseWikilinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const seen = new Set<string>();
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    const name = m[1].trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      results.push(name);
    }
  }
  return results;
}

/**
 * Synchronise concept_links for a note or resource_item after its content is saved.
 *
 * For every [[Name]] in content:
 *   - Matches an existing concept case-insensitively, or creates one automatically.
 *   - Ensures a concept_link row exists for this entity.
 *
 * Removes links for concepts no longer mentioned.
 * Returns the final set of concept links for this entity.
 */
export async function syncWikilinks({
  supabase,
  userId,
  entityType,
  entityId,
  content,
}: {
  supabase: SupabaseClient;
  userId: string;
  entityType: "note" | "resource_item";
  entityId: string;
  content: string;
}): Promise<WikilinkSync[]> {
  const parsedNames = parseWikilinks(content);
  const entityColumn = entityType === "note" ? "note_id" : "resource_item_id";

  // Fetch existing links for this entity so we can diff them.
  type ExistingLinkRow = { id: string; concept_id: string; concept: { id: string; name: string } };
  const { data: existingRaw } = await supabase
    .from("concept_links")
    .select("id, concept_id, concept:concepts!concept_id(id, name)")
    .eq(entityColumn, entityId)
    .eq("user_id", userId);

  const existingByConceptId = new Map<string, { linkId: string; name: string }>();
  for (const row of ((existingRaw ?? []) as unknown as ExistingLinkRow[])) {
    existingByConceptId.set(row.concept_id, { linkId: row.id, name: row.concept.name });
  }

  // Remove all links if content has no wikilinks.
  if (parsedNames.length === 0) {
    if (existingByConceptId.size > 0) {
      await supabase
        .from("concept_links")
        .delete()
        .eq(entityColumn, entityId)
        .eq("user_id", userId);
    }
    return [];
  }

  // Load all user concepts for case-insensitive matching.
  const { data: allConceptsRaw } = await supabase
    .from("concepts")
    .select("id, name")
    .eq("user_id", userId);

  const conceptByLower = new Map<string, { id: string; name: string }>();
  for (const c of ((allConceptsRaw ?? []) as { id: string; name: string }[])) {
    conceptByLower.set(c.name.toLowerCase(), c);
  }

  // Resolve each name to an existing or newly created concept.
  const resolved: { id: string; name: string }[] = [];
  for (const name of parsedNames) {
    const existing = conceptByLower.get(name.toLowerCase());
    if (existing) {
      resolved.push(existing);
    } else {
      const { data } = await supabase
        .from("concepts")
        .insert({ user_id: userId, name })
        .select("id, name")
        .single();
      if (data) {
        const c = data as { id: string; name: string };
        resolved.push(c);
        conceptByLower.set(c.name.toLowerCase(), c);
      }
    }
  }

  const resolvedIds = new Set(resolved.map((c) => c.id));

  // Delete links for concepts no longer mentioned.
  const toDelete = [...existingByConceptId.entries()]
    .filter(([conceptId]) => !resolvedIds.has(conceptId))
    .map(([, v]) => v.linkId);

  if (toDelete.length > 0) {
    await supabase.from("concept_links").delete().in("id", toDelete);
  }

  // Return all current links, creating rows for any new mentions.
  const result: WikilinkSync[] = [];
  for (const concept of resolved) {
    const existing = existingByConceptId.get(concept.id);
    if (existing) {
      result.push({ linkId: existing.linkId, conceptId: concept.id, conceptName: concept.name });
    } else {
      const { data } = await supabase
        .from("concept_links")
        .insert({ user_id: userId, concept_id: concept.id, [entityColumn]: entityId })
        .select("id")
        .single();
      if (data) {
        result.push({
          linkId: (data as { id: string }).id,
          conceptId: concept.id,
          conceptName: concept.name,
        });
      }
    }
  }

  return result;
}
