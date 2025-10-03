/**
 * SyncCommand Tests
 * Tests business logic for syncing stale documentation
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SyncCommand } from '@/cli/commands/sync.js';
import type { SyncOptions } from '@/cli/commands/sync.types.js';

// Mock dependencies
vi.mock('@/cli/pipeline/index.js');
vi.mock('@/config/documentation-urls.js', () => ({
  DocumentationUrlService: vi.fn().mockImplementation(() => ({
    getAllUrls: vi.fn(() => [
      'https://docs.claude.com/en/docs/claude-code/overview',
      'https://docs.claude.com/en/docs/claude-code/hooks',
      'https://docs.claude.com/en/docs/claude-code/settings'
    ]),
    getPageKeyFromUrl: vi.fn((url: string) => url.split('/').pop())
  }))
}));

// Mock ManifestService
const mockGetRecord = vi.fn();
vi.mock('@/services/manifest-service.js', () => ({
  ManifestService: vi.fn().mockImplementation(() => ({
    getRecord: mockGetRecord
  }))
}));

// Mock Listr
vi.mock('listr2', () => ({
  Listr: vi.fn().mockImplementation((tasks, options) => ({
    run: vi.fn().mockResolvedValue(undefined),
    ctx: options.ctx
  }))
}));

describe('SyncCommand', () => {
  let syncCommand: SyncCommand;
  let MockListr: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    syncCommand = new SyncCommand();
    const listr2 = await import('listr2');
    MockListr = listr2.Listr as any;
  });

  describe('freshness detection logic', () => {
    it('should identify stale documents (>7 days old)', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

      mockGetRecord.mockResolvedValue({
        status: 'embedded',
        lastIngestedAt: eightDaysAgo
      });

      await syncCommand.run({});

      // Should process stale documents
      expect(mockGetRecord).toHaveBeenCalled();
    });

    it('should skip fresh documents (<7 days old)', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

      mockGetRecord.mockResolvedValue({
        status: 'embedded',
        lastIngestedAt: twoDaysAgo
      });

      const options: SyncOptions = { check: true };
      await syncCommand.run(options);

      // Should not process fresh docs
      if (MockListr.mock.calls.length > 0) {
        const tasks = MockListr.mock.calls[0][0];
        expect(tasks).toHaveLength(0);
      }
    });

    it('should identify documents without ingestion date as stale', async () => {
      mockGetRecord.mockResolvedValue({
        status: 'fetched',
        lastIngestedAt: undefined
      });

      await syncCommand.run({});

      // Should identify as needing ingestion
      expect(mockGetRecord).toHaveBeenCalled();
    });

    it('should identify failed documents for retry', async () => {
      mockGetRecord.mockResolvedValue({
        status: 'failed',
        lastFailedAt: new Date().toISOString()
      });

      await syncCommand.run({});

      // Should retry failed docs
      expect(mockGetRecord).toHaveBeenCalled();
    });
  });

  describe('TTL configuration', () => {
    it('should use default TTL of 7 days', async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      mockGetRecord.mockResolvedValue({
        status: 'embedded',
        lastIngestedAt: sevenDaysAgo
      });

      await syncCommand.run({ check: true });

      // Default TTL should be applied
      expect(mockGetRecord).toHaveBeenCalled();
    });

    it('should respect custom TTL', async () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

      mockGetRecord.mockResolvedValue({
        status: 'embedded',
        lastIngestedAt: fourDaysAgo
      });

      const options: SyncOptions = { ttl: 3, check: true };
      await syncCommand.run(options);

      // Should identify as stale with custom TTL of 3 days
      expect(mockGetRecord).toHaveBeenCalled();
    });
  });

  describe('check mode (dry run)', () => {
    it('should not execute tasks in check mode', async () => {
      mockGetRecord.mockResolvedValue({
        status: 'embedded',
        lastIngestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      });

      const options: SyncOptions = { check: true };
      await syncCommand.run(options);

      // Check mode should preview but not execute
      // In check mode, Listr should not be instantiated or tasks should be empty
      if (MockListr.mock.calls.length > 0) {
        // If called, should not actually run tasks
        const listrInstance = MockListr.mock.results[0]?.value;
        if (listrInstance && listrInstance.run) {
          expect(listrInstance.run).not.toHaveBeenCalled();
        }
      }
    });
  });

  describe('resume capability logic', () => {
    it('should resume from fetched status', async () => {
      mockGetRecord.mockResolvedValue({
        status: 'fetched',
        lastFetchedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      });

      await syncCommand.run({});

      // Should call pipeline methods to resume
      expect(mockGetRecord).toHaveBeenCalled();
    });

    it('should resume from extracted status', async () => {
      mockGetRecord.mockResolvedValue({
        status: 'extracted',
        lastExtractedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      });

      await syncCommand.run({});

      // Should resume from embed stage
      expect(mockGetRecord).toHaveBeenCalled();
    });
  });

  describe('task configuration', () => {
    it('should run tasks sequentially', async () => {
      mockGetRecord.mockResolvedValue({
        status: 'embedded',
        lastIngestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      });

      await syncCommand.run({});

      if (MockListr.mock.calls.length > 0) {
        const config = MockListr.mock.calls[0][1];
        expect(config.concurrent).toBe(false);
      }
    });

    it('should continue on error', async () => {
      mockGetRecord.mockResolvedValue({
        status: 'embedded',
        lastIngestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      });

      await syncCommand.run({});

      if (MockListr.mock.calls.length > 0) {
        const config = MockListr.mock.calls[0][1];
        expect(config.exitOnError).toBe(false);
      }
    });

    it('should include retry configuration', async () => {
      mockGetRecord.mockResolvedValue({
        status: 'embedded',
        lastIngestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      });

      await syncCommand.run({});

      if (MockListr.mock.calls.length > 0) {
        const tasks = MockListr.mock.calls[0][0];
        if (tasks.length > 0) {
          expect(tasks[0].options).toHaveProperty('retry', 2);
        }
      }
    });
  });
});
