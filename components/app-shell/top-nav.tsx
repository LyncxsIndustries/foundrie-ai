"use client";

// Authenticated top navigation bar (Feature 06).
// Holds the brand, a mobile drawer trigger that mounts the same workspace nav as
// the desktop rail, and the Clerk user menu. The `(app)` route group is already
// protected by `proxy.ts`, so a session always exists here.
import Link from "next/link";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WorkspaceNav } from "@/components/app-shell/workspace-nav";

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-bg-surface px-4">
      <div className="flex items-center gap-2">
        {/* Mobile: open the workspace nav as a drawer (desktop shows the rail). */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-touch md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-bg-surface p-0">
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle className="text-left text-sm font-semibold text-text-primary">
                Foundrie
              </SheetTitle>
            </SheetHeader>
            <WorkspaceNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-1 text-sm font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden className="size-5 rounded-sm bg-accent-primary" />
          Foundrie
        </Link>
      </div>

      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: "size-8",
          },
        }}
      />
    </header>
  );
}
