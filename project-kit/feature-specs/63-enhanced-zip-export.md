# Feature 63 - Enhanced ZIP Export with Media

## Type

MODIFICATION (modifies Feature 30 - ZIP Builder)

## What This Delivers

Enhanced ZIP generation that downloads all Cloudinary media files and organizes them into category-based folders within `/research`. Generates `/research/FILES.md` manifest with metadata, AI analysis notes, and upload timestamps. Ensures exported ZIPs are fully self-contained with no external dependencies (all media included as actual files, not just URLs).

## Dependencies

- Feature 30 (ZIP Builder) provides base ZIP generation.
- Feature 55 (Research Phase Media Management) provides categorized media files.
- Feature 54 (Enhanced Discovery Chat UI) provides Cloudinary upload infrastructure.
- Feature 08 (Visual and Motion Research Analysis) provides AI analysis data.

## Context To Read First

- `context/architecture-context.md` (Media Storage Architecture section)
- `context/library-docs.md` (Cloudinary download patterns)
- `context/build-plan.md` (Phase 12: Enhanced ZIP Export with Media)
- `context/progress-tracker.md`

## Context7 Docs To Check

- Cloudinary Node SDK for asset downloads
- JSZip for adding binary files

```bash
npx ctx7 library cloudinary "Download assets from Cloudinary URL"
npx ctx7 library jszip "Adding binary files to ZIP"
```

## Files Owned

- `lib/zip/download-media.ts`
- `lib/zip/generate-files-manifest.ts`

## Files

CREATE: `lib/zip/download-media.ts` - download Cloudinary files to buffers
CREATE: `lib/zip/generate-files-manifest.ts` - generate FILES.md with metadata
MODIFY: `lib/zip/build-project-zip.ts` - integrate media download and organization
MODIFY: `trigger/generate-project-zip.ts` - increase timeout for large media downloads
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Handle download failures gracefully (log error, continue with placeholder, don't fail entire ZIP).
- **CRITICAL**: Respect Cloudinary rate limits (add delays between downloads if needed).
- **CRITICAL**: Increase Trigger.dev timeout to 600s (10 minutes) for projects with many large media files.
- **CRITICAL**: Preserve original filenames and extensions.

### Media Download Logic

```typescript
// lib/zip/download-media.ts

import { cloudinary } from '@/lib/media/cloudinary';

export async function downloadCloudinaryAsset(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Failed to download ${url}:`, error);
    throw error;
  }
}

export interface MediaDownloadResult {
  success: boolean;
  fileName: string;
  category: string;
  buffer?: Buffer;
  error?: string;
  sourceUrl: string;
}

export async function downloadProjectMedia(
  researchFiles: Array<{
    fileName: string;
    category: string | null;
    cloudinaryUrl: string;
  }>
): Promise<MediaDownloadResult[]> {
  const results: MediaDownloadResult[] = [];

  for (const file of researchFiles) {
    try {
      const buffer = await downloadCloudinaryAsset(file.cloudinaryUrl);
      
      results.push({
        success: true,
        fileName: file.fileName,
        category: file.category || 'general',
        buffer,
        sourceUrl: file.cloudinaryUrl,
      });

      // Rate limiting: 100ms delay between downloads
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.push({
        success: false,
        fileName: file.fileName,
        category: file.category || 'general',
        error: error.message,
        sourceUrl: file.cloudinaryUrl,
      });
    }
  }

  return results;
}
```

### FILES.md Manifest Generation

```typescript
// lib/zip/generate-files-manifest.ts

import { formatDate } from 'date-fns';

interface ResearchFileMetadata {
  fileName: string;
  category: string;
  uploadedAt: Date;
  fileSize: number;
  tags: string[];
  aiDescription?: string;
  extractedText?: string;
}

export function generateFilesManifest(
  files: ResearchFileMetadata[],
  downloadResults: MediaDownloadResult[]
): string {
  // Group by category
  const categorized = files.reduce((acc, file) => {
    const category = file.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(file);
    return acc;
  }, {} as Record<string, ResearchFileMetadata[]>);

  const categories = Object.keys(categorized).sort();

  let manifest = '# Research Files\n\n';
  manifest += `Total files: ${files.length}\n\n`;
  manifest += '---\n\n';

  // Per-category sections
  for (const category of categories) {
    const categoryFiles = categorized[category];
    manifest += `## ${category.charAt(0).toUpperCase() + category.slice(1)} (${categoryFiles.length} files)\n\n`;

    for (const file of categoryFiles) {
      const downloadResult = downloadResults.find(r => r.fileName === file.fileName);
      
      manifest += `### ${file.fileName}\n\n`;
      manifest += `- **Uploaded:** ${formatDate(file.uploadedAt, 'yyyy-MM-dd HH:mm')}\n`;
      manifest += `- **Size:** ${(file.fileSize / 1024).toFixed(2)} KB\n`;
      
      if (file.tags.length > 0) {
        manifest += `- **Tags:** ${file.tags.join(', ')}\n`;
      }

      if (downloadResult && !downloadResult.success) {
        manifest += `- **⚠️ Download Failed:** ${downloadResult.error}\n`;
        manifest += `- **Source URL:** ${downloadResult.sourceUrl}\n`;
      }

      if (file.aiDescription) {
        manifest += `- **AI Analysis:** ${file.aiDescription}\n`;
      }

      if (file.extractedText) {
        const preview = file.extractedText.slice(0, 200);
        manifest += `- **Extracted Text:** ${preview}${file.extractedText.length > 200 ? '...' : ''}\n`;
      }

      manifest += '\n';
    }

    manifest += '---\n\n';
  }

  return manifest;
}
```

### ZIP Builder Integration

```typescript
// lib/zip/build-project-zip.ts (updated)

// After fetching research files
const researchFiles = await tx.researchFile.findMany({
  where: { projectId },
  select: {
    fileName: true,
    category: true,
    cloudinaryUrl: true,
    fileSize: true,
    tags: true,
    aiDescription: true,
    extractedText: true,
    createdAt: true,
  },
});

// Download media
console.log(`Downloading ${researchFiles.length} media files...`);
const downloadResults = await downloadProjectMedia(researchFiles);

// Organize by category
const categoryFolders: Record<string, string> = {
  'inspiration': 'research/inspiration/',
  'wireframes': 'research/wireframes/',
  'branding': 'research/branding/',
  'technical-docs': 'research/technical-docs/',
  'competitors': 'research/competitors/',
  'general': 'research/general/',
};

// Add files to ZIP
for (const result of downloadResults) {
  const folder = categoryFolders[result.category] || 'research/general/';
  
  if (result.success && result.buffer) {
    zip.file(`${folder}${result.fileName}`, result.buffer);
  } else {
    // Placeholder for failed downloads
    const placeholder = `# Download Failed

Original URL: ${result.sourceUrl}
Error: ${result.error}

This file could not be downloaded during ZIP generation. You can download it manually from the URL above.`;
    
    zip.file(`${folder}${result.fileName}.txt`, placeholder);
  }
}

// Generate and add manifest
const manifest = generateFilesManifest(researchFiles, downloadResults);
zip.file('research/FILES.md', manifest);
```

### Trigger.dev Timeout Extension

```typescript
// trigger/generate-project-zip.ts

export const generateProjectZip = task({
  id: 'generate-project-zip',
  maxDuration: 600, // 10 minutes (up from 5 minutes) for large media downloads
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: { projectId: string; userId: string }) => {
    // ... existing logic with media download integration
  },
});
```

### Error Handling Strategy

**Graceful degradation for download failures:**

1. **Individual file failure**: Log error, create placeholder file, continue with other files
2. **Partial batch failure**: Include successful downloads, document failed ones in FILES.md
3. **Complete failure**: Include FILES.md with all URLs as fallback, no binary files
4. **Rate limit errors**: Retry with exponential backoff (3 attempts max)

### ZIP Structure (Enhanced)

```
{project-slug}_{timestamp}.zip
├── AGENTS.md
├── ARTKINS_STYLE_GUIDE.md
├── .env.example
├── .npmrc
├── .github/
├── .agents/skills/
├── context/
│   ├── project-overview.md
│   ├── architecture-context.md
│   ├── build-plan.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── ai-workflow-rules.md
│   └── progress-tracker.md
├── feature-specs/
│   ├── 01-design-system.md
│   ├── 02-auth.md
│   └── ... (all specs)
├── diagrams/
│   ├── structural/
│   ├── behavioral/
│   └── ... (all diagrams)
├── research/                        ← ENHANCED
│   ├── FILES.md                    ← NEW: Manifest with metadata
│   ├── inspiration/                 ← NEW: Downloaded images
│   │   ├── hero-design.png
│   │   └── color-palette.jpg
│   ├── wireframes/                  ← NEW: Downloaded wireframes
│   │   ├── dashboard-mockup.pdf
│   │   └── mobile-flow.png
│   ├── branding/                    ← NEW: Downloaded brand assets
│   │   ├── logo.svg
│   │   └── style-guide.pdf
│   ├── technical-docs/              ← NEW: Downloaded docs
│   │   └── api-spec.pdf
│   ├── competitors/                 ← NEW: Competitor analysis
│   │   └── competitor-screenshot.png
│   └── general/                     ← NEW: Uncategorized
│       └── notes.txt
├── requirements/
├── project-management/
├── docs/
└── prompts/ (if applicable)
```

### Performance Considerations

**Optimization strategies:**

1. **Parallel downloads**: Use `Promise.all` with concurrency limit (5 simultaneous downloads max)
2. **Streaming**: Stream large files directly to ZIP without loading entirely into memory
3. **Compression**: Disable ZIP compression for images/videos (already compressed)
4. **Progress tracking**: Update Trigger.dev metadata with download progress

```typescript
// Parallel downloads with concurrency limit
async function downloadWithConcurrency(
  files: ResearchFile[],
  concurrency: number = 5
): Promise<MediaDownloadResult[]> {
  const results: MediaDownloadResult[] = [];
  
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(file => downloadSingleFile(file))
    );
    results.push(...batchResults);
    
    // Update progress
    const progress = Math.round(((i + batch.length) / files.length) * 100);
    console.log(`Download progress: ${progress}%`);
  }
  
  return results;
}
```

## Out of Scope

- Video transcoding (videos exported as-is from Cloudinary)
- Image optimization (use Cloudinary-optimized versions)
- Automatic retry for failed downloads in exported ZIP (user must re-generate)
- Resumable ZIP generation (start from scratch on failure)

## Future Modifications

- Future features may add ZIP generation progress streaming to UI
- Future features may add selective media export (user chooses which files to include)
- Future features may add media compression settings (quality vs size tradeoff)

## Quality Gates

- Run `npm run test` and ensure it passes (minimum 8 new tests: 4 download logic, 2 manifest, 2 ZIP integration)
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Test with small project (3 files, < 5MB total)
- Test with large project (50+ files, > 100MB total)
- Test with failed downloads (simulate Cloudinary errors)

## Acceptance Criteria

- [ ] downloadCloudinaryAsset() downloads file and returns Buffer
- [ ] downloadCloudinaryAsset() throws error on HTTP failures
- [ ] downloadProjectMedia() downloads all files with rate limiting (100ms delay)
- [ ] downloadProjectMedia() continues on individual failures (doesn't fail entire batch)
- [ ] generateFilesManifest() groups files by category
- [ ] Manifest includes filename, upload date, size, tags, AI description, extracted text
- [ ] Manifest documents download failures with source URLs
- [ ] ZIP includes category folders: inspiration, wireframes, branding, technical-docs, competitors, general
- [ ] Downloaded files added to ZIP with original filenames
- [ ] Failed downloads have placeholder .txt files with error details
- [ ] FILES.md manifest included at /research/FILES.md
- [ ] Trigger.dev timeout increased to 600s (10 minutes)
- [ ] Parallel downloads with concurrency limit (5 simultaneous)
- [ ] Progress logged during download (percentage updates)
- [ ] Non-owner access returns 404
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes with no warnings
- [ ] CodeRabbit review completed (recommended quality gate)