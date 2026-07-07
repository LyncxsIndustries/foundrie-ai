"use client";

// Global workspace navigation (Feature 06).
// The persistent left-rail links for the authenticated app. Active state is
// derived from the pathname, so this is a client component. Project-scoped phase
// navigation lives in `ProjectPhaseNav`, not here.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, FileText, Settings, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface WorkspaceNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Project", href: "/projects/new", icon: Plus },
] as const;

interface WorkspaceNavProps {
  /** Invoked after a link is chosen, so a mobile drawer can close itself. */
  onNavigate?: () => void;
  className?: string;
}

export function WorkspaceNav({ onNavigate, className }: WorkspaceNavProps) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Workspace"
      className={cn("flex flex-col gap-1 p-3", className)}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-touch items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-bg-elevated text-text-primary"
                : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
            )}
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
