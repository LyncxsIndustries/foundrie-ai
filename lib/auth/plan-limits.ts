// Plan limits and project-creation gate (Feature 04).
// Plan gates are enforced server-side before any write. Tier numbers are a
// conservative launch default: the pricing research (research/FOUNDRIE_RESEARCH.md
// §16 "Pricing tiers") pins Free as solo with monthly session limits and Pro as
// "unlimited", but does not pin an exact concurrent-project count, so FREE is
// capped here and paid tiers are uncapped. Stripe-backed quota enforcement and
// monthly session counting are out of scope for this feature.
import type { UserPlan } from "@/lib/generated/prisma/enums";

/**
 * Maximum number of projects a user may own per plan. `Infinity` means no
 * application-enforced cap (paid tiers). Keyed by every `UserPlan` value so a
 * new plan cannot silently fall through to an undefined limit.
 */
export const PLAN_LIMITS: Record<UserPlan, { maxProjects: number }> = {
  FREE: { maxProjects: 3 },
  PRO: { maxProjects: Infinity },
  ENTERPRISE: { maxProjects: Infinity },
};

/**
 * Whether a user on `plan` may create another project given how many they
 * already own. Pure and synchronous so callers count once and decide here.
 */
export function canCreateProject(
  plan: UserPlan,
  currentProjectCount: number,
): boolean {
  return currentProjectCount < PLAN_LIMITS[plan].maxProjects;
}
