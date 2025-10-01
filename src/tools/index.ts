import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { searchDocumentation, formatSearchResults } from './search.js';
import { SearchParams } from '../types/index.js';

export function registerTools(server: Server, qdrant: QdrantClient) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'search_claude_code_docs',
        description:
          'Search the locally ingested Claude Code documentation using semantic search. Use this for detailed information about Claude Code features, slash commands, hooks, MCP integration, settings, and code examples. Prefer this over fetching online docs when available.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'What to search for in Claude Code docs (e.g., "slash commands", "MCP integration", "hooks")'
            },
            provider: {
              type: 'string',
              enum: ['ollama', 'openai', 'both'],
              description: 'Which embedding provider to use for search (default: ollama)',
              default: 'ollama'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 3)',
              default: 3,
              minimum: 1,
              maximum: 10
            }
          },
          required: ['query']
        }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async request => {
    if (request.params.name === 'search_claude_code_docs') {
      const params = request.params.arguments as unknown as SearchParams;
      const { provider = 'ollama' } = params;

      try {
        const results = await searchDocumentation(qdrant, params);

        return {
          content: [
            {
              type: 'text',
              text: formatSearchResults(results)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching Claude Code documentation: ${error.message}\\n\\nMake sure:\\n1. Qdrant is running (docker run -p 6333:6333 qdrant/qdrant)\\n2. Documentation is indexed (npm run cli -- batch)\\n3. The specified provider (${provider}) is available`
            }
          ]
        };
      }
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });
}
