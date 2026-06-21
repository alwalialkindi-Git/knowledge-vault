"use client";

import { BookMarked } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

export function TopBar() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BookMarked className="h-4 w-4" />
        </span>
        <span className="font-serif text-base font-medium">{t("app.name")}</span>
      </div>
      <div className="flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
