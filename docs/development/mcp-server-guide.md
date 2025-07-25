# MCP Server Development Guide

A comprehensive guide to building production-ready Model Context Protocol (MCP) servers with TypeScript, covering architecture, best practices, and real-world patterns.

## 🎯 Overview

This guide captures proven patterns for building scalable, maintainable MCP servers based on production experience with Claude Code documentation systems.

## 🏗️ Project Structure

### Recommended Architecture

```
mcp-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── tools/                # Tool implementations
│   │   ├── index.ts          # Tool registry and exports
│   │   └── [feature].ts      # Individual tool modules
│   ├── resources/            # Resource handlers (optional)
│   │   ├── index.ts          # Resource registry
│   │   └── [resource].ts     # Resource implementations
│   ├── services/             # External service integrations
│   │   ├── [service].ts      # API clients, databases, etc.
│   │   └── auth.ts           # Authentication services
│   ├── types/                # TypeScript definitions
│   │   ├── index.ts          # Common types
│   │   └── [domain].ts       # Domain-specific types
│   └── utils/                # Helper functions
│       ├── validation.ts     # Input validation
│       └── formatting.ts     # Response formatting
├── tests/                    # Test files
├── build/                    # Compiled output
├── .claude/                  # Claude Code settings
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── jest.config.js            # Test configuration
```

### Key Principles

1. **Modular Architecture**: Separate concerns into logical modules
2. **Type Safety**: Comprehensive TypeScript definitions
3. **Error Handling**: Graceful degradation and meaningful errors
4. **Testing**: Unit, integration, and E2E test coverage
5. **Documentation**: Self-documenting code and comprehensive docs

## 📦 Package Configuration

### package.json Template

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "MCP server for [purpose]",
  "main": "build/index.js",
  "type": "module",
  "bin": {
    "my-mcp-server": "./build/index.js"
  },
  "scripts": {
    "start": "tsx src/index.ts",
    "build": "tsc && chmod 755 build/index.js",
    "prepare": "npm run build",
    "watch": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "debug": "npx @modelcontextprotocol/inspector node build/index.js"
  },
  "files": ["build"],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^22.9.0",
    "tsx": "^4.19.2",
    "jest": "^30.0.5",
    "ts-jest": "^29.4.0",
    "@modelcontextprotocol/inspector": "latest"
  }
}
```

### TypeScript Configuration

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
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "declaration": false,
    "sourceMap": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "tests"]
}
```

## 🚀 Server Implementation

### Main Entry Point (src/index.ts)

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { registerTools } from './tools/index.js';

config();

// Create server instance
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

// Register capabilities
registerTools(server);

// Server lifecycle management
process.on('SIGINT', async () => {
  console.log('\\n🛑 Shutting down MCP server...');
  await server.close();
  process.exit(0);
});

// Start server
async function startServer() {
  console.log('🚀 Starting MCP Server...');
  console.log('\\n✅ Server ready for connections\\n');

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

startServer().catch(console.error);
```

### Tool Registration Pattern

```typescript
// src/tools/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { searchTool } from './search.js';
import { analysisTool } from './analysis.js';

export function registerTools(server: Server) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      searchTool.definition,
      analysisTool.definition
    ]
  }));

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'search':
        return await searchTool.handler(args);
      case 'analysis':
        return await analysisTool.handler(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
```

### Individual Tool Pattern

```typescript
// src/tools/search.ts
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(20).default(5)
});

export const searchTool = {
  definition: {
    name: 'search',
    description: 'Search for relevant information',
    inputSchema: {
      type: 'object',
      properties: {
        query: { 
          type: 'string', 
          description: 'Search query' 
        },
        limit: {
          type: 'number',
          description: 'Number of results (1-20)',
          minimum: 1,
          maximum: 20,
          default: 5
        }
      },
      required: ['query']
    }
  },

  async handler(args: unknown) {
    const { query, limit } = searchSchema.parse(args);
    
    try {
      // Implement search logic
      const results = await performSearch(query, limit);
      
      return {
        content: [{
          type: 'text',
          text: formatResults(results)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Search error: ${error.message}`
        }]
      };
    }
  }
};

async function performSearch(query: string, limit: number) {
  // Search implementation
}

function formatResults(results: any[]) {
  // Result formatting
}
```

## 🛡️ Error Handling Patterns

### Graceful Error Handling

```typescript
export async function safeToolHandler<T>(
  handler: () => Promise<T>,
  fallbackMessage: string
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const result = await handler();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    console.error('Tool execution error:', error);
    
    return {
      content: [{
        type: 'text',
        text: `${fallbackMessage}\\n\\nError: ${error.message}`
      }]
    };
  }
}
```

### Input Validation

```typescript
import { z } from 'zod';

function validateToolInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new Error(`Invalid input: ${issues}`);
    }
    throw error;
  }
}
```

## 🔧 Development Workflow

### Environment Setup

```bash
# Install dependencies
npm install

# Development with hot reload
npm run watch & npm start

# Build for production
npm run build

# Debug with Inspector
npm run debug
```

### Debugging Tips

1. **Use MCP Inspector**: `npm run debug` for interactive debugging
2. **Console Logging**: Strategic logging for request/response flow
3. **Error Boundaries**: Wrap tools in try-catch blocks
4. **Type Checking**: Enable strict TypeScript checking
5. **Test Coverage**: Maintain high test coverage for reliability

## 📊 Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load services only when needed
2. **Caching**: Cache expensive operations
3. **Connection Pooling**: Reuse database connections
4. **Async Operations**: Use promises for I/O operations
5. **Memory Management**: Clean up resources properly

### Example Caching Pattern

```typescript
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  clear() {
    this.cache.clear();
  }
}
```

## 🧪 Testing Strategy

### Test Structure

```
tests/
├── unit/           # Unit tests for individual modules
├── integration/    # Integration tests with external services  
├── fixtures/       # Test data and mocks
└── setup.ts        # Test environment configuration
```

### Example Unit Test

```typescript
import { searchTool } from '../../src/tools/search.js';

describe('Search Tool', () => {
  it('should handle valid search queries', async () => {
    const result = await searchTool.handler({
      query: 'test query',
      limit: 3
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('results');
  });

  it('should handle invalid input gracefully', async () => {
    const result = await searchTool.handler({
      query: '', // Invalid empty query
    });

    expect(result.content[0].text).toContain('error');
  });
});
```

## 🚀 Deployment

### Docker Configuration

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY build/ ./build/

EXPOSE 3000

CMD ["node", "build/index.js"]
```

### Environment Variables

```bash
# .env.example
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://...
API_KEY=your-api-key
CACHE_TTL=300
```

## 📚 Additional Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Testing Guide](../testing/guide.md)
- [Deployment Guide](../deployment/guide.md)

---

## 🎯 Key Takeaways

1. **Structure Matters**: Follow modular architecture patterns
2. **Type Safety**: Use TypeScript for reliability
3. **Error Handling**: Plan for failure scenarios
4. **Testing**: Comprehensive test coverage saves time
5. **Documentation**: Document patterns and decisions
6. **Performance**: Consider optimization early
7. **Security**: Validate inputs and handle credentials safely

*This guide represents battle-tested patterns from production MCP server development.*