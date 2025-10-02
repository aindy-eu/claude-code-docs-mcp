/**
 * Tests for ExtractService
 * Uses REAL extracted JSON from .data/test.com/structured/test.json
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExtractService } from '@/services/extract-service.js';
import { existsSync, readFileSync, rmSync } from 'fs';
import path from 'path';

const TEST_URL = 'https://test.com/docs/test';
const TEST_DOMAIN = 'test.com';
const TEST_DATA_DIR = path.join(process.cwd(), '.data', TEST_DOMAIN);
const STRUCTURED_DIR = path.join(TEST_DATA_DIR, 'structured');
const TEST_JSON_PATH = path.join(STRUCTURED_DIR, 'test.json');

describe('ExtractService', () => {
  let service: ExtractService;

  beforeEach(() => {
    service = new ExtractService(TEST_URL);
  });

  describe('Initialization', () => {
    it('should create structured directory on construction', () => {
      expect(existsSync(STRUCTURED_DIR)).toBe(true);
    });

    it('should extract domain from URL', () => {
      const testService = new ExtractService('https://example.com/path/to/doc');
      const jsonPath = testService.getJsonPath('https://example.com/path/to/doc');
      expect(jsonPath).toContain('example.com');
    });
  });

  describe('getJsonPath', () => {
    it('should generate correct path for URL', () => {
      const jsonPath = service.getJsonPath(TEST_URL);
      expect(jsonPath).toBe(TEST_JSON_PATH);
    });

    it('should handle URL with trailing slash', () => {
      const jsonPath = service.getJsonPath('https://test.com/docs/test/');
      expect(jsonPath).toBe(TEST_JSON_PATH);
    });

    it('should clean special characters from filename', () => {
      const jsonPath = service.getJsonPath('https://test.com/my-doc@2024!');
      expect(jsonPath).toContain('my-doc_2024_');
      expect(jsonPath).not.toContain('@');
      expect(jsonPath).not.toContain('!');
    });

    it('should handle root path', () => {
      const jsonPath = service.getJsonPath('https://test.com/');
      expect(jsonPath).toContain('index.json');
    });

    it('should use last segment as filename', () => {
      const jsonPath = service.getJsonPath('https://test.com/docs/guides/advanced');
      expect(jsonPath).toContain('advanced.json');
    });
  });

  describe('get', () => {
    it('should read existing JSON', async () => {
      const json = (await service.get(TEST_URL)) as any;

      expect(json).toBeDefined();
      expect(json?.source).toBe('https://docs.claude.com/en/docs/claude-code/overview');
      expect(json?.pageTitle).toBe('Claude Code Overview');
      expect(json?.sections).toBeInstanceOf(Array);
    });

    it('should return null for non-existent JSON', async () => {
      const json = await service.get('https://test.com/does-not-exist');
      expect(json).toBeNull();
    });

    it('should preserve complex nested structure', async () => {
      const json = (await service.get(TEST_URL)) as any;

      expect(json?.sections[0].codeExamples).toBeInstanceOf(Array);
      expect(json?.sections[0].codeExamples[0]).toHaveProperty('language');
      expect(json?.sections[0].codeExamples[0]).toHaveProperty('code');
      expect(json?.sections[0].codeExamples[0]).toHaveProperty('description');
    });

    it('should preserve metadata', async () => {
      const json = (await service.get(TEST_URL)) as any;

      expect(json?.metadata).toBeDefined();
      expect(json?.metadata?.extractionMethod).toBe('claude-driven');
      expect(json?.metadata?.model).toBe('claude-sonnet-4-5-20250929');
    });
  });

  describe('save', () => {
    const TEMP_URL = 'https://test.com/temp-test-doc';
    let tempJsonPath: string;

    beforeEach(() => {
      tempJsonPath = service.getJsonPath(TEMP_URL);
    });

    afterEach(() => {
      // Clean up temp file
      if (existsSync(tempJsonPath)) {
        rmSync(tempJsonPath);
      }
    });

    it('should save JSON to correct path', async () => {
      const testData = {
        title: 'Test Doc',
        content: 'Test content'
      };

      await service.save(TEMP_URL, testData);

      expect(existsSync(tempJsonPath)).toBe(true);
    });

    it('should save JSON with proper formatting', async () => {
      const testData = {
        title: 'Test Doc',
        sections: [{ heading: 'Test' }]
      };

      await service.save(TEMP_URL, testData);

      const savedContent = readFileSync(tempJsonPath, 'utf-8');
      const parsed = JSON.parse(savedContent);

      expect(parsed).toEqual(testData);
      // Check formatting (indented with 2 spaces)
      expect(savedContent).toContain('  "title"');
    });

    it('should roundtrip save and get', async () => {
      const originalData = {
        source: 'https://test.com',
        pageTitle: 'Roundtrip Test',
        sections: [
          {
            title: 'Section 1',
            content: 'Content here',
            codeExamples: [{ language: 'js', code: 'console.log()' }]
          }
        ],
        metadata: { test: true }
      };

      await service.save(TEMP_URL, originalData);
      const retrievedData = await service.get(TEMP_URL);

      expect(retrievedData).toEqual(originalData);
    });
  });

  describe('exists', () => {
    it('should return true for existing JSON', () => {
      const exists = service.exists(TEST_URL);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent JSON', () => {
      const exists = service.exists('https://test.com/does-not-exist');
      expect(exists).toBe(false);
    });
  });

  describe('Real data validation', () => {
    it('should handle real extracted data structure', async () => {
      const json = (await service.get(TEST_URL)) as any;

      // Validate required fields
      expect(json).toHaveProperty('source');
      expect(json).toHaveProperty('pageTitle');
      expect(json).toHaveProperty('summary');
      expect(json).toHaveProperty('sections');
      expect(json).toHaveProperty('metadata');

      // Validate sections structure
      json?.sections.forEach((section: any) => {
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('content');
        expect(section).toHaveProperty('type');
        expect(section).toHaveProperty('codeExamples');
      });
    });
  });
});
