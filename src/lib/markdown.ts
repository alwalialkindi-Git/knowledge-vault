// Minimal, safe "basic formatting" renderer.
// Supports: **bold**, *italic*, "- " bullet lists, and line breaks.
// Input is HTML-escaped first, so rendering user content is XSS-safe.

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function renderBasicMarkdown(input: string): string {
  const escaped = escapeHtml(input);
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
