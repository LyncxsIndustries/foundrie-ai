// Subscription plan tier. Mirrors the Prisma `Plan` enum (FREE/PRO/ENTERPRISE)
// without importing the generated client, so the rotation engine and its tests
// stay independent of the database layer. Tier drives the primary model
// selection in `resolveModelKey` (Hard Rule 7).

export type Plan = "FREE" | "PRO" | "ENTERPRISE";

/** True for plans entitled to the paid-tier flagship model (Claude Sonnet 4). */
export function isPaidPlan(plan: Plan): boolean {
  return plan === "PRO" || plan === "ENTERPRISE";
}
