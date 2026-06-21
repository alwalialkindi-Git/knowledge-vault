"use client";

import * as React from "react";
import en from "@/i18n/messages/en.json";
import ar from "@/i18n/messages/ar.json";
import {
  defaultLocale,
  direction,
  localeCookie,
  locales,
  type Locale,
} from "@/i18n/config";

type Messages = typeof en;
const dictionaries: Record<Locale, Messages> = { en, ar };

type LanguageContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

function lookup(messages: Messages, key: string): string {
  const value = key
    .split(".")
    .reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, messages);
  return typeof value === "string" ? value : key;
}

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

  const setLocale = React.useCallback((next: Locale) => {
    if (!locales.includes(next)) return;
    setLocaleState(next);
    document.cookie = `${localeCookie}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = direction[next];
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction[locale];
  }, [locale]);

  const value = React.useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir: direction[locale],
      setLocale,
      t: (key: string) => lookup(dictionaries[locale], key),
    }),
    [locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return ctx;
}

export { defaultLocale };
