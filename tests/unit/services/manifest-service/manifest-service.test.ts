/**
 * Tests for ManifestService
 */

import { ManifestService } from '@/services/manifest-service.js';
import { existsSync, readFileSync, rmSync } from 'fs';
import path from 'path';

const TEST_URL = 'https://example.com/test-doc';
const TEST_DOMAIN = 'example.com';
const TEST_DATA_DIR = path.join(process.cwd(), '.data', TEST_DOMAIN);
const TEST_MANIFEST_PATH = path.join(TEST_DATA_DIR, 'manifest.json');

describe('ManifestService', () => {
  beforeEach(() => {
    // Clean up test directory
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

  describe('Initialization', () => {
    it('should create manifest directory on first write', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL); // Triggers manifest creation
      expect(existsSync(path.dirname(TEST_MANIFEST_PATH))).toBe(true);
    });

    it('should initialize manifest on first access', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      expect(existsSync(TEST_MANIFEST_PATH)).toBe(true);

      const manifest = JSON.parse(readFileSync(TEST_MANIFEST_PATH, 'utf-8'));
      expect(manifest.version).toBe('2.0');
      expect(manifest.domain).toBe(TEST_DOMAIN);
      expect(manifest.defaultTTLDays).toBe(7);
      expect(manifest.records).toBeDefined();
    });
  });

  describe('updateFetched', () => {
    it('should create a fetched record', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      const record = manager.getRecord(TEST_URL);
      expect(record).toBeDefined();
      expect(record?.url).toBe(TEST_URL);
      expect(record?.status).toBe('fetched');
      expect(record?.lastFetchedAt).toBeDefined();
    });

    it('should update existing record', async () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      const firstFetch = manager.getRecord(TEST_URL)?.lastFetchedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      manager.updateFetched(TEST_URL);
      const secondFetch = manager.getRecord(TEST_URL)?.lastFetchedAt;

      expect(secondFetch).toBeDefined();
      expect(secondFetch).not.toBe(firstFetch);
    });
  });

  describe('updateExtracted', () => {
    it('should update status to extracted', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);
      manager.updateExtracted(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929'
      });

      const record = manager.getRecord(TEST_URL);
      expect(record?.status).toBe('extracted');
      expect(record?.extractionModel).toBe('claude-sonnet-4-5-20250929');
      expect(record?.lastExtractedAt).toBeDefined();
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
  });

  describe('updateStructured', () => {
    it('should update status to structured', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateStructured(TEST_URL);

      const record = manager.getRecord(TEST_URL);
      expect(record?.status).toBe('structured');
      expect(record?.lastStructuredAt).toBeDefined();
    });
  });

  describe('updateEmbedded', () => {
    it('should update status to embedded', () => {
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
  });

  describe('updateFailed', () => {
    it('should update status to failed with error', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFailed(TEST_URL, 'Test error message');

      const record = manager.getRecord(TEST_URL);
      expect(record?.status).toBe('failed');
      expect(record?.lastError).toBe('Test error message');
      expect(record?.lastFailedAt).toBeDefined();
    });
  });

  describe('getRecord', () => {
    it('should return null for non-existent record', () => {
      const manager = new ManifestService(TEST_URL);
      const record = manager.getRecord('https://example.com/does-not-exist');
      expect(record).toBeNull();
    });

    it('should return existing record', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      const record = manager.getRecord(TEST_URL);
      expect(record).toBeDefined();
      expect(record?.url).toBe(TEST_URL);
    });
  });

  describe('getAllRecords', () => {
    it('should return empty array when no records', () => {
      const manager = new ManifestService(TEST_URL);
      const records = manager.getAllRecords();
      expect(records).toEqual([]);
    });

    it('should return all records', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched('https://example.com/doc1');
      manager.updateFetched('https://example.com/doc2');
      manager.updateFetched('https://example.com/doc3');

      const records = manager.getAllRecords();
      expect(records.length).toBe(3);
      expect(records.map(r => r.url)).toContain('https://example.com/doc1');
      expect(records.map(r => r.url)).toContain('https://example.com/doc2');
      expect(records.map(r => r.url)).toContain('https://example.com/doc3');
    });
  });

  describe('Pipeline progression', () => {
    it('should track full pipeline: fetch → extract → embed', () => {
      const manager = new ManifestService(TEST_URL);

      // Fetch
      manager.updateFetched(TEST_URL);
      expect(manager.getRecord(TEST_URL)?.status).toBe('fetched');

      // Extract
      manager.updateExtracted(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929'
      });
      expect(manager.getRecord(TEST_URL)?.status).toBe('extracted');

      // Embed
      manager.updateEmbedded(TEST_URL, {
        provider: 'ollama'
      });
      expect(manager.getRecord(TEST_URL)?.status).toBe('embedded');

      // Verify all timestamps are preserved
      const record = manager.getRecord(TEST_URL);
      expect(record?.lastFetchedAt).toBeDefined();
      expect(record?.lastExtractedAt).toBeDefined();
      expect(record?.lastEmbeddedAt).toBeDefined();
      expect(record?.extractionModel).toBe('claude-sonnet-4-5-20250929');
      expect(record?.embeddingProvider).toBe('ollama');
    });
  });

  describe('Manifest structure', () => {
    it('should maintain valid manifest structure', () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      const manifest = JSON.parse(readFileSync(TEST_MANIFEST_PATH, 'utf-8'));

      expect(manifest).toHaveProperty('version');
      expect(manifest).toHaveProperty('domain');
      expect(manifest).toHaveProperty('createdAt');
      expect(manifest).toHaveProperty('lastUpdatedAt');
      expect(manifest).toHaveProperty('defaultTTLDays');
      expect(manifest).toHaveProperty('records');
      expect(typeof manifest.records).toBe('object');
    });

    it('should update lastUpdatedAt on every change', async () => {
      const manager = new ManifestService(TEST_URL);
      manager.updateFetched(TEST_URL);

      const manifest1 = JSON.parse(readFileSync(TEST_MANIFEST_PATH, 'utf-8'));
      const firstUpdate = manifest1.lastUpdatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      manager.updateExtracted(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929'
      });

      const manifest2 = JSON.parse(readFileSync(TEST_MANIFEST_PATH, 'utf-8'));
      const secondUpdate = manifest2.lastUpdatedAt;

      expect(secondUpdate).not.toBe(firstUpdate);
    });
  });
});
