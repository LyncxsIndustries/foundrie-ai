import { describe, it, expect } from 'vitest';
import { dataUrlToBuffer } from './capture';

describe('lib/diagrams/capture', () => {
  describe('dataUrlToBuffer', () => {
    it('converts base64 data URL to Buffer', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
      const buffer = dataUrlToBuffer(dataUrl);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('handles data URL without prefix', () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUg==';
      const dataUrl = `data:image/png;base64,${base64}`;
      const buffer = dataUrlToBuffer(dataUrl);
      
      expect(buffer.toString('base64')).toBe(base64);
    });
  });
});
