/**
 * MasterManifestService Tests with Mocked File System
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MasterManifestService } from '@/services/master-manifest-service.js';
import {
  emptyMasterManifest,
  singleSourceMasterManifest,
  multiSourceMasterManifest
} from '@tests/fixtures/manifestFixtures.js';

// Mock logger
vi.mock('@/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn()
}));

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

describe('MasterManifestService', () => {
  let virtualFS: Map<string, string>;
  const MANIFEST_PATH = `${process.cwd()}/.data/manifest.json`;

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

  describe('initialization', () => {
    it('should create master manifest on first use', () => {
      const service = new MasterManifestService();
      const sources = service.getSources();

      expect(sources).toEqual(emptyMasterManifest.sources);
      expect(writeFileSync).toHaveBeenCalled();

      // Verify structure matches fixture
      const writtenData = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
      expect(writtenData.version).toBe(emptyMasterManifest.version);
      expect(writtenData.sources).toEqual(emptyMasterManifest.sources);
    });

    it('should load existing master manifest from virtual FS', () => {
      // Pre-populate virtual FS with fixture using correct path
      virtualFS.set(MANIFEST_PATH, JSON.stringify(singleSourceMasterManifest));

      const service = new MasterManifestService();
      const sources = service.getSources();

      expect(sources['docs.claude.com']).toBeDefined();
      expect(sources['docs.claude.com'].type).toBe('claude-code-docs');
      expect(sources['docs.claude.com'].urlCount).toBe(10);
    });
  });

  describe('registerSource', () => {
    it('should register new source', () => {
      const service = new MasterManifestService();
      service.registerSource('react.dev', 'documentation', 20);

      const source = service.getSource('react.dev');
      expect(source).toBeDefined();
      expect(source?.type).toBe('documentation');
      expect(source?.urlCount).toBe(20);
      expect(source?.status).toBe('active');
      expect(source?.addedAt).toBeDefined();
      expect(source?.lastSyncedAt).toBeDefined();
    });

    it('should update existing source', async () => {
      const service = new MasterManifestService();
      service.registerSource('react.dev', 'documentation', 20);

      const original = service.getSource('react.dev');
      const originalAddedAt = original?.addedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update with new count
      service.registerSource('react.dev', 'documentation', 25);

      const updated = service.getSource('react.dev');
      expect(updated?.urlCount).toBe(25);
      expect(updated?.addedAt).toBe(originalAddedAt); // Should preserve original
      expect(updated?.lastSyncedAt).not.toBe(original?.lastSyncedAt);
    });
  });

  describe('getSources', () => {
    it('should return all sources matching fixture', () => {
      // Pre-populate with multi-source fixture
      virtualFS.set(MANIFEST_PATH, JSON.stringify(multiSourceMasterManifest));

      const service = new MasterManifestService();
      const sources = service.getSources();

      expect(Object.keys(sources)).toHaveLength(3);
      expect(sources['docs.claude.com']).toEqual(
        multiSourceMasterManifest.sources['docs.claude.com']
      );
      expect(sources['react.dev']).toEqual(multiSourceMasterManifest.sources['react.dev']);
      expect(sources['nextjs.org']).toEqual(multiSourceMasterManifest.sources['nextjs.org']);
    });

    it('should return empty object when no sources', () => {
      const service = new MasterManifestService();
      const sources = service.getSources();
      expect(sources).toEqual(emptyMasterManifest.sources);
    });
  });

  describe('getSource', () => {
    it('should return specific source', () => {
      const service = new MasterManifestService();
      service.registerSource('docs.claude.com', 'claude-code-docs', 10);

      const source = service.getSource('docs.claude.com');
      expect(source).toBeDefined();
      expect(source?.type).toBe('claude-code-docs');
    });

    it('should return null for non-existent source', () => {
      const service = new MasterManifestService();
      const source = service.getSource('nonexistent.com');
      expect(source).toBeNull();
    });
  });

  describe('getSourcesByType', () => {
    it('should return sources of specific type from fixture', () => {
      // Use multi-source fixture with different types
      virtualFS.set(MANIFEST_PATH, JSON.stringify(multiSourceMasterManifest));

      const service = new MasterManifestService();

      const docSources = service.getSourcesByType('documentation');
      expect(docSources).toHaveLength(2);
      expect(docSources).toContain('react.dev');
      expect(docSources).toContain('nextjs.org');

      const claudeSources = service.getSourcesByType('claude-code-docs');
      expect(claudeSources).toHaveLength(1);
      expect(claudeSources).toContain('docs.claude.com');
    });

    it('should return empty array when no sources of type', () => {
      virtualFS.set(MANIFEST_PATH, JSON.stringify(singleSourceMasterManifest));

      const service = new MasterManifestService();
      const apiSources = service.getSourcesByType('api-docs');
      expect(apiSources).toEqual([]);
    });
  });

  describe('updateSyncTime', () => {
    it('should update last sync time', () => {
      const service = new MasterManifestService();
      service.registerSource('docs.claude.com', 'claude-code-docs', 10);

      const before = service.getSource('docs.claude.com');
      const beforeTime = before?.lastSyncedAt;

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        service.updateSyncTime('docs.claude.com');

        const after = service.getSource('docs.claude.com');
        expect(after?.lastSyncedAt).not.toBe(beforeTime);
      }, 10);
    });

    it('should not crash for non-existent source', () => {
      const service = new MasterManifestService();
      expect(() => {
        service.updateSyncTime('nonexistent.com');
      }).not.toThrow();
    });
  });

  describe('deactivateSource', () => {
    it('should mark source as inactive', () => {
      const service = new MasterManifestService();
      service.registerSource('docs.claude.com', 'claude-code-docs', 10);

      service.deactivateSource('docs.claude.com');

      const source = service.getSource('docs.claude.com');
      expect(source?.status).toBe('inactive');
    });

    it('should not crash for non-existent source', () => {
      const service = new MasterManifestService();
      expect(() => {
        service.deactivateSource('nonexistent.com');
      }).not.toThrow();
    });
  });
});
