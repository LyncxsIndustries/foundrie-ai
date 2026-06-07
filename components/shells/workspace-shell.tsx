import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WorkspaceShellProps {
  /** Left navigation region (project/phase nav). */
  nav?: ReactNode;
  /** Optional right inspector region. */
  inspector?: ReactNode;
  /** Main working content. */
  children: ReactNode;
  className?: string;
}

/**
 * Structural shell for Foundrie's authenticated working surfaces: a left
 * navigation rail, a scrollable main region, and an optional right inspector.
 * Navigation contents are added by Feature 06; this provides the layout frame.
 */
export function WorkspaceShell({
  nav,
  inspector,
  children,
  className,
}: WorkspaceShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen bg-background text-foreground",
        className,
      )}
    >
      {nav ? (
        <aside className="hidden w-64 shrink-0 border-r border-border bg-bg-surface md:block">
          {nav}
        </aside>
      ) : null}
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      {inspector ? (
        <aside className="hidden w-80 shrink-0 border-l border-border bg-bg-surface lg:block">
          {inspector}
        </aside>
      ) : null}
    </div>
  );
}

interface SurfaceHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Consistent header for a working surface. */
export function SurfaceHeader({
  title,
  description,
  actions,
}: SurfaceHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
