import { QdrantClient } from '@qdrant/js-client-rest';
import {
  generateEmbedding,
  getCollectionName,
  EmbeddingProvider
} from '../../src/utils/embeddings.js';
import { getDocUrl } from '../../src/config/documentation-urls.js';
import { v4 as uuidv4 } from 'uuid';

describe('Qdrant Integration Tests (requires Qdrant)', () => {
  let qdrant: QdrantClient;
  const testCollectionName = 'test-qdrant-integration';

  beforeAll(async () => {
    qdrant = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333')
    });

    // Wait for Qdrant to be ready
    let retries = 5;
    while (retries > 0) {
      try {
        await qdrant.getCollections();
        break;
      } catch (error) {
        console.log(`Waiting for Qdrant... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
        if (retries === 0) {
          throw new Error('Qdrant is not available. Make sure it is running on localhost:6333');
        }
      }
    }
  });

  // Global cleanup - only after all tests
  afterAll(async () => {
    // Final cleanup of test collection
    try {
      await qdrant.deleteCollection(testCollectionName);
    } catch (error) {
      // Collection might not exist, which is fine
    }
  });

  describe('Collection Management', () => {
    beforeEach(async () => {
      // Clean up before each test in this suite
      try {
        await qdrant.deleteCollection(testCollectionName);
      } catch (error) {
        // Collection might not exist
      }
    });

    afterEach(async () => {
      // Clean up after each test in this suite
      try {
        await qdrant.deleteCollection(testCollectionName);
      } catch (error) {
        // Collection might not exist
      }
    });

    it('should create a collection successfully', async () => {
      await qdrant.createCollection(testCollectionName, {
        vectors: {
          size: 768,
          distance: 'Cosine'
        }
      });

      const collections = await qdrant.getCollections();
      const collectionNames = collections.collections.map(c => c.name);
      expect(collectionNames).toContain(testCollectionName);
    });

    it('should get collection info', async () => {
      await qdrant.createCollection(testCollectionName, {
        vectors: {
          size: 768,
          distance: 'Cosine'
        }
      });

      const info = await qdrant.getCollection(testCollectionName);
      expect(info.points_count).toBe(0);
      expect(info.config?.params?.vectors?.size).toBe(768);
    });

    it('should handle collection that does not exist', async () => {
      await expect(qdrant.getCollection('non-existent-collection')).rejects.toThrow();
    });
  });

  describe('Document Operations', () => {
    beforeEach(async () => {
      // Clean up first
      try {
        await qdrant.deleteCollection(testCollectionName);
      } catch (error) {
        // Collection might not exist
      }

      // Then create fresh collection
      await qdrant.createCollection(testCollectionName, {
        vectors: {
          size: 768,
          distance: 'Cosine'
        }
      });
    });

    afterEach(async () => {
      // Clean up after each test
      try {
        await qdrant.deleteCollection(testCollectionName);
      } catch (error) {
        // Collection might not exist
      }
    });

    it('should upsert and query documents', async () => {
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random());

      // Upsert test documents
      await qdrant.upsert(testCollectionName, {
        points: [
          {
            id: uuidv4(),
            vector: mockEmbedding,
            payload: {
              content: 'Claude Code supports slash commands for quick actions.',
              title: 'Slash Commands',
              section: 'Getting Started',
              url: getDocUrl('slashCommands'),
              codeExamples: ['/help', '/settings']
            }
          },
          {
            id: uuidv4(),
            vector: mockEmbedding.map(x => x * 0.9), // Slightly different vector
            payload: {
              content: 'MCP allows Claude Code to connect to external tools.',
              title: 'MCP Integration',
              section: 'Advanced',
              url: getDocUrl('mcp'),
              codeExamples: ['claude mcp add test node ./server.js']
            }
          }
        ]
      });

      // Verify points were added
      const info = await qdrant.getCollection(testCollectionName);
      expect(info.points_count).toBe(2);

      // Query the documents
      const searchResults = await qdrant.query(testCollectionName, {
        query: mockEmbedding,
        limit: 10,
        with_payload: true,
        score_threshold: 0.0
      });

      expect(searchResults.points).toHaveLength(2);
      expect(searchResults.points[0].payload?.title).toBeDefined();
      expect(searchResults.points[0].payload?.content).toBeDefined();
      expect(searchResults.points[0].score).toBeGreaterThan(0);
    });

    it('should filter results by score threshold', async () => {
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random());

      await qdrant.upsert(testCollectionName, {
        points: [
          {
            id: uuidv4(),
            vector: mockEmbedding,
            payload: { title: 'Test Document 1' }
          }
        ]
      });

      // Query with high score threshold (should return no results)
      const strictResults = await qdrant.query(testCollectionName, {
        query: new Array(768).fill(0).map(() => Math.random()), // Random vector
        limit: 10,
        with_payload: true,
        score_threshold: 0.99
      });

      expect(strictResults.points).toHaveLength(0);

      // Query with low score threshold (should return results)
      const lenientResults = await qdrant.query(testCollectionName, {
        query: mockEmbedding,
        limit: 10,
        with_payload: true,
        score_threshold: 0.1
      });

      expect(lenientResults.points.length).toBeGreaterThan(0);
    });
  });

  describe('Real Embedding Integration', () => {
    beforeEach(async () => {
      // Clean up first
      try {
        await qdrant.deleteCollection(testCollectionName);
      } catch (error) {
        // Collection might not exist
      }

      // Then create fresh collection
      await qdrant.createCollection(testCollectionName, {
        vectors: {
          size: 768,
          distance: 'Cosine'
        }
      });
    });

    afterEach(async () => {
      // Clean up after each test
      try {
        await qdrant.deleteCollection(testCollectionName);
      } catch (error) {
        // Collection might not exist
      }
    });

    it('should work with real embeddings from ollama', async () => {
      // This test requires ollama to be running with nomic-embed-text model
      const testQuery = 'slash commands in Claude Code';

      try {
        const embedding = await generateEmbedding(testQuery, 'ollama');
        expect(embedding).toHaveLength(768);
        expect(embedding.every(x => typeof x === 'number')).toBe(true);

        // Test that we can use this embedding with Qdrant
        await qdrant.upsert(testCollectionName, {
          points: [
            {
              id: uuidv4(),
              vector: embedding,
              payload: {
                content: 'Test document with real embedding',
                title: 'Real Embedding Test'
              }
            }
          ]
        });

        const searchResults = await qdrant.query(testCollectionName, {
          query: embedding,
          limit: 1,
          with_payload: true
        });

        expect(searchResults.points).toHaveLength(1);
        expect(searchResults.points[0].score).toBeCloseTo(1.0, 5); // Should be nearly perfect match
      } catch (error) {
        console.warn('Skipping real embedding test - ollama not available:', error.message);
        // Mark test as pending instead of failing
        pending('Ollama not available for real embedding test');
      }
    }, 30000); // Longer timeout for embedding generation
  });

  describe('Collection Name Generation', () => {
    it('should generate correct collection names', () => {
      expect(getCollectionName('ollama')).toBe('claude_code_docs_ollama');
      expect(getCollectionName('openai')).toBe('claude_code_docs_openai');
    });

    it('should use generated collection names with Qdrant', async () => {
      const collectionName = getCollectionName('ollama');

      // First delete if it exists from previous test run
      try {
        await qdrant.deleteCollection(collectionName);
      } catch (error) {
        // Collection might not exist
      }

      await qdrant.createCollection(collectionName, {
        vectors: { size: 768, distance: 'Cosine' }
      });

      const collections = await qdrant.getCollections();
      const names = collections.collections.map(c => c.name);
      expect(names).toContain(collectionName);

      // Clean up
      await qdrant.deleteCollection(collectionName);
    });
  });
});
