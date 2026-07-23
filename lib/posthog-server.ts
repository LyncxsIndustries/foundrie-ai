import { PostHog } from "posthog-node";

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
      console.warn(
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

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, boolean | number | string>,
): Promise<void> {
  const posthog = getPostHogClient();
  if (!posthog) {
    return;
  }

  posthog.capture({ distinctId, event, properties });
  await posthog.flush();
}
