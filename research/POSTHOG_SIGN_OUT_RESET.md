# PostHog Sign-Out Reset Research — Feature 59

- **Research Date**: 2026-07-30
- **Scope**: Browser `posthog-js` identity unlink at Clerk signed-out boundary in `lib/liveblocks/provider.tsx`
- **Toolchain**: Context7 CLI — `/posthog/posthog-js` (`reset()` implementation) and `/posthog/posthog.com` (logout guidance)

## 1. Evidence

| ID | Source | Finding |
|----|--------|---------|
| R-01 | `packages/browser/src/posthog-core.ts` `reset()` | Clears persistence + sessionPersistence; sets anonymous user state; new `distinct_id`; optional `reset_device_id` rotates `$device_id` |
| R-02 | Same file | Until `reset()` runs, identified `distinct_id` persists across refreshes |
| R-03 | posthog.com docs `_snippets/identify-reset.mdx` | Call `posthog.reset()` on logout to unlink future events; critical on shared devices |
| R-04 | posthog.com `libraries/js/usage.mdx` | `posthog.reset()` / `posthog.reset(true)` documented for session unlink / device rotation |

## 2. Decision

| Option | Result |
|--------|--------|
| Gate reset on `identifiedUserId.current` | **Rejected** — cold signed-out mount leaves persisted identity |
| Unconditional `posthog.reset()` when `isLoaded && (!isSignedIn \|\| !user)` | **Selected** — matches official logout guidance + Feature 59 AC |
| `posthog.reset(true)` | **Deferred** — device-id rotation not required by this spec |

## 3. Interaction With Other Layers

| Layer | Spec | Interaction with Feature 59 |
|-------|------|-----------------------------|
| 1 | 60 | Identify scrub still pending; reset clears prior person props from persistence regardless |
| 2 | 57 | `before_send` still wipes every outbound envelope including any residual `$identify` / capture after reset |
| 3 | 58 | `defaults: "2026-05-30"` canvasCapture remains neutralized on the wire by Layer 2; reset also clears in-memory recording session state |

## 4. Contract Sync Footprint (Feature 59)

| Artifact | Change | Status |
|----------|--------|--------|
| `lib/liveblocks/provider.tsx` | Unconditional signed-out `posthog.reset()` | DONE |
| `lib/liveblocks/provider.test.tsx` | NEW — 4 unit tests | DONE |
| `project-kit/feature-specs/59-liveblocks-reset-on-sign-out.md` | Version Research + Context7 Findings + skills | DONE |
| `project-kit/feature-specs/60-liveblocks-identify-scrub.md` | Layer 4 failure-mode wording corrected | DONE |
| `project-kit/context/library-docs.md` | Signed-out reset pattern subsection | DONE |
| `docs/POSTHOG_SIGN_OUT_RESET.md` | NEW operational notes | DONE |
| `docs/POSTHOG_PRIVACY_IMPLEMENTATION.md` | Feature 59 checklist item | DONE |
| `research/POSTHOG_CONFIGURATION_AUDIT.md` | §5.3 Feature 59 footprint | DONE |
| `research/POSTHOG_SIGN_OUT_RESET.md` | THIS FILE | DONE |
| `project-kit/context/progress-tracker.md` | Feature 59 DONE → Goal 60 | DONE (after gates) |
| Agent skills | `verify-posthog-instrumentation`, `check-posthog-loading` installed | DONE |

## 5. Generated Project Rule
Any Foundrie-generated app that uses PostHog + session auth MUST:
1. Call `posthog.reset()` on every signed-out mount after auth hydration.
2. Cite Context7 `/posthog/posthog-js` for the `reset()` contract.
3. Ship matching docs + research artifacts and the same Hard Rule 0 gates.

## 6. References
- Feature 59 spec
- `docs/POSTHOG_SIGN_OUT_RESET.md`
- `docs/POSTHOG_PRIVACY_IMPLEMENTATION.md`
- `research/POSTHOG_CONFIGURATION_AUDIT.md`
