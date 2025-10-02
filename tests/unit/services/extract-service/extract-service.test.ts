/**
 * ExtractService Tests with Mocked File System
 * Comprehensive tests without touching real files
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExtractService } from '@/services/extract-service.js';
import {
  extractedSimple,
  extractedComplex,
  extractedMinimal,
  extractedCodeHeavy,
  urlFilenameMappings,
  edgeCases
} from '../../../fixtures/extractServiceFixtures.js';

// Mock logger
vi.mock('@/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn()
}));

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { logger } from '@/utils/logger.js';

const TEST_URL = 'https://docs.example.com/test';

describe('ExtractService (Mocked)', () => {
  let virtualFS: Map<string, string>;

  beforeEach(() => {
    // Reset virtual filesystem
    virtualFS = new Map();

    // Reset all mocks
    vi.clearAllMocks();

    // Setup fs mocks
    vi.mocked(existsSync).mockImplementation(path => virtualFS.has(path as string));

    vi.mocked(readFileSync).mockImplementation(path => {
      const content = virtualFS.get(path as string);
      if (!content) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return content;
    });

    vi.mocked(writeFileSync).mockImplementation((path, data) => {
      virtualFS.set(path as string, data as string);
    });

    vi.mocked(mkdirSync).mockImplementation(() => undefined as any);
  });

  describe('Initialization', () => {
    it('should extract domain from URL', () => {
      const service = new ExtractService('https://docs.example.com/path/to/doc');
      const jsonPath = service.getJsonPath('https://docs.example.com/path/to/doc');

      expect(jsonPath).toContain('docs.example.com');
    });

    it('should create structured directory on construction', () => {
      new ExtractService(TEST_URL);

      expect(mkdirSync).toHaveBeenCalled();
    });
  });

  describe('getJsonPath', () => {
    it('should generate correct path for simple URL', () => {
      const service = new ExtractService(urlFilenameMappings.simple.url);
      const jsonPath = service.getJsonPath(urlFilenameMappings.simple.url);

      expect(jsonPath).toContain(urlFilenameMappings.simple.expectedFilename);
    });

    it('should use last URL segment as filename', () => {
      const service = new ExtractService(urlFilenameMappings.nested.url);
      const jsonPath = service.getJsonPath(urlFilenameMappings.nested.url);

      expect(jsonPath).toContain(urlFilenameMappings.nested.expectedFilename);
      expect(jsonPath).toContain('hooks.json');
      expect(jsonPath).not.toContain('guides');
    });

    it('should handle URL with trailing slash', () => {
      const service = new ExtractService(urlFilenameMappings.withTrailingSlash.url);
      const jsonPath = service.getJsonPath(urlFilenameMappings.withTrailingSlash.url);

      expect(jsonPath).toContain(urlFilenameMappings.withTrailingSlash.expectedFilename);
    });

    it('should use index.json for root URL', () => {
      const service = new ExtractService(urlFilenameMappings.root.url);
      const jsonPath = service.getJsonPath(urlFilenameMappings.root.url);

      expect(jsonPath).toContain(urlFilenameMappings.root.expectedFilename);
    });

    it('should sanitize special characters', () => {
      const service = new ExtractService(urlFilenameMappings.specialChars.url);
      const jsonPath = service.getJsonPath(urlFilenameMappings.specialChars.url);

      expect(jsonPath).toContain('my-doc_2024_.json');
      expect(jsonPath).not.toContain('@');
      expect(jsonPath).not.toContain('!');
    });

    it('should sanitize multiple special characters', () => {
      const service = new ExtractService(urlFilenameMappings.multipleSpecialChars.url);
      const jsonPath = service.getJsonPath(urlFilenameMappings.multipleSpecialChars.url);

      // Service uses last URL segment 'api#v2.0' → sanitizes to 'api_v2_0'
      // But URL parsing treats '#v2.0' as fragment (removed), so we get 'api'
      expect(jsonPath).toContain('api.json');
      expect(jsonPath).not.toContain('#');
    });

    it('should preserve numbers and dashes', () => {
      const service = new ExtractService(urlFilenameMappings.numbersAndDashes.url);
      const jsonPath = service.getJsonPath(urlFilenameMappings.numbersAndDashes.url);

      expect(jsonPath).toContain('version-2-0.json');
    });
  });

  describe('save', () => {
    it('should save simple extracted JSON', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedSimple);

      const jsonPath = service.getJsonPath(TEST_URL);
      expect(writeFileSync).toHaveBeenCalledWith(jsonPath, expect.any(String));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Saved extracted JSON'));
    });

    it('should save JSON with 2-space indentation', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedMinimal);

      const jsonPath = service.getJsonPath(TEST_URL);
      const writeCall = vi.mocked(writeFileSync).mock.calls.find(call => call[0] === jsonPath);
      const savedContent = writeCall![1] as string;

      // Check for 2-space indentation
      expect(savedContent).toContain('  "source"');
      expect(savedContent).toContain('  "pageTitle"');
    });

    it('should save complex nested structure', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedComplex);

      const jsonPath = service.getJsonPath(TEST_URL);
      expect(writeFileSync).toHaveBeenCalledWith(jsonPath, expect.any(String));

      // Verify we can parse it back
      const writeCall = vi.mocked(writeFileSync).mock.calls.find(call => call[0] === jsonPath);
      const savedContent = writeCall![1] as string;
      const parsed = JSON.parse(savedContent);

      expect(parsed.sections).toHaveLength(3);
      expect(parsed.sections[0].codeExamples).toBeDefined();
    });

    it('should save code-heavy documents', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedCodeHeavy);

      const jsonPath = service.getJsonPath(TEST_URL);
      const writeCall = vi.mocked(writeFileSync).mock.calls.find(call => call[0] === jsonPath);
      const savedContent = writeCall![1] as string;
      const parsed = JSON.parse(savedContent);

      expect(parsed.sections[0].codeExamples).toHaveLength(3);
      expect(parsed.sections[0].codeExamples[0].language).toBe('javascript');
    });

    it('should create directory if needed', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedSimple);

      // Directory creation happens in constructor + save
      expect(mkdirSync).toHaveBeenCalled();
    });

    it('should handle unicode content', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, edgeCases.unicodeContent);

      const jsonPath = service.getJsonPath(TEST_URL);
      const writeCall = vi.mocked(writeFileSync).mock.calls.find(call => call[0] === jsonPath);
      const savedContent = writeCall![1] as string;
      const parsed = JSON.parse(savedContent);

      expect(parsed.pageTitle).toContain('你好');
      expect(parsed.pageTitle).toContain('🎉');
      expect(parsed.summary).toContain('中文');
    });
  });

  describe('get', () => {
    it('should retrieve saved JSON', async () => {
      const service = new ExtractService(TEST_URL);
      const jsonPath = service.getJsonPath(TEST_URL);

      // Pre-populate virtual FS
      virtualFS.set(jsonPath, JSON.stringify(extractedSimple, null, 2));

      const retrieved = await service.get(TEST_URL);

      expect(retrieved).toEqual(extractedSimple);
    });

    it('should return null for non-existent JSON', async () => {
      const service = new ExtractService(TEST_URL);

      const result = await service.get('https://docs.example.com/does-not-exist');

      expect(result).toBeNull();
    });

    it('should parse complex nested structures correctly', async () => {
      const service = new ExtractService(TEST_URL);
      const jsonPath = service.getJsonPath(TEST_URL);

      virtualFS.set(jsonPath, JSON.stringify(extractedComplex, null, 2));

      const retrieved = (await service.get(TEST_URL)) as any;

      expect(retrieved).toEqual(extractedComplex);
      expect(retrieved.sections).toHaveLength(3);
      expect(retrieved.sections[1].codeExamples).toHaveLength(1);
      expect(retrieved.sections[1].codeExamples[0].language).toBe('json');
    });

    it('should preserve metadata structure', async () => {
      const service = new ExtractService(TEST_URL);
      const jsonPath = service.getJsonPath(TEST_URL);

      virtualFS.set(jsonPath, JSON.stringify(extractedSimple, null, 2));

      const retrieved = (await service.get(TEST_URL)) as any;

      expect(retrieved.metadata).toBeDefined();
      expect(retrieved.metadata.modelUsed).toBe('claude-sonnet-4-5-20250929');
      expect(retrieved.metadata.extractionStats).toBeDefined();
      expect(retrieved.metadata.extractionStats.totalSections).toBe(1);
    });

    it('should handle edge case: empty JSON', async () => {
      const service = new ExtractService(TEST_URL);
      const jsonPath = service.getJsonPath(TEST_URL);

      virtualFS.set(jsonPath, JSON.stringify(edgeCases.emptyJson));

      const retrieved = await service.get(TEST_URL);

      expect(retrieved).toEqual({});
    });
  });

  describe('exists', () => {
    it('should return true when JSON exists', () => {
      const service = new ExtractService(TEST_URL);
      const jsonPath = service.getJsonPath(TEST_URL);

      virtualFS.set(jsonPath, JSON.stringify(extractedSimple));

      const result = service.exists(TEST_URL);

      expect(result).toBe(true);
    });

    it('should return false when JSON does not exist', () => {
      const service = new ExtractService(TEST_URL);

      const result = service.exists('https://docs.example.com/non-existent');

      expect(result).toBe(false);
    });
  });

  describe('Roundtrip (save → get)', () => {
    it('should preserve exact structure after save and get', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedSimple);
      const retrieved = await service.get(TEST_URL);

      expect(retrieved).toEqual(extractedSimple);
    });

    it('should preserve complex structures', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedComplex);
      const retrieved = await service.get(TEST_URL);

      expect(retrieved).toEqual(extractedComplex);
    });

    it('should preserve code examples', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedCodeHeavy);
      const retrieved = (await service.get(TEST_URL)) as any;

      expect(retrieved.sections[0].codeExamples).toEqual(
        extractedCodeHeavy.sections[0].codeExamples
      );
    });

    it('should preserve unicode and special characters', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, edgeCases.unicodeContent);
      const retrieved = await service.get(TEST_URL);

      expect(retrieved).toEqual(edgeCases.unicodeContent);
    });
  });

  describe('Real-world structure validation', () => {
    it('should handle realistic extraction with all fields', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedComplex);
      const retrieved = (await service.get(TEST_URL)) as any;

      // Validate required top-level fields
      expect(retrieved).toHaveProperty('source');
      expect(retrieved).toHaveProperty('pageTitle');
      expect(retrieved).toHaveProperty('summary');
      expect(retrieved).toHaveProperty('sections');
      expect(retrieved).toHaveProperty('prerequisites');
      expect(retrieved).toHaveProperty('useCases');
      expect(retrieved).toHaveProperty('configuration');
      expect(retrieved).toHaveProperty('troubleshooting');
      expect(retrieved).toHaveProperty('metadata');

      // Validate sections structure
      retrieved.sections.forEach((section: any) => {
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('content');
        expect(section).toHaveProperty('confidence');
        expect(section).toHaveProperty('codeExamples');
        expect(section).toHaveProperty('keyConcepts');
        expect(section).toHaveProperty('implementation');
      });

      // Validate metadata structure
      expect(retrieved.metadata).toHaveProperty('extractedAt');
      expect(retrieved.metadata).toHaveProperty('modelUsed');
      expect(retrieved.metadata).toHaveProperty('extractionStats');
    });

    it('should preserve code example structure', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedCodeHeavy);
      const retrieved = (await service.get(TEST_URL)) as any;

      const codeExample = retrieved.sections[0].codeExamples[0];
      expect(codeExample).toHaveProperty('language');
      expect(codeExample).toHaveProperty('code');
      expect(codeExample).toHaveProperty('description');
      expect(codeExample).toHaveProperty('demonstrates');
      expect(codeExample).toHaveProperty('context');
      expect(codeExample).toHaveProperty('variations');
      expect(codeExample).toHaveProperty('confidence');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const service = new ExtractService(TEST_URL);
      const jsonPath = service.getJsonPath(TEST_URL);

      // Set invalid JSON in virtual FS
      virtualFS.set(jsonPath, edgeCases.invalidJson);

      await expect(service.get(TEST_URL)).rejects.toThrow();
    });

    it('should handle huge documents', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, edgeCases.hugeDocument);
      const retrieved = (await service.get(TEST_URL)) as any;

      expect(retrieved.sections).toHaveLength(100);
      expect(retrieved.metadata.extractionStats.totalSections).toBe(100);
    });

    it('should handle minimal documents', async () => {
      const service = new ExtractService(TEST_URL);

      await service.save(TEST_URL, extractedMinimal);
      const retrieved = (await service.get(TEST_URL)) as any;

      expect(retrieved.sections).toHaveLength(0);
      expect(retrieved.metadata.completeness).toBe('low');
    });
  });
});
