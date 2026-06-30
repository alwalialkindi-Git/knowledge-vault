import { LayoutDashboard, Library, Network, Repeat, Settings, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Shown only in the sidebar; excluded from the mobile bottom nav. */
  sidebarOnly?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, exact: true },
  { href: "/library", labelKey: "nav.library", icon: Library },
  { href: "/review", labelKey: "nav.review", icon: Repeat },
  { href: "/concepts", labelKey: "nav.concepts", icon: Network, sidebarOnly: true },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
