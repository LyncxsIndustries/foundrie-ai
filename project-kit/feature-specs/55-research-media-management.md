# Feature 55 - Research Phase Media Management

## Type

ENHANCEMENT

## What This Delivers

Enhanced research workspace with category-based media organization, AI-powered analysis, bulk operations, and filtered gallery views. Users upload files during discovery (images, videos, PDFs, documents), categorize them (inspiration, wireframes, branding, technical-docs, competitors, general), tag with custom labels, trigger AI analysis to extract text and generate descriptions, and export organized media to ZIP with proper folder structure (`/research/{category}/{filename}`).

## Dependencies

- Feature 54 (Enhanced Discovery Chat UI with File Upload) must be complete for the upload infrastructure.
- Feature 08 (Visual and Motion Research Analysis) provides the AI analysis foundation.
- Feature 07 (Research Library) provides the base ResearchAsset and ResearchDocument models.

## Context To Read First

- `context/architecture-context.md` (Media Storage Architecture section)
- `context/ui-registry.md` (MediaGallery component)
- `context/library-docs.md` (Cloudinary integration patterns)
- `context/build-plan.md` (Phase 5: Research Phase Media Management)
- `context/progress-tracker.md`

## Context7 Docs To Check

- Cloudinary Node SDK for advanced transformations and metadata queries
- React Query for optimistic updates during bulk operations

```bash
npx ctx7 library cloudinary "How to query assets by custom metadata tags"
npx ctx7 library @tanstack/react-query "Optimistic updates for bulk mutations"
```

## Files Owned

- `components/research/MediaGallery.tsx`
- `components/research/CategoryFilter.tsx`
- `components/research/FileCard.tsx`
- `components/research/BulkActionsBar.tsx`
- `lib/media/categories.ts`
- `lib/media/bulk-operations.ts`
- `app/api/research/[projectId]/files/bulk/route.ts`
- `app/api/research/[projectId]/analyze/route.ts` (enhanced from Feature 08)

## Files

CREATE: `components/research/MediaGallery.tsx` - main gallery with grid layout, filtering, search
CREATE: `components/research/CategoryFilter.tsx` - dropdown filter with category counts
CREATE: `components/research/FileCard.tsx` - individual file card with thumbnail, metadata, actions
CREATE: `components/research/BulkActionsBar.tsx` - sticky bar for multi-select operations
CREATE: `lib/media/categories.ts` - category definitions and validation
CREATE: `lib/media/bulk-operations.ts` - batch update/delete logic
CREATE: `app/api/research/[projectId]/files/bulk/route.ts` - bulk operations endpoint
MODIFY: `app/api/research/[projectId]/analyze/route.ts` - add batch analysis support
MODIFY: `lib/zip/build-project-zip.ts` - organize media by category in ZIP export
MODIFY: `app/(app)/projects/[projectId]/research/page.tsx` - mount MediaGallery
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For Cloudinary advanced features (metadata queries, batch transformations), provide step-by-step setup instructions including dashboard configuration for custom metadata fields.
- **CRITICAL**: Ensure all UI components follow `ui-rules.md` fixed scrolling layout (gallery scrolls, header/sidebar fixed) and `ui-tokens.md` Lynx Theme Pro styling.

### Category System

Define 6 standard categories in `lib/media/categories.ts`:

```typescript
export const MEDIA_CATEGORIES = [
  { id: 'inspiration', label: 'Inspiration', icon: 'Sparkles', description: 'Design inspiration, mood boards, reference sites' },
  { id: 'wireframes', label: 'Wireframes', icon: 'Layout', description: 'Sketches, wireframes, mockups, prototypes' },
  { id: 'branding', label: 'Branding', icon: 'Palette', description: 'Logos, brand guidelines, color palettes, typography' },
  { id: 'technical-docs', label: 'Technical Docs', icon: 'FileText', description: 'API docs, architecture diagrams, spec sheets' },
  { id: 'competitors', label: 'Competitors', icon: 'TrendingUp', description: 'Competitor screenshots, feature comparisons' },
  { id: 'general', label: 'General', icon: 'Folder', description: 'Uncategorized research files' },
] as const;

export type MediaCategory = typeof MEDIA_CATEGORIES[number]['id'];
```

### MediaGallery Component

**Layout:**
- Responsive grid: 1 col mobile, 3 col tablet, 4 col desktop
- Category filter dropdown at top with counts (e.g., "Wireframes (12)")
- Search input for filename/tag filtering
- Bulk selection mode toggle
- Empty state when no files or filtered results empty

**Interactions:**
- Click file card → open lightbox with full preview
- Checkbox for multi-select (visible in bulk mode)
- Hover shows quick actions: edit category, delete, analyze
- Drag-and-drop to reorder within category (save order to DB)

**Performance:**
- Virtual scrolling for 100+ files using `@tanstack/react-virtual`
- Image lazy loading with Next.js Image component
- Optimistic updates for category changes

### Bulk Operations

**Supported operations via `BulkActionsBar`:**
1. **Change Category**: Update all selected files to new category (atomic transaction)
2. **Add Tags**: Append tags to selected files (comma-separated input)
3. **Trigger AI Analysis**: Batch analyze selected files (queue job per file)
4. **Delete**: Bulk delete with confirmation modal showing count

**API Contract:**

```typescript
// POST /api/research/[projectId]/files/bulk
{
  operation: 'update-category' | 'add-tags' | 'analyze' | 'delete',
  fileIds: string[],
  data?: {
    category?: MediaCategory,
    tags?: string[],
  }
}

// Response
{
  success: true,
  updatedCount: number,
  errors?: Array<{ fileId: string, error: string }>
}
```

### AI Analysis Enhancement

Extend Feature 08's analysis endpoint to support batch processing:

```typescript
// POST /api/research/[projectId]/analyze
{
  fileIds: string[], // Single or multiple
  analysisType: 'vision' | 'ocr' | 'full' // full = vision + OCR
}

// Response
{
  results: Array<{
    fileId: string,
    aiDescription: string,
    extractedText?: string,
    status: 'success' | 'error',
    error?: string
  }>
}
```

**Analysis Pipeline:**
1. Fetch file URLs from `ResearchFile` by `fileIds`
2. Download images from Cloudinary
3. Call `callAI('visual_analysis')` per file with vision-capable model
4. For PDFs/images with text, call OCR service or vision model with text extraction
5. Atomically update `ResearchFile.aiDescription` and `extractedText` fields
6. Return results array with per-file status

### ZIP Export Organization

Modify `lib/zip/build-project-zip.ts` to organize media by category:

```typescript
// Before: /research/assets/{filename}
// After:  /research/{category}/{filename}

const categoryFolders = {
  'inspiration': 'research/inspiration/',
  'wireframes': 'research/wireframes/',
  'branding': 'research/branding/',
  'technical-docs': 'research/technical-docs/',
  'competitors': 'research/competitors/',
  'general': 'research/general/',
};

for (const file of researchFiles) {
  const folder = categoryFolders[file.category || 'general'];
  const buffer = await downloadCloudinaryAsset(file.cloudinaryUrl);
  zip.file(`${folder}${file.fileName}`, buffer);
}
```

Generate `/research/FILES.md` manifest:

```markdown
# Research Files

## Inspiration (5 files)
- hero-design.png - Uploaded 2026-07-01 - Tags: dark-theme, hero-section
- color-palette.jpg - Uploaded 2026-07-01 - Tags: branding, colors

## Wireframes (12 files)
...

## AI Analysis Notes
- hero-design.png: "Dark theme hero section with gradient background and CTA button"
- dashboard-mockup.pdf: "Dashboard layout with sidebar navigation and metric cards"
```

### Database Schema (Already Exists from Feature 07)

Verify `ResearchFile` model has required fields:

```prisma
model ResearchFile {
  id                 String   @id @default(cuid())
  projectId          String
  project            Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  cloudinaryPublicId String
  cloudinaryUrl      String
  format             String   // "jpg", "mp4", "pdf"
  fileType           String   // "image", "video", "document"
  fileName           String
  fileSize           Int
  
  category           String?  // NEW: "inspiration", "wireframes", etc.
  tags               String[] // NEW: ["dark-theme", "hero-section"]
  
  aiDescription      String?  // AI-generated description
  extractedText      String?  // OCR/document text extraction
  
  order              Int      @default(0) // NEW: for drag-and-drop reordering
  
  createdAt          DateTime @default(now())
  uploadedBy         String
  
  @@index([projectId, category])
  @@index([projectId, order])
}
```

**Migration needed:**
- Add `category` field (nullable String)
- Add `tags` field (String array)
- Add `order` field (Int, default 0)
- Add indexes for category filtering and ordering

## Out of Scope

- Video frame extraction (deferred to future feature)
- Advanced image transformations beyond Cloudinary defaults
- Collaborative tagging with multiple users (single-user tagging only)
- Version history for file replacements

## Future Modifications

- Feature 62 (Enhanced ZIP Export) will use category-organized structure
- Future features may add AI-suggested tags based on visual analysis
- Future features may add similarity search across uploaded images

## Quality Gates

- Run `npm run test` and ensure it passes (minimum 15 new tests: 5 MediaGallery, 3 bulk operations, 4 API routes, 3 ZIP export)
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Test with 100+ files for performance validation (virtual scrolling, lazy loading)

## Acceptance Criteria

- [ ] MediaGallery displays files in responsive grid (1-3-4 columns)
- [ ] Category filter dropdown shows categories with file counts
- [ ] Search filters files by filename and tags in real-time
- [ ] Users can change category for single file (dropdown on card)
- [ ] Users can select multiple files and bulk change category
- [ ] Users can bulk add tags to selected files
- [ ] Users can bulk trigger AI analysis on selected files
- [ ] Users can bulk delete files with confirmation modal
- [ ] AI analysis generates descriptions and extracts text from images/PDFs
- [ ] Analysis results saved to `aiDescription` and `extractedText` fields
- [ ] ZIP export organizes files into category folders (`/research/wireframes/`, etc.)
- [ ] ZIP export includes `/research/FILES.md` manifest with metadata and AI notes
- [ ] Empty state shown when no files exist or filtered results empty
- [ ] Lightbox opens on file click with full preview
- [ ] Drag-and-drop reordering within category updates `order` field
- [ ] Non-member access returns 404 (uses `requireProjectMember`)
- [ ] Performance: Virtual scrolling for 100+ files, lazy image loading
- [ ] Accessibility: Keyboard navigation, screen reader labels, focus indicators
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes
- [ ] CodeRabbit review completed (recommended quality gate)