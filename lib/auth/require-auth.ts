// Route auth guard (Feature 04).
// requireAuth() is the shared entry point for every route that touches user
// data. It throws a typed AuthError instead of returning a Response so route
// handlers can centralize the 401 mapping in one catch and keep the happy path
// unindented.
import { getAuthUser, type AuthUser } from "@/lib/auth/get-auth-user";

/**
 * Thrown when no authenticated, locally-synced user backs the request. Carries
 * the HTTP status so the route's error handler can render the response without
 * re-deriving it.
 */
export class AuthError extends Error {
  readonly status = 401;

  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Return the authenticated local user or throw {@link AuthError} (401). Use at
 * the top of any route handler before reading or mutating user-owned data.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthError();
  }
  return user;
}
