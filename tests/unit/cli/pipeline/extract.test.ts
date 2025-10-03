/**
 * Extract Orchestrator Tests
 * Tests the extract stage orchestration logic
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { extractStage } from '@/cli/pipeline/extract.js';

// Mock all services
vi.mock('@/services/fetch-service.js');
vi.mock('@/services/extract-service.js');
vi.mock('@/services/manifest-service.js');

// Mock ora and chalk
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis()
  }))
}));

vi.mock('chalk', () => ({
  default: {
    green: (str: string) => str,
    red: (str: string) => str
  }
}));

// Mock child_process spawn
vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

import { FetchService } from '@/services/fetch-service.js';
import { ExtractService } from '@/services/extract-service.js';
import { ManifestService } from '@/services/manifest-service.js';
import { spawn } from 'child_process';

const TEST_URL = 'https://docs.test.com/page';
const TEST_PROJECT_ROOT = '/project';

describe('extractStage orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Extraction', () => {
    it('should call Python script and save result', async () => {
      const mockHTML = '<html><body>Test</body></html>';
      const mockExtracted = { source: TEST_URL, sections: [] };

      vi.mocked(FetchService.prototype.getHTML).mockResolvedValue(mockHTML);
      vi.mocked(FetchService.prototype.getCachePaths).mockReturnValue({
        htmlPath: '/cache/test.html',
        metaPath: '/cache/test.meta.json',
        dir: '/cache'
      });

      // Mock spawn to simulate successful Python execution
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn()
      };

      vi.mocked(spawn).mockReturnValue(mockChild as any);

      // Simulate Python script success
      mockChild.stdout.on.mockImplementation((event, handler) => {
        if (event === 'data') {
          handler(JSON.stringify(mockExtracted));
        }
      });

      mockChild.on.mockImplementation((event, handler) => {
        if (event === 'close') {
          handler(0); // Success exit code
        }
      });

      vi.mocked(ExtractService.prototype.save).mockResolvedValue();
      vi.mocked(ExtractService.prototype.getJsonPath).mockReturnValue('/path/to.json');
      vi.mocked(ManifestService.prototype.updateExtracted).mockImplementation(() => {});

      await extractStage(TEST_URL, TEST_PROJECT_ROOT, {}, true);

      expect(ExtractService.prototype.save).toHaveBeenCalledWith(TEST_URL, mockExtracted);
      expect(ManifestService.prototype.updateExtracted).toHaveBeenCalledWith(TEST_URL, {
        model: 'claude-sonnet-4-5-20250929',
        jsonPath: '/path/to.json'
      });
    });

    it('should use specified model', async () => {
      const mockHTML = '<html><body>Test</body></html>';
      const mockExtracted = { source: TEST_URL, sections: [] };

      vi.mocked(FetchService.prototype.getHTML).mockResolvedValue(mockHTML);
      vi.mocked(FetchService.prototype.getCachePaths).mockReturnValue({
        htmlPath: '/cache/test.html',
        metaPath: '/cache/test.meta.json',
        dir: '/cache'
      });

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn()
      };

      vi.mocked(spawn).mockReturnValue(mockChild as any);

      mockChild.stdout.on.mockImplementation((event, handler) => {
        if (event === 'data') {
          handler(JSON.stringify(mockExtracted));
        }
      });

      mockChild.on.mockImplementation((event, handler) => {
        if (event === 'close') {
          handler(0);
        }
      });

      vi.mocked(ExtractService.prototype.save).mockResolvedValue();
      vi.mocked(ExtractService.prototype.getJsonPath).mockReturnValue('/path/to.json');
      vi.mocked(ManifestService.prototype.updateExtracted).mockImplementation(() => {});

      await extractStage(TEST_URL, TEST_PROJECT_ROOT, { model: 'claude-opus-4' }, true);

      expect(ManifestService.prototype.updateExtracted).toHaveBeenCalledWith(TEST_URL, {
        model: 'claude-opus-4',
        jsonPath: '/path/to.json'
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw if HTML not cached', async () => {
      vi.mocked(FetchService.prototype.getHTML).mockResolvedValue(null);

      await expect(extractStage(TEST_URL, TEST_PROJECT_ROOT, {}, true)).rejects.toThrow(
        'HTML not cached. Run fetch first.'
      );
    });

    it('should throw if Python script fails', async () => {
      const mockHTML = '<html><body>Test</body></html>';

      vi.mocked(FetchService.prototype.getHTML).mockResolvedValue(mockHTML);
      vi.mocked(FetchService.prototype.getCachePaths).mockReturnValue({
        htmlPath: '/cache/test.html',
        metaPath: '/cache/test.meta.json',
        dir: '/cache'
      });

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn()
      };

      vi.mocked(spawn).mockReturnValue(mockChild as any);

      mockChild.stderr.on.mockImplementation((event, handler) => {
        if (event === 'data') {
          handler('Python error');
        }
      });

      mockChild.on.mockImplementation((event, handler) => {
        if (event === 'close') {
          handler(1); // Error exit code
        }
      });

      await expect(extractStage(TEST_URL, TEST_PROJECT_ROOT, {}, true)).rejects.toThrow(
        'Python script exited with code 1'
      );
    });
  });
});
