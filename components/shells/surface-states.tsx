import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StateProps {
  className?: string;
}

/**
 * Loading skeleton for a working surface. Mirrors a list/grid layout so the
 * shift to real content keeps CLS low (Core Web Vitals target CLS < 0.1).
 */
export function SurfaceLoading({ className }: StateProps) {
  return (
    <div
      className={cn("space-y-4 p-6", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

interface SurfaceErrorProps extends StateProps {
  title?: string;
  message?: string;
  /** When provided, renders a recovery action. */
  onRetry?: () => void;
  retryLabel?: string;
}

/** Recoverable error state for a working surface. */
export function SurfaceError({
  title = "Something went wrong",
  message = "We couldn't load this surface. Try again.",
  onRetry,
  retryLabel = "Retry",
  className,
}: SurfaceErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="max-w-md text-sm text-text-secondary">{message}</p>
      {onRetry ? (
        <Button
          variant="outline"
          size="lg"
          className="min-touch"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

interface SurfaceEmptyProps extends StateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/** Empty state for a working surface with no content yet. */
export function SurfaceEmpty({
  title,
  message,
  icon,
  action,
  className,
}: SurfaceEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? <div className="text-text-muted">{icon}</div> : null}
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {message ? (
        <p className="max-w-md text-sm text-text-secondary">{message}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
