import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/sidebar-nav";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defence in depth: middleware already guards these routes.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SidebarNav />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
