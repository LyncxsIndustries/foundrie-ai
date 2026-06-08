// Authenticated app shell (Feature 06).
// Provides the persistent chrome shared by every working surface: a top nav with
// the brand, a mobile workspace-nav drawer, and the Clerk user menu. The `(app)`
// route group is protected by `proxy.ts`, so requests that reach this layout are
// authenticated. Each surface owns its own contextual left rail via
// `WorkspaceShell` (the dashboard list, the project phase nav), so the shell does
// not render a second persistent desktop sidebar here.
import type { ReactNode } from "react";

import { TopNav } from "@/components/app-shell/top-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopNav />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
