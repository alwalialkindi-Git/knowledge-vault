import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DomainsManager } from "@/components/settings/domains-manager";
import type { LearningDomain } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("learning_domains")
    .select("*")
    .order("sort_order");

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/settings"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          Settings
        </Link>
        <h1 className="font-serif text-3xl font-medium">Learning Domains</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize your resources by topic. Domains you create here appear in
          resource forms.
        </p>
      </div>

      <DomainsManager initialDomains={(data as LearningDomain[]) ?? []} />
    </section>
  );
}
