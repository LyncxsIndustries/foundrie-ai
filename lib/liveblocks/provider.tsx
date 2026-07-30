"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { LiveblocksProvider } from "@liveblocks/react";
import posthog from "posthog-js";

export function LiveblocksReactProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    // Feature 59: always reset on signed-out mount — identified distinct_id
    // persists across refreshes until reset() clears persistence (Context7
    // /posthog/posthog-js). Do not gate on identifiedUserId; a prior session
    // may have left identity in localStorage/cookies with a null React ref.
    if (!isSignedIn || !user) {
      posthog.reset();
      identifiedUserId.current = null;
      return;
    }

    if (identifiedUserId.current === user.id) {
      return;
    }

    if (identifiedUserId.current) {
      posthog.reset();
    }

    posthog.identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName ?? undefined,
    });
    identifiedUserId.current = user.id;
  }, [isLoaded, isSignedIn, user]);

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      {children}
    </LiveblocksProvider>
  );
}
