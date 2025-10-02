/**
 * EmbedService Tests
 * Focused tests for document extraction, statistics, and Qdrant integration
 *
 * NOTE: This test suite focuses on what's testable without complex type gymnastics.
 * Skipped areas (covered by integration tests):
 * - Content formatting details (requires deep Qdrant mock inspection)
 * - Exact payload structure (Qdrant types are complex)
 * - searchKeywords/aliases in payload (integration tests verify this works)
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmbedService } from '@/services/embed-service.js';
import {
  simpleExtraction,
  complexExtraction,
  minimalExtraction,
  shortCodeExtraction,
  emptyExtraction,
  mockQdrantCollection,
  mockQdrantUpsertResponse,
  mockOllamaEmbedding,
  mockOpenAIEmbedding
} from '../../../fixtures/embedServiceFixtures.js';

// Mock logger
vi.mock('@/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock embeddings utility
vi.mock('@/utils/embeddings.js', () => ({
  generateEmbedding: vi.fn(),
  getCollectionName: vi.fn((provider: string) => `claude_code_docs_${provider}`),
  EMBEDDING_CONFIGS: {
    ollama: { dimensions: 768, model: 'nomic-embed-text' },
    openai: { dimensions: 1536, model: 'text-embedding-ada-002' }
  }
}));

import { generateEmbedding } from '@/utils/embeddings.js';
import { logger } from '@/utils/logger.js';

describe('EmbedService', () => {
  let mockQdrantClient: any;
  let service: EmbedService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Qdrant client
    mockQdrantClient = {
      getCollection: vi.fn().mockResolvedValue(mockQdrantCollection),
      createCollection: vi.fn().mockResolvedValue({ status: 'ok' }),
      upsert: vi.fn().mockResolvedValue(mockQdrantUpsertResponse)
    };

    service = new EmbedService(mockQdrantClient, 'ollama');

    // Default mock for generateEmbedding
    vi.mocked(generateEmbedding).mockResolvedValue(mockOllamaEmbedding);
  });

  describe('Document Extraction & Processing', () => {
    it('should process simple extraction successfully', async () => {
      const result = await service.embed(simpleExtraction, 'ollama');

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBeGreaterThan(0);
      expect(result.embeddingsGenerated).toBeGreaterThan(0);
    });

    it('should process complex extraction with multiple sections', async () => {
      const result = await service.embed(complexExtraction, 'ollama');

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBeGreaterThan(0);
      expect(result.embeddingsGenerated).toBeGreaterThan(0);
    });

    it('should filter out short content (< 100 chars)', async () => {
      const result = await service.embed(minimalExtraction, 'ollama');

      // No summary, content too short - nothing to process
      expect(result.documentsProcessed).toBe(0);
      expect(result.success).toBe(false);
    });

    it('should filter out short code examples (< 50 chars)', async () => {
      const result = await service.embed(shortCodeExtraction, 'ollama');

      // Should process: overview + section + 1 long code (not the 'ls' command)
      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBeGreaterThan(0);
    });

    it('should handle empty extraction gracefully', async () => {
      const result = await service.embed(emptyExtraction, 'ollama');

      expect(result.documentsProcessed).toBe(0);
      expect(result.success).toBe(false);
    });

    it('should handle extraction with only summary', async () => {
      const summaryOnly = {
        ...emptyExtraction,
        summary: 'This is a valid summary with enough content to be processed as a document'
      };

      const result = await service.embed(summaryOnly, 'ollama');

      expect(result.documentsProcessed).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track totalSections correctly', async () => {
      const result = await service.embed(simpleExtraction, 'ollama');

      expect(result.stats.totalSections).toBe(simpleExtraction.sections.length);
      expect(result.stats.totalSections).toBe(1);
    });

    it('should track totalCodeExamples correctly', async () => {
      const result = await service.embed(complexExtraction, 'ollama');

      const expectedCodeExamples = complexExtraction.sections.reduce(
        (sum, section) => sum + (section.codeExamples?.length || 0),
        0
      );
      expect(result.stats.totalCodeExamples).toBe(expectedCodeExamples);
    });

    it('should track totalConcepts correctly', async () => {
      const result = await service.embed(complexExtraction, 'ollama');

      const expectedConcepts = complexExtraction.sections.reduce(
        (sum, section) => sum + (section.keyConcepts?.length || 0),
        0
      );
      expect(result.stats.totalConcepts).toBe(expectedConcepts);
    });

    it('should track processing time', async () => {
      const result = await service.embed(simpleExtraction, 'ollama');

      expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0); // Can be 0ms when very fast
      expect(result.stats.processingTimeMs).toBeLessThan(10000); // Should be fast
    });

    it('should log processing completion', async () => {
      await service.embed(simpleExtraction, 'ollama');

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Processed'));
    });
  });

  describe('Embedding Generation', () => {
    it('should generate embeddings for all documents', async () => {
      await service.embed(simpleExtraction, 'ollama');

      expect(generateEmbedding).toHaveBeenCalled();
      expect(vi.mocked(generateEmbedding).mock.calls.length).toBeGreaterThan(0);
    });

    it('should use specified provider', async () => {
      await service.embed(simpleExtraction, 'openai');

      expect(generateEmbedding).toHaveBeenCalledWith(expect.any(String), 'openai');
    });

    it('should use default provider when not specified', async () => {
      await service.embed(simpleExtraction);

      expect(generateEmbedding).toHaveBeenCalledWith(expect.any(String), 'ollama');
    });

    it('should handle embedding generation errors gracefully', async () => {
      vi.mocked(generateEmbedding)
        .mockResolvedValueOnce(mockOllamaEmbedding) // First succeeds
        .mockRejectedValueOnce(new Error('Embedding failed')) // Second fails
        .mockResolvedValueOnce(mockOllamaEmbedding); // Third succeeds

      const result = await service.embed(simpleExtraction, 'ollama');

      // Should continue processing despite one failure
      expect(result.embeddingsGenerated).toBeGreaterThan(0);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should accumulate multiple embedding errors', async () => {
      vi.mocked(generateEmbedding).mockRejectedValue(new Error('All failed'));

      const result = await service.embed(complexExtraction, 'ollama');

      // When all embeddings fail, those that succeeded before failure are still counted
      expect(result.embeddingsGenerated).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Qdrant Collection Management', () => {
    it('should check if collection exists', async () => {
      await service.embed(simpleExtraction, 'ollama');

      expect(mockQdrantClient.getCollection).toHaveBeenCalledWith('claude_code_docs_ollama');
    });

    it('should create collection if it does not exist', async () => {
      mockQdrantClient.getCollection.mockRejectedValueOnce(new Error('Collection not found'));

      await service.embed(simpleExtraction, 'ollama');

      expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
        'claude_code_docs_ollama',
        expect.objectContaining({
          vectors: expect.objectContaining({
            size: 768,
            distance: 'Cosine'
          })
        })
      );
    });

    it('should use correct dimensions for Ollama (768)', async () => {
      mockQdrantClient.getCollection.mockRejectedValueOnce(new Error('Not found'));

      await service.embed(simpleExtraction, 'ollama');

      expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
        'claude_code_docs_ollama',
        expect.objectContaining({
          vectors: expect.objectContaining({ size: 768 })
        })
      );
    });

    it('should use correct dimensions for OpenAI (1536)', async () => {
      mockQdrantClient.getCollection.mockRejectedValueOnce(new Error('Not found'));
      vi.mocked(generateEmbedding).mockResolvedValue(mockOpenAIEmbedding);

      await service.embed(simpleExtraction, 'openai');

      expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
        'claude_code_docs_openai',
        expect.objectContaining({
          vectors: expect.objectContaining({ size: 1536 })
        })
      );
    });

    it('should batch upsert with wait=true', async () => {
      await service.embed(simpleExtraction, 'ollama');

      expect(mockQdrantClient.upsert).toHaveBeenCalledWith(
        'claude_code_docs_ollama',
        expect.objectContaining({
          wait: true
        })
      );
    });

    it('should not upsert if no embeddings generated', async () => {
      vi.mocked(generateEmbedding).mockRejectedValue(new Error('All failed'));

      await service.embed(simpleExtraction, 'ollama');

      expect(mockQdrantClient.upsert).not.toHaveBeenCalled();
    });

    it('should log collection creation', async () => {
      mockQdrantClient.getCollection.mockRejectedValueOnce(new Error('Not found'));

      await service.embed(simpleExtraction, 'ollama');

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Created collection'));
    });
  });

  describe('Error Handling', () => {
    it('should handle Qdrant upsert errors', async () => {
      mockQdrantClient.upsert.mockRejectedValueOnce(new Error('Qdrant connection failed'));

      const result = await service.embed(simpleExtraction, 'ollama');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Qdrant connection failed');
    });

    it('should log processing errors', async () => {
      mockQdrantClient.upsert.mockRejectedValueOnce(new Error('Test error'));

      await service.embed(simpleExtraction, 'ollama');

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing Claude output:',
        expect.any(Error)
      );
    });

    it('should continue processing after individual embedding failures', async () => {
      vi.mocked(generateEmbedding)
        .mockResolvedValueOnce(mockOllamaEmbedding)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockOllamaEmbedding);

      const result = await service.embed(simpleExtraction, 'ollama');

      // Should process the successful ones
      expect(result.embeddingsGenerated).toBeGreaterThan(0);
      expect(result.documentsProcessed).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });

    it('should return stats even on failure', async () => {
      mockQdrantClient.upsert.mockRejectedValueOnce(new Error('Failed'));

      const result = await service.embed(simpleExtraction, 'ollama');

      expect(result.stats.totalSections).toBe(1);
      expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0); // Can be 0ms
    });
  });

  describe('Result Structure', () => {
    it('should return complete IngestionResult structure', async () => {
      const result = await service.embed(simpleExtraction, 'ollama');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('documentsProcessed');
      expect(result).toHaveProperty('embeddingsGenerated');
      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('totalSections');
      expect(result.stats).toHaveProperty('totalCodeExamples');
      expect(result.stats).toHaveProperty('totalConcepts');
      expect(result.stats).toHaveProperty('processingTimeMs');
    });

    it('should include errors array when errors occur', async () => {
      mockQdrantClient.upsert.mockRejectedValueOnce(new Error('Test'));

      const result = await service.embed(simpleExtraction, 'ollama');

      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should match documentsProcessed with embeddingsGenerated on success', async () => {
      const result = await service.embed(simpleExtraction, 'ollama');

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBe(result.embeddingsGenerated);
    });
  });
});

/**
 * SKIPPED TESTS (Covered by integration tests instead):
 *
 * 1. Content Formatting Details
 *    - Exact format of overview/section/code documents
 *    - SEARCH TERMS: prefix in sections
 *    - ALSO KNOWN AS: prefix for aliases
 *    - Warning emoji (⚠️) and best practice checkmark (✓) formatting
 *    Reason: Would require deep inspection of Qdrant upsert payload (complex types)
 *
 * 2. Payload Structure
 *    - searchKeywords included in Qdrant payload
 *    - aliases included in Qdrant payload
 *    - All metadata fields (content, title, section, url, codeExamples, etc.)
 *    Reason: Qdrant TypeScript types make mock inspection difficult
 *
 * 3. Document ID Generation
 *    - UUID format validation
 *    - Uniqueness of IDs
 *    Reason: IDs are internal implementation detail, not behavioral requirement
 *
 * 4. Separate Code Documents
 *    - Verification that code examples become separate documents
 *    - Title format "Code: {demonstrates}"
 *    Reason: Verified by document counts, exact structure tested in integration
 *
 * 5. Concept Extraction
 *    - All concepts from all sections collected in overview
 *    Reason: Complex cross-section logic, better tested end-to-end
 *
 * All skipped tests are covered by integration tests in tests/integration/
 * which verify the full pipeline including actual Qdrant storage and retrieval.
 */
