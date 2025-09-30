# MCP Server Development Guide

Quick guide to building MCP servers with TypeScript.

## Usage with Claude Code

### Register Server
```bash
# Add server to Claude Code
claude mcp add my-server node ./build/index.js

# List servers
claude mcp list

# Test it
claude "test query"
```

### Manual Configuration
Add to `.mcp.json` in your project root:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/my-mcp-server/build/index.js"],
      "env": {}
    }
  }
}
```
Note: Environment variables can be expanded in `command`, `args`, and `env` fields.

## Development Commands

```bash
# Install dependencies
npm install

# Build
npm run build

# Development (auto-rebuild)
npm run watch

# Debug with MCP Inspector
npm run debug
```

## Project Setup

### package.json
```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "main": "build/index.js",
  "type": "module",
  "bin": {
    "my-mcp-server": "./build/index.js"
  },
  "scripts": {
    "start": "tsx src/index.ts",
    "build": "tsc && chmod +x build/index.js",
    "watch": "tsc --watch",
    "test": "jest",
    "debug": "npx @modelcontextprotocol/inspector node build/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^22.9.0",
    "tsx": "^4.19.2"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

## Basic Server Implementation

### src/index.ts
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/index.js';

const server = new Server(
  {
    name: 'my-mcp-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register your tools
registerTools(server);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### src/tools/index.ts
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

export function registerTools(server: Server) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'my_tool',
        description: 'Does something useful',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'What to search for'
            },
            limit: {
              type: 'number',
              description: 'Max results',
              default: 5
            }
          },
          required: ['query']
        }
      }
    ]
  }));

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'my_tool') {
      const { query, limit = 5 } = request.params.arguments as any;

      try {
        // Your tool logic here
        const result = await doSomething(query, limit);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }]
        };
      }
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });
}

async function doSomething(query: string, limit: number) {
  // Implement your tool logic
  return { query, limit, results: [] };
}
```

## Real Example: Search Tool

Here's a complete working tool from this project:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_docs',
      description: 'Search documentation',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          limit: {
            type: 'number',
            description: 'Number of results (1-10)',
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'search_docs') {
    const { query, limit = 3 } = request.params.arguments as any;

    // Connect to your data source
    const results = await searchDatabase(query, limit);

    // Format response
    const formatted = results
      .map(r => `## ${r.title}\n${r.content}`)
      .join('\n\n---\n\n');

    return {
      content: [{
        type: 'text',
        text: formatted || 'No results found'
      }]
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});
```

## Tips

- Keep tools focused - one tool, one job
- Return text, not complex objects
- Handle errors gracefully
- Test with MCP Inspector before using with Claude Code
- Use environment variables for API keys

## Related Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)