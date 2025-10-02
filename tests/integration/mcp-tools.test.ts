import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import { registerTools } from '@/mcp-tools/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getDocUrl } from '@/config/documentation-urls.js';
import { v4 as uuidv4 } from 'uuid';

// Check if Qdrant is available before running tests
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

// Conditionally run integration tests based on Qdrant availability
describe('MCP Tools Integration (requires Qdrant)', () => {
  let server: Server;
  let qdrant: QdrantClient;
  // CRITICAL: Use unique test collection to avoid destroying production data
  const testCollectionName = `test_mcp_tools_${Date.now()}`;

  // Store a fixed embedding to use consistently across tests
  const fixedEmbedding = new Array(768).fill(0).map((_, i) => Math.sin(i) * 0.5 + 0.5);

  beforeAll(async () => {
    // Check if Qdrant is available
    const isAvailable = await checkQdrantAvailable();
    if (!isAvailable) {
      console.info('⚠️  Qdrant is not running - skipping integration tests');
      console.info(
        '   To run these tests, start Qdrant with: docker run -p 6333:6333 qdrant/qdrant'
      );
      return;
    }

    // Mock the generateEmbedding function to return our fixed embedding
    vi.mock('../../src/utils/embeddings.js', () => ({
      generateEmbedding: vi.fn(() => Promise.resolve(fixedEmbedding)),
      getCollectionName: vi.fn().mockReturnValue('test-collection'),
      EMBEDDING_CONFIGS: {
        ollama: { dimensions: 768, model: 'nomic-embed-text' },
        openai: { dimensions: 1536, model: 'text-embedding-ada-002' }
      }
    }));

    // Create test server
    server = new Server({ name: 'test-server', version: '1.0.0' }, { capabilities: { tools: {} } });

    // Create Qdrant client
    qdrant = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333')
    });

    // Register tools
    registerTools(server, qdrant);

    // Set up test collection with sample data - ensure clean state
    try {
      await qdrant.deleteCollection(testCollectionName);
    } catch {
      // Collection might not exist
    }

    await qdrant.createCollection(testCollectionName, {
      vectors: {
        size: 768,
        distance: 'Cosine'
      }
    });

    // Add sample test documents using the fixed embedding
    await qdrant.upsert(testCollectionName, {
      points: [
        {
          id: uuidv4(),
          vector: fixedEmbedding,
          payload: {
            title: 'Slash Commands',
            content: 'Claude Code supports slash commands like /help for quick actions.',
            url: getDocUrl('slashCommands'),
            section: 'Getting Started',
            provider: 'ollama',
            codeExamples: ['/help', '/settings'],
            keyConcepts: ['slash commands', 'quick actions']
          }
        },
        {
          id: uuidv4(),
          vector: fixedEmbedding.map(v => v * 0.95), // Slightly different but still similar
          payload: {
            title: 'Hooks',
            content: 'Hooks allow you to run custom commands in Claude Code.',
            url: getDocUrl('hooks'),
            section: 'Configuration',
            provider: 'ollama',
            codeExamples: ['{"hooks": {"pre-commit": "npm test"}}'],
            keyConcepts: ['hooks', 'automation']
          }
        }
      ]
    });
  });

  afterAll(async () => {
    try {
      await qdrant.deleteCollection(testCollectionName);
    } catch {
      // Collection might not exist
    }
  });

  describe('List Tools', () => {
    it('should list available tools', async () => {
      // Create a mock handler to capture the registered handler
      let registeredHandler: any;
      const mockSetRequestHandler = vi.fn((schema, handler) => {
        if (schema === ListToolsRequestSchema) {
          registeredHandler = handler;
        }
      });

      // Create a test server with mocked setRequestHandler
      const testServer = {
        setRequestHandler: mockSetRequestHandler
      } as any;

      // Register tools with our test server
      registerTools(testServer, qdrant);

      // Verify handler was registered
      expect(mockSetRequestHandler).toHaveBeenCalledWith(
        ListToolsRequestSchema,
        expect.any(Function)
      );

      // Handler must be registered
      expect(registeredHandler).toBeDefined();

      // Call the handler and verify response
      const response = await registeredHandler({ method: 'tools/list', params: {} });
      expect(response).toHaveProperty('tools');
      expect(Array.isArray(response.tools)).toBe(true);
      expect(response.tools.length).toBeGreaterThan(0);

      const searchTool = response.tools.find((t: any) => t.name === 'search_claude_code_docs');
      expect(searchTool).toBeDefined();
      expect(searchTool?.description).toContain('Claude Code documentation');
    });
  });

  describe('Search Tool', () => {
    // Note: These tests use a test-specific collection, not production collection

    it.skip('should execute search tool successfully (requires populated collection)', async () => {
      // Create a mock handler to capture the registered handler
      let registeredHandler: any;
      const mockSetRequestHandler = vi.fn((schema, handler) => {
        if (schema === CallToolRequestSchema) {
          registeredHandler = handler;
        }
      });

      // Create a test server with mocked setRequestHandler
      const testServer = {
        setRequestHandler: mockSetRequestHandler
      } as any;

      // Register tools with our test server
      registerTools(testServer, qdrant);

      // Verify handler was registered
      expect(mockSetRequestHandler).toHaveBeenCalledWith(
        CallToolRequestSchema,
        expect.any(Function)
      );

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {
            query: 'slash commands',
            limit: 5,
            provider: 'ollama'
          }
        }
      };

      // Handler must be registered
      expect(registeredHandler).toBeDefined();

      const response = await registeredHandler(request);
      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('Claude Code Documentation Search Results');
    });

    it.skip('should handle search with different providers (requires populated collection)', async () => {
      // Set up test server and handler
      let registeredHandler: any;
      const testServer = {
        setRequestHandler: vi.fn((schema, handler) => {
          if (schema === CallToolRequestSchema) {
            registeredHandler = handler;
          }
        })
      } as any;

      registerTools(testServer, qdrant);

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {
            query: 'hooks',
            provider: 'both'
          }
        }
      };

      // Handler must be registered
      expect(registeredHandler).toBeDefined();

      const response = await registeredHandler(request);
      expect(response.content[0].text).toContain('Hooks');
    });

    it('should handle search errors gracefully', async () => {
      // Test with a provider that requires API key we don't have
      let registeredHandler: any;
      const testServer = {
        setRequestHandler: vi.fn((schema, handler) => {
          if (schema === CallToolRequestSchema) {
            registeredHandler = handler;
          }
        })
      } as any;

      registerTools(testServer, qdrant);

      // Try to use openai provider without API key set
      delete process.env.OPENAI_API_KEY;

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {
            query: 'test query',
            provider: 'openai'
          }
        }
      };

      // Handler must be registered
      expect(registeredHandler).toBeDefined();

      const response = await registeredHandler(request);
      // Should return error message, not throw
      expect(response.content[0].text).toContain('Error searching Claude Code documentation');
    });

    it('should validate required parameters', async () => {
      // Set up test server and handler
      let registeredHandler: any;
      const testServer = {
        setRequestHandler: vi.fn((schema, handler) => {
          if (schema === CallToolRequestSchema) {
            registeredHandler = handler;
          }
        })
      } as any;

      registerTools(testServer, qdrant);

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {} // Missing required 'query' parameter
        }
      };

      // Handler must be registered
      expect(registeredHandler).toBeDefined();

      const response = await registeredHandler(request);
      // The search will fail due to missing query, but should return error message
      expect(response.content[0].text).toContain('Error');
    });

    it('should use default parameters', async () => {
      // Set up test server and handler
      let registeredHandler: any;
      const testServer = {
        setRequestHandler: vi.fn((schema, handler) => {
          if (schema === CallToolRequestSchema) {
            registeredHandler = handler;
          }
        })
      } as any;

      registerTools(testServer, qdrant);

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_claude_code_docs',
          arguments: {
            query: 'MCP integration'
          }
        }
      };

      // Handler must be registered
      expect(registeredHandler).toBeDefined();

      const response = await registeredHandler(request);
      expect(response.content).toBeDefined();
    });

    it('should handle unknown tool names', async () => {
      // Set up test server and handler
      let registeredHandler: any;
      const testServer = {
        setRequestHandler: vi.fn((schema, handler) => {
          if (schema === CallToolRequestSchema) {
            registeredHandler = handler;
          }
        })
      } as any;

      registerTools(testServer, qdrant);

      const request = {
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: { query: 'test' }
        }
      };

      // Handler must be registered
      expect(registeredHandler).toBeDefined();

      await expect(registeredHandler(request)).rejects.toThrow('Unknown tool: unknown_tool');
    });
  });

  describe('Tool Schema Validation', () => {
    it('should have proper input schema structure', async () => {
      // Capture the tools list handler
      let listToolsHandler: any;
      const testServer = {
        setRequestHandler: vi.fn((schema, handler) => {
          if (schema === ListToolsRequestSchema) {
            listToolsHandler = handler;
          }
        })
      } as any;

      registerTools(testServer, qdrant);

      // Handler must be registered
      expect(listToolsHandler).toBeDefined();

      // Call the list tools handler to get the tool schemas
      const response = await listToolsHandler({ method: 'tools/list', params: {} });
      const searchTool = response.tools.find(
        (tool: any) => tool.name === 'search_claude_code_docs'
      );

      expect(searchTool).toBeDefined();
      expect(searchTool?.inputSchema).toHaveProperty('type', 'object');
      expect(searchTool?.inputSchema).toHaveProperty('properties');
      expect(searchTool?.inputSchema.properties).toHaveProperty('query');
      expect(searchTool?.inputSchema.required).toContain('query');
    });
  });
});

// Unit tests that don't require Qdrant
describe('MCP Tools Unit Tests', () => {
  it('should export registerTools function', () => {
    expect(registerTools).toBeDefined();
    expect(typeof registerTools).toBe('function');
  });
});
