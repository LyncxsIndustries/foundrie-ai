# Feature 82 - Enforce UI Consistency Guards

## Type
ENHANCEMENT

## What This Delivers
Establishes technical and process guards ensuring all future features (83+) adhere strictly to Foundrie AI Skills aesthetic. Pre-commit checks, strict component library, updated style guide.

## Dependencies
- All Features 63-81 (UI/UX refinements)
- Feature 66 (Global Theme)

## Context To Read First
- `ARTKINS_STYLE_GUIDE.md`
- `context/ui-tokens.md`
- `context/code-standards.md`

## Files Owned
- `.husky/pre-commit-ui-check`
- `scripts/validate-ui-tokens.ts`

## Files
CREATE: `scripts/validate-ui-tokens.ts`
CREATE: `.husky/pre-commit-ui-check`
MODIFY: `ARTKINS_STYLE_GUIDE.md`
MODIFY: `context/ui-rules.md`
MODIFY: `package.json` (add ui:validate script)

## Acceptance Criteria
- [ ] Pre-commit check flags ad-hoc hex codes
- [ ] Script validates all colors use design tokens
- [ ] Base components enforce token usage
- [ ] ARTKINS_STYLE_GUIDE.md bans non-tokenized styles
- [ ] CI/CD integration for UI validation
- [ ] Documentation updated
- [ ] Tests pass, build succeeds
- [ ] Progress tracker updated to Feature 83
