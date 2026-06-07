"use client";

import { SurfaceError } from "@/components/shells/surface-states";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Show a generic message to users; never surface raw error details, which
  // can leak internals or PII. The structured logger (with trace_id and PII
  // scrubbing) is introduced in the logging feature; this boundary will emit
  // the caught error through it once it exists. Until then we avoid
  // `console.*`, which code-standards forbids as a logging mechanism.
  return (
    <SurfaceError
      message="We couldn't load your projects. Try again."
      onRetry={reset}
    />
  );
}
