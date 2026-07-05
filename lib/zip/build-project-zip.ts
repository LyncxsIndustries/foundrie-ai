/**
 * ZIP Builder - Product Export Assembly
 * 
 * Assembles the complete Foundrie project export package.
 */

import { db } from '@/lib/db';
import { generateRootFolderName, buildZipPath } from './zip-structure';
import { ContextFileType } from '@/lib/generated/prisma/enums';
import { get } from '@vercel/blob';
import { getCategoryInfo } from '@/lib/media/categories';
import type { ZipBuildOptions } from '@/trigger/types';

interface BuildZipOptionsLegacy {
  includeResearchAssets?: boolean;
}

// Merge legacy options with new progress-enabled options
type BuildZipOptionsComplete = BuildZipOptionsLegacy & ZipBuildOptions;

/**
 * Error placeholder for missing diagram PNGs
 */
function createDiagramPlaceholder(diagramName: string, reason: string): string {
  return `# Diagram Placeholder: ${diagramName}

**Status**: Not available in this export

**Reason**: ${reason}

This diagram was planned but the PNG file is not yet available.
Please regenerate this diagram or check the diagram generation status.
`;
}

/**
 * Error placeholder for unavailable research assets
 */
function createAssetPlaceholder(assetName: string, sourceUrl: string | null, reason: string): string {
  return `# Research Asset Placeholder: ${assetName}

**Status**: Not available in this export

**Source URL**: ${sourceUrl || 'Not available'}

**Reason**: ${reason}

This research asset could not be included in the export package.
Please check the source URL or re-upload the asset.
`;
}

/**
 * Download research asset from Blob storage
 */
async function downloadBlobAsset(blobUrl: string): Promise<Buffer | null> {
  try {
    // Vercel Blob URLs are already public, use get() to download
    const result = await get(blobUrl, { access: 'public' });
    
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }
    
    // Read the stream into chunks
    const reader = result.stream.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    // Combine chunks into single buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    return Buffer.from(combined);
  } catch (error) {
    return null;
  }
}

/**
 * Main ZIP assembly function
 */
export async function buildProjectZip(
  projectId: string,
  options: BuildZipOptionsComplete = {}
): Promise<Buffer> {
  const { includeResearchAssets = true, onProgress } = options;
  
  // Helper to report progress
  const reportProgress = (step: string, percent: number) => {
    if (onProgress) {
      onProgress(step, percent);
    }
  };
  
  reportProgress("Starting ZIP build...", 0);

  // Fetch all data in a consistent snapshot
  reportProgress("Fetching project data...", 5);
  const projectData = await db.$transaction(
    async (tx) => {
      reportProgress("Loading project metadata...", 10);
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: {
          slug: true,
          name: true,
          contextFiles: {
            select: {
              fileType: true,
              content: true,
            },
            orderBy: { fileType: 'asc' },
          },
          featureSpecs: {
            select: {
              order: true,
              title: true,
              content: true,
            },
            orderBy: { order: 'asc' },
          },
          diagrams: {
            select: {
              id: true,
              name: true,
              diagramTypeId: true,
              category: true,
              orderInCategory: true,
              status: true,
              version: true,
              pngStorageUrl: true,
            },
            orderBy: [
              { category: 'asc' },
              { orderInCategory: 'asc' },
            ],
          },
          researchDocuments: {
            select: {
              title: true,
              content: true,
              sourceType: true,
            },
            orderBy: [
              { createdAt: 'asc' },
              { title: 'asc' },
            ],
          },
          researchAssets: {
            select: {
              fileName: true,
              storageUrl: true,
              mimeType: true,
              category: true,
              tags: true,
              aiDescription: true,
              order: true,
            },
            orderBy: [
              { category: 'asc' },
              { order: 'asc' },
              { createdAt: 'asc' },
            ],
          },
          agentSkills: {
            select: {
              slug: true,
              name: true,
              content: true,
            },
            orderBy: { slug: 'asc' },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      return project;
    },
    {
      isolationLevel: 'RepeatableRead',
    }
  );

  reportProgress("Creating ZIP structure...", 15);
  
  // Create ZIP instance
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const rootFolder = generateRootFolderName(projectData.slug);
  const root = zip.folder(rootFolder);
  if (!root) throw new Error('Failed to create root folder');

  reportProgress("Adding root files...", 20);
  
  // Add root files
  root.file('AGENTS.md', generateAgentsMd(projectData));
  root.file('ARTKINS_STYLE_GUIDE.md', getArtkinsStyeGuide());
  root.file('.env.example', generateEnvExample());
  root.file('.npmrc', 'save-exact=true\nengine-strict=true\n');

  reportProgress("Adding context files...", 25);
  
  // Add context files
  const contextFolder = root.folder('context');
  if (contextFolder) {
    for (const file of projectData.contextFiles) {
      const fileName = getContextFileName(file.fileType);
      contextFolder.file(fileName, file.content || '');
    }
  }

  reportProgress("Adding feature specifications...", 30);
  
  // Add feature specs
  const specsFolder = root.folder('feature-specs');
  if (specsFolder) {
    for (const spec of projectData.featureSpecs) {
      const fileName = `${String(spec.order).padStart(2, '0')}-${slugify(spec.title)}.md`;
      specsFolder.file(fileName, spec.content || '');
    }
  }

  reportProgress("Processing diagrams...", 35);
  
  // Add diagrams (mandatory - ZIP is invalid without this folder)
  const diagramsFolder = root.folder('diagrams');
  if (diagramsFolder) {
    const totalDiagrams = projectData.diagrams.length;
    let processedDiagrams = 0;
    
    for (const diagram of projectData.diagrams) {
      const categoryFolder = diagramsFolder.folder(diagram.category);
      if (!categoryFolder) continue;

      const typeFolder = categoryFolder.folder(diagram.diagramTypeId);
      if (!typeFolder) continue;

      // Add PNG (or placeholder)
      if (diagram.pngStorageUrl) {
        try {
          const pngBuffer = await downloadBlobAsset(diagram.pngStorageUrl);
          if (pngBuffer) {
            typeFolder.file(`${diagram.diagramTypeId}-v${diagram.version}.png`, pngBuffer);
          } else {
            typeFolder.file(
              `${diagram.diagramTypeId}-v${diagram.version}-placeholder.txt`,
              createDiagramPlaceholder(diagram.name, 'PNG file could not be downloaded from storage')
            );
          }
        } catch (error) {
          typeFolder.file(
            `${diagram.diagramTypeId}-v${diagram.version}-placeholder.txt`,
            createDiagramPlaceholder(diagram.name, 'Download failed')
          );
        }
      } else {
        typeFolder.file(
          `${diagram.diagramTypeId}-v${diagram.version}-placeholder.txt`,
          createDiagramPlaceholder(diagram.name, 'PNG not yet generated')
        );
      }

      // Note: Format-specific exports (Mermaid, SVG, DBML, OpenAPI, XState) 
      // are generated on-demand in Feature 21 and stored as separate files.
      // They are not part of the Diagram model in the database.
      // Future enhancement could add these as separate related records.
      
      // Report diagram progress (35-50% range)
      processedDiagrams++;
      const diagramPercent = 35 + Math.floor((processedDiagrams / totalDiagrams) * 15);
      reportProgress(`Processing diagram ${processedDiagrams}/${totalDiagrams}...`, diagramPercent);
    }
  }

  reportProgress("Adding research files...", 50);
  
  // Add research folder
  const researchFolder = root.folder('research');
  if (researchFolder) {
    researchFolder.file('PROJECT_RESEARCH.md', generateProjectResearchMd(projectData));

    reportProgress("Adding research documents...", 55);
    
    // Add research documents
    if (projectData.researchDocuments.length > 0) {
      const docsFolder = researchFolder.folder('documents');
      if (docsFolder) {
        for (const doc of projectData.researchDocuments) {
          if (doc.sourceType === 'REQUIREMENTS_EXPORT') continue;
          if (doc.sourceType === 'PROJECT_MANAGEMENT_EXPORT') continue;
          const fileName = `${slugify(doc.title)}.md`;
          docsFolder.file(fileName, doc.content || '');
        }
      }
    }

    reportProgress("Downloading research assets...", 60);
    
    // Add research assets (organized by category)
    if (includeResearchAssets && projectData.researchAssets.length > 0) {
      const assetsFolder = researchFolder.folder('assets');
      if (assetsFolder) {
        // Group assets by category
        const assetsByCategory = new Map<string, typeof projectData.researchAssets>();
        for (const asset of projectData.researchAssets) {
          const category = asset.category || 'general';
          if (!assetsByCategory.has(category)) {
            assetsByCategory.set(category, []);
          }
          assetsByCategory.get(category)!.push(asset);
        }

        const totalAssets = projectData.researchAssets.length;
        let processedAssets = 0;

        // Create category folders and add assets
        for (const [category, assets] of assetsByCategory.entries()) {
          const categoryFolder = assetsFolder.folder(category);
          if (!categoryFolder) continue;

          for (const asset of assets) {
            try {
              const buffer = await downloadBlobAsset(asset.storageUrl);
              if (buffer) {
                categoryFolder.file(asset.fileName, buffer);
              } else {
                categoryFolder.file(
                  `${asset.fileName}-placeholder.txt`,
                  createAssetPlaceholder(asset.fileName, asset.storageUrl, 'Could not download from storage')
                );
              }
            } catch (error) {
              categoryFolder.file(
                `${asset.fileName}-placeholder.txt`,
                createAssetPlaceholder(asset.fileName, asset.storageUrl, 'Download failed')
              );
            }
            
            // Report asset progress (60-70% range)
            processedAssets++;
            const assetPercent = 60 + Math.floor((processedAssets / totalAssets) * 10);
            reportProgress(`Downloading asset ${processedAssets}/${totalAssets}...`, assetPercent);
          }
        }

        // Generate FILES.md manifest
        assetsFolder.file('FILES.md', generateFilesManifest(projectData.researchAssets));
      }
    }
  }

  reportProgress("Adding requirements folder...", 70);
  
  // Add requirements folder
  const requirementsFolder = root.folder('requirements');
  if (requirementsFolder) {
    const reqDocs = projectData.researchDocuments.filter((d: any) => d.sourceType === 'REQUIREMENTS_EXPORT');
    if (reqDocs.length > 0) {
      for (const doc of reqDocs) {
        requirementsFolder.file(doc.title, doc.content || '');
      }
    } else {
      requirementsFolder.file('README.md', '# Requirements\n\nRequirements documentation will be added in future features.\n');
    }
  }

  // Add project management folder
  const pmFolder = root.folder('project-management');
  if (pmFolder) {
    const pmDocs = projectData.researchDocuments.filter((d: any) => d.sourceType === 'PROJECT_MANAGEMENT_EXPORT');
    if (pmDocs.length > 0) {
      for (const doc of pmDocs) {
        pmFolder.file(doc.title, doc.content || '');
      }
    } else {
      pmFolder.file('README.md', '# Project Management\n\nProject management documentation will be added in future features.\n');
    }
  }

  reportProgress("Adding documentation folders...", 72);
  
  // Add docs folder (placeholder structure for now)
  const docsFolder = root.folder('docs');
  if (docsFolder) {
    docsFolder.file('README.md', '# Documentation\n\nProduction documentation will be added in future features.\n');
  }

  reportProgress("Adding GitHub configuration...", 74);
  
  // Add .github folder
  const githubFolder = root.folder('.github');
  if (githubFolder) {
    githubFolder.file('CODEOWNERS', '# Code owners will be configured per project\n');
  }

  reportProgress("Adding agent skills...", 76);
  
  // Conditional: Add agent skills if present
  if (projectData.agentSkills.length > 0) {
    const agentsFolder = root.folder('.agents');
    if (agentsFolder) {
      const skillsFolder = agentsFolder.folder('skills');
      if (skillsFolder) {
        for (const skill of projectData.agentSkills) {
          const skillFolder = skillsFolder.folder(skill.slug);
          if (skillFolder) {
            skillFolder.file('SKILL.md', skill.content || '');
          }
        }
      }
    }
  }

  reportProgress("Compressing ZIP file...", 80);
  
  // Generate the ZIP buffer
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  reportProgress("ZIP generation complete!", 100);
  
  return zipBuffer;
}

/**
 * Helper: Generate AGENTS.md from context file or template
 */
function generateAgentsMd(projectData: any): string {
  const agentsFile = projectData.contextFiles.find(
    (f: any) => f.fileType === ContextFileType.AI_WORKFLOW_RULES
  );
  return agentsFile?.content || '# AGENTS.md\n\nAgent workflow rules will be generated.\n';
}

/**
 * Helper: Get ARTKINS_STYLE_GUIDE.md verbatim
 */
function getArtkinsStyeGuide(): string {
  // In production, this would read from the actual file
  // For now, return a placeholder that indicates it should be the verbatim guide
  return '# ARTKINS_STYLE_GUIDE.md\n\nThe complete, unabridged Artkins Style Guide will be included verbatim.\n';
}

/**
 * Helper: Generate .env.example
 */
function generateEnvExample(): string {
  return `# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# Add other environment variables as needed
`;
}

/**
 * Helper: Map context file type to filename
 */
function getContextFileName(fileType: ContextFileType): string {
  const map: Record<ContextFileType, string> = {
    [ContextFileType.PROJECT_OVERVIEW]: 'project-overview.md',
    [ContextFileType.ARCHITECTURE_CONTEXT]: 'architecture-context.md',
    [ContextFileType.CODE_STANDARDS]: 'code-standards.md',
    [ContextFileType.UI_CONTEXT]: 'ui-context.md',
    [ContextFileType.AI_WORKFLOW_RULES]: 'ai-workflow-rules.md',
    [ContextFileType.PROGRESS_TRACKER]: 'progress-tracker.md',
  };
  return map[fileType] || 'unknown.md';
}

/**
 * Helper: Generate PROJECT_RESEARCH.md
 */
function generateProjectResearchMd(projectData: any): string {
  return `# Project Research

This folder contains all research materials gathered during the discovery and planning phases.

## Research Documents

${projectData.researchDocuments.map((doc: any) => `- ${doc.title} (${doc.sourceType})`).join('\n')}

## Research Assets

${projectData.researchAssets.length} asset(s) included in the assets/ folder.

See \`assets/FILES.md\` for a complete manifest organized by category.
`;
}

/**
 * Helper: Generate FILES.md manifest for research assets
 */
interface ManifestAsset {
  fileName: string;
  mimeType: string | null;
  category: string | null;
  tags: string[];
  aiDescription: string | null;
}

function generateFilesManifest(assets: ManifestAsset[]): string {
  // Group by category
  const byCategory = new Map<string, ManifestAsset[]>();
  for (const asset of assets) {
    const category = asset.category || 'general';
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(asset);
  }

  // Build manifest
  let manifest = `# Research Asset Manifest

This manifest provides an organized view of all research assets included in this export.

**Total Assets**: ${assets.length}

---

`;

  for (const [category, categoryAssets] of Array.from(byCategory.entries()).sort()) {
    // Use canonical category label from MEDIA_CATEGORIES
    const categoryInfo = getCategoryInfo(category);
    const categoryLabel = categoryInfo?.label ?? category.charAt(0).toUpperCase() + category.slice(1);
    
    manifest += `## ${categoryLabel}\n\n`;
    manifest += `**Count**: ${categoryAssets.length}\n\n`;

    for (const asset of categoryAssets) {
      manifest += `### ${asset.fileName}\n\n`;
      manifest += `- **Location**: \`${category}/${asset.fileName}\`\n`;
      manifest += `- **Type**: ${asset.mimeType || 'Unknown'}\n`;
      
      if (asset.tags && asset.tags.length > 0) {
        manifest += `- **Tags**: ${asset.tags.join(', ')}\n`;
      }
      
      if (asset.aiDescription) {
        manifest += `- **Description**: ${asset.aiDescription}\n`;
      }
      
      manifest += '\n';
    }

    manifest += '---\n\n';
  }

  return manifest;
}

/**
 * Helper: Simple slugify
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
