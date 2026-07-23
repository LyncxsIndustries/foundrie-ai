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

    if (!isSignedIn || !user) {
      if (identifiedUserId.current) {
        posthog.reset();
        identifiedUserId.current = null;
      }
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
