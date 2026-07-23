import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts`; Clerk's `clerkMiddleware`
// is the default export and works unchanged under the new filename.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals, Turbopack dev resources (@vite), and static files
    // unless referenced in search params.
    "/((?!_next|@vite|__nextjs|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes.
    "/__clerk/(.*)",
  ],
};
