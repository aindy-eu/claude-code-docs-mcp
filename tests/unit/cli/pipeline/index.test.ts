/**
 * Pipeline Tests
 * Tests the main pipeline class that coordinates pipeline stages
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Pipeline } from '@/cli/pipeline/index.js';

// Mock stage functions
vi.mock('@/cli/pipeline/fetch.js', () => ({
  fetchStage: vi.fn()
}));

vi.mock('@/cli/pipeline/extract.js', () => ({
  extractStage: vi.fn()
}));

vi.mock('@/cli/pipeline/embed.js', () => ({
  embedStage: vi.fn()
}));

vi.mock('@/services/manifest-service.js');

// Mock ora and chalk
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: ''
  }))
}));

vi.mock('chalk', () => ({
  default: {
    cyan: (str: string) => str,
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str
  }
}));

import { fetchStage } from '@/cli/pipeline/fetch.js';
import { extractStage } from '@/cli/pipeline/extract.js';
import { embedStage } from '@/cli/pipeline/embed.js';
import { ManifestService } from '@/services/manifest-service.js';

const TEST_URL = 'https://docs.test.com/page';

describe('Pipeline', () => {
  let pipeline: Pipeline;

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new Pipeline();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ingest (full pipeline)', () => {
    it('should run all three stages in order', async () => {
      vi.mocked(fetchStage).mockResolvedValue({
        html: '<html></html>',
        finalUrl: TEST_URL,
        skipPipeline: false
      });
      vi.mocked(extractStage).mockResolvedValue();
      vi.mocked(embedStage).mockResolvedValue();

      await pipeline.ingest(TEST_URL, {});

      expect(fetchStage).toHaveBeenCalledWith(TEST_URL, expect.any(String), {}, true);
      expect(extractStage).toHaveBeenCalledWith(TEST_URL, expect.any(String), {}, true);
      expect(embedStage).toHaveBeenCalledWith(TEST_URL, expect.any(String), {}, true);
    });

    it('should skip pipeline when content unchanged', async () => {
      vi.mocked(fetchStage).mockResolvedValue({
        html: '<html></html>',
        finalUrl: TEST_URL,
        skipPipeline: true // Content unchanged
      });
      vi.mocked(ManifestService.prototype.updateUnchanged).mockImplementation(() => {});

      await pipeline.ingest(TEST_URL, {});

      expect(fetchStage).toHaveBeenCalled();
      expect(extractStage).not.toHaveBeenCalled();
      expect(embedStage).not.toHaveBeenCalled();
      expect(ManifestService.prototype.updateUnchanged).toHaveBeenCalledWith(TEST_URL);
    });

    it('should force pipeline even when content unchanged', async () => {
      vi.mocked(fetchStage).mockResolvedValue({
        html: '<html></html>',
        finalUrl: TEST_URL,
        skipPipeline: true
      });
      vi.mocked(extractStage).mockResolvedValue();
      vi.mocked(embedStage).mockResolvedValue();

      await pipeline.ingest(TEST_URL, { force: true });

      expect(extractStage).toHaveBeenCalled();
      expect(embedStage).toHaveBeenCalled();
    });

    it('should use finalUrl from fetch result', async () => {
      const redirectedUrl = 'https://docs.test.com/redirected';

      vi.mocked(fetchStage).mockResolvedValue({
        html: '<html></html>',
        finalUrl: redirectedUrl,
        skipPipeline: false
      });
      vi.mocked(extractStage).mockResolvedValue();
      vi.mocked(embedStage).mockResolvedValue();

      await pipeline.ingest(TEST_URL, {});

      expect(extractStage).toHaveBeenCalledWith(redirectedUrl, expect.any(String), {}, true);
      expect(embedStage).toHaveBeenCalledWith(redirectedUrl, expect.any(String), {}, true);
    });

    it('should pass options to stages', async () => {
      vi.mocked(fetchStage).mockResolvedValue({
        html: '<html></html>',
        finalUrl: TEST_URL,
        skipPipeline: false
      });
      vi.mocked(extractStage).mockResolvedValue();
      vi.mocked(embedStage).mockResolvedValue();

      await pipeline.ingest(TEST_URL, {
        model: 'claude-opus-4',
        provider: 'openai',
        force: true,
        dev: true
      });

      expect(fetchStage).toHaveBeenCalledWith(TEST_URL, expect.any(String), { force: true }, true);
      expect(extractStage).toHaveBeenCalledWith(
        TEST_URL,
        expect.any(String),
        { model: 'claude-opus-4', dev: true, force: true },
        true
      );
      expect(embedStage).toHaveBeenCalledWith(
        TEST_URL,
        expect.any(String),
        { provider: 'openai' },
        true
      );
    });

    it('should throw error if any stage fails', async () => {
      vi.mocked(fetchStage).mockResolvedValue({
        html: '<html></html>',
        finalUrl: TEST_URL,
        skipPipeline: false
      });
      vi.mocked(extractStage).mockRejectedValue(new Error('Extraction failed'));

      await expect(pipeline.ingest(TEST_URL, {})).rejects.toThrow('Extraction failed');
    });
  });

  describe('fetch', () => {
    it('should call fetchStage and return finalUrl', async () => {
      vi.mocked(fetchStage).mockResolvedValue({
        html: '<html></html>',
        finalUrl: TEST_URL,
        skipPipeline: false
      });

      const result = await pipeline.fetch(TEST_URL);

      expect(fetchStage).toHaveBeenCalledWith(TEST_URL, expect.any(String), {}, false);
      expect(result).toBe(TEST_URL);
    });
  });

  describe('extract', () => {
    it('should call extractStage with options', async () => {
      vi.mocked(extractStage).mockResolvedValue();

      await pipeline.extract(TEST_URL, { model: 'claude-opus-4' });

      expect(extractStage).toHaveBeenCalledWith(
        TEST_URL,
        expect.any(String),
        { model: 'claude-opus-4' },
        false
      );
    });
  });

  describe('embed', () => {
    it('should call embedStage with options', async () => {
      vi.mocked(embedStage).mockResolvedValue();

      await pipeline.embed(TEST_URL, { provider: 'openai' });

      expect(embedStage).toHaveBeenCalledWith(
        TEST_URL,
        expect.any(String),
        { provider: 'openai' },
        false
      );
    });
  });
});
