"use client";

import { SurfaceError } from "@/components/shells/surface-states";

export default function ProjectError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Generic message only; raw error details can leak internals or PII. The
  // structured logger (trace_id + PII scrubbing) is introduced in the logging
  // feature and will emit the caught error here. console.* is forbidden as a
  // logging mechanism (code-standards.md).
  return (
    <SurfaceError
      message="We couldn't load this project. Try again."
      onRetry={reset}
    />
  );
}
