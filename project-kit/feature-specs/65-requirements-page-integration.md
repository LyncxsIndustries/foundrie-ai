# Feature 65 - Requirements Page Integration

## Type

ENHANCEMENT

## What This Delivers

Adjusts the flow from Discovery Chat to the Requirements page. "Generate Requirements" button now appears only in the Discovery Chat section when chat is marked DONE. After generation, the system automatically redirects to the Requirements page, fetches requirements from the database, loads them into the client store, and displays them immediately. After this feature, the requirements workflow is seamless with no manual refresh needed.

## Dependencies

- Feature 11 (Requirements Generation) - generates requirements
- Feature 12 (Requirements Review UI) - displays requirements
- Feature 64 (Discovery Chat State & Logic) - provides discoveryStatus DONE state
- Feature 63 (Discovery Chat UI Fixes) - UI refinements

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ui-rules.md`

## Context7 Docs To Check

```bash
npx ctx7 library next.js "router navigation and redirect"
npx ctx7 library zustand "store actions and state management"
```

## Files Owned

None - this feature modifies existing requirements and discovery files.

## Files

MODIFY: `components/discovery/DiscoveryChat.tsx` - add "Generate Requirements" button (shown only when status is DONE)
MODIFY: `components/requirements/RequirementsHeader.tsx` - remove "Generate Requirements" button from header
MODIFY: `app/api/requirements/generate/route.ts` - return requirements data in response
MODIFY: `stores/requirementsStore.ts` - add setRequirements action
MODIFY: `app/project/[projectId]/requirements/page.tsx` - auto-fetch and display on mount
UPDATE: `components/discovery/DiscoveryChat.test.tsx` - test conditional button rendering
UPDATE: `app/project/[projectId]/requirements/page.test.tsx` - test auto-display

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### Discovery Chat Button Logic

```tsx
// components/discovery/DiscoveryChat.tsx
const { discoveryStatus } = useProject(projectId);
const [isGenerating, setIsGenerating] = useState(false);

const handleGenerateRequirements = async () => {
  setIsGenerating(true);
  try {
    const response = await fetch(`/api/requirements/generate`, {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
    
    const { requirements } = await response.json();
    
    // Store requirements in client state
    requirementsStore.setRequirements(requirements);
    
    // Redirect to requirements page
    router.push(`/project/${projectId}/requirements`);
  } catch (error) {
    toast.error('Failed to generate requirements');
  } finally {
    setIsGenerating(false);
  }
};

return (
  <div>
    {/* Chat messages */}
    
    {discoveryStatus === 'DONE' && (
      <Button 
        onClick={handleGenerateRequirements}
        disabled={isGenerating}
        size="lg"
        className="mt-4"
      >
        {isGenerating ? 'Generating...' : 'Generate Requirements'}
      </Button>
    )}
  </div>
);
```

### Requirements Page Auto-Display

```tsx
// app/project/[projectId]/requirements/page.tsx
export default function RequirementsPage({ params }: { params: { projectId: string } }) {
  const { requirements } = useRequirementsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequirements = async () => {
      if (requirements.length > 0) {
        // Already loaded from generation redirect
        setLoading(false);
        return;
      }

      // Fetch from database if not in store
      try {
        const response = await fetch(`/api/requirements/${params.projectId}`);
        const data = await response.json();
        requirementsStore.setRequirements(data.requirements);
      } catch (error) {
        toast.error('Failed to load requirements');
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, [params.projectId]);

  if (loading) {
    return <RequirementsSkeleton />;
  }

  return <RequirementsDisplay requirements={requirements} />;
}
```

### Requirements Header Cleanup

```tsx
// components/requirements/RequirementsHeader.tsx
// REMOVE: "Generate Requirements" button (now in Discovery Chat only)
export function RequirementsHeader({ projectId }: { projectId: string }) {
  return (
    <div className="flex items-center justify-between">
      <h1>Requirements</h1>
      {/* Other header actions like Export, Edit */}
    </div>
  );
}
```

## Out of Scope

- Requirements editing UI (Feature 12)
- Requirements generation logic (Feature 11)
- Discovery chat state tracking (Feature 64)
- Requirements export (Feature 47)

## Future Modifications

- Future features may add requirements versioning
- Requirements may support collaborative editing

## Quality Gates

- Run `npm run sync:check` and ensure it passes
- Run `npm run security:all` and ensure it passes
- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes

## Acceptance Criteria

- [ ] "Generate Requirements" button removed from Requirements page header
- [ ] "Generate Requirements" button added to Discovery Chat, visible only when discoveryStatus is DONE
- [ ] Button is disabled and shows loading state during generation
- [ ] Generation API returns requirements data in response body
- [ ] Requirements are stored in client store after generation
- [ ] User is redirected to Requirements page after successful generation
- [ ] Requirements display automatically on page load without manual refresh
- [ ] If store is empty, page fetches requirements from database
- [ ] Loading skeleton shows while fetching
- [ ] Error handling with toast notifications on failure
- [ ] Conditional button rendering is tested
- [ ] Auto-display behavior is tested
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 66
- [ ] All quality gates pass
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

No new external accounts or API keys required. This feature modifies existing requirements workflow and state management.

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
