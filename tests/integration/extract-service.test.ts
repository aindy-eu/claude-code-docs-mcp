/**
 * ExtractService Integration Tests
 * Tests real file I/O for JSON extraction storage and retrieval
 *
 * NOTE: These tests use real file system operations (appropriate for integration testing)
 * For unit tests with mocked FS, see tests/unit/services/extract-service/
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ExtractService } from '@/services/extract-service.js';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// Use dedicated test directory to avoid polluting main .data/
const TEST_DATA_DIR = '.data/extract-integration-test.com';
const TEST_URL = 'https://extract-integration-test.com/docs/test-page';

// Sample Claude extraction (matching actual ClaudeDocOutput structure)
const sampleExtraction = {
  source: TEST_URL,
  pageTitle: 'Integration Test Documentation',
  summary: 'Testing ExtractService with real file system operations',
  sections: [
    {
      title: 'Getting Started',
      content: 'This section covers the basics of integration testing',
      searchKeywords: ['integration', 'testing', 'setup'],
      codeExamples: [
        {
          language: 'typescript',
          code: 'const service = new ExtractService(url);',
          description: 'Initialize the service',
          demonstrates: ['service initialization']
        }
      ],
      keyConcepts: ['integration testing', 'file I/O']
    },
    {
      title: 'Advanced Usage',
      content: 'Advanced patterns for integration testing',
      searchKeywords: ['advanced', 'patterns'],
      codeExamples: [],
      keyConcepts: ['best practices']
    }
  ],
  prerequisites: ['TypeScript', 'Vitest'],
  useCases: ['Testing file operations', 'Validating persistence'],
  metadata: {
    extractedAt: new Date().toISOString(),
    modelUsed: 'claude-sonnet-4-5-20250929'
  }
};

describe('ExtractService Integration (Real File I/O)', () => {
  let extractService: ExtractService;

  beforeAll(() => {
    // Clean up any previous test runs
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }

    // Create fresh test directory
    mkdirSync(TEST_DATA_DIR, { recursive: true });

    extractService = new ExtractService(TEST_URL);
  });

  afterAll(() => {
    // Clean up test directory after all tests
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });

  describe('Directory and File Creation', () => {
    it('should create structured directory on initialization', () => {
      const structuredPath = join(TEST_DATA_DIR, 'structured');
      expect(existsSync(structuredPath)).toBe(true);
    });

    it('should create JSON files with correct extension', async () => {
      await extractService.save(TEST_URL, sampleExtraction);

      const jsonPath = extractService.getJsonPath(TEST_URL);
      expect(jsonPath).toMatch(/\.json$/);
      expect(existsSync(jsonPath)).toBe(true);
    });

    it('should create nested directory structure for deep URLs', async () => {
      const deepUrl = 'https://extract-integration-test.com/docs/guides/advanced/hooks';
      const deepExtraction = { ...sampleExtraction, source: deepUrl };

      const deepService = new ExtractService(deepUrl);
      await deepService.save(deepUrl, deepExtraction);

      const jsonPath = deepService.getJsonPath(deepUrl);
      expect(existsSync(jsonPath)).toBe(true);
    });
  });

  describe('Save and Retrieve Operations', () => {
    it('should save and retrieve simple extraction', async () => {
      const simpleExtraction = {
        source: TEST_URL,
        pageTitle: 'Simple Page',
        summary: 'A simple test page',
        sections: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          modelUsed: 'claude-sonnet-4-5-20250929'
        }
      };

      await extractService.save(TEST_URL, simpleExtraction);
      const retrieved = await extractService.get(TEST_URL);

      expect(retrieved).toEqual(simpleExtraction);
    });

    it('should preserve complex nested structures', async () => {
      await extractService.save(TEST_URL, sampleExtraction);
      const retrieved = (await extractService.get(TEST_URL)) as any;

      expect(retrieved.pageTitle).toBe(sampleExtraction.pageTitle);
      expect(retrieved.sections).toHaveLength(2);
      expect(retrieved.sections[0].codeExamples).toHaveLength(1);
      expect(retrieved.sections[0].codeExamples[0].language).toBe('typescript');
    });

    it('should preserve all metadata fields', async () => {
      await extractService.save(TEST_URL, sampleExtraction);
      const retrieved = (await extractService.get(TEST_URL)) as any;

      expect(retrieved.metadata).toBeDefined();
      expect(retrieved.metadata.modelUsed).toBe('claude-sonnet-4-5-20250929');
      expect(retrieved.metadata.extractedAt).toBe(sampleExtraction.metadata.extractedAt);
    });

    it('should handle unicode and special characters', async () => {
      const unicodeExtraction = {
        source: TEST_URL,
        pageTitle: 'Unicode Test 你好 🎉',
        summary: 'Testing unicode: ñ é å 中文 日本語',
        sections: [
          {
            title: 'Emoji Section 🚀',
            content: 'Content with emojis ✅ ❌ 💡',
            codeExamples: []
          }
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          modelUsed: 'claude-sonnet-4-5-20250929'
        }
      };

      await extractService.save(TEST_URL, unicodeExtraction);
      const retrieved = (await extractService.get(TEST_URL)) as any;

      expect(retrieved.pageTitle).toContain('你好');
      expect(retrieved.pageTitle).toContain('🎉');
      expect(retrieved.summary).toContain('中文');
      expect(retrieved.sections[0].title).toContain('🚀');
    });

    it('should return null for non-existent files', async () => {
      const nonExistentUrl = 'https://extract-integration-test.com/does-not-exist';
      const result = await extractService.get(nonExistentUrl);

      expect(result).toBeNull();
    });
  });

  describe('Exists Check', () => {
    it('should return true for existing extractions', async () => {
      await extractService.save(TEST_URL, sampleExtraction);

      const exists = extractService.exists(TEST_URL);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent extractions', () => {
      const exists = extractService.exists('https://extract-integration-test.com/missing');
      expect(exists).toBe(false);
    });
  });

  describe('File Persistence', () => {
    it('should persist data across service instances', async () => {
      const testUrl = 'https://extract-integration-test.com/docs/persistent';
      const extraction = { ...sampleExtraction, source: testUrl };

      // Save with first instance
      const service1 = new ExtractService(testUrl);
      await service1.save(testUrl, extraction);

      // Retrieve with new instance
      const service2 = new ExtractService(testUrl);
      const retrieved = await service2.get(testUrl);

      expect(retrieved).toEqual(extraction);
    });

    it('should overwrite existing files on save', async () => {
      const firstVersion = {
        ...sampleExtraction,
        pageTitle: 'Version 1'
      };

      const secondVersion = {
        ...sampleExtraction,
        pageTitle: 'Version 2'
      };

      await extractService.save(TEST_URL, firstVersion);
      await extractService.save(TEST_URL, secondVersion);

      const retrieved = (await extractService.get(TEST_URL)) as any;
      expect(retrieved.pageTitle).toBe('Version 2');
    });
  });

  describe('JSON Formatting', () => {
    it('should format JSON with proper indentation', async () => {
      await extractService.save(TEST_URL, sampleExtraction);

      const jsonPath = extractService.getJsonPath(TEST_URL);
      const { readFileSync } = await import('fs');
      const fileContent = readFileSync(jsonPath, 'utf-8');

      // Check for 2-space indentation
      expect(fileContent).toContain('  "source"');
      expect(fileContent).toContain('  "pageTitle"');
    });

    it('should produce valid JSON', async () => {
      await extractService.save(TEST_URL, sampleExtraction);

      const jsonPath = extractService.getJsonPath(TEST_URL);
      const { readFileSync } = await import('fs');
      const fileContent = readFileSync(jsonPath, 'utf-8');

      // Should be parseable
      expect(() => JSON.parse(fileContent)).not.toThrow();
    });
  });

  describe('URL to Filename Mapping', () => {
    it('should use last URL segment as filename', async () => {
      const url = 'https://extract-integration-test.com/docs/guides/hooks';
      const _extraction = { ...sampleExtraction, source: url };

      const service = new ExtractService(url);
      await service.save(url, _extraction);

      const jsonPath = service.getJsonPath(url);
      expect(jsonPath).toContain('hooks.json');
    });

    it('should use index.json for root URLs', async () => {
      const rootUrl = 'https://extract-integration-test.com/';

      const service = new ExtractService(rootUrl);
      const jsonPath = service.getJsonPath(rootUrl);

      expect(jsonPath).toContain('index.json');
    });

    it('should sanitize special characters in filenames', async () => {
      const specialUrl = 'https://extract-integration-test.com/my-doc@2024!';
      const service = new ExtractService(specialUrl);
      const jsonPath = service.getJsonPath(specialUrl);

      // Special characters should be sanitized
      expect(jsonPath).toContain('.json');
      expect(jsonPath).not.toContain('@');
      expect(jsonPath).not.toContain('!');
    });
  });

  describe('Roundtrip Preservation', () => {
    it('should preserve exact structure through save/get cycle', async () => {
      const complexExtraction = {
        source: TEST_URL,
        pageTitle: 'Complex Structure Test',
        summary: 'Testing deep nesting and arrays',
        sections: [
          {
            title: 'Section 1',
            content: 'Content 1',
            searchKeywords: ['key1', 'key2', 'key3'],
            codeExamples: [
              {
                language: 'typescript',
                code: 'const x = 1;',
                description: 'Example 1',
                demonstrates: ['variables']
              },
              {
                language: 'javascript',
                code: 'console.log("test");',
                description: 'Example 2',
                demonstrates: ['logging']
              }
            ],
            keyConcepts: ['concept1', 'concept2']
          }
        ],
        prerequisites: ['prereq1', 'prereq2'],
        useCases: ['use1', 'use2'],
        metadata: {
          extractedAt: '2025-01-01T00:00:00Z',
          modelUsed: 'claude-sonnet-4-5-20250929'
        }
      };

      await extractService.save(TEST_URL, complexExtraction);
      const retrieved = await extractService.get(TEST_URL);

      expect(retrieved).toEqual(complexExtraction);
    });

    it('should preserve empty arrays and undefined fields', async () => {
      const sparseExtraction = {
        source: TEST_URL,
        pageTitle: 'Sparse Data',
        summary: 'Testing sparse data',
        sections: [],
        prerequisites: [],
        useCases: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          modelUsed: 'claude-sonnet-4-5-20250929'
        }
      };

      await extractService.save(TEST_URL, sparseExtraction);
      const retrieved = await extractService.get(TEST_URL);

      expect(retrieved).toEqual(sparseExtraction);
    });
  });

  /**
   * TESTS SKIPPED (require external dependencies):
   *
   * 1. Claude API Integration
   *    - Actual extraction via Claude API
   *    - Prompt engineering and response parsing
   *    - Token usage tracking
   *    Reason: Requires Claude API key and credits
   *    Alternative: Use recorded fixtures or mock responses
   *
   * 2. Content Extraction Logic
   *    - HTML to structured JSON conversion
   *    - Section detection and splitting
   *    - Code example identification
   *    Reason: This is handled by Claude, not ExtractService
   *    Note: ExtractService is just a file wrapper for Claude's output
   *
   * 3. Error Recovery
   *    - Handling malformed Claude responses
   *    - Retry logic for API failures
   *    Reason: Would require live API testing
   *
   * 4. Concurrent Extractions
   *    - Multiple URLs being extracted simultaneously
   *    - Race conditions in file writes
   *    Reason: Complex to test reliably, better tested manually
   *
   * These scenarios are better tested with:
   * - Recorded Claude API fixtures
   * - Manual integration testing with real docs
   * - End-to-end pipeline tests
   */
});
