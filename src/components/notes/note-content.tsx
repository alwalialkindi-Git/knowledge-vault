"use client";

import { renderBasicMarkdown } from "@/lib/markdown";

export function NoteContent({
  content,
  conceptMap,
  className,
}: {
  content: string;
  conceptMap?: ReadonlyMap<string, { id: string; name: string }>;
  className?: string;
}) {
  return (
    <div
      dir="auto"
      className={`note-content text-sm leading-relaxed${className ? ` ${className}` : ""}`}
      dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(content, conceptMap) }}
    />
  );
}
