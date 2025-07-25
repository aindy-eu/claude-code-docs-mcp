# 5-Minute MCP Server Setup

Get a production-ready MCP server running in 5 minutes with Claude Code integration.

## 🚀 Prerequisites

- Node.js 18+ installed
- Docker installed (for Qdrant)
- Claude Code installed

## ⚡ Quick Setup

### 1. Create Project (30 seconds)

```bash
mkdir my-mcp-server && cd my-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk @qdrant/js-client-rest dotenv
npm install -D typescript @types/node tsx
```

### 2. Configure TypeScript (30 seconds)

```bash
# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"]
}
EOF

# Update package.json
npm pkg set type="module"
npm pkg set main="build/index.js"
npm pkg set scripts.start="tsx src/index.ts"
npm pkg set scripts.build="tsc"
```

### 3. Create MCP Server (2 minutes)

```bash
mkdir src && cat > src/index.ts << 'EOF'
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'my-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Register a simple echo tool
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'echo',
    description: 'Echo back the input text',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to echo' }
      },
      required: ['text']
    }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'echo') {
    const { text } = request.params.arguments as { text: string };
    return {
      content: [{
        type: 'text',
        text: `Echo: ${text}`
      }]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  console.log('🚀 MCP Server starting...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
EOF
```

### 4. Claude Code Integration (1 minute)

```bash
# Create Claude Code settings
mkdir .claude && cat > .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(npm start:*)", 
      "Bash(tsx:*)",
      "Bash(node:*)"
    ]
  }
}
EOF

# Add to .gitignore
cat > .gitignore << 'EOF'
node_modules/
build/
.env
.claude/settings.local.json
.claude/memory/
.claude/cache/
EOF
```

### 5. Test & Run (1 minute)

```bash
# Test the server
npm start &
SERVER_PID=$!

# Kill test server
kill $SERVER_PID

# Build for production
npm run build && chmod +x build/index.js

echo "✅ MCP Server ready!"
echo "🔗 Connect with: claude --mcp-server ./build/index.js"
```

## 🎯 Test with Claude Code

```bash
# Test the echo tool
claude --mcp-server ./build/index.js "Use the echo tool to say hello"
```

Expected output:
```
Using tool: echo
Arguments: {"text": "hello"}
Result: Echo: hello
```

## 🔧 Add Vector Search (Bonus - 2 minutes)

If you have Qdrant running:

```bash
# Start Qdrant
docker run -d -p 6333:6333 --name qdrant qdrant/qdrant

# Add search functionality
cat >> src/index.ts << 'EOF'

import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({
  host: 'localhost',
  port: 6333
});

// Add search tool to the tools list
const searchTool = {
  name: 'search',
  description: 'Search for information',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' }
    },
    required: ['query']
  }
};

// Add to CallToolRequestSchema handler
if (request.params.name === 'search') {
  const { query } = request.params.arguments as { query: string };
  
  try {
    // Simple search implementation
    const collections = await qdrant.getCollections();
    return {
      content: [{
        type: 'text',
        text: `Search for "${query}" found ${collections.collections.length} collections`
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
EOF

# Rebuild
npm run build
```

## 📚 Next Steps

Now you have a working MCP server! Here's what to explore next:

### Immediate (5-10 minutes)
- [Add more tools](../development/mcp-server-guide.md#tool-registration-pattern)
- [Configure Claude Code permissions](../claude-code/setup.md)
- [Add environment variables](../deployment/guide.md#environment-variables)

### Short term (30 minutes)
- [Set up Qdrant vector database](../qdrant/setup.md)
- [Add embedding services](../embeddings/providers.md)
- [Implement proper error handling](../development/mcp-server-guide.md#error-handling-patterns)

### Medium term (1-2 hours)
- [Add comprehensive testing](../testing/guide.md)
- [Set up CI/CD](../testing/ci-cd.md)
- [Implement caching](../advanced/caching.md)

### Production ready (1 day)
- [Deploy with Docker](../deployment/guide.md)
- [Add monitoring](../deployment/monitoring.md)
- [Security hardening](../deployment/security.md)

## 🐛 Troubleshooting

### Common Issues

**Permission denied:**
```bash
# Add execute permission
chmod +x build/index.js
```

**Module not found:**
```bash
# Check package.json type
npm pkg set type="module"
```

**Claude Code connection fails:**
```bash
# Test server manually
node build/index.js
# Should not exit, waiting for input
```

**Port conflicts:**
```bash
# Check if Qdrant is running
curl http://localhost:6333/health
```

## ✅ Success Checklist

- [ ] MCP server starts without errors
- [ ] Claude Code can connect to server
- [ ] Echo tool works correctly
- [ ] Build process creates executable
- [ ] Git ignores sensitive files
- [ ] Claude Code permissions are configured

**Congratulations! 🎉 You have a working MCP server in 5 minutes.**

---

For production deployment and advanced features, see the [complete development guide](../development/mcp-server-guide.md).