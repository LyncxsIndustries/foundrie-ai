import { PostHog } from "posthog-node";
import { logger } from "./logger";

let client: PostHog | null | undefined;

function getPostHogClient(): PostHog | null {
  if (client !== undefined) {
    return client;
  }

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!projectToken || !host) {
    // In non-production environments we gracefully degrade by disabling PostHog rather than throwing.
    if (process.env.NODE_ENV !== "production") {
      logger.warn(
        "PostHog environment variables missing; PostHog client disabled.",
      );
    }
    client = null;
    return client;
  }

  client = new PostHog(projectToken, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });

  return client;
}

/**
 * Reset the cached PostHog server client. Test-only — production code must not call this.
 */
export function resetPostHogServerClientForTests(): void {
  client = undefined;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, boolean | number | string>,
): Promise<void> {
  const posthog = getPostHogClient();
  if (!posthog) {
    return;
  }

  // Context7 /posthog/posthog-js (packages/node):
  // capture() is sync fire-and-forget (queues EventMessage); flush() drains the queue
  // and can reject on network/transport failure. Swallow after structured log so route
  // handlers never fail solely because analytics delivery failed.
  try {
    posthog.capture({ distinctId, event, properties });
    await posthog.flush();
  } catch (error) {
    logger.error("PostHog server capture failed", {
      event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
