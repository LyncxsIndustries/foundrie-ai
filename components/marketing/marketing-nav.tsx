"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <nav className="border-b border-border bg-surface">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-text-primary">
          Foundrie
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing">
            <Button variant="ghost" size="sm">
              Pricing
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
