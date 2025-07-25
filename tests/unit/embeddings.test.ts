import { generateEmbedding, getCollectionName, EMBEDDING_CONFIGS } from '../../src/services/hybrid-embeddings.js';

// Mock external dependencies
jest.mock('ollama', () => ({
  embed: jest.fn()
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn()
    }
  }))
}));

const mockOllama = require('ollama');
const mockOpenAI = require('openai');

describe('Embedding Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EMBEDDING_CONFIGS', () => {
    it('should have correct configurations', () => {
      expect(EMBEDDING_CONFIGS).toHaveProperty('ollama');
      expect(EMBEDDING_CONFIGS).toHaveProperty('openai');
      
      expect(EMBEDDING_CONFIGS.ollama).toEqual({
        dimensions: 384,
        model: 'nomic-embed-text'
      });
      
      expect(EMBEDDING_CONFIGS.openai).toEqual({
        dimensions: 1536,
        model: 'text-embedding-3-small'
      });
    });
  });

  describe('getCollectionName', () => {
    it('should generate correct collection names', () => {
      expect(getCollectionName('ollama')).toBe('claude-docs-ollama');
      expect(getCollectionName('openai')).toBe('claude-docs-openai');
    });
  });

  describe('generateEmbedding', () => {
    describe('ollama provider', () => {
      it('should generate embeddings using ollama', async () => {
        const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
        mockOllama.embed.mockResolvedValue({
          embeddings: [mockEmbedding]
        });

        const result = await generateEmbedding('test text', 'ollama');

        expect(mockOllama.embed).toHaveBeenCalledWith({
          model: 'nomic-embed-text',
          input: 'test text'
        });
        expect(result).toEqual(mockEmbedding);
        expect(result).toHaveLength(384);
      });

      it('should handle ollama errors', async () => {
        mockOllama.embed.mockRejectedValue(new Error('Ollama connection failed'));

        await expect(generateEmbedding('test text', 'ollama'))
          .rejects
          .toThrow('Ollama connection failed');
      });

      it('should handle empty embeddings response', async () => {
        mockOllama.embed.mockResolvedValue({ embeddings: [] });

        await expect(generateEmbedding('test text', 'ollama'))
          .rejects
          .toThrow('No embeddings returned from ollama');
      });
    });

    describe('openai provider', () => {
      let mockOpenAIInstance: any;

      beforeEach(() => {
        mockOpenAIInstance = {
          embeddings: {
            create: jest.fn()
          }
        };
        mockOpenAI.OpenAI.mockImplementation(() => mockOpenAIInstance);
      });

      it('should generate embeddings using OpenAI', async () => {
        const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
        mockOpenAIInstance.embeddings.create.mockResolvedValue({
          data: [{ embedding: mockEmbedding }]
        });

        const result = await generateEmbedding('test text', 'openai');

        expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledWith({
          model: 'text-embedding-3-small',
          input: 'test text'
        });
        expect(result).toEqual(mockEmbedding);
        expect(result).toHaveLength(1536);
      });

      it('should handle OpenAI errors', async () => {
        mockOpenAIInstance.embeddings.create.mockRejectedValue(
          new Error('OpenAI API error')
        );

        await expect(generateEmbedding('test text', 'openai'))
          .rejects
          .toThrow('OpenAI API error');
      });

      it('should handle empty OpenAI response', async () => {
        mockOpenAIInstance.embeddings.create.mockResolvedValue({
          data: []
        });

        await expect(generateEmbedding('test text', 'openai'))
          .rejects
          .toThrow('No embeddings returned from OpenAI');
      });

      it('should handle missing embedding data', async () => {
        mockOpenAIInstance.embeddings.create.mockResolvedValue({
          data: [{}]
        });

        await expect(generateEmbedding('test text', 'openai'))
          .rejects
          .toThrow('No embeddings returned from OpenAI');
      });
    });

    describe('input validation', () => {
      it('should handle empty text', async () => {
        const mockEmbedding = new Array(384).fill(0);
        mockOllama.embed.mockResolvedValue({
          embeddings: [mockEmbedding]
        });

        const result = await generateEmbedding('', 'ollama');
        
        expect(mockOllama.embed).toHaveBeenCalledWith({
          model: 'nomic-embed-text',
          input: ''
        });
        expect(result).toEqual(mockEmbedding);
      });

      it('should handle long text', async () => {
        const longText = 'A'.repeat(10000);
        const mockEmbedding = new Array(384).fill(0);
        mockOllama.embed.mockResolvedValue({
          embeddings: [mockEmbedding]
        });

        const result = await generateEmbedding(longText, 'ollama');
        
        expect(mockOllama.embed).toHaveBeenCalledWith({
          model: 'nomic-embed-text',
          input: longText
        });
        expect(result).toEqual(mockEmbedding);
      });

      it('should handle special characters', async () => {
        const specialText = '🚀 Claude Code with émojis and ñoñó characters!';
        const mockEmbedding = new Array(384).fill(0);
        mockOllama.embed.mockResolvedValue({
          embeddings: [mockEmbedding]
        });

        const result = await generateEmbedding(specialText, 'ollama');
        
        expect(mockOllama.embed).toHaveBeenCalledWith({
          model: 'nomic-embed-text',
          input: specialText
        });
        expect(result).toEqual(mockEmbedding);
      });
    });

    describe('provider validation', () => {
      it('should throw error for unsupported provider', async () => {
        await expect(generateEmbedding('test', 'unsupported' as any))
          .rejects
          .toThrow('Unsupported embedding provider: unsupported');
      });
    });
  });

  describe('embedding consistency', () => {
    it('should generate consistent embeddings for same input', async () => {
      const mockEmbedding = new Array(384).fill(0.5);
      mockOllama.embed.mockResolvedValue({
        embeddings: [mockEmbedding]
      });

      const result1 = await generateEmbedding('consistent test', 'ollama');
      const result2 = await generateEmbedding('consistent test', 'ollama');

      expect(result1).toEqual(result2);
      expect(mockOllama.embed).toHaveBeenCalledTimes(2);
    });

    it('should generate different embeddings for different inputs', async () => {
      const embedding1 = new Array(384).fill(0.1);
      const embedding2 = new Array(384).fill(0.9);
      
      mockOllama.embed
        .mockResolvedValueOnce({ embeddings: [embedding1] })
        .mockResolvedValueOnce({ embeddings: [embedding2] });

      const result1 = await generateEmbedding('first text', 'ollama');
      const result2 = await generateEmbedding('second text', 'ollama');

      expect(result1).not.toEqual(result2);
      expect(result1).toEqual(embedding1);
      expect(result2).toEqual(embedding2);
    });
  });

  describe('performance considerations', () => {
    it('should handle concurrent embedding requests', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      mockOllama.embed.mockResolvedValue({
        embeddings: [mockEmbedding]
      });

      const promises = Array.from({ length: 5 }, (_, i) => 
        generateEmbedding(`test text ${i}`, 'ollama')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockOllama.embed).toHaveBeenCalledTimes(5);
      results.forEach(result => {
        expect(result).toEqual(mockEmbedding);
      });
    });
  });
});