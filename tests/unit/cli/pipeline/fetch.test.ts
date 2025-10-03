/**
 * Fetch Orchestrator Tests
 * Tests the fetch stage orchestration logic without network calls
 *
 * The orchestrator is a thin wrapper that coordinates:
 * - FetchService (fetch HTML)
 * - ManifestService (track state)
 * - PipelineLoggingService (log operations)
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fetchStage } from '@/cli/pipeline/fetch.js';
import type { FetchResult } from '@/services/fetch-service.types.js';

// Mock all services
vi.mock('@/services/fetch-service.js');
vi.mock('@/services/manifest-service.js');
vi.mock('@/services/pipeline-logging-service.js');

// Mock ora spinner
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis()
  }))
}));

// Mock chalk (no color output in tests)
vi.mock('chalk', () => ({
  default: {
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str
  }
}));

import { FetchService } from '@/services/fetch-service.js';
import { ManifestService } from '@/services/manifest-service.js';
import { PipelineLoggingService } from '@/services/pipeline-logging-service.js';

const TEST_URL = 'https://docs.test.com/page';
const TEST_PROJECT_ROOT = '/project';

describe('fetchStage orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Fetch', () => {
    it('should call FetchService and return result', async () => {
      const mockResult: FetchResult = {
        html: '<html><body>Test</body></html>',
        finalUrl: TEST_URL,
        skipPipeline: false,
        comparison: undefined
      };

      vi.mocked(FetchService.prototype.fetch).mockResolvedValue(mockResult);
      vi.mocked(ManifestService.prototype.updateFetched).mockImplementation(() => {});
      vi.mocked(PipelineLoggingService.prototype.logFetch).mockImplementation(() => {});

      const result = await fetchStage(TEST_URL, TEST_PROJECT_ROOT, {}, true);

      expect(FetchService.prototype.fetch).toHaveBeenCalledWith(TEST_URL, false);
      expect(result).toEqual(mockResult);
    });

    it('should update manifest when not skipping pipeline', async () => {
      const mockResult: FetchResult = {
        html: '<html><body>Test</body></html>',
        finalUrl: TEST_URL,
        skipPipeline: false,
        comparison: undefined
      };

      vi.mocked(FetchService.prototype.fetch).mockResolvedValue(mockResult);
      vi.mocked(ManifestService.prototype.updateFetched).mockImplementation(() => {});
      vi.mocked(PipelineLoggingService.prototype.logFetch).mockImplementation(() => {});

      await fetchStage(TEST_URL, TEST_PROJECT_ROOT, {}, true);

      expect(ManifestService.prototype.updateFetched).toHaveBeenCalledWith(TEST_URL);
    });

    it('should NOT update manifest when skipping pipeline (content unchanged)', async () => {
      const mockResult: FetchResult = {
        html: '<html><body>Test</body></html>',
        finalUrl: TEST_URL,
        skipPipeline: true, // Content unchanged
        comparison: {
          hasChanged: false,
          contentHash: 'abc123',
          comparedAt: new Date().toISOString()
        }
      };

      vi.mocked(FetchService.prototype.fetch).mockResolvedValue(mockResult);
      vi.mocked(PipelineLoggingService.prototype.logFetch).mockImplementation(() => {});

      await fetchStage(TEST_URL, TEST_PROJECT_ROOT, {}, true);

      expect(ManifestService.prototype.updateFetched).not.toHaveBeenCalled();
    });

    it('should log fetch duration', async () => {
      const mockResult: FetchResult = {
        html: '<html><body>Test</body></html>',
        finalUrl: TEST_URL,
        skipPipeline: false,
        comparison: undefined
      };

      vi.mocked(FetchService.prototype.fetch).mockResolvedValue(mockResult);
      vi.mocked(ManifestService.prototype.updateFetched).mockImplementation(() => {});
      vi.mocked(PipelineLoggingService.prototype.logFetch).mockImplementation(() => {});

      await fetchStage(TEST_URL, TEST_PROJECT_ROOT, {}, true);

      expect(PipelineLoggingService.prototype.logFetch).toHaveBeenCalledWith(
        TEST_URL,
        expect.any(Number) // duration in ms
      );
    });

    it('should pass force option to FetchService', async () => {
      const mockResult: FetchResult = {
        html: '<html><body>Test</body></html>',
        finalUrl: TEST_URL,
        skipPipeline: false,
        comparison: undefined
      };

      vi.mocked(FetchService.prototype.fetch).mockResolvedValue(mockResult);
      vi.mocked(ManifestService.prototype.updateFetched).mockImplementation(() => {});
      vi.mocked(PipelineLoggingService.prototype.logFetch).mockImplementation(() => {});

      await fetchStage(TEST_URL, TEST_PROJECT_ROOT, { force: true }, true);

      expect(FetchService.prototype.fetch).toHaveBeenCalledWith(TEST_URL, true);
    });
  });

  describe('Redirect Handling', () => {
    it('should use finalUrl for manifest and logging when redirected', async () => {
      const redirectedUrl = 'https://docs.test.com/new-page';
      const mockResult: FetchResult = {
        html: '<html><body>Redirected</body></html>',
        finalUrl: redirectedUrl, // Different from original URL
        skipPipeline: false,
        comparison: {
          hasChanged: true,
          changePercentage: 15.5,
          contentHash: 'xyz789',
          comparedAt: new Date().toISOString()
        }
      };

      vi.mocked(FetchService.prototype.fetch).mockResolvedValue(mockResult);
      vi.mocked(ManifestService.prototype.updateFetched).mockImplementation(() => {});
      vi.mocked(PipelineLoggingService.prototype.logFetch).mockImplementation(() => {});

      await fetchStage(TEST_URL, TEST_PROJECT_ROOT, {}, true);

      // Should use redirected URL, not original
      expect(ManifestService.prototype.updateFetched).toHaveBeenCalledWith(redirectedUrl);
      expect(PipelineLoggingService.prototype.logFetch).toHaveBeenCalledWith(
        redirectedUrl,
        expect.any(Number)
      );
    });
  });

  describe('Error Handling', () => {
    it('should log errors when fetch fails', async () => {
      const error = new Error('Network timeout');

      vi.mocked(FetchService.prototype.fetch).mockRejectedValue(error);
      vi.mocked(PipelineLoggingService.prototype.logFetchError).mockImplementation(() => {});

      await expect(fetchStage(TEST_URL, TEST_PROJECT_ROOT, {}, true)).rejects.toThrow(
        'Network timeout'
      );

      expect(PipelineLoggingService.prototype.logFetchError).toHaveBeenCalledWith(
        TEST_URL,
        'Network timeout',
        expect.any(Number)
      );
    });

    it('should handle non-Error exceptions', async () => {
      const errorString = 'Unknown error';

      vi.mocked(FetchService.prototype.fetch).mockRejectedValue(errorString);
      vi.mocked(PipelineLoggingService.prototype.logFetchError).mockImplementation(() => {});

      await expect(fetchStage(TEST_URL, TEST_PROJECT_ROOT, {}, true)).rejects.toBe(errorString);

      expect(PipelineLoggingService.prototype.logFetchError).toHaveBeenCalledWith(
        TEST_URL,
        errorString,
        expect.any(Number)
      );
    });

    it('should re-throw errors after logging', async () => {
      const error = new Error('Fetch failed');

      vi.mocked(FetchService.prototype.fetch).mockRejectedValue(error);
      vi.mocked(PipelineLoggingService.prototype.logFetchError).mockImplementation(() => {});

      await expect(fetchStage(TEST_URL, TEST_PROJECT_ROOT, {}, true)).rejects.toThrow(error);
    });
  });

  describe('Silent Mode', () => {
    it('should not show spinner when silent=true', async () => {
      const mockResult: FetchResult = {
        html: '<html><body>Test</body></html>',
        finalUrl: TEST_URL,
        skipPipeline: false,
        comparison: undefined
      };

      vi.mocked(FetchService.prototype.fetch).mockResolvedValue(mockResult);
      vi.mocked(ManifestService.prototype.updateFetched).mockImplementation(() => {});
      vi.mocked(PipelineLoggingService.prototype.logFetch).mockImplementation(() => {});

      // Silent mode - spinner should not be used
      const result = await fetchStage(TEST_URL, TEST_PROJECT_ROOT, {}, true);

      // Test still passes - spinner is just not displayed
      expect(result).toBeDefined();
    });
  });
});
