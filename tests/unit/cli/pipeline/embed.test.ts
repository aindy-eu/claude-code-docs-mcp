/**
 * Embed Orchestrator Tests
 * Tests the embed stage orchestration logic
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { embedStage } from '@/cli/pipeline/embed.js';

// Mock all services
vi.mock('@/services/extract-service.js');
vi.mock('@/services/manifest-service.js');
vi.mock('@/services/pipeline-logging-service.js');
vi.mock('@/services/embed-service.js');
vi.mock('@qdrant/js-client-rest');

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

import { ExtractService } from '@/services/extract-service.js';
import { ManifestService } from '@/services/manifest-service.js';
import { PipelineLoggingService } from '@/services/pipeline-logging-service.js';
import { EmbedService } from '@/services/embed-service.js';

const TEST_URL = 'https://docs.test.com/page';
const TEST_PROJECT_ROOT = '/project';

describe('embedStage orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Embedding', () => {
    it('should call EmbedService and update manifest', async () => {
      const mockExtracted = { source: TEST_URL, sections: [] };
      const mockResult = {
        success: true,
        embeddingsGenerated: 10,
        documentsProcessed: 10
      };

      vi.mocked(ExtractService.prototype.get).mockResolvedValue(mockExtracted);
      vi.mocked(ExtractService.prototype.getJsonPath).mockReturnValue('/path/to.json');
      vi.mocked(EmbedService.prototype.embed).mockResolvedValue(mockResult as any);
      vi.mocked(ManifestService.prototype.updateEmbedded).mockImplementation(() => {});
      vi.mocked(PipelineLoggingService.prototype.logEmbed).mockImplementation(() => {});

      await embedStage(TEST_URL, TEST_PROJECT_ROOT, {}, true);

      expect(EmbedService.prototype.embed).toHaveBeenCalledWith(mockExtracted, 'ollama');
      expect(ManifestService.prototype.updateEmbedded).toHaveBeenCalledWith(TEST_URL, {
        provider: 'ollama',
        jsonPath: '/path/to.json'
      });
    });

    it('should use specified provider', async () => {
      const mockExtracted = { source: TEST_URL, sections: [] };
      const mockResult = { success: true, embeddingsGenerated: 5, documentsProcessed: 5 };

      vi.mocked(ExtractService.prototype.get).mockResolvedValue(mockExtracted);
      vi.mocked(ExtractService.prototype.getJsonPath).mockReturnValue('/path/to.json');
      vi.mocked(EmbedService.prototype.embed).mockResolvedValue(mockResult as any);
      vi.mocked(ManifestService.prototype.updateEmbedded).mockImplementation(() => {});
      vi.mocked(PipelineLoggingService.prototype.logEmbed).mockImplementation(() => {});

      await embedStage(TEST_URL, TEST_PROJECT_ROOT, { provider: 'openai' }, true);

      expect(EmbedService.prototype.embed).toHaveBeenCalledWith(mockExtracted, 'openai');
    });

    it('should log embedding duration and count', async () => {
      const mockExtracted = { source: TEST_URL, sections: [] };
      const mockResult = { success: true, embeddingsGenerated: 42, documentsProcessed: 42 };

      vi.mocked(ExtractService.prototype.get).mockResolvedValue(mockExtracted);
      vi.mocked(ExtractService.prototype.getJsonPath).mockReturnValue('/path/to.json');
      vi.mocked(EmbedService.prototype.embed).mockResolvedValue(mockResult as any);
      vi.mocked(ManifestService.prototype.updateEmbedded).mockImplementation(() => {});
      vi.mocked(PipelineLoggingService.prototype.logEmbed).mockImplementation(() => {});

      await embedStage(TEST_URL, TEST_PROJECT_ROOT, {}, true);

      expect(PipelineLoggingService.prototype.logEmbed).toHaveBeenCalledWith(
        TEST_URL,
        'ollama',
        expect.any(Number),
        42
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw if extracted JSON not found', async () => {
      vi.mocked(ExtractService.prototype.get).mockResolvedValue(null);

      await expect(embedStage(TEST_URL, TEST_PROJECT_ROOT, {}, true)).rejects.toThrow(
        'JSON not extracted. Run extract first.'
      );
    });

    it('should throw if embedding fails', async () => {
      const mockExtracted = { source: TEST_URL, sections: [] };
      const mockResult = {
        success: false,
        embeddingsGenerated: 0,
        documentsProcessed: 0,
        errors: ['Connection failed']
      };

      vi.mocked(ExtractService.prototype.get).mockResolvedValue(mockExtracted);
      vi.mocked(EmbedService.prototype.embed).mockResolvedValue(mockResult as any);
      vi.mocked(PipelineLoggingService.prototype.logEmbedError).mockImplementation(() => {});

      await expect(embedStage(TEST_URL, TEST_PROJECT_ROOT, {}, true)).rejects.toThrow(
        'Embedding failed: Connection failed'
      );
    });

    it('should log errors when embedding fails', async () => {
      const mockExtracted = { source: TEST_URL, sections: [] };
      const error = new Error('Qdrant unavailable');

      vi.mocked(ExtractService.prototype.get).mockResolvedValue(mockExtracted);
      vi.mocked(EmbedService.prototype.embed).mockRejectedValue(error);
      vi.mocked(PipelineLoggingService.prototype.logEmbedError).mockImplementation(() => {});

      await expect(embedStage(TEST_URL, TEST_PROJECT_ROOT, {}, true)).rejects.toThrow(
        'Qdrant unavailable'
      );

      expect(PipelineLoggingService.prototype.logEmbedError).toHaveBeenCalledWith(
        TEST_URL,
        'ollama',
        'Qdrant unavailable',
        expect.any(Number)
      );
    });
  });
});
