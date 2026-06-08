// Admin gate (Feature 04).
// v1 admin access is an allowlist of emails in the ADMIN_EMAILS environment
// variable (comma-separated). User.role exists for internal classification but
// is not the launch admin authority. Non-admin access to admin surfaces returns
// 404 (handled by callers), never 403.

/**
 * Parse `ADMIN_EMAILS` into a normalized lookup set. Trimmed, lowercased, and
 * empty entries dropped so stray commas or whitespace cannot widen access.
 */
function adminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0),
  );
}

/**
 * Whether `email` is in the admin allowlist. Case-insensitive; returns false for
 * null/empty input or an unset/empty `ADMIN_EMAILS`.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return adminEmailSet().has(email.trim().toLowerCase());
}
