"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/language-provider";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Toggle language"
      className="gap-2"
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-medium">
        {locale === "en" ? "العربية" : "EN"}
      </span>
    </Button>
  );
}
