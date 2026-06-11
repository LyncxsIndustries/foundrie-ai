import { describe, it, expect } from 'vitest';
import { ZIP_STRUCTURE, buildZipPath, generateRootFolderName } from './zip-structure';

describe('zip-structure', () => {
  describe('ZIP_STRUCTURE', () => {
    it('defines required root files', () => {
      expect(ZIP_STRUCTURE.root.required).toContain('AGENTS.md');
      expect(ZIP_STRUCTURE.root.required).toContain('ARTKINS_STYLE_GUIDE.md');
      expect(ZIP_STRUCTURE.root.required).toContain('.env.example');
      expect(ZIP_STRUCTURE.root.required).toContain('.npmrc');
    });

    it('defines required folders', () => {
      expect(ZIP_STRUCTURE.folders.required).toContain('context/');
      expect(ZIP_STRUCTURE.folders.required).toContain('diagrams/');
      expect(ZIP_STRUCTURE.folders.required).toContain('feature-specs/');
      expect(ZIP_STRUCTURE.folders.required).toContain('research/');
    });

    it('defines conditional folders', () => {
      expect(ZIP_STRUCTURE.folders.conditional).toContain('.agents/skills/');
      expect(ZIP_STRUCTURE.folders.conditional).toContain('tools/');
      expect(ZIP_STRUCTURE.folders.conditional).toContain('evals/');
    });
  });

  describe('buildZipPath', () => {
    it('joins path segments', () => {
      expect(buildZipPath('folder', 'subfolder', 'file.txt')).toBe('folder/subfolder/file.txt');
    });

    it('handles single segment', () => {
      expect(buildZipPath('file.txt')).toBe('file.txt');
    });
  });

  describe('generateRootFolderName', () => {
    it('includes project slug and timestamp', () => {
      const name = generateRootFolderName('my-project');
      expect(name).toMatch(/^my-project_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
    });

    it('formats timestamp correctly', () => {
      const name = generateRootFolderName('test');
      const timestampPart = name.split('_').slice(1).join('_');
      expect(timestampPart).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
    });
  });
});
