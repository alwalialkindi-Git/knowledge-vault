"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export interface YouTubeVideo {
  title: string;
  url: string;
  position: number;
}

export function YouTubeImporter({
  saving,
  onImport,
  onCancel,
}: {
  saving: boolean;
  onImport: (videos: YouTubeVideo[]) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [url, setUrl] = React.useState("");
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleImport() {
    setError(null);
    setFetching(true);
    try {
      const res = await fetch("/api/youtube-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? t("items.ytError"));
        return;
      }
      onImport(json.videos as YouTubeVideo[]);
    } catch {
      setError(t("items.ytNetworkError"));
    } finally {
      setFetching(false);
    }
  }

  const valid = url.trim().length > 0;

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("items.ytLabel")}
        </label>
        <input
          type="text"
          dir="ltr"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder={t("items.ytPlaceholder")}
          className={cn(fieldClass, "h-9")}
          autoFocus
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!valid || fetching || saving}
          onClick={handleImport}
        >
          {fetching ? t("items.ytFetching") : t("items.ytImport")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
