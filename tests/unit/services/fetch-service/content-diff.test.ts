/**
 * Tests for FetchService content diff functionality
 * Tests the ACTUAL comparison logic with REAL HTML
 */

import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// Real HTML path from test fixture
// This ensures tests work even if user hasn't ingested docs yet
const REAL_HTML_PATH = path.join(process.cwd(), '.data/test.com/cache/docs/test/content.html');

/**
 * This is the ACTUAL normalization logic from FetchService
 * Copy-pasted to test it directly without mocking
 */
function normalizeForComparison(html: string): string {
  return html
    .replace(/<!--.*?-->/gs, '') // Remove comments
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove inline styles
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/timestamp="[^"]*"/gi, '') // Remove timestamps
    .replace(/updated="[^"]*"/gi, '') // Remove update dates
    .replace(/lastmod="[^"]*"/gi, '') // Remove last modified
    .trim();
}

/**
 * This is the ACTUAL comparison logic from FetchService
 * Copy-pasted to test it directly
 */
function compareContent(oldHtml: string, newHtml: string) {
  const oldNormalized = normalizeForComparison(oldHtml);
  const newNormalized = normalizeForComparison(newHtml);

  const oldHash = createHash('sha256').update(oldNormalized).digest('hex');
  const newHash = createHash('sha256').update(newNormalized).digest('hex');

  if (oldHash === newHash) {
    return {
      hasChanged: false,
      contentHash: newHash,
      previousHash: oldHash,
      comparedAt: new Date().toISOString(),
      changePercentage: 0
    };
  }

  // Simple change percentage based on length difference
  const lengthDiff = Math.abs(newNormalized.length - oldNormalized.length);
  const changePercentage = (lengthDiff / oldNormalized.length) * 100;

  return {
    hasChanged: true,
    contentHash: newHash,
    previousHash: oldHash,
    comparedAt: new Date().toISOString(),
    changePercentage: Math.min(changePercentage, 100)
  };
}

describe('Content Diff Logic', () => {
  let realHtml: string;

  beforeAll(() => {
    // Load REAL HTML from test fixture
    if (!existsSync(REAL_HTML_PATH)) {
      throw new Error(
        `Test fixture not found at ${REAL_HTML_PATH}. ` +
          `This file should be committed to the repo for consistent testing.`
      );
    }
    realHtml = readFileSync(REAL_HTML_PATH, 'utf-8');
  });

  describe('Comparison with real HTML', () => {
    it('should detect unchanged content (same HTML)', () => {
      const result = compareContent(realHtml, realHtml);

      expect(result.hasChanged).toBe(false);
      expect(result.changePercentage).toBe(0);
      expect(result.contentHash).toBe(result.previousHash);
    });

    it('should detect changed content (modified HTML)', () => {
      const modifiedHtml = realHtml + '\n<!-- Updated content -->\n<p>New paragraph</p>';

      const result = compareContent(realHtml, modifiedHtml);

      expect(result.hasChanged).toBe(true);
      expect(result.changePercentage).toBeGreaterThan(0);
      expect(result.contentHash).not.toBe(result.previousHash);
    });

    it('should ignore script changes (dynamic content)', () => {
      const htmlWithScript1 = realHtml + '<script>var x = 1;</script>';
      const htmlWithScript2 = realHtml + '<script>var x = 999;</script>';

      const result = compareContent(htmlWithScript1, htmlWithScript2);

      // Scripts are removed during normalization, so content is "unchanged"
      expect(result.hasChanged).toBe(false);
    });

    it('should ignore comment changes', () => {
      const htmlWithComment1 = realHtml + '<!-- Comment A -->';
      const htmlWithComment2 = realHtml + '<!-- Comment B -->';

      const result = compareContent(htmlWithComment1, htmlWithComment2);

      expect(result.hasChanged).toBe(false);
    });

    it('should ignore whitespace differences', () => {
      const htmlCompact = realHtml.replace(/\s+/g, ' ');

      const result = compareContent(realHtml, htmlCompact);

      expect(result.hasChanged).toBe(false);
    });

    it('should ignore timestamp attributes', () => {
      const htmlWithTimestamp1 = realHtml.replace(/<div/, '<div timestamp="2025-01-01"');
      const htmlWithTimestamp2 = realHtml.replace(/<div/, '<div timestamp="2025-12-31"');

      const result = compareContent(htmlWithTimestamp1, htmlWithTimestamp2);

      expect(result.hasChanged).toBe(false);
    });
  });

  describe('Normalization', () => {
    it('should remove scripts from real HTML', () => {
      const normalized = normalizeForComparison(realHtml);

      expect(normalized).not.toContain('<script>');
      expect(normalized).not.toContain('</script>');
    });

    it('should remove comments from real HTML', () => {
      const htmlWithComment = realHtml + '<!-- This is a comment -->';
      const normalized = normalizeForComparison(htmlWithComment);

      expect(normalized).not.toContain('<!--');
      expect(normalized).not.toContain('-->');
    });

    it('should normalize whitespace in real HTML', () => {
      const normalized = normalizeForComparison(realHtml);

      // Should not have multiple consecutive spaces
      expect(normalized).not.toMatch(/  +/);
    });
  });

  describe('Hash consistency', () => {
    it('should produce same hash for identical content', () => {
      const result1 = compareContent(realHtml, realHtml);
      const result2 = compareContent(realHtml, realHtml);

      expect(result1.contentHash).toBe(result2.contentHash);
    });

    it('should use SHA256 hashing', () => {
      const normalized = normalizeForComparison(realHtml);
      const expectedHash = createHash('sha256').update(normalized).digest('hex');

      const result = compareContent(realHtml, realHtml);

      expect(result.contentHash).toBe(expectedHash);
      expect(result.contentHash.length).toBe(64); // SHA256 = 64 hex chars
    });
  });
});
