"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/components/providers/language-provider";

export function SignOutButton({
  variant = "ghost",
  className,
}: {
  variant?: "ghost" | "outline" | "secondary";
  className?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant={variant} className={className} onClick={signOut}>
      <LogOut className="h-4 w-4" />
      {t("auth.signOut")}
    </Button>
  );
}
