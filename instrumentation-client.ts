import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!projectToken || !host) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error(
      !projectToken
        ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
        : "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured",
    );
  }
} else {
  // Guard against using the example placeholder token
  const placeholder = "your_posthog_project_token_here";
  if (projectToken === placeholder) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "PostHog initialization aborted: placeholder token detected. Set NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN to a real value.",
      );
    }
    // Skip initialization entirely
  } else {
    posthog.init(projectToken, {
      api_host: host,
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
      // before_send hook will be added in a later spec
    });
  }
}
