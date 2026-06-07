import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Root landing surface. Minimal entry into the workspace; the full marketing
 * and onboarding experience is built in later features.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-accent-primary">
          Foundrie AI
        </p>
        <h1 className="text-4xl font-bold text-text-primary">
          From idea to implementation-ready package
        </h1>
        <p className="mx-auto max-w-xl text-text-secondary">
          A pre-IDE architectural workspace: Socratic discovery, requirements,
          architecture, a full diagram suite, and ordered feature specs.
        </p>
      </div>
      <Button asChild size="lg" className="min-touch">
        <Link href="/dashboard">Open workspace</Link>
      </Button>
    </main>
  );
}
