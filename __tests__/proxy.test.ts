import { describe, it, expect } from "vitest";
import { createRouteMatcher } from "@clerk/nextjs/server";
import middleware, { publicRoutes } from "../proxy";

/**
 * Builds a minimal request stand-in that satisfies what `createRouteMatcher`
 * reads (the URL). This exercises the real matcher against the exported public
 * route list so the auth boundary is verified, not just the array contents.
 */
function requestForPath(pathname: string) {
  const url = `https://foundrieai.com${pathname}`;
  return { url, nextUrl: new URL(url) } as unknown as Request;
}

describe("auth public route boundary", () => {
  const isPublicRoute = createRouteMatcher(publicRoutes);

  it.each([
    "/",
    "/pricing",
    "/sign-in",
    "/sign-in/factor-one",
    "/sign-up",
    "/sign-up/verify-email-address",
    "/api/webhooks/clerk",
  ])("treats %s as public", (pathname) => {
    expect(isPublicRoute((requestForPath(pathname) as any))).toBe(true);
  });

  it.each([
    "/dashboard",
    "/projects/new",
    "/projects/abc123",
    "/api/projects",
    "/api/webhooks/stripe",
  ])("protects %s by default", (pathname) => {
    expect(isPublicRoute((requestForPath(pathname) as any))).toBe(false);
  });
});
