// Minimal, safe "basic formatting" renderer.
// Supports: **bold**, *italic*, "- " bullet lists, line breaks, [[WikiLinks]].
// Input is HTML-escaped first, so rendering user content is XSS-safe.

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeHtml(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function makeInline(
  conceptMap?: ReadonlyMap<string, { id: string; name: string }>,
) {
  return function inline(text: string): string {
    let result = text;

    if (conceptMap) {
      result = result.replace(/\[\[([^\]]+)\]\]/g, (_, raw: string) => {
        const display = raw.trim();
        // raw is already HTML-escaped; unescape for map lookup
        const concept = conceptMap.get(unescapeHtml(display).toLowerCase());
        if (concept) {
          return `<a href="/concepts/${concept.id}" class="wikilink">${display}</a>`;
        }
        return `<span class="wikilink wikilink--unknown">${display}</span>`;
      });
    }

    return result
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  };
}

export function renderBasicMarkdown(
  input: string,
  conceptMap?: ReadonlyMap<string, { id: string; name: string }>,
): string {
  const escaped = escapeHtml(input);
  const inline = makeInline(conceptMap);
  const lines = escaped.split(/\r?\n/);
  let html = "";
  let inList = false;

  for (const line of lines) {
    const bullet = line.match(/^\s*-\s+(.*)$/);
    if (bullet) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inline(bullet[1])}</li>`;
      continue;
    }
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    if (line.trim() === "") continue;
    html += `<p>${inline(line)}</p>`;
  }
  if (inList) html += "</ul>";
  return html;
}
