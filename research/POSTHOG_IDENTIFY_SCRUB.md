# Research: PostHog Identify Call-Site Scrub (Feature 60)

- **Date**: 2026-07-31
- **Branch**: `feature/60-liveblocks-identify-scrub`
- **Context7 IDs**: `/posthog/posthog-js`, `/posthog/posthog.com`

## Evidence

| ID | Source | Finding |
|----|--------|---------|
| E-01 | `packages/types/src/posthog.ts` | `identify(new_distinct_id?, userPropertiesToSet?, userPropertiesToSetOnce?): void` |
| E-02 | `packages/browser/src/posthog-core.ts` | On first anonymous→identified transition, captures `$identify` with `{ $set: userPropertiesToSet \|\| {}, $set_once: ... }`. On later identifies with props, calls `setPersonProperties`. |
| E-03 | Same file `group()` | `group(groupType, groupKey, groupPropertiesToSet?)` writes `$group_set` — correct place for workspace attributes. |
| E-04 | posthog.com identify best practices | Person properties are optional; reset on logout (Feature 59). |

## Decision

| Option | Pros | Cons | Chosen? |
|--------|------|------|---------|
| A. Omit second arg: `identify(user.id)` | Minimal | Does not overwrite stale `$set.email` from pre-60 sessions | No |
| B. Empty strings: `identify(user.id, { email: "", name: "" })` | Matches tracker wording; overwrites stale person props | Empty strings still appear briefly in in-memory `$set` before Layer 2 wipe | **Yes** |
| C. Add `posthog.group('workspace', ...)` in provider | Aligns with "group_properties" wording | No workspace id in Liveblocks provider; exceeds Files Owned / invents product behavior | No |

## Risk closure
- Audit risk **R-02** (raw email/name in `$set` after identify) → closed at call site by Feature 60; Layer 2 remains belt-and-suspenders.

## Sync footprint (Feature 60)

| Artifact | Change |
|----------|--------|
| `lib/liveblocks/provider.tsx` | Empty email/name on identify |
| `lib/liveblocks/provider.test.tsx` | Expectations + dedicated Feature 60 test |
| `60-liveblocks-identify-scrub.md` | Version Research + Context7 Findings + Skills |
| `library-docs.md` | Identify scrub pattern subsection |
| `docs/POSTHOG_IDENTIFY_SCRUB.md` | NEW |
| `docs/POSTHOG_PRIVACY_IMPLEMENTATION.md` | Layer 1 marked implemented |
| `research/POSTHOG_IDENTIFY_SCRUB.md` | THIS FILE |
| `research/POSTHOG_CONFIGURATION_AUDIT.md` | R-02 + §5.4 |
| `research/POSTHOG_MASTER_PROMPT.md` | Identify props scrubbed |
| `progress-tracker.md` | Feature 60 DONE → Goal 61 / Next 62 |
