/**
 * EmbedService Integration Tests
 * Tests real Qdrant operations, embedding generation, and document processing
 *
 * NOTE: These tests require:
 * - Qdrant running on localhost:6333
 * - Ollama with nomic-embed-text model (for Ollama provider tests)
 *
 * For unit tests with mocked dependencies, see tests/unit/services/embed-service/
 */

import { describe, it, beforeAll, beforeEach, afterEach, expect } from 'vitest';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbedService } from '@/services/embed-service.js';
import { generateEmbedding } from '@/utils/embeddings.js';
import type { ClaudeDocOutput } from '@/services/embed-service.types.js';

// Sample extraction matching actual ClaudeDocOutput structure
const sampleExtraction: ClaudeDocOutput = {
  source: 'https://test.com/integration-test',
  pageTitle: 'Integration Test Page',
  summary: 'Testing EmbedService with real Qdrant and embeddings',
  sections: [
    {
      title: 'Getting Started',
      content: 'This section covers how to get started with the integration tests and embeddings',
      searchKeywords: ['integration', 'testing', 'qdrant'],
      aliases: ['Setup', 'Initial Setup'],
      codeExamples: [
        {
          language: 'typescript',
          code: 'const service = new EmbedService(qdrant, "ollama");',
          description: 'Initialize the embed service',
          demonstrates: ['service creation', 'ollama provider']
        }
      ],
      keyConcepts: ['embeddings', 'vector database'],
      warnings: [],
      bestPractices: ['Use consistent provider'],
      relatedSections: []
    },
    {
      title: 'Advanced Usage',
      content:
        'Advanced patterns for working with embeddings and Qdrant vector search capabilities',
      searchKeywords: ['advanced', 'patterns'],
      aliases: [],
      codeExamples: [],
      keyConcepts: ['vector search', 'semantic similarity'],
      warnings: ['Ensure Qdrant is running'],
      bestPractices: [],
      relatedSections: ['getting-started']
    }
  ],
  prerequisites: ['Qdrant', 'Ollama'],
  useCases: ['Semantic search', 'Documentation lookup'],
  metadata: {
    extractedAt: new Date().toISOString(),
    modelUsed: 'claude-sonnet-4-5-20250929'
  }
};

// Check if Qdrant is available
const checkQdrantAvailable = async () => {
  const qdrant = new QdrantClient({
    host: process.env.QDRANT_HOST || 'localhost',
    port: parseInt(process.env.QDRANT_PORT || '6333')
  });

  try {
    await qdrant.getCollections();
    return true;
  } catch {
    return false;
  }
};

// Check if Ollama is available
const checkOllamaAvailable = async () => {
  try {
    await generateEmbedding('test', 'ollama');
    return true;
  } catch {
    return false;
  }
};

describe('EmbedService Integration (requires Qdrant + Ollama)', () => {
  let qdrant: QdrantClient;
  let service: EmbedService;
  let isQdrantAvailable = false;
  let isOllamaAvailable = false;

  // Use unique test collection names to avoid destroying production data
  const getTestCollection = () =>
    `test_embed_integration_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  beforeAll(async () => {
    // Check if required services are available
    isQdrantAvailable = await checkQdrantAvailable();
    isOllamaAvailable = await checkOllamaAvailable();

    if (!isQdrantAvailable) {
      console.info('⚠️  Qdrant is not running - skipping integration tests');
      console.info(
        '   To run these tests, start Qdrant with: docker run -p 6333:6333 qdrant/qdrant'
      );
      return;
    }

    if (!isOllamaAvailable) {
      console.info('⚠️  Ollama is not available - skipping embedding tests');
      console.info('   To run these tests, install Ollama and pull nomic-embed-text model');
      return;
    }

    qdrant = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333')
    });
    service = new EmbedService(qdrant, 'ollama');
  });

  describe('Collection Management', () => {
    let testCollection: string;

    beforeEach(() => {
      if (!isQdrantAvailable) return;
      testCollection = getTestCollection();
    });

    afterEach(async () => {
      if (!isQdrantAvailable || !testCollection) return;
      try {
        await qdrant.deleteCollection(testCollection);
      } catch {
        // Collection might not exist
      }
    });

    it('should create collection with correct dimensions for Ollama (768)', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      await service.embed(sampleExtraction, 'ollama', testCollection);

      const collection = await qdrant.getCollection(testCollection);
      expect(collection.config?.params?.vectors).toMatchObject({
        size: 768,
        distance: 'Cosine'
      });
    });

    it('should reuse existing collection if it exists', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      // First embed creates collection
      await service.embed(sampleExtraction, 'ollama', testCollection);
      const firstCount = await qdrant.count(testCollection);

      // Second embed reuses collection
      await service.embed(sampleExtraction, 'ollama', testCollection);
      const secondCount = await qdrant.count(testCollection);

      expect(secondCount.count).toBeGreaterThan(firstCount.count);
    });
  });

  describe('Document Processing & Storage', () => {
    let testCollection: string;

    beforeEach(() => {
      if (!isQdrantAvailable) return;
      testCollection = getTestCollection();
    });

    afterEach(async () => {
      if (!isQdrantAvailable || !testCollection) return;
      try {
        await qdrant.deleteCollection(testCollection);
      } catch {
        // Collection might not exist
      }
    });

    it('should store documents in Qdrant with correct count', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      const result = await service.embed(sampleExtraction, 'ollama', testCollection);

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBeGreaterThan(0);

      // Verify documents are actually in Qdrant
      const count = await qdrant.count(testCollection);
      expect(count.count).toBe(result.documentsProcessed);
    });

    it('should store full payload with all metadata fields', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      await service.embed(sampleExtraction, 'ollama', testCollection);

      // Retrieve stored documents
      const points = await qdrant.scroll(testCollection, { limit: 5 });
      expect(points.points.length).toBeGreaterThan(0);

      const firstPoint = points.points[0];
      expect(firstPoint.payload).toMatchObject({
        content: expect.any(String),
        title: expect.any(String),
        section: expect.any(String),
        url: sampleExtraction.source,
        provider: 'ollama',
        extractionMethod: 'claude-driven',
        pageTitle: sampleExtraction.pageTitle,
        summary: sampleExtraction.summary
      });

      // Verify arrays exist (even if empty)
      expect(firstPoint.payload).toHaveProperty('codeExamples');
      expect(firstPoint.payload).toHaveProperty('keyConcepts');
      expect(firstPoint.payload).toHaveProperty('searchKeywords');
      expect(firstPoint.payload).toHaveProperty('aliases');
    });

    it('should preserve searchKeywords and aliases in payload', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      await service.embed(sampleExtraction, 'ollama', testCollection);

      const points = await qdrant.scroll(testCollection, { limit: 10 });

      // Find the "Getting Started" section specifically
      const gettingStartedPoint = points.points.find(
        p => p.payload && p.payload.section === 'Getting Started'
      );

      expect(gettingStartedPoint).toBeDefined();
      expect(gettingStartedPoint?.payload?.searchKeywords).toContain('integration');
      expect(gettingStartedPoint?.payload?.aliases).toContain('Setup');
    });

    it('should filter out short section content (< 100 chars)', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      const shortContentExtraction: ClaudeDocOutput = {
        ...sampleExtraction,
        sections: [
          {
            title: 'Short',
            content: 'Too short', // < 100 chars
            searchKeywords: [],
            aliases: [],
            codeExamples: [],
            keyConcepts: [],
            warnings: [],
            bestPractices: [],
            relatedSections: []
          }
        ]
      };

      const result = await service.embed(shortContentExtraction, 'ollama', testCollection);

      // Only overview document should be created (summary is long enough)
      expect(result.documentsProcessed).toBe(1);
    });

    it('should filter out short code examples (< 50 chars)', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      const shortCodeExtraction: ClaudeDocOutput = {
        ...sampleExtraction,
        sections: [
          {
            title: 'Code Section',
            content:
              'This section has both short and long code examples for demonstration purposes and needs to be over 100 characters long',
            searchKeywords: [],
            aliases: [],
            codeExamples: [
              {
                language: 'bash',
                code: 'ls', // < 50 chars - should be filtered
                description: 'List files',
                demonstrates: []
              },
              {
                language: 'typescript',
                code: 'const service = new EmbedService(qdrant, "ollama");\nawait service.embed(output);', // > 50 chars
                description: 'Use service',
                demonstrates: ['embedding']
              }
            ],
            keyConcepts: [],
            warnings: [],
            bestPractices: [],
            relatedSections: []
          }
        ]
      };

      const result = await service.embed(shortCodeExtraction, 'ollama', testCollection);

      // Should process: overview + section + 1 long code (not the 'ls' command)
      expect(result.documentsProcessed).toBe(3);
    });
  });

  describe('Embedding Generation', () => {
    let testCollection: string;

    beforeEach(() => {
      if (!isQdrantAvailable) return;
      testCollection = getTestCollection();
    });

    afterEach(async () => {
      if (!isQdrantAvailable || !testCollection) return;
      try {
        await qdrant.deleteCollection(testCollection);
      } catch {
        // Collection might not exist
      }
    });

    it('should generate embeddings with correct dimensions (768 for Ollama)', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      await service.embed(sampleExtraction, 'ollama', testCollection);

      const points = await qdrant.scroll(testCollection, { limit: 1, with_vector: true });
      expect(points.points.length).toBeGreaterThan(0);

      const vector = points.points[0].vector as number[];
      expect(vector).toHaveLength(768);
      expect(vector.every(v => typeof v === 'number')).toBe(true);
    });

    it('should track statistics correctly', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      const result = await service.embed(sampleExtraction, 'ollama', testCollection);

      expect(result.stats.totalSections).toBe(sampleExtraction.sections.length);
      expect(result.stats.totalCodeExamples).toBe(1); // One code example in "Getting Started"
      expect(result.stats.totalConcepts).toBeGreaterThan(0);
      expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.documentsProcessed).toBe(result.embeddingsGenerated);
    });
  });

  describe('Semantic Search Quality', () => {
    let testCollection: string;

    beforeEach(() => {
      if (!isQdrantAvailable) return;
      testCollection = getTestCollection();
    });

    afterEach(async () => {
      if (!isQdrantAvailable || !testCollection) return;
      try {
        await qdrant.deleteCollection(testCollection);
      } catch {
        // Collection might not exist
      }
    });

    it('should enable semantic search for stored documents', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      await service.embed(sampleExtraction, 'ollama', testCollection);

      // Generate search embedding for a related query
      const searchVector = await generateEmbedding('how to get started with embeddings', 'ollama');

      // Search Qdrant
      const results = await qdrant.search(testCollection, {
        vector: searchVector,
        limit: 3
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThan(0.3); // Semantic relevance threshold
    });
  });

  describe('Error Handling', () => {
    let testCollection: string;

    beforeEach(() => {
      if (!isQdrantAvailable) return;
      testCollection = getTestCollection();
    });

    afterEach(async () => {
      if (!isQdrantAvailable || !testCollection) return;
      try {
        await qdrant.deleteCollection(testCollection);
      } catch {
        // Collection might not exist
      }
    });

    it('should handle empty extraction gracefully', async () => {
      if (!isQdrantAvailable || !isOllamaAvailable) return;

      const emptyExtraction: ClaudeDocOutput = {
        source: 'https://test.com/empty',
        pageTitle: 'Empty',
        summary: '',
        sections: [],
        prerequisites: [],
        useCases: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          modelUsed: 'claude-sonnet-4-5-20250929'
        }
      };

      const result = await service.embed(emptyExtraction, 'ollama', testCollection);

      expect(result.documentsProcessed).toBe(0);
      expect(result.success).toBe(false);
    });
  });

  /**
   * TESTS NOT INCLUDED (better tested elsewhere):
   *
   * 1. Provider Comparison (Ollama vs OpenAI)
   *    Reason: Requires OPENAI_API_KEY and costs money
   *    Alternative: Unit tests verify provider parameter works
   *
   * 2. Large-Scale Performance (100+ documents)
   *    Reason: Slow tests, better as manual benchmarks
   *    Alternative: Manual performance testing with real workloads
   *
   * 3. Concurrent Embedding
   *    Reason: Complex to test reliably, race conditions
   *    Alternative: Manual testing with concurrent workloads
   *
   * 4. Content Formatting Details (SEARCH TERMS:, ALSO KNOWN AS:, emoji)
   *    Reason: Requires parsing stored content strings
   *    Alternative: Unit tests verify formatting logic
   */
});
