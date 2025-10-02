/**
 * ManifestService Integration Tests
 * Tests real filesystem operations, manifest persistence, and multi-instance behavior
 *
 * NOTE: These tests use real file I/O to verify:
 * - Manifest files are created and persisted correctly
 * - Multiple service instances share the same manifest
 * - JSON parsing works with real files
 * - Directory creation and error handling
 *
 * For unit tests with mocked filesystem, see tests/unit/services/manifest-service/
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ManifestService } from '@/services/manifest-service.js';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import path from 'path';

// Use unique test domain to avoid conflicts
const TEST_DOMAIN = 'manifest-integration-test.local';
const TEST_URL = `https://${TEST_DOMAIN}/test-doc`;
const TEST_DATA_DIR = path.join(process.cwd(), '.data', TEST_DOMAIN);
const TEST_MANIFEST_PATH = path.join(TEST_DATA_DIR, 'manifest.json');

describe('ManifestService Integration (Real FS)', () => {
  beforeEach(() => {
    // Clean up test data directory
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });

  describe('Filesystem Operations', () => {
    it('should create domain directory on first write', () => {
      expect(existsSync(TEST_DATA_DIR)).toBe(false);

      const service = new ManifestService(TEST_URL);
      service.updateFetched(TEST_URL);

      expect(existsSync(TEST_DATA_DIR)).toBe(true);
      expect(existsSync(TEST_MANIFEST_PATH)).toBe(true);
    });

    it('should persist manifest to disk and read it back', () => {
      const service = new ManifestService(TEST_URL);
      service.updateFetched(TEST_URL);

      // Verify file was written
      expect(existsSync(TEST_MANIFEST_PATH)).toBe(true);

      // Read and parse the actual file
      const fileContent = readFileSync(TEST_MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(fileContent);

      expect(manifest.version).toBe('2.0');
      expect(manifest.domain).toBe(TEST_DOMAIN);
      expect(manifest.records[TEST_URL]).toBeDefined();
      expect(manifest.records[TEST_URL].status).toBe('fetched');
    });

    it('should share manifest across multiple service instances', () => {
      // Service 1 writes
      const service1 = new ManifestService(TEST_URL);
      service1.updateFetched(TEST_URL);

      // Service 2 reads (different instance, same domain)
      const service2 = new ManifestService(TEST_URL);
      const record = service2.getRecord(TEST_URL);

      expect(record).toBeDefined();
      expect(record?.status).toBe('fetched');
      expect(record?.url).toBe(TEST_URL);
    });

    it('should update lastUpdatedAt timestamp on every save', () => {
      const service = new ManifestService(TEST_URL);

      // First write
      service.updateFetched(TEST_URL);
      const content1 = JSON.parse(readFileSync(TEST_MANIFEST_PATH, 'utf-8'));
      const firstTimestamp = content1.lastUpdatedAt;

      // Wait and write again
      const delay = () => new Promise(resolve => setTimeout(resolve, 10));
      return delay().then(() => {
        service.updateExtracted(TEST_URL, { model: 'claude-sonnet-4' });

        const content2 = JSON.parse(readFileSync(TEST_MANIFEST_PATH, 'utf-8'));
        const secondTimestamp = content2.lastUpdatedAt;

        expect(secondTimestamp).not.toBe(firstTimestamp);
        expect(new Date(secondTimestamp) > new Date(firstTimestamp)).toBe(true);
      });
    });

    it('should format manifest with pretty JSON (2-space indent)', () => {
      const service = new ManifestService(TEST_URL);
      service.updateFetched(TEST_URL);

      const fileContent = readFileSync(TEST_MANIFEST_PATH, 'utf-8');

      // Check for pretty formatting (contains newlines and indentation)
      expect(fileContent).toContain('\n');
      expect(fileContent).toMatch(/ {2}"/); // 2-space indent
    });
  });

  describe('Pipeline Progression with Real Files', () => {
    it('should track complete pipeline: fetch → extract → structured → embed', async () => {
      const service = new ManifestService(TEST_URL);

      // Stage 1: Fetch
      service.updateFetched(TEST_URL);
      expect(service.getRecord(TEST_URL)?.status).toBe('fetched');

      // Wait for distinct timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Stage 2: Extract
      service.updateExtracted(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929'
      });
      expect(service.getRecord(TEST_URL)?.status).toBe('extracted');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Stage 3: Structured
      service.updateStructured(TEST_URL);
      expect(service.getRecord(TEST_URL)?.status).toBe('structured');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Stage 4: Embed
      service.updateEmbedded(TEST_URL, {
        provider: 'ollama'
      });
      expect(service.getRecord(TEST_URL)?.status).toBe('embedded');

      // Verify all metadata persisted to disk
      const fileContent = readFileSync(TEST_MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(fileContent);
      const record = manifest.records[TEST_URL];

      expect(record.lastFetchedAt).toBeDefined();
      expect(record.lastExtractedAt).toBeDefined();
      expect(record.lastStructuredAt).toBeDefined();
      expect(record.lastEmbeddedAt).toBeDefined();
      expect(record.lastIngestedAt).toBeDefined();
      expect(record.extractionModel).toBe('claude-sonnet-4-5-20250929');
      expect(record.embeddingProvider).toBe('ollama');
    });

    it('should preserve timestamps through pipeline progression', async () => {
      const service = new ManifestService(TEST_URL);

      service.updateFetched(TEST_URL);
      const fetchTime = service.getRecord(TEST_URL)?.lastFetchedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      service.updateExtracted(TEST_URL, { model: 'claude-sonnet-4' });
      const extractTime = service.getRecord(TEST_URL)?.lastExtractedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      service.updateEmbedded(TEST_URL, { provider: 'ollama' });

      const finalRecord = service.getRecord(TEST_URL);

      // All timestamps preserved
      expect(finalRecord?.lastFetchedAt).toBe(fetchTime);
      expect(finalRecord?.lastExtractedAt).toBe(extractTime);
      expect(finalRecord?.lastEmbeddedAt).toBeDefined();
    });

    it('should handle failed pipeline stage and preserve previous state', async () => {
      const service = new ManifestService(TEST_URL);

      service.updateFetched(TEST_URL);
      const fetchTime = service.getRecord(TEST_URL)?.lastFetchedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate extraction failure
      service.updateFailed(TEST_URL, 'Claude API timeout');

      const record = service.getRecord(TEST_URL);
      expect(record?.status).toBe('failed');
      expect(record?.lastError).toBe('Claude API timeout');
      expect(record?.lastFailedAt).toBeDefined();
      expect(record?.lastFetchedAt).toBe(fetchTime); // Preserved

      // Verify persisted to disk
      const fileContent = readFileSync(TEST_MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(fileContent);
      expect(manifest.records[TEST_URL].status).toBe('failed');
      expect(manifest.records[TEST_URL].lastError).toBe('Claude API timeout');
    });
  });

  describe('JSON File Parsing Integration', () => {
    it('should parse real JSON file and extract section/code counts for structured stage', () => {
      const service = new ManifestService(TEST_URL);

      // Create real extraction JSON file
      const extractionDir = path.join(TEST_DATA_DIR, 'extractions');
      mkdirSync(extractionDir, { recursive: true });

      const extractionPath = path.join(extractionDir, 'test-extraction.json');
      const extractionData = {
        sections: [
          {
            title: 'Getting Started',
            codeExamples: [{ code: 'example1' }, { code: 'example2' }]
          },
          {
            title: 'Advanced Usage',
            codeExamples: [{ code: 'example3' }]
          },
          {
            title: 'API Reference',
            codeExamples: [] // No code examples
          }
        ]
      };

      writeFileSync(extractionPath, JSON.stringify(extractionData, null, 2));

      // Update with real JSON path
      service.updateStructured(TEST_URL, { jsonPath: extractionPath });

      const record = service.getRecord(TEST_URL);

      expect(record?.status).toBe('structured');
      expect(record?.sectionCount).toBe(3);
      expect(record?.codeExampleCount).toBe(3); // 2 + 1 + 0
      expect(record?.outputSize).toBeGreaterThan(0); // Real file size
    });

    it('should track raw response size for extracted stage', () => {
      const service = new ManifestService(TEST_URL);

      // Create raw extraction file
      const rawDir = path.join(TEST_DATA_DIR, 'raw');
      mkdirSync(rawDir, { recursive: true });

      const rawPath = path.join(rawDir, 'raw-extraction.json');
      const rawData = JSON.stringify({ raw: 'response from Claude' });
      writeFileSync(rawPath, rawData);

      service.updateExtracted(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929',
        jsonPath: rawPath
      });

      const record = service.getRecord(TEST_URL);

      expect(record?.status).toBe('extracted');
      expect(record?.rawResponseSize).toBe(rawData.length);
    });

    it('should parse JSON for embedded stage with counts', () => {
      const service = new ManifestService(TEST_URL);

      // Create structured JSON
      const jsonPath = path.join(TEST_DATA_DIR, 'structured.json');
      mkdirSync(path.dirname(jsonPath), { recursive: true });

      const data = {
        sections: [{ codeExamples: [{}, {}, {}] }, { codeExamples: [{}] }]
      };

      writeFileSync(jsonPath, JSON.stringify(data));

      service.updateEmbedded(TEST_URL, {
        provider: 'openai',
        jsonPath
      });

      const record = service.getRecord(TEST_URL);

      expect(record?.status).toBe('embedded');
      expect(record?.sectionCount).toBe(2);
      expect(record?.codeExampleCount).toBe(4);
      expect(record?.embeddingProvider).toBe('openai');
    });

    it('should handle missing JSON file gracefully', () => {
      const service = new ManifestService(TEST_URL);

      // Path doesn't exist
      service.updateStructured(TEST_URL, {
        jsonPath: '/non/existent/path.json'
      });

      const record = service.getRecord(TEST_URL);

      expect(record?.status).toBe('structured');
      expect(record?.sectionCount).toBeUndefined();
      expect(record?.codeExampleCount).toBeUndefined();
    });
  });

  describe('Content Change Tracking', () => {
    it('should track unchanged content without full ingestion', () => {
      const service = new ManifestService(TEST_URL);

      // Simulate existing embedded record
      service.updateFetched(TEST_URL);
      service.updateExtracted(TEST_URL, { model: 'claude-sonnet-4' });
      service.updateEmbedded(TEST_URL, { provider: 'ollama' });

      const originalStatus = service.getRecord(TEST_URL)?.status;

      // Content check finds no changes
      service.updateUnchanged(TEST_URL);

      const record = service.getRecord(TEST_URL);

      expect(record?.status).toBe(originalStatus); // Status unchanged
      expect(record?.lastCheckedAt).toBeDefined();

      // Verify persisted
      const fileContent = readFileSync(TEST_MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(fileContent);
      expect(manifest.records[TEST_URL].lastCheckedAt).toBeDefined();
    });
  });

  describe('Multiple Records Management', () => {
    it('should manage multiple URLs in single manifest', () => {
      const service = new ManifestService(TEST_URL);

      const url1 = 'https://manifest-integration-test.local/doc1';
      const url2 = 'https://manifest-integration-test.local/doc2';
      const url3 = 'https://manifest-integration-test.local/doc3';

      service.updateFetched(url1);
      service.updateExtracted(url2, { model: 'claude-sonnet-4' });
      service.updateEmbedded(url3, { provider: 'ollama' });

      const records = service.getAllRecords();

      expect(records.length).toBe(3);
      expect(records.find(r => r.url === url1)?.status).toBe('fetched');
      expect(records.find(r => r.url === url2)?.status).toBe('extracted');
      expect(records.find(r => r.url === url3)?.status).toBe('embedded');

      // Verify all in same file
      const fileContent = readFileSync(TEST_MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(fileContent);
      expect(Object.keys(manifest.records).length).toBe(3);
    });

    it('should retrieve individual records from manifest with multiple URLs', () => {
      const service = new ManifestService(TEST_URL);

      service.updateFetched('https://manifest-integration-test.local/doc1');
      service.updateFetched('https://manifest-integration-test.local/doc2');

      const record1 = service.getRecord('https://manifest-integration-test.local/doc1');
      const record2 = service.getRecord('https://manifest-integration-test.local/doc2');
      const record3 = service.getRecord('https://manifest-integration-test.local/doc-missing');

      expect(record1?.url).toBe('https://manifest-integration-test.local/doc1');
      expect(record2?.url).toBe('https://manifest-integration-test.local/doc2');
      expect(record3).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from corrupt manifest file', () => {
      const service1 = new ManifestService(TEST_URL);
      service1.updateFetched(TEST_URL);

      // Corrupt the manifest
      writeFileSync(TEST_MANIFEST_PATH, '{invalid json');

      // New service instance should reinitialize
      const service2 = new ManifestService(TEST_URL);
      service2.updateFetched('https://manifest-integration-test.local/new-url');

      const record = service2.getRecord('https://manifest-integration-test.local/new-url');
      expect(record?.status).toBe('fetched');

      // Old record is lost (manifest was reinitialized)
      expect(service2.getRecord(TEST_URL)).toBeNull();
    });

    it('should reinitialize manifest with missing version', () => {
      // Create invalid manifest (missing version)
      mkdirSync(TEST_DATA_DIR, { recursive: true });
      writeFileSync(
        TEST_MANIFEST_PATH,
        JSON.stringify({
          domain: TEST_DOMAIN,
          records: {}
        })
      );

      const service = new ManifestService(TEST_URL);
      service.updateFetched(TEST_URL);

      // Should reinitialize with version
      const fileContent = readFileSync(TEST_MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(fileContent);

      expect(manifest.version).toBe('2.0');
      expect(manifest.records[TEST_URL]).toBeDefined();
    });
  });

  describe('Manifest Metadata', () => {
    it('should set createdAt on initialization', () => {
      const service = new ManifestService(TEST_URL);
      service.updateFetched(TEST_URL);

      const fileContent = readFileSync(TEST_MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(fileContent);

      expect(manifest.createdAt).toBeDefined();
      expect(manifest.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
    });

    it('should preserve createdAt but update lastUpdatedAt', async () => {
      const service = new ManifestService(TEST_URL);

      service.updateFetched(TEST_URL);
      const content1 = JSON.parse(readFileSync(TEST_MANIFEST_PATH, 'utf-8'));
      const createdAt = content1.createdAt;
      const firstUpdate = content1.lastUpdatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      service.updateExtracted(TEST_URL, { model: 'claude-sonnet-4' });
      const content2 = JSON.parse(readFileSync(TEST_MANIFEST_PATH, 'utf-8'));

      expect(content2.createdAt).toBe(createdAt); // Preserved
      expect(content2.lastUpdatedAt).not.toBe(firstUpdate); // Updated
    });

    it('should include defaultTTLDays in manifest', () => {
      const service = new ManifestService(TEST_URL);
      service.updateFetched(TEST_URL);

      const fileContent = readFileSync(TEST_MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(fileContent);

      expect(manifest.defaultTTLDays).toBeDefined();
      expect(typeof manifest.defaultTTLDays).toBe('number');
    });
  });
});
