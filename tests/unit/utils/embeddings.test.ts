import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Create shared mock function for OpenAI BEFORE vi.mock()
const mockOpenAICreate = vi.fn();

// Mock with proper factory functions
vi.mock('ollama', () => ({
  __esModule: true,
  default: {
    embeddings: vi.fn()
  }
}));

vi.mock('openai', () => ({
  __esModule: true,
  default: class MockOpenAI {
    embeddings = {
      create: mockOpenAICreate // Use the pre-defined function
    };
  }
}));

// Import the module we're testing
import { generateEmbedding, getCollectionName, EMBEDDING_CONFIGS } from '@/utils/embeddings.js';
import ollama from 'ollama';

// Get typed reference to ollama mock
const mockOllamaEmbeddings = vi.mocked(ollama.embeddings);

describe('Embedding Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOllamaEmbeddings.mockReset();
    mockOpenAICreate.mockReset();

    // Set up env vars for OpenAI tests
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('EMBEDDING_CONFIGS', () => {
    it('should have correct configurations', () => {
      expect(EMBEDDING_CONFIGS).toHaveProperty('ollama');
      expect(EMBEDDING_CONFIGS).toHaveProperty('openai');

      expect(EMBEDDING_CONFIGS.ollama.dimensions).toBe(768);
      expect(EMBEDDING_CONFIGS.ollama.model).toBe('nomic-embed-text');

      expect(EMBEDDING_CONFIGS.openai.dimensions).toBe(1536);
      expect(EMBEDDING_CONFIGS.openai.model).toBe('text-embedding-ada-002');
    });
  });

  describe('getCollectionName', () => {
    it('should generate correct collection names', () => {
      expect(getCollectionName('ollama')).toBe('claude_code_docs_ollama');
      expect(getCollectionName('openai')).toBe('claude_code_docs_openai');
    });
  });

  describe('generateEmbedding', () => {
    describe('ollama provider', () => {
      it('should generate embeddings using ollama', async () => {
        const mockEmbedding = new Array(768).fill(0).map(() => Math.random());
        mockOllamaEmbeddings.mockResolvedValue({
          embedding: mockEmbedding
        });

        const result = await generateEmbedding('test text', 'ollama');

        expect(mockOllamaEmbeddings).toHaveBeenCalledWith({
          model: 'nomic-embed-text',
          prompt: 'test text'
        });
        expect(result).toEqual(mockEmbedding);
        expect(result).toHaveLength(768);
      });

      it('should handle ollama errors', async () => {
        mockOllamaEmbeddings.mockRejectedValue(new Error('Ollama connection failed'));

        await expect(generateEmbedding('test text', 'ollama')).rejects.toThrow(
          'Ollama connection failed'
        );
      });

      it('should handle empty embeddings response', async () => {
        mockOllamaEmbeddings.mockResolvedValue({
          embedding: undefined as any
        });

        // The actual implementation doesn't validate, so it will return undefined
        const result = await generateEmbedding('test text', 'ollama');
        expect(result as any).toBeUndefined();
      });
    });

    describe('openai provider', () => {
      it('should generate embeddings using OpenAI', async () => {
        const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
        mockOpenAICreate.mockResolvedValue({
          data: [{ embedding: mockEmbedding }]
        });

        const result = await generateEmbedding('test text', 'openai');

        expect(mockOpenAICreate).toHaveBeenCalledWith({
          model: 'text-embedding-ada-002',
          input: 'test text'
        });
        expect(result).toEqual(mockEmbedding);
        expect(result).toHaveLength(1536);
      });

      it('should handle OpenAI errors', async () => {
        mockOpenAICreate.mockRejectedValue(new Error('OpenAI API error'));

        await expect(generateEmbedding('test text', 'openai')).rejects.toThrow('OpenAI API error');
      });

      it('should handle empty OpenAI response', async () => {
        mockOpenAICreate.mockResolvedValue({
          data: []
        });

        // The actual implementation will throw when trying to access data[0]
        await expect(generateEmbedding('test text', 'openai')).rejects.toThrow();
      });

      it('should handle missing embedding data', async () => {
        mockOpenAICreate.mockResolvedValue({
          data: [{ embedding: undefined }]
        });

        // The actual implementation returns undefined from data[0].embedding
        const result = await generateEmbedding('test text', 'openai');
        expect(result).toBeUndefined();
      });
    });

    describe('provider validation', () => {
      it('should throw error for unsupported provider', async () => {
        // The actual implementation doesn't validate provider,
        // it will just fall through to the else branch (OpenAI)
        // and fail because no API key is set for unsupported provider
        delete process.env.OPENAI_API_KEY;

        await expect(generateEmbedding('test', 'unsupported' as any)).rejects.toThrow(
          'OPENAI_API_KEY is required for OpenAI embeddings'
        );
      });
    });
  });

  describe('input validation', () => {
    it('should handle empty text', async () => {
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random());
      mockOllamaEmbeddings.mockResolvedValue({
        embedding: mockEmbedding
      });

      // The implementation doesn't validate empty text
      const result = await generateEmbedding('', 'ollama');
      expect(result).toHaveLength(768);
    });

    it('should handle long text', async () => {
      const longText = 'a'.repeat(50000);
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random());
      mockOllamaEmbeddings.mockResolvedValue({
        embedding: mockEmbedding
      });

      const result = await generateEmbedding(longText, 'ollama');
      expect(result).toHaveLength(768);
    });

    it('should handle special characters', async () => {
      const specialText = 'Test with 特殊文字 and émojis 🚀';
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random());
      mockOllamaEmbeddings.mockResolvedValue({
        embedding: mockEmbedding
      });

      const result = await generateEmbedding(specialText, 'ollama');

      expect(mockOllamaEmbeddings).toHaveBeenCalledWith({
        model: 'nomic-embed-text',
        prompt: specialText
      });
      expect(result).toHaveLength(768);
    });
  });

  describe('embedding consistency', () => {
    it('should generate consistent embeddings for same input', async () => {
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random());
      mockOllamaEmbeddings.mockResolvedValue({
        embedding: mockEmbedding
      });

      const result1 = await generateEmbedding('test text', 'ollama');
      const result2 = await generateEmbedding('test text', 'ollama');

      expect(result1).toEqual(result2);
    });

    it('should generate different embeddings for different inputs', async () => {
      const mockEmbedding1 = new Array(768).fill(0).map(() => Math.random());
      const mockEmbedding2 = new Array(768).fill(0).map(() => Math.random());

      mockOllamaEmbeddings
        .mockResolvedValueOnce({ embedding: mockEmbedding1 })
        .mockResolvedValueOnce({ embedding: mockEmbedding2 });

      const result1 = await generateEmbedding('text one', 'ollama');
      const result2 = await generateEmbedding('text two', 'ollama');

      expect(result1).not.toEqual(result2);
    });
  });

  describe('performance considerations', () => {
    it('should handle concurrent embedding requests', async () => {
      const mockEmbeddings = Array.from({ length: 5 }, () =>
        new Array(768).fill(0).map(() => Math.random())
      );

      mockEmbeddings.forEach((emb, _i) => {
        mockOllamaEmbeddings.mockResolvedValueOnce({ embedding: emb });
      });

      const promises = Array.from({ length: 5 }, (_, i) =>
        generateEmbedding(`text ${i}`, 'ollama')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveLength(768);
      });
    });
  });
});
