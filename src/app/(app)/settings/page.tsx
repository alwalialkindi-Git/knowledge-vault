"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";
import { SignOutButton } from "@/components/sign-out-button";
import { ExportButton } from "@/components/settings/export-button";
import { type Locale } from "@/i18n/config";

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const themeOptions: { value: string; label: string }[] = [
    { value: "light", label: t("settings.light") },
    { value: "dark", label: t("settings.dark") },
    { value: "system", label: t("settings.system") },
  ];

  const langOptions: { value: Locale; label: string }[] = [
    { value: "en", label: "English" },
    { value: "ar", label: "العربية" },
  ];

  return (
    <section className="mx-auto max-w-2xl space-y-10">
      <h1 className="font-serif text-3xl font-medium">{t("settings.title")}</h1>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("settings.appearance")}
        </h2>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">{t("settings.theme")}</p>
          <div className="flex flex-wrap gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "rounded-md border px-4 py-2 text-sm transition-colors",
                  mounted && theme === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-accent",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">{t("settings.language")}</p>
          <div className="flex flex-wrap gap-2">
            {langOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocale(opt.value)}
                className={cn(
                  "rounded-md border px-4 py-2 text-sm transition-colors",
                  locale === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-accent",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("settings.data")}
        </h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            {t("settings.exportHint")}
          </p>
          <ExportButton />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("settings.account")}
        </h2>
        <SignOutButton variant="outline" />
      </div>
    </section>
  );
}
