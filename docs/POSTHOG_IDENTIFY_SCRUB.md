# PostHog Identify Call-Site Scrub — Feature 60

## File Ownership
- Owner: Foundrie runtime / privacy
- Code: `lib/liveblocks/provider.tsx` (Files Owned by Feature 60)
- Related specs: Feature 57 (`before_send` wire scrub), Feature 58 (`defaults`), Feature 59 (signed-out `reset`), Feature 60 (THIS FILE)

## What Changed
Signed-in identify no longer passes Clerk email/name into PostHog person properties:

```typescript
// BEFORE (PII in $set)
posthog.identify(user.id, {
  email: user.primaryEmailAddress?.emailAddress,
  name: user.fullName ?? undefined,
});

// AFTER (Feature 60)
posthog.identify(user.id, {
  email: "",
  name: "",
});
```

Distinct id remains Clerk `user.id` so sessions still stitch correctly without storing PII on the person profile.

## Context7 Contract
- Library: `/posthog/posthog-js`
- Signature: `identify(new_distinct_id?, userPropertiesToSet?, userPropertiesToSetOnce?): void`
- `userPropertiesToSet` → `$set` on the `$identify` event (and `setPersonProperties` on re-identify).
- Workspace/org data: use `group(groupType, groupKey, groupPropertiesToSet?)` — **not** person props on `identify`. This provider has no workspace context; no `group()` call here.

## Defense-in-Depth
| Layer | Spec | Role after Feature 60 |
|-------|------|------------------------|
| 1 | 60 | Call site never seeds email/name |
| 2 | 57 | Wire envelope `$set` still wiped to `{}` |
| 3 | 59 | Signed-out `reset()` clears persistence |
| 4 | 58 | Defaults preset; canvas capture neutralized by Layer 2 |

## Validation
1. Unit: `lib/liveblocks/provider.test.tsx` — Feature 60 case asserts `{ email: "", name: "" }` and rejects Clerk PII strings.
2. Manual: Network → PostHog `/e/` — `$identify` must not carry real email/name in `$set` even before `before_send` inspection; after Feature 57, `$set` is `{}` on the wire regardless.

## Generated Projects
Any Foundrie-generated app that calls `posthog.identify` MUST scrub person props the same way (empty email/name or omit PII fields) and keep workspace attrs on `posthog.group()`. Bake this into generated `library-docs.md` / privacy docs.
