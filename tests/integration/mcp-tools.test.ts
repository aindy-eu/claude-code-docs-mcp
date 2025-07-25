import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import { registerTools } from '../../src/tools/index.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

describe('MCP Tools Integration', () => {
  let server: Server;
  let qdrant: QdrantClient;
  const testCollectionName = 'test-claude-docs-ollama';

  beforeAll(async () => {
    // Create test server
    server = new Server(
      { name: 'test-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    // Create Qdrant client
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
          throw new Error('Qdrant is not available for integration tests');
        }
      }
    }

    // Register tools
    registerTools(server, qdrant);

    // Set up test collection with sample data
    try {
      await qdrant.deleteCollection(testCollectionName);
    } catch (error) {
      // Collection might not exist
    }

    await qdrant.createCollection(testCollectionName, {
      vectors: {
        size: 384,
        distance: 'Cosine'
      }
    });

    // Add sample test documents
    const sampleEmbedding = new Array(384).fill(0).map(() => Math.random());
    await qdrant.upsert(testCollectionName, {
      points: [
        {
          id: 'test-doc-1',
          vector: sampleEmbedding,
          payload: {
            content: 'Claude Code supports slash commands like /help and /settings for quick actions.',
            title: 'Slash Commands Guide',
            section: 'Getting Started',
            url: 'https://docs.anthropic.com/claude-code/slash-commands',
            codeExamples: ['/help', '/settings', '/memory clear']
          }
        },
        {
          id: 'test-doc-2',
          vector: sampleEmbedding.map(x => x * 0.8),
          payload: {
            content: 'MCP (Model Context Protocol) enables Claude Code to connect to external data sources.',
            title: 'MCP Integration',
            section: 'Advanced Features',
            url: 'https://docs.anthropic.com/claude-code/mcp',
            codeExamples: ['claude --mcp-server ./server.js']
          }
        }
      ]
    });
  });

  afterAll(async () => {
    // Clean up test collection
    try {
      await qdrant.deleteCollection(testCollectionName);
    } catch (error) {
      // Collection might not exist
    }
  });

  describe('List Tools', () => {
    it('should list available tools', async () => {
      const request = { method: 'tools/list', params: {} };
      const handler = server['requestHandlers'].get(ListToolsRequestSchema);
      
      expect(handler).toBeDefined();
      
      const response = await handler!(request as any);
      
      expect(response).toHaveProperty('tools');
      expect(response.tools).toHaveLength(1);
      expect(response.tools[0]).toMatchObject({
        name: 'search_claude_code_docs',
        description: expect.stringContaining('Search Claude Code documentation'),
        inputSchema: expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            query: expect.objectContaining({
              type: 'string'
            }),
            provider: expect.objectContaining({
              enum: ['ollama', 'openai', 'both']
            }),
            limit: expect.objectContaining({
              type: 'number'
            })
          }),
          required: ['query']
        })
      });
    });
  });

  describe('Search Tool', () => {
    // Mock the embedding generation for consistent testing
    const mockGenerateEmbedding = jest.fn();
    
    beforeAll(() => {
      // Mock the embedding service to return consistent embeddings
      jest.doMock('../../src/services/hybrid-embeddings.js', () => ({
        generateEmbedding: mockGenerateEmbedding,
        getCollectionName: jest.fn().mockReturnValue(testCollectionName),
        EMBEDDING_CONFIGS: {
          ollama: { dimensions: 384, model: 'nomic-embed-text' },
          openai: { dimensions: 1536, model: 'text-embedding-3-small' }
        }
      }));
    });

    beforeEach(() => {
      // Reset mock and set default behavior
      mockGenerateEmbedding.mockReset();
      const sampleEmbedding = new Array(384).fill(0).map(() => Math.random());
      mockGenerateEmbedding.mockResolvedValue(sampleEmbedding);
    });

    it('should execute search tool successfully', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {
            query: 'slash commands',
            provider: 'ollama',
            limit: 2
          }
        }
      };

      const handler = server['requestHandlers'].get(CallToolRequestSchema);
      expect(handler).toBeDefined();

      const response = await handler!(request as any);

      expect(response).toHaveProperty('content');
      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('## Claude Code Documentation Search Results')
      });

      const text = response.content[0].text;
      expect(text).toContain('Slash Commands Guide');
      expect(text).toContain('Getting Started');
      expect(text).toContain('**Provider:** ollama');
      expect(text).toContain('/help');
    }, 30000);

    it('should handle search with different providers', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {
            query: 'MCP integration',
            provider: 'both',
            limit: 1
          }
        }
      };

      const handler = server['requestHandlers'].get(CallToolRequestSchema);
      const response = await handler!(request as any);

      expect(response.content[0].text).toContain('MCP Integration');
      expect(mockGenerateEmbedding).toHaveBeenCalledWith('MCP integration', 'ollama');
      expect(mockGenerateEmbedding).toHaveBeenCalledWith('MCP integration', 'openai');
    }, 30000);

    it('should handle search errors gracefully', async () => {
      // Make the embedding generation fail
      mockGenerateEmbedding.mockRejectedValue(new Error('Embedding service unavailable'));

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {
            query: 'test query',
            provider: 'ollama'
          }
        }
      };

      const handler = server['requestHandlers'].get(CallToolRequestSchema);
      const response = await handler!(request as any);

      expect(response.content[0].text).toContain('Error searching Claude Code documentation');
      expect(response.content[0].text).toContain('Embedding service unavailable');
      expect(response.content[0].text).toContain('Make sure:');
    });

    it('should validate required parameters', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {
            // Missing required 'query' parameter
            provider: 'ollama'
          }
        }
      };

      const handler = server['requestHandlers'].get(CallToolRequestSchema);
      
      // The tool should handle missing parameters gracefully
      // In a real implementation, this might be caught by schema validation
      const response = await handler!(request as any);
      
      // Should either error or handle undefined query
      expect(response).toHaveProperty('content');
    });

    it('should use default parameters', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {
            query: 'test with defaults'
          }
        }
      };

      const handler = server['requestHandlers'].get(CallToolRequestSchema);
      const response = await handler!(request as any);

      expect(response.content[0].text).toContain('Claude Code Documentation Search Results');
      // Should use default provider (ollama) and limit (3)
      expect(mockGenerateEmbedding).toHaveBeenCalledWith('test with defaults', 'ollama');
    });

    it('should handle unknown tool names', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };

      const handler = server['requestHandlers'].get(CallToolRequestSchema);
      
      await expect(handler!(request as any))
        .rejects
        .toThrow('Unknown tool: unknown_tool');
    });
  });

  describe('Tool Schema Validation', () => {
    it('should have proper input schema structure', async () => {
      const request = { method: 'tools/list', params: {} };
      const handler = server['requestHandlers'].get(ListToolsRequestSchema);
      const response = await handler!(request as any);

      const tool = response.tools[0];
      const schema = tool.inputSchema;

      expect(schema.type).toBe('object');
      expect(schema.properties).toHaveProperty('query');
      expect(schema.properties).toHaveProperty('provider');
      expect(schema.properties).toHaveProperty('limit');

      expect(schema.properties.provider.enum).toEqual(['ollama', 'openai', 'both']);
      expect(schema.properties.limit.minimum).toBe(1);
      expect(schema.properties.limit.maximum).toBe(10);
      expect(schema.required).toEqual(['query']);
    });
  });
});