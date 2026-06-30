"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";

export function ExportButton() {
  const { t } = useTranslation();
  const [busy, setBusy] = React.useState(false);

  async function exportData() {
    setBusy(true);
    try {
      const supabase = createClient();
      const [domains, resources, resourceItems, notes, reviewCards, concepts, conceptLinks] =
        await Promise.all([
          supabase.from("learning_domains").select("*").order("sort_order"),
          supabase.from("resources").select("*").order("created_at"),
          supabase.from("resource_items").select("*").order("order_index"),
          supabase.from("notes").select("*").order("created_at"),
          supabase.from("review_cards").select("*").order("created_at"),
          supabase.from("concepts").select("*").order("created_at"),
          supabase.from("concept_links").select("*").order("created_at"),
        ]);

      const payload = {
        app: "My Learning Vault",
        version: 3,
        exported_at: new Date().toISOString(),
        learning_domains: domains.data ?? [],
        resources: resources.data ?? [],
        resource_items: resourceItems.data ?? [],
        notes: notes.data ?? [],
        review_cards: reviewCards.data ?? [],
        concepts: concepts.data ?? [],
        concept_links: conceptLinks.data ?? [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `learning-vault-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={exportData} disabled={busy}>
      <Download className="h-4 w-4" />
      {busy ? t("settings.exporting") : t("settings.export")}
    </Button>
  );
}
