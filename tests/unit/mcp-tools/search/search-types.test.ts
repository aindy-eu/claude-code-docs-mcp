import { SearchResult, SearchParams } from '@/mcp-tools/search/search.types.js';

describe('Type Definitions', () => {
  describe('SearchResult', () => {
    it('should accept valid SearchResult object', () => {
      const validResult: SearchResult = {
        content: 'Test content',
        title: 'Test Title',
        section: 'Test Section',
        url: 'https://test.com',
        score: 0.95,
        codeExamples: ['example1', 'example2'],
        provider: 'ollama'
      };

      expect(validResult.content).toBe('Test content');
      expect(validResult.title).toBe('Test Title');
      expect(validResult.score).toBe(0.95);
      expect(validResult.codeExamples).toHaveLength(2);
    });

    it('should handle empty code examples', () => {
      const result: SearchResult = {
        content: 'Test content',
        title: 'Test Title',
        section: 'Test Section',
        url: 'https://test.com',
        score: 0.95,
        codeExamples: [],
        provider: 'openai'
      };

      expect(result.codeExamples).toEqual([]);
    });
  });

  describe('SearchParams', () => {
    it('should accept minimal SearchParams', () => {
      const params: SearchParams = {
        query: 'test query'
      };

      expect(params.query).toBe('test query');
      expect(params.provider).toBeUndefined();
      expect(params.limit).toBeUndefined();
    });

    it('should accept full SearchParams', () => {
      const params: SearchParams = {
        query: 'test query',
        provider: 'both',
        limit: 5
      };

      expect(params.query).toBe('test query');
      expect(params.provider).toBe('both');
      expect(params.limit).toBe(5);
    });

    it('should handle different provider values', () => {
      const ollamaParams: SearchParams = {
        query: 'test',
        provider: 'ollama'
      };

      const openaiParams: SearchParams = {
        query: 'test',
        provider: 'openai'
      };

      const bothParams: SearchParams = {
        query: 'test',
        provider: 'both'
      };

      expect(ollamaParams.provider).toBe('ollama');
      expect(openaiParams.provider).toBe('openai');
      expect(bothParams.provider).toBe('both');
    });
  });
});
