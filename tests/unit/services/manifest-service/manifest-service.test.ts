/**
 * ManifestService Tests with Mocked File System
 * Comprehensive tests without touching real files
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ManifestService } from '@/services/manifest-service.js';
import {
  manifestWithFetchedRecord,
  manifestWithEmbeddedRecord,
  manifestWithMultipleRecords,
  manifestMissingVersion,
  manifestMissingRecords,
  corruptManifestJson,
  structuredDocWithSections,
  structuredDocEmpty,
  structuredDocNoCodeExamples,
  structuredDocMissingSectionsField
} from '../../../fixtures/manifestFixtures.js';

// Mock logger to suppress logs during tests
vi.mock('@/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock the entire fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn()
}));

// Import mocked fs functions
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { logger } from '@/utils/logger.js';

const TEST_URL = 'https://example.com/test-doc';
const TEST_DOMAIN = 'example.com';

describe('ManifestService (Mocked FS)', () => {
  // Virtual file system state
  let virtualFS: Map<string, string>;

  beforeEach(() => {
    // Reset virtual file system
    virtualFS = new Map();

    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock implementations
    vi.mocked(existsSync).mockImplementation(path => {
      return virtualFS.has(path as string);
    });

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

    vi.mocked(statSync).mockImplementation(
      () =>
        ({
          size: 45678
        }) as any
    );
  });

  describe('Initialization', () => {
    it('should create manifest on first write without touching real filesystem', () => {
      const manager = new ManifestService(TEST_URL);

      // Before update, manifest doesn't exist
      expect(virtualFS.size).toBe(0);

      // Update triggers manifest creation
      manager.updateFetched(TEST_URL);

      // Verify writeFileSync was called (init + update)
      expect(writeFileSync).toHaveBeenCalled();

      // Get the last write (the updated manifest)
      const lastWriteCall =
        vi.mocked(writeFileSync).mock.calls[vi.mocked(writeFileSync).mock.calls.length - 1];
      const writtenData = lastWriteCall[1] as string;
      const manifest = JSON.parse(writtenData);

      expect(manifest.version).toBe('2.0');
      expect(manifest.domain).toBe(TEST_DOMAIN);
      expect(manifest.records).toBeDefined();
      expect(manifest.records[TEST_URL]).toBeDefined();
      expect(manifest.records[TEST_URL].status).toBe('fetched');
    });

    it('should read existing manifest from virtual filesystem', () => {
      const manifestPath = `${process.cwd()}/.data/${TEST_DOMAIN}/manifest.json`;
      virtualFS.set(manifestPath, JSON.stringify(manifestWithFetchedRecord, null, 2));

      const manager = new ManifestService(TEST_URL);
      const record = manager.getRecord('https://example.com/docs/quickstart'); // URL from fixture

      expect(readFileSync).toHaveBeenCalledWith(manifestPath, 'utf-8');
      expect(record).toBeDefined();
      expect(record?.status).toBe('fetched');
    });

    it('should reinitialize invalid manifest (missing version)', () => {
      const manifestPath = `${process.cwd()}/.data/${TEST_DOMAIN}/manifest.json`;
      virtualFS.set(manifestPath, JSON.stringify(manifestMissingVersion));

      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      expect(logger.warn).toHaveBeenCalledWith('Invalid manifest structure, reinitializing');
    });

    it('should reinitialize invalid manifest (missing records)', () => {
      const manifestPath = `${process.cwd()}/.data/${TEST_DOMAIN}/manifest.json`;
      virtualFS.set(manifestPath, JSON.stringify(manifestMissingRecords));

      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      expect(logger.warn).toHaveBeenCalledWith('Invalid manifest structure, reinitializing');
    });

    it('should handle corrupt JSON gracefully', () => {
      const manifestPath = `${process.cwd()}/.data/${TEST_DOMAIN}/manifest.json`;
      virtualFS.set(manifestPath, corruptManifestJson);

      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to read manifest, reinitializing',
        expect.any(Object)
      );
    });
  });

  describe('updateFetched', () => {
    it('should create fetched record', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      const record = manager.getRecord(TEST_URL);
      expect(record).toBeDefined();
      expect(record?.url).toBe(TEST_URL);
      expect(record?.status).toBe('fetched');
      expect(record?.lastFetchedAt).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(`[MANIFEST] Updated: ${TEST_URL} -> fetched`);
    });

    it('should update existing record timestamp', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      const firstRecord = manager.getRecord(TEST_URL);
      const firstTimestamp = firstRecord?.lastFetchedAt;

      // Simulate time passing
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      manager.updateFetched(TEST_URL);
      vi.useRealTimers();

      const secondRecord = manager.getRecord(TEST_URL);
      expect(secondRecord?.lastFetchedAt).not.toBe(firstTimestamp);
    });
  });

  describe('updateExtracted', () => {
    it('should update status to extracted with model', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);
      manager.updateExtracted(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929'
      });

      const record = manager.getRecord(TEST_URL);
      expect(record?.status).toBe('extracted');
      expect(record?.extractionModel).toBe('claude-sonnet-4-5-20250929');
      expect(record?.lastExtractedAt).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('[MANIFEST] Updated: https://example.com/test-doc -> extracted')
      );
    });

    it('should preserve previous timestamps', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      const fetchTime = manager.getRecord(TEST_URL)?.lastFetchedAt;

      manager.updateExtracted(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929'
      });

      const record = manager.getRecord(TEST_URL);
      expect(record?.lastFetchedAt).toBe(fetchTime);
      expect(record?.lastExtractedAt).toBeDefined();
    });

    it('should track raw response size when jsonPath provided', () => {
      const jsonPath = '/fake/path.json';
      virtualFS.set(jsonPath, '{}');

      const manager = new ManifestService(TEST_URL);
      manager.updateExtracted(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929',
        jsonPath
      });

      const record = manager.getRecord(TEST_URL);
      expect(record?.rawResponseSize).toBe(45678); // From statSync mock
      expect(statSync).toHaveBeenCalledWith(jsonPath);
    });
  });

  describe('updateStructured', () => {
    it('should update status to structured', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateStructured(TEST_URL);

      const record = manager.getRecord(TEST_URL);
      expect(record?.status).toBe('structured');
      expect(record?.lastStructuredAt).toBeDefined();
    });

    it('should parse JSON and count sections and code examples', () => {
      const jsonPath = '/fake/structured.json';
      virtualFS.set(jsonPath, JSON.stringify(structuredDocWithSections));

      const manager = new ManifestService(TEST_URL);
      manager.updateStructured(TEST_URL, { jsonPath });

      const record = manager.getRecord(TEST_URL);
      expect(record?.sectionCount).toBe(5);
      expect(record?.codeExampleCount).toBe(10); // Total across all sections
      expect(record?.outputSize).toBe(45678);
    });

    it('should handle empty sections array', () => {
      const jsonPath = '/fake/empty.json';
      virtualFS.set(jsonPath, JSON.stringify(structuredDocEmpty));

      const manager = new ManifestService(TEST_URL);
      manager.updateStructured(TEST_URL, { jsonPath });

      const record = manager.getRecord(TEST_URL);
      expect(record?.sectionCount).toBe(0);
      expect(record?.codeExampleCount).toBe(0);
    });

    it('should handle missing sections field', () => {
      const jsonPath = '/fake/missing-sections.json';
      virtualFS.set(jsonPath, JSON.stringify(structuredDocMissingSectionsField));

      const manager = new ManifestService(TEST_URL);
      manager.updateStructured(TEST_URL, { jsonPath });

      const record = manager.getRecord(TEST_URL);
      expect(record?.sectionCount).toBe(0);
      expect(record?.codeExampleCount).toBe(0);
    });

    it('should handle docs with no code examples', () => {
      const jsonPath = '/fake/no-code.json';
      virtualFS.set(jsonPath, JSON.stringify(structuredDocNoCodeExamples));

      const manager = new ManifestService(TEST_URL);
      manager.updateStructured(TEST_URL, { jsonPath });

      const record = manager.getRecord(TEST_URL);
      expect(record?.sectionCount).toBe(2);
      expect(record?.codeExampleCount).toBe(0);
    });

    it('should handle malformed JSON gracefully', () => {
      const jsonPath = '/fake/malformed.json';
      virtualFS.set(jsonPath, '{invalid json');

      const manager = new ManifestService(TEST_URL);
      manager.updateStructured(TEST_URL, { jsonPath });

      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to parse JSON for counts',
        expect.any(Object)
      );
    });
  });

  describe('updateEmbedded', () => {
    it('should update status to embedded with provider', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateEmbedded(TEST_URL, {
        provider: 'ollama'
      });

      const record = manager.getRecord(TEST_URL);
      expect(record?.status).toBe('embedded');
      expect(record?.embeddingProvider).toBe('ollama');
      expect(record?.lastEmbeddedAt).toBeDefined();
      expect(record?.lastIngestedAt).toBeDefined();
    });

    it('should parse JSON and count sections for embedded docs', () => {
      const jsonPath = '/fake/embedded.json';
      virtualFS.set(jsonPath, JSON.stringify(structuredDocWithSections));

      const manager = new ManifestService(TEST_URL);
      manager.updateEmbedded(TEST_URL, {
        provider: 'openai',
        jsonPath
      });

      const record = manager.getRecord(TEST_URL);
      expect(record?.sectionCount).toBe(5);
      expect(record?.codeExampleCount).toBe(10);
      expect(record?.embeddingProvider).toBe('openai');
    });
  });

  describe('updateFailed', () => {
    it('should update status to failed with error message', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFailed(TEST_URL, 'Claude API timeout');

      const record = manager.getRecord(TEST_URL);
      expect(record?.status).toBe('failed');
      expect(record?.lastError).toBe('Claude API timeout');
      expect(record?.lastFailedAt).toBeDefined();
    });

    it('should preserve previous state when failing', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);
      const fetchTime = manager.getRecord(TEST_URL)?.lastFetchedAt;

      manager.updateFailed(TEST_URL, 'Network error');

      const record = manager.getRecord(TEST_URL);
      expect(record?.status).toBe('failed');
      expect(record?.lastFetchedAt).toBe(fetchTime); // Preserved
      expect(record?.lastError).toBe('Network error');
    });
  });

  describe('updateUnchanged', () => {
    it('should update lastCheckedAt without changing status', () => {
      const manifestPath = `${process.cwd()}/.data/${TEST_DOMAIN}/manifest.json`;
      virtualFS.set(manifestPath, JSON.stringify(manifestWithEmbeddedRecord));

      const manager = new ManifestService(TEST_URL);
      const originalStatus = manager.getRecord(TEST_URL)?.status;

      manager.updateUnchanged(TEST_URL);

      const record = manager.getRecord(TEST_URL);
      expect(record?.status).toBe(originalStatus); // Status unchanged
      expect(record?.lastCheckedAt).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('[MANIFEST] Content unchanged: https://example.com/test-doc')
      );
    });

    it('should preserve all timestamps when unchanged', () => {
      const manifestPath = `${process.cwd()}/.data/${TEST_DOMAIN}/manifest.json`;
      virtualFS.set(manifestPath, JSON.stringify(manifestWithEmbeddedRecord));

      const manager = new ManifestService(TEST_URL);
      const original = manager.getRecord(TEST_URL);

      manager.updateUnchanged(TEST_URL);

      const updated = manager.getRecord(TEST_URL);
      expect(updated?.lastFetchedAt).toBe(original?.lastFetchedAt);
      expect(updated?.lastExtractedAt).toBe(original?.lastExtractedAt);
      expect(updated?.lastEmbeddedAt).toBe(original?.lastEmbeddedAt);
      expect(updated?.lastIngestedAt).toBe(original?.lastIngestedAt);
    });
  });

  describe('getRecord', () => {
    it('should return null for non-existent record', () => {
      const manager = new ManifestService(TEST_URL);
      const record = manager.getRecord('https://example.com/does-not-exist');
      expect(record).toBeNull();
    });

    it('should return existing record', () => {
      const manifestPath = `${process.cwd()}/.data/${TEST_DOMAIN}/manifest.json`;
      virtualFS.set(manifestPath, JSON.stringify(manifestWithFetchedRecord));

      const manager = new ManifestService(TEST_URL);
      const record = manager.getRecord('https://example.com/docs/quickstart');

      expect(record).toBeDefined();
      expect(record?.url).toBe('https://example.com/docs/quickstart');
      expect(record?.status).toBe('fetched');
    });
  });

  describe('getAllRecords', () => {
    it('should return empty array when no records', () => {
      const manager = new ManifestService(TEST_URL);
      const records = manager.getAllRecords();
      expect(records).toEqual([]);
    });

    it('should return all records', () => {
      const manifestPath = `${process.cwd()}/.data/${TEST_DOMAIN}/manifest.json`;
      virtualFS.set(manifestPath, JSON.stringify(manifestWithMultipleRecords));

      const manager = new ManifestService(TEST_URL);
      const records = manager.getAllRecords();

      expect(records.length).toBe(3);
      expect(records.map(r => r.url)).toContain('https://example.com/docs/quickstart');
      expect(records.map(r => r.url)).toContain('https://example.com/docs/setup');
      expect(records.map(r => r.url)).toContain('https://example.com/docs/troubleshooting');
    });
  });

  describe('Pipeline progression', () => {
    it('should track full pipeline: fetch → extract → structured → embed', () => {
      const manager = new ManifestService(TEST_URL);

      // Fetch
      manager.updateFetched(TEST_URL);
      expect(manager.getRecord(TEST_URL)?.status).toBe('fetched');

      // Extract
      manager.updateExtracted(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929'
      });
      expect(manager.getRecord(TEST_URL)?.status).toBe('extracted');

      // Structured
      manager.updateStructured(TEST_URL);
      expect(manager.getRecord(TEST_URL)?.status).toBe('structured');

      // Embed
      manager.updateEmbedded(TEST_URL, {
        provider: 'ollama'
      });
      expect(manager.getRecord(TEST_URL)?.status).toBe('embedded');

      // Verify all timestamps are preserved
      const record = manager.getRecord(TEST_URL);
      expect(record?.lastFetchedAt).toBeDefined();
      expect(record?.lastExtractedAt).toBeDefined();
      expect(record?.lastStructuredAt).toBeDefined();
      expect(record?.lastEmbeddedAt).toBeDefined();
      expect(record?.extractionModel).toBe('claude-sonnet-4-5-20250929');
      expect(record?.embeddingProvider).toBe('ollama');
    });
  });
});
