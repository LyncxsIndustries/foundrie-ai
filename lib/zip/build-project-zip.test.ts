import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildProjectZip } from './build-project-zip';
import { db } from '@/lib/db';
import JSZip from 'jszip';
import { ContextFileType } from '@/lib/generated/prisma/enums';

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: vi.fn(),
  },
}));

vi.mock('@vercel/blob', () => ({
  download: vi.fn(),
}));

describe('build-project-zip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildProjectZip', () => {
    it('throws error when project not found', async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          project: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        });
      });

      await expect(buildProjectZip('nonexistent')).rejects.toThrow('Project not found');
    });

    it('creates ZIP with minimal project data', async () => {
      const mockProject = {
        slug: 'test-project',
        name: 'Test Project',
        contextFiles: [
          {
            fileType: ContextFileType.PROJECT_OVERVIEW,
            content: '# Project Overview\n\nTest content',
          },
        ],
        featureSpecs: [
          {
            order: 1,
            title: 'Feature One',
            content: '# Feature 01\n\nTest feature',
          },
        ],
        diagrams: [],
        researchDocuments: [],
        researchAssets: [],
        agentSkills: [],
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          project: {
            findUnique: vi.fn().mockResolvedValue(mockProject),
          },
        });
      });

      const buffer = await buildProjectZip('test-id');
      expect(buffer).toBeInstanceOf(Buffer);

      // Load and verify ZIP contents
      const zip = await JSZip.loadAsync(buffer);
      const allPaths = Object.keys(zip.files);
      
      // Find the root folder (first path segment)
      const rootFolder = allPaths[0].split('/')[0];
      expect(rootFolder).toMatch(/^test-project_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
    });

    it('includes mandatory folders', async () => {
      const mockProject = {
        slug: 'test-project',
        name: 'Test Project',
        contextFiles: [],
        featureSpecs: [],
        diagrams: [],
        researchDocuments: [],
        researchAssets: [],
        agentSkills: [],
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          project: {
            findUnique: vi.fn().mockResolvedValue(mockProject),
          },
        });
      });

      const buffer = await buildProjectZip('test-id');
      const zip = await JSZip.loadAsync(buffer);

      // Check for required folders
      const paths = Object.keys(zip.files);
      expect(paths.some(p => p.includes('/context/'))).toBe(true);
      expect(paths.some(p => p.includes('/diagrams/'))).toBe(true);
      expect(paths.some(p => p.includes('/feature-specs/'))).toBe(true);
      expect(paths.some(p => p.includes('/research/'))).toBe(true);
    });

    it('includes context files', async () => {
      const mockProject = {
        slug: 'test-project',
        name: 'Test Project',
        contextFiles: [
          {
            fileType: ContextFileType.PROJECT_OVERVIEW,
            content: '# Overview\n\nContent',
          },
          {
            fileType: ContextFileType.ARCHITECTURE_CONTEXT,
            content: '# Architecture\n\nContent',
          },
        ],
        featureSpecs: [],
        diagrams: [],
        researchDocuments: [],
        researchAssets: [],
        agentSkills: [],
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          project: {
            findUnique: vi.fn().mockResolvedValue(mockProject),
          },
        });
      });

      const buffer = await buildProjectZip('test-id');
      const zip = await JSZip.loadAsync(buffer);

      const paths = Object.keys(zip.files);
      expect(paths.some(p => p.includes('/context/project-overview.md'))).toBe(true);
      expect(paths.some(p => p.includes('/context/architecture-context.md'))).toBe(true);
    });

    it('includes feature specs in order', async () => {
      const mockProject = {
        slug: 'test-project',
        name: 'Test Project',
        contextFiles: [],
        featureSpecs: [
          { order: 1, title: 'First Feature', content: '# Feature 1' },
          { order: 2, title: 'Second Feature', content: '# Feature 2' },
        ],
        diagrams: [],
        researchDocuments: [],
        researchAssets: [],
        agentSkills: [],
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          project: {
            findUnique: vi.fn().mockResolvedValue(mockProject),
          },
        });
      });

      const buffer = await buildProjectZip('test-id');
      const zip = await JSZip.loadAsync(buffer);

      const paths = Object.keys(zip.files);
      expect(paths.some(p => p.includes('/feature-specs/01-first-feature.md'))).toBe(true);
      expect(paths.some(p => p.includes('/feature-specs/02-second-feature.md'))).toBe(true);
    });

    it('includes agent skills when present', async () => {
      const mockProject = {
        slug: 'test-project',
        name: 'Test Project',
        contextFiles: [],
        featureSpecs: [],
        diagrams: [],
        researchDocuments: [],
        researchAssets: [],
        agentSkills: [
          { slug: 'test-skill', name: 'Test Skill', content: '# Skill content' },
        ],
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          project: {
            findUnique: vi.fn().mockResolvedValue(mockProject),
          },
        });
      });

      const buffer = await buildProjectZip('test-id');
      const zip = await JSZip.loadAsync(buffer);

      const paths = Object.keys(zip.files);
      expect(paths.some(p => p.includes('/.agents/skills/test-skill/SKILL.md'))).toBe(true);
    });

    it('excludes agent skills folder when empty', async () => {
      const mockProject = {
        slug: 'test-project',
        name: 'Test Project',
        contextFiles: [],
        featureSpecs: [],
        diagrams: [],
        researchDocuments: [],
        researchAssets: [],
        agentSkills: [],
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          project: {
            findUnique: vi.fn().mockResolvedValue(mockProject),
          },
        });
      });

      const buffer = await buildProjectZip('test-id');
      const zip = await JSZip.loadAsync(buffer);

      const paths = Object.keys(zip.files);
      expect(paths.some(p => p.includes('/.agents/'))).toBe(false);
    });
  });
});
