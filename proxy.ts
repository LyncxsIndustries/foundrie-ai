import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes reachable without an authenticated session. Everything not matched
 * here is protected by default. `/pricing` and the Clerk webhook endpoint are
 * listed ahead of the features that implement them so the auth boundary is
 * stable as those features land. Exported so the boundary can be unit-tested.
 */
export const publicRoutes = [
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
  "/api/github/webhook",
  "/api/github/install",
];

const isPublicRoute = createRouteMatcher(publicRoutes);

// Next.js 16 renamed `middleware.ts` to `proxy.ts`; Clerk's `clerkMiddleware`
// is the default export and works unchanged under the new filename.
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless referenced in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes.
    "/__clerk/(.*)",
  ],
};
