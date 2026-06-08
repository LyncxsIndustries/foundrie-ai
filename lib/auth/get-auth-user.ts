// Clerk session -> local user mapping (Feature 04).
// getAuthUser() is the single bridge between Clerk's session truth and the local
// User row. The Clerk user id comes only from the verified session via auth() —
// never from request body, query, or route params — so ownership scoping built
// on the returned id cannot be spoofed by client input.
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

/**
 * The minimal authenticated user shape every protected route relies on. Kept
 * narrow (no relations, no large columns) so the session lookup stays cheap.
 */
export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  plan: import("@/lib/generated/prisma/enums").UserPlan;
  role: import("@/lib/generated/prisma/enums").UserRole;
}

/**
 * Resolve the current Clerk session to its local `User`. Returns `null` when
 * there is no session or when the webhook has not yet synced a local row.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  return db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, clerkId: true, email: true, plan: true, role: true },
  });
}
