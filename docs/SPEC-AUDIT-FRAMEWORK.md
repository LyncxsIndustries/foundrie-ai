# Feature Spec Audit Framework

## Objective

Ensure that by the time we reach the final implementation spec (Feature 64: Test, Validation & Deployment), ALL "Out of Scope" and "Future Modifications" items from previous specs have been:

1. **Implemented** in the spec that actually needs them
2. **Documented** with clear cross-references
3. **Resolved** so no pending implementations remain

## Principles

### 1. Just-In-Time Implementation
- Feature 1 may defer something to "Out of Scope"
- Feature 7 implements it because that's when it's actually needed
- By Feature 64, all deferments are resolved

### 2. MVP-First Phasing (For Generated Projects)
Foundrie generates projects in stages:

**Stage 1: MVP** (Always first)
- Core features only
- User feedback collection
- Investor pitching capability
- Data gathering for improvement

**Stage 2+: Enhancements**
- User explicitly confirms moving to next stage
- Each phase builds on previous data
- Spec modifications accepted between stages
- Contract sync gates enforced

**Final Stage: Production Ready**
- All Out of Scope items implemented
- Only Post-Production enhancements remain
- Full system testing and deployment

### 3. Honest Deferrals Only
Items that remain in "Out of Scope" by Feature 64 must be:
- Genuinely post-production enhancements
- Not critical for MVP or production launch
- Maintenance-phase features
- Future business expansion features

## Audit Strategy

### Phase 1: Extract All Deferrals
Script to extract:
- All "Out of Scope" sections (Features 01-63)
- All "Future Modifications" sections (Features 01-63)
- Group by theme (auth, AI, canvas, ZIP, research, etc.)

### Phase 2: Map Dependencies
For each deferred item:
1. Which spec deferred it?
2. Which spec actually needs it?
3. Is it implemented in that spec?
4. If not, where should it go?

### Phase 3: Distribute Items
Rules for distribution:
- **Database changes** → Go to the spec that first queries that field
- **API endpoints** → Go to the spec that first calls that endpoint
- **UI components** → Go to the spec that first renders that component
- **AI features** → Go to the spec that first generates that content
- **ZIP structure** → Go to Feature 30 (ZIP Builder) or Feature 63 (Enhanced ZIP Export)

### Phase 4: Create Resolution Plan
For each deferred item, document:
```markdown
## Deferred Item: [Name]
- **Originally Deferred In**: Feature XX
- **Reason for Deferral**: Not needed yet
- **Should Be Implemented In**: Feature YY
- **Current Status**: ❌ Not implemented / ✅ Already implemented
- **Action Required**: Add to Feature YY spec / Already resolved
```

## Common Deferral Categories

### 1. Authentication & Authorization
- **Deferred in**: Features 02-03
- **Common items**: Team workspaces, RBAC, custom roles, audit logs
- **Should implement in**: Features 35-42 (Collaboration) or honestly defer to Post-V1

### 2. Database Schema Extensions
- **Deferred in**: Feature 03
- **Common items**: Extra fields, indexes, relations
- **Should implement in**: First spec that queries those fields

### 3. AI Generation Enhancements
- **Deferred in**: Features 05, 10-13, 22-29
- **Common items**: Advanced prompts, multi-model comparison, quality scoring
- **Should implement in**: Feature 62 (Master Prompt) or defer to Post-V1

### 4. Canvas & Diagram Features
- **Deferred in**: Features 14-21
- **Common items**: Advanced node types, collaborative editing, version history
- **Should implement in**: Feature 45 (Architecture Approval Gate) or Feature 51 (GitHub Integration)

### 5. ZIP Export Structure
- **Deferred in**: Features 07-09, 22-29, 30-32
- **Common items**: Research assets, diagram PNGs, media files, manifest
- **Should implement in**: Feature 63 (Enhanced ZIP Export)

### 6. Research & Media Management
- **Deferred in**: Features 07-09
- **Common items**: Video frame extraction, AI tagging, similarity search, categorization
- **Should implement in**: Feature 55 (Research Media Management) - ALREADY DOCUMENTED

### 7. Real-time & Collaboration
- **Deferred in**: Features 31-32 (Progress tracking)
- **Common items**: WebSocket streaming, Liveblocks realtime
- **Should implement in**: NOW - We just implemented Liveblocks realtime! ✅

## Example: Feature 55 Audit

From your message:
```
'Migration needed:
- Add category field (nullable String)
- Add tags field (String array)
- Add order field (Int, default 0)
- Add indexes for category filtering and ordering

Out of Scope:
- Video frame extraction (deferred to future feature)
- Advanced image transformations beyond Cloudinary defaults
- Collaborative tagging with multiple users (single-user tagging only)
- Version history for file replacements

Future Modifications:
- Feature 62 (Enhanced ZIP Export) will use category-organized structure
- Future features may add AI-suggested tags based on visual analysis
- Future features may add similarity search across uploaded images'
```

**Resolution:**
1. **category, tags, order fields** → Add to Feature 55 spec NOW (not deferred)
2. **Video frame extraction** → Add to Feature 55 or Feature 64 (test suite)
3. **Collaborative tagging** → Add to Features 39-42 (Collaboration) or defer Post-V1
4. **Version history** → Add to Feature 46 (Session Autosave) or defer Post-V1
5. **Feature 62 reference** → Update Feature 63 spec to document category-organized ZIP structure
6. **AI-suggested tags** → Add to Feature 55 AI analysis OR defer Post-V1
7. **Similarity search** → Add to Feature 07 (Research Library) search OR defer Post-V1

## Implementation Plan

### Step 1: Create Audit Script
```bash
# Extract all Out of Scope and Future Modifications
./scripts/audit-spec-deferrals.sh > docs/SPEC-AUDIT-REPORT.md
```

### Step 2: Review Audit Report
Manual review to categorize each item:
- ✅ Already implemented
- 📝 Should be added to Feature XX
- 🚫 Honestly defer to Post-V1

### Step 3: Update Specs
For each item needing implementation:
1. Add to the appropriate spec's **Implementation** section
2. Remove from "Out of Scope" in origin spec
3. Update "Future Modifications" with cross-reference

### Step 4: Final Verification
By Feature 64:
- Run audit script again
- Verify only honest Post-V1 items remain
- Ensure all critical features are implemented

## Quality Gates

Before merging any spec update:
1. ✅ Run `npm run sync:check` - Contract verification
2. ✅ Cross-reference all "See Feature XX" links
3. ✅ Verify database migrations include all deferred fields
4. ✅ Confirm API routes implement all deferred endpoints
5. ✅ Check ZIP structure includes all deferred assets

## Generated Project Guidelines

When Foundrie generates project specs:

### Stage Markers
```markdown
## Stage: MVP
This feature is part of the MVP stage. Implement only what's needed for core functionality.

## Stage: Enhancement
This feature requires MVP completion. Ask user for explicit approval before proceeding.

## Stage: Production Ready
This feature prepares the system for production deployment.
```

### Between-Stage Checkpoints
```markdown
## Stage Checkpoint

Before proceeding to the next stage:
1. ✅ All current stage features implemented
2. ✅ User feedback collected and reviewed
3. ✅ Performance metrics analyzed
4. ✅ User explicitly approves moving forward

**User Action Required:** Approve continuation to next stage
```

### Spec Modification Protocol
1. User provides feedback during any stage
2. Agent updates affected specs
3. Run `npm run sync:check` to verify contracts
4. Show user the updated plan
5. Get explicit approval before continuing

## Tools & Automation

### Audit Script (To Create)
```bash
#!/bin/bash
# scripts/audit-spec-deferrals.sh

echo "# Spec Deferral Audit Report"
echo ""
echo "Generated: $(date)"
echo ""

for file in project-kit/feature-specs/*.md; do
  spec_num=$(basename "$file" .md)
  
  echo "## $spec_num"
  echo ""
  
  # Extract Out of Scope
  echo "### Out of Scope"
  sed -n '/## Out of Scope/,/## Future Modifications/p' "$file" | head -n -1
  
  # Extract Future Modifications
  echo "### Future Modifications"
  sed -n '/## Future Modifications/,/## Quality Gates/p' "$file" | head -n -1
  
  echo ""
done
```

### Resolution Tracker
Track progress in `docs/SPEC-RESOLUTION-TRACKER.md`:
```markdown
| Item | Origin Spec | Should Implement In | Status | Notes |
|------|-------------|---------------------|--------|-------|
| Video frame extraction | 55 | 55 or 64 | ❌ TODO | Add to Feature 55 |
| Collaborative tagging | 55 | 39-42 | ❌ TODO | Add to Collaboration features |
| Category ZIP structure | 55 | 63 | ❌ TODO | Update Feature 63 |
```

## Success Criteria

By Feature 64 completion:
- ✅ All database fields from deferred migrations are implemented
- ✅ All API endpoints from deferred routes are implemented
- ✅ All UI components from deferred features are implemented
- ✅ ZIP structure includes all deferred assets
- ✅ Only honest Post-V1 enhancements remain in "Out of Scope"
- ✅ All specs have accurate cross-references
- ✅ Contract sync gates pass for all specs

## Post-V1 Enhancements (Honest Deferrals)

Items that can legitimately remain deferred:
- Advanced analytics and reporting
- Multi-language support
- Mobile app versions
- Advanced AI model comparisons
- Enterprise SSO integrations
- Custom white-label options
- Advanced compliance features (SOC2, HIPAA)
- Performance optimizations for 10x scale
