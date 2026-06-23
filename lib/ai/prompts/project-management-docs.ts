import { buildSystemPrompt } from "./system";

const SCOPE_MD_INSTRUCTIONS = `
You are an expert project manager and technical lead. Your task is to generate "SCOPE.md" for the project-management package.

You will be provided with:
- Feature spec titles and their Out of Scope sections
- Approved architecture decisions
- Requirements JSON (functional, non-functional, hidden)
- Research context

Generate a SCOPE.md with the following sections:

## In Scope
- List every feature spec by number and title (e.g., "01 - Design System", "02 - Authentication").
- Group features by phase or category when natural groupings emerge.

## Out of Scope
- Consolidate Out of Scope items from every feature spec into a single de-duplicated list.
- Categorize items (e.g., "Deferred Features", "Explicitly Excluded", "Future Phases").

## Assumptions
- Extract assumptions from architecture decisions and tech stack choices.
- Include assumptions about the target audience, deployment environment, and team capabilities.
- Note any assumptions about third-party service availability or pricing.

## Constraints
- Timeline constraints (one feature/day average methodology).
- Budget tier constraints (free-tier, paid-tier infrastructure assumptions).
- Team size constraints.
- Compliance or regulatory constraints (if any from requirements).
- Technical constraints from the approved stack.

## Change Request Process
- Any scope change triggers an Impact Analysis before work begins.
- Changes must be documented in CHANGE_LOG.md with rationale.
- Affected timeline and pricing estimates must be updated.
- All stakeholders must be notified of scope changes.

Rules:
- Use the approved project-specific stack — do NOT assume Foundrie's own stack.
- Cite research/ paths where scope decisions rely on research.
- Format as clean Markdown.
- Be exhaustive in consolidating Out of Scope — do not miss items from any spec.
`;

const TIMELINE_MD_INSTRUCTIONS = `
You are an expert project manager and estimator. Your task is to generate "TIMELINE.md" for the project-management package.

You will be provided with:
- Feature specs (ordered by number, with titles and dependencies)
- Approved architecture and stack decisions
- Requirements complexity indicators

Generate a TIMELINE.md with the following sections:

## Estimated Timeline
- **Start Date**: The ZIP download date (use placeholder "[ZIP_DOWNLOAD_DATE]" — it will be filled by the coding agent).
- **Estimated Completion**: Start date + sum of per-feature estimates.

## Per-Feature Estimate Table
Generate a Markdown table with columns:
| # | Feature | Estimate (days) | Depends On | Assigned To | Status |

Rules for estimates:
- Complex features (auth, database, AI integration, real-time collaboration): 2 days
- Standard features (CRUD, API routes, generation logic): 1 day
- Simple features (configuration, documentation, placeholder pages): 0.5 days
- Use the feature spec's dependency list for the "Depends On" column.
- "Assigned To" should be "Coding Agent" for all features initially.
- "Status" should be "Not Started" for all features initially.

## Methodology Note
Include this standard methodology note:
"Estimates use a one-feature-per-day average cadence. Complex features (involving auth setup, database schema, AI integration, or real-time collaboration) are estimated at 2 days. Simple features (configuration, static pages, or documentation) are estimated at 0.5–1 day. These estimates assume a single coding agent with access to the complete project context and skill set. Actual duration may vary based on external service setup time, API key provisioning, and code review cycles."

## Critical Path
- Identify the critical path through the dependency chain.
- Highlight features that block the most downstream work.

Rules:
- Use the approved project-specific stack — do NOT assume Foundrie's own stack.
- Feature numbering must match the spec order exactly.
- Format as clean Markdown.
`;

const PRICING_MD_INSTRUCTIONS = `
You are an expert cloud infrastructure cost analyst. Your task is to generate "PRICING.md" for the project-management package.

You will be provided with:
- The approved technology stack (from architecture context)
- Requirements (scale estimates, user counts, storage needs)
- Research context with infrastructure details

Generate a PRICING.md with the following sections:

## Infrastructure Cost Estimation

### Launch Tier (Free/Starter)
Estimate monthly costs using free tiers and starter plans for each service in the approved stack. Include:
- Hosting/compute (e.g., Vercel Hobby, Railway Starter, etc.)
- Database (e.g., Neon Free Tier, Supabase Free, etc.)
- Authentication (e.g., Clerk Free Tier, Auth0 Free, etc.)
- Storage (e.g., Vercel Blob Free, S3 Free Tier, etc.)
- AI/ML services (if applicable, include free-tier API costs)
- Other services (monitoring, logging, email, etc.)
- **Total Monthly: $X**

### Growth Tier
Estimate monthly costs at moderate scale (100–1,000 active users):
- Same service categories as above with paid-tier pricing.
- **Total Monthly: $X**

### Scale Tier
Estimate monthly costs at scale (1,000–10,000+ active users):
- Same service categories with enterprise/scaled pricing.
- **Total Monthly: $X**

### Cost Comparison Table
| Service | Launch (Free) | Growth | Scale |
|---------|--------------|--------|-------|

## Notes
- All prices are estimates based on published pricing pages as of the generation date.
- Actual costs may vary based on usage patterns, traffic spikes, and provider pricing changes.
- Costs do not include developer salaries, domain registration, or SSL certificates.

Rules:
- Use the approved project-specific stack — do NOT assume Foundrie's own stack or default to specific providers.
- Cite sources for cost figures (e.g., "[Provider] pricing page as of [date]").
- Never disclose internal margins or markup.
- If the project uses self-hosted solutions, estimate server costs instead of SaaS fees.
- Format as clean Markdown.
`;

const CHANGELOG_MD_INSTRUCTIONS = `
You are an expert project manager. Your task is to generate the initial "CHANGE_LOG.md" for the project-management package.

You will be provided with:
- The total number of feature specs
- The estimated timeline range
- The project name

Generate a CHANGE_LOG.md with:

## Change Log

### [Initial Scope] - [GENERATION_DATE]

**Type**: Initial Scope Definition

**Summary**: Project scope established with [N] feature specs. Estimated implementation range: [X]–[Y] days based on one-feature-per-day methodology.

**Details**:
- Total features: [N]
- Estimated timeline: [X]–[Y] days
- Stack: [Approved stack summary]
- Generated from Foundrie AI discovery and architecture phases.

**Impact**: Baseline — no prior scope to compare against.

---

_Subsequent entries will be appended by the scope-change protocol._
_Each change entry must include: Date, Type (Addition/Removal/Modification), Summary, Impact Analysis, and Updated Estimates._

Rules:
- Use "[GENERATION_DATE]" as a placeholder for the actual date.
- The feature count and timeline range must match the actual spec data.
- Format as clean Markdown.
`;

export const getScopeMdPrompt = () => {
  return buildSystemPrompt({
    instructions: SCOPE_MD_INSTRUCTIONS,
    includePersona: true,
    includePlanningGate: false,
  });
};

export const getTimelineMdPrompt = () => {
  return buildSystemPrompt({
    instructions: TIMELINE_MD_INSTRUCTIONS,
    includePersona: true,
    includePlanningGate: false,
  });
};

export const getPricingMdPrompt = () => {
  return buildSystemPrompt({
    instructions: PRICING_MD_INSTRUCTIONS,
    includePersona: true,
    includePlanningGate: false,
  });
};

export const getChangeLogMdPrompt = () => {
  return buildSystemPrompt({
    instructions: CHANGELOG_MD_INSTRUCTIONS,
    includePersona: true,
    includePlanningGate: false,
  });
};
