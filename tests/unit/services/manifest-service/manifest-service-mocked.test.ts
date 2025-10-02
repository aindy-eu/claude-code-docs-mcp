/**
 * Example: ManifestService Tests with Mocked File System
 * This shows how we could test without touching real files
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ManifestService } from '@/services/manifest-service.js';

// Mock the entire fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  rmSync: vi.fn()
}));

// Import mocked fs functions
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

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
  });

  describe('Initialization', () => {
    it('should create manifest on first write without touching real filesystem', () => {
      const manager = new ManifestService(TEST_URL);

      // Before update, manifest doesn't exist
      expect(virtualFS.size).toBe(0);

      // Update triggers manifest creation
      manager.updateFetched(TEST_URL);

      // Check that writeFileSync was called (twice: init + update)
      expect(writeFileSync).toHaveBeenCalledTimes(2);

      // Verify the manifest structure in virtual FS (second call has the updated record)
      const writtenData = vi.mocked(writeFileSync).mock.calls[1][1] as string;
      const manifest = JSON.parse(writtenData);

      expect(manifest.version).toBe('2.0');
      expect(manifest.domain).toBe(TEST_DOMAIN);
      expect(manifest.records).toBeDefined();
      expect(manifest.records[TEST_URL]).toBeDefined();
      expect(manifest.records[TEST_URL].status).toBe('fetched');
    });

    it('should read existing manifest from virtual filesystem', () => {
      // Pre-populate virtual FS with a manifest
      const existingManifest = {
        version: '2.0',
        domain: TEST_DOMAIN,
        records: {
          [TEST_URL]: {
            url: TEST_URL,
            status: 'embedded',
            lastFetchedAt: '2024-01-01T00:00:00Z'
          }
        }
      };

      const manifestPath = `${process.cwd()}/.data/${TEST_DOMAIN}/manifest.json`;
      virtualFS.set(manifestPath, JSON.stringify(existingManifest, null, 2));

      const manager = new ManifestService(TEST_URL);
      const record = manager.getRecord(TEST_URL);

      expect(readFileSync).toHaveBeenCalledWith(manifestPath, 'utf-8');
      expect(record).toBeDefined();
      expect(record?.status).toBe('embedded');
    });
  });

  describe('Update operations', () => {
    it('should update status without file I/O side effects', () => {
      const manager = new ManifestService(TEST_URL);

      // Chain of updates (each update writes twice: once for init, then for the update)
      manager.updateFetched(TEST_URL);
      expect(writeFileSync).toHaveBeenCalledTimes(2);

      manager.updateExtracted(TEST_URL);
      expect(writeFileSync).toHaveBeenCalledTimes(3);

      manager.updateEmbedded(TEST_URL);
      expect(writeFileSync).toHaveBeenCalledTimes(4);

      // Check the final manifest state
      const lastWrite = vi.mocked(writeFileSync).mock.calls[3][1] as string;
      const finalManifest = JSON.parse(lastWrite);

      expect(finalManifest.records[TEST_URL].status).toBe('embedded');
    });
  });
});

/**
 * Alternative Approach: Using a Temp Directory
 * This approach uses real file operations but in isolated temp directories
 */
describe('ManifestService (Temp Directory)', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    const { mkdtemp } = await import('fs/promises');
    const { tmpdir } = await import('os');
    const { join } = await import('path');

    tempDir = await mkdtemp(join(tmpdir(), 'manifest-test-'));

    // Mock only the part that determines the data directory
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
  });

  afterEach(async () => {
    // Restore mock
    vi.restoreAllMocks();

    // Clean up temp directory
    if (tempDir) {
      const { rm } = await import('fs/promises');
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should work with real files in temp directory', () => {
    const manager = new ManifestService(TEST_URL);
    manager.updateFetched(TEST_URL);

    // This creates real files but in our temp directory
    // Not affecting the project's .data folder
    const manifestPath = `${tempDir}/.data/${TEST_DOMAIN}/manifest.json`;
    expect(existsSync(manifestPath)).toBe(true);
  });
});
