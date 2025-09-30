// Create a mock embedding before importing anything else
const mockEmbedding = new Array(768).fill(0).map(() => Math.random());

// Mock the embedding service before any imports that might use it
jest.mock('../../src/services/hybrid-embeddings.js', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(mockEmbedding),
  getCollectionName: jest.fn().mockReturnValue('test-collection'),
  EMBEDDING_CONFIGS: {
    ollama: { dimensions: 768, model: 'nomic-embed-text' },
    openai: { dimensions: 1536, model: 'text-embedding-ada-002' }
  }
}));

import { formatSearchResults, searchDocumentation } from '../../src/tools/search.js';
import { SearchResult, SearchParams } from '../../src/types/index.js';
import { MockQdrantClient } from '../mocks/qdrantClient.js';
import { mockSearchResults } from '../fixtures/mockSearchResults.js';

describe('Search Functionality', () => {
  let mockQdrant: MockQdrantClient;

  beforeEach(() => {
    mockQdrant = new MockQdrantClient();
    mockQdrant.createCollection('test-collection', { vectors: { size: 768 } });
  });

  afterEach(() => {
    mockQdrant.reset();
    jest.clearAllMocks();
  });

  describe('formatSearchResults', () => {
    it('should format search results correctly', () => {
      const formatted = formatSearchResults(mockSearchResults);
      
      expect(formatted).toContain('## Claude Code Documentation Search Results');
      expect(formatted).toContain('### 1. Slash Commands Overview');
      expect(formatted).toContain('**Section:** Getting Started');
      expect(formatted).toContain('**Relevance Score:** 95.0%');
      expect(formatted).toContain('**Provider:** ollama');
      expect(formatted).toContain('/help');
      expect(formatted).toContain('---');
    });

    it('should handle empty results', () => {
      const formatted = formatSearchResults([]);
      expect(formatted).toBe('No relevant Claude Code documentation found for your query.');
    });

    it('should truncate long content', () => {
      const longResult: SearchResult = {
        ...mockSearchResults[0],
        content: 'A'.repeat(1000)
      };
      
      const formatted = formatSearchResults([longResult]);
      expect(formatted).toContain('A'.repeat(800) + '...');
    });

    it('should limit code examples to 2', () => {
      const resultWithManyExamples: SearchResult = {
        ...mockSearchResults[0],
        codeExamples: ['/cmd1', '/cmd2', '/cmd3', '/cmd4', '/cmd5']
      };
      
      const formatted = formatSearchResults([resultWithManyExamples]);
      const codeBlocks = formatted.match(/```/g);
      expect(codeBlocks).toHaveLength(4); // 2 examples × 2 backticks each
    });
  });

  describe('searchDocumentation', () => {
    it('should search with ollama provider', async () => {
      const params: SearchParams = {
        query: 'slash commands',
        provider: 'ollama',
        limit: 3
      };

      const results = await searchDocumentation(mockQdrant as any, params);
      
      expect(results).toHaveLength(2);
      expect(results[0].provider).toBe('ollama');
      expect(results[0].score).toBe(0.95);
      expect(results).toBeSortedBy('score', { descending: true });
    });

    it('should search with openai provider', async () => {
      const params: SearchParams = {
        query: 'MCP integration',
        provider: 'openai',
        limit: 2
      };

      const results = await searchDocumentation(mockQdrant as any, params);
      
      expect(results).toHaveLength(2);
    });

    it('should search with both providers', async () => {
      const params: SearchParams = {
        query: 'hooks configuration',
        provider: 'both',
        limit: 5
      };

      const results = await searchDocumentation(mockQdrant as any, params);
      
      expect(results).toHaveLength(4); // 2 results × 2 providers
    });

    it('should use default parameters', async () => {
      const params: SearchParams = {
        query: 'test query'
      };

      const results = await searchDocumentation(mockQdrant as any, params);
      
      expect(results).toHaveLength(2);
    });

    it('should handle search errors gracefully', async () => {
      const badQdrant = {
        query: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };

      const params: SearchParams = {
        query: 'test query',
        provider: 'ollama'
      };

      await expect(searchDocumentation(badQdrant as any, params))
        .rejects
        .toThrow('Connection failed');
    });

    it('should continue with other providers if one fails', async () => {
      const partiallyFailingQdrant = {
        query: jest.fn()
          .mockResolvedValueOnce(mockQdrant.query('test-collection', {}))
          .mockRejectedValueOnce(new Error('Provider failed'))
      };

      const params: SearchParams = {
        query: 'test query',
        provider: 'both'
      };

      const results = await searchDocumentation(partiallyFailingQdrant as any, params);
      
      expect(results).toHaveLength(2); // Only successful provider results
    });

    it('should limit results correctly', async () => {
      const params: SearchParams = {
        query: 'test query',
        limit: 1
      };

      const results = await searchDocumentation(mockQdrant as any, params);
      
      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.95); // Should be the highest scoring result
    });
  });
});

// Custom Jest matcher for sorting
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeSortedBy(key: string, options?: { descending?: boolean }): R;
    }
  }
}

expect.extend({
  toBeSortedBy(received: any[], key: string, options: { descending?: boolean } = {}) {
    const { descending = false } = options;
    
    for (let i = 1; i < received.length; i++) {
      const current = received[i][key];
      const previous = received[i - 1][key];
      
      if (descending ? current > previous : current < previous) {
        return {
          message: () => `Expected array to be sorted by ${key} ${descending ? 'descending' : 'ascending'}`,
          pass: false,
        };
      }
    }
    
    return {
      message: () => `Expected array not to be sorted by ${key} ${descending ? 'descending' : 'ascending'}`,
      pass: true,
    };
  },
});