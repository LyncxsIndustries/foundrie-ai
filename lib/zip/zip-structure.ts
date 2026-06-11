/**
 * ZIP Structure - Product Contract
 * 
 * Defines the canonical folder/file layout for Foundrie project exports.
 * This structure is a product contract; do not rename folders or omit required files.
 */

export interface ZipStructure {
  root: {
    required: string[];
    optional: string[];
  };
  folders: {
    required: string[];
    conditional: string[];
  };
}

/**
 * The complete ZIP structure contract
 */
export const ZIP_STRUCTURE: ZipStructure = {
  root: {
    required: [
      'AGENTS.md',
      'ARTKINS_STYLE_GUIDE.md',
      '.env.example',
      '.npmrc',
    ],
    optional: [
      'README.md',
    ],
  },
  folders: {
    required: [
      'context/',
      'diagrams/',
      'feature-specs/',
      'research/',
      'requirements/',
      'project-management/',
      'docs/',
      '.github/',
    ],
    conditional: [
      '.agents/skills/',
      'tools/',
      'evals/',
      'docs/security/RED-TEAM.md',
    ],
  },
};

/**
 * Helper to build consistent paths within the ZIP
 */
export function buildZipPath(...segments: string[]): string {
  return segments.join('/');
}

/**
 * Generate the root folder name with timestamp
 */
export function generateRootFolderName(projectSlug: string): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .slice(0, 19); // YYYY-MM-DD_HH-mm-ss
  return `${projectSlug}_${timestamp}`;
}
