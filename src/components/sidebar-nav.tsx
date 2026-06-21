"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, isActive } from "@/components/nav-items";
import { useTranslation } from "@/components/providers/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { SignOutButton } from "@/components/sign-out-button";

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-card md:flex md:sticky md:top-0 md:h-screen">
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BookMarked className="h-5 w-5" />
        </span>
        <span className="font-serif text-lg font-medium leading-tight">
          {t("app.name")}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <SignOutButton variant="outline" className="w-full justify-start" />
      </div>
    </aside>
  );
}
