"use client";

import { renderBasicMarkdown } from "@/lib/markdown";

export function NoteContent({ content }: { content: string }) {
  return (
    <div
      dir="auto"
      className="note-content text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(content) }}
    />
  );
}
