# Contributing to Foundrie AI

Foundrie AI follows a strict, high-precision engineering workflow. All contributors (human and AI) must adhere to the standards defined in the root of this project.

## 1. Mandatory Reading

Before submitting any changes, you must read:

1. `AGENTS.md`: The canonical agent workflow and implementation rules.
2. `ARTKINS_STYLE_GUIDE.md`: The full engineering, UX, and quality policy.

## 2. Implementation Rules

- **One Feature at a Time**: Features must be implemented in strict numeric order from `Context_Features_Issues/feature-specs/`. Never batch multiple specs into one PR.
- **Planning Gate**: Every implementation-impacting change requires a concrete, user-approved implementation plan before work begins.
- **No AI Slope**: Avoid verbosity, padding, and performative output. Code should be self-documenting; comments explain *why*, not *what*.
- **Research First**: Use Context7 to verify current library documentation and APIs before committing code.

## 3. Workflow

1. Read the current numbered feature spec.
2. Create an implementation plan and obtain user approval.
3. Implement the feature within its scope.
4. Test locally.
5. Update `Context_Features_Issues/context/progress-tracker.md`.
6. Submit a Pull Request.
7. Address all CodeRabbit findings until the review is clean.
8. Only mark a spec as done after GitHub review is finalized.

## 4. Code Standards

- **Next.js 16**: Use App Router with root-level directories (`app/`, `components/`, etc.).
- **TypeScript**: Strict mode only. No `any`.
- **Styling**: Tailwind CSS v4 and shadcn/ui.
- **Authorization**: Every user-owned read/write must be scoped by authenticated `user.id`. Ownership failures return 404.

Thank you for building with Foundrie AI.
