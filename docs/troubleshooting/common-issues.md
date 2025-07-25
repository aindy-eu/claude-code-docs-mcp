# Common Issues & Solutions

Comprehensive troubleshooting guide for MCP server development, Claude Code integration, and production deployment.

## 🚨 MCP Server Issues

### Server Won't Start

**Error: Cannot find module**
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```

**Solutions:**
```bash
# Install dependencies
npm install

# Check package.json type
npm pkg get type  # Should return "module"

# Verify TypeScript compilation
npm run build
```

**Error: Permission denied**
```
bash: ./build/index.js: Permission denied
```

**Solutions:**
```bash
# Add execute permission
chmod +x build/index.js

# Or use node directly
node build/index.js

# Check shebang line
head -1 build/index.js  # Should be #!/usr/bin/env node
```

**Error: Unexpected token 'export'**
```
SyntaxError: Unexpected token 'export'
```

**Solutions:**
```bash
# Set module type in package.json
npm pkg set type="module"

# Update tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16"
  }
}
EOF
```

### Tool Registration Issues

**Error: Tool not found**
```
Error: Unknown tool: my_tool
```

**Debug Steps:**
1. Check tool name matches exactly
2. Verify tool is in ListToolsRequestSchema response
3. Add to CallToolRequestSchema handler

**Example Fix:**
```typescript
// In ListToolsRequestSchema handler
tools: [{
  name: 'my_tool',  // Exact name match required
  description: '...'
}]

// In CallToolRequestSchema handler
if (request.params.name === 'my_tool') {  // Same exact name
  // Handle tool
}
```

**Error: Invalid input schema**
```
Tool validation failed: Invalid input
```

**Solutions:**
```typescript
// Use proper JSON Schema format
inputSchema: {
  type: 'object',
  properties: {
    query: { 
      type: 'string', 
      description: 'Required description' 
    }
  },
  required: ['query']  // Specify required fields
}

// Validate input in handler
import { z } from 'zod';

const schema = z.object({
  query: z.string().min(1)
});

const { query } = schema.parse(request.params.arguments);
```

## 🔧 Claude Code Integration Issues

### Connection Problems

**Error: MCP server connection failed**
```
Failed to connect to MCP server: Connection refused
```

**Debug Steps:**
```bash
# Test server manually
node build/index.js
# Server should start and wait for input

# Check file permissions
ls -la build/index.js

# Test with absolute path
claude --mcp-server /full/path/to/build/index.js "test"

# Check Claude Code logs
claude logs
```

**Error: Permission denied for command**
```
Command 'npm start' requires permission
```

**Solutions:**
```json
// Add to .claude/settings.local.json
{
  "permissions": {
    "allow": [
      "Bash(npm start:*)",
      "Bash(npm run:*)",
      "Bash(node:*)",
      "Bash(tsx:*)"
    ]
  }
}
```

### Settings Issues

**Error: Settings file not loaded**
```
Warning: No Claude Code settings found
```

**Solutions:**
```bash
# Create settings directory
mkdir -p .claude

# Create basic settings
cat > .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": ["Bash(npm:*)"]
  }
}
EOF

# Check settings validation
claude settings validate
```

**Error: Invalid JSON in settings**
```
Error parsing settings.json: Unexpected token
```

**Solutions:**
```bash
# Validate JSON syntax
cat .claude/settings.local.json | jq .

# Fix common issues
# - Remove trailing commas
# - Use double quotes for strings
# - Check bracket matching
```

## 🗄️ Database Issues

### Qdrant Connection

**Error: Qdrant connection refused**
```
Error: connect ECONNREFUSED 127.0.0.1:6333
```

**Debug Steps:**
```bash
# Check if Qdrant is running
curl http://localhost:6333/health

# Start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Check Docker containers
docker ps | grep qdrant

# Check port conflicts
netstat -an | grep 6333
```

**Error: Collection already exists**
```
Error: Collection 'my-collection' already exists
```

**Solutions:**
```typescript
// Handle existing collections gracefully
try {
  await qdrant.createCollection(name, config);
} catch (error) {
  if (error.message?.includes('already exists')) {
    console.log(`Collection ${name} already exists, skipping creation`);
  } else {
    throw error;
  }
}
```

### Vector Operations

**Error: Vector dimension mismatch**
```
Error: Vector dimension mismatch: expected 384, got 1536
```

**Solutions:**
```typescript
// Check embedding dimensions
const EMBEDDING_CONFIGS = {
  ollama: { dimensions: 384 },
  openai: { dimensions: 1536 }
};

// Create provider-specific collections
const collectionName = `docs-${provider}`;
const config = EMBEDDING_CONFIGS[provider];

await qdrant.createCollection(collectionName, {
  vectors: { size: config.dimensions }
});
```

**Error: Empty embeddings returned**
```
Error: No embeddings returned from provider
```

**Debug Steps:**
```typescript
// Add validation
if (!embedding || embedding.length === 0) {
  throw new Error(`No embeddings returned from ${provider}`);
}

if (embedding.length !== expectedDimensions) {
  throw new Error(`Dimension mismatch: got ${embedding.length}, expected ${expectedDimensions}`);
}
```

## 🧠 Embedding Service Issues

### Ollama Problems

**Error: Ollama connection failed**
```
Error: fetch failed (connection refused)
```

**Debug Steps:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Check model availability
ollama list
ollama pull nomic-embed-text
```

**Error: Model not found**
```
Error: model 'nomic-embed-text' not found
```

**Solutions:**
```bash
# Pull the model
ollama pull nomic-embed-text

# List available models
ollama list

# Use available model
ollama pull all-minilm  # Alternative embedding model
```

### OpenAI Issues

**Error: API key not found**
```
Error: The OPENAI_API_KEY environment variable is missing
```

**Solutions:**
```bash
# Set environment variable
export OPENAI_API_KEY=your-api-key

# Or create .env file
echo "OPENAI_API_KEY=your-api-key" > .env

# Load in application
import { config } from 'dotenv';
config();
```

**Error: Rate limit exceeded**
```
Error: Rate limit reached for requests
```

**Solutions:**
```typescript
// Add retry logic with exponential backoff
async function generateEmbeddingWithRetry(text: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateEmbedding(text);
    } catch (error) {
      if (error.message.includes('rate limit') && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

## 🧪 Testing Issues

### Jest Configuration

**Error: Cannot use import statement outside module**
```
SyntaxError: Cannot use import statement outside a module
```

**Solutions:**
```javascript
// Update jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }]
  },
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.(js|ts)$': '$1'
  }
};
```

**Error: Module not found in tests**
```
Cannot find module '../../src/services/api.js'
```

**Solutions:**
```typescript
// Use .js extensions in imports (for compiled output)
import { searchTool } from '../../src/tools/search.js';

// Or configure module name mapping in jest.config.js
moduleNameMapping: {
  '^(\\.{1,2}/.*)\\.(js|ts)$': '$1'
}
```

### Mock Issues

**Error: Cannot mock ES modules**
```
Error: Cannot mock module that doesn't exist
```

**Solutions:**
```typescript
// Use jest.unstable_mockModule for ES modules
beforeEach(async () => {
  await jest.unstable_mockModule('../../src/services/api.js', () => ({
    generateEmbedding: jest.fn()
  }));
});

// Or use manual mocks
// __mocks__/../../src/services/api.js
export const generateEmbedding = jest.fn();
```

## 🚀 Deployment Issues

### Docker Problems

**Error: Docker build fails**
```
Error: Cannot find module in Docker container
```

**Solutions:**
```dockerfile
# Ensure proper build context
FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
RUN npm ci --only=production

# Build TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Set execute permissions
RUN chmod +x build/index.js

CMD ["node", "build/index.js"]
```

**Error: Port binding fails**
```
Error: Port 6333 is already in use
```

**Solutions:**
```bash
# Check what's using the port
lsof -i :6333

# Use different port
docker run -p 6334:6333 qdrant/qdrant

# Update connection config
export QDRANT_PORT=6334
```

### Environment Issues

**Error: Environment variables not loaded**
```
Error: undefined environment variable
```

**Solutions:**
```typescript
// Add environment validation
const requiredEnvVars = ['QDRANT_HOST', 'QDRANT_PORT'];
const missing = requiredEnvVars.filter(name => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

// Provide defaults
const config = {
  qdrantHost: process.env.QDRANT_HOST || 'localhost',
  qdrantPort: parseInt(process.env.QDRANT_PORT || '6333')
};
```

## 🔍 Performance Issues

### Memory Problems

**Error: Out of memory**
```
Error: JavaScript heap out of memory
```

**Solutions:**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 build/index.js

# Or set environment variable
export NODE_OPTIONS="--max-old-space-size=4096"

# Check memory usage
node --inspect build/index.js
# Connect Chrome DevTools for profiling
```

**Memory Optimization:**
```typescript
// Batch processing for large datasets
async function processBatches<T>(
  items: T[], 
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}
```

### Slow Queries

**Issue: Vector search takes too long**

**Solutions:**
```typescript
// Optimize Qdrant configuration
await qdrant.updateCollection(collectionName, {
  hnsw_config: {
    m: 16,                    // Reduce for faster search
    ef_construct: 100,        // Reduce for faster indexing
    full_scan_threshold: 1000 // Use exact search for small collections
  }
});

// Add query timeout
const searchResults = await Promise.race([
  qdrant.query(collectionName, params),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Query timeout')), 10000)
  )
]);
```

## 🛠️ Debug Tools

### Logging Setup

```typescript
// Enhanced logging
class Logger {
  private level: string;

  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
  }

  debug(message: string, data?: any) {
    if (this.level === 'debug') {
      console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  info(message: string, data?: any) {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  error(message: string, error?: Error) {
    console.error(`[ERROR] ${message}`, error?.stack || error?.message || '');
  }
}

export const logger = new Logger();
```

### Health Check Endpoint

```typescript
// Add health check for debugging
async function healthCheck() {
  const checks = {
    server: true,
    qdrant: false,
    ollama: false,
    openai: false
  };

  try {
    await qdrant.getCollections();
    checks.qdrant = true;
  } catch (error) {
    logger.error('Qdrant health check failed', error);
  }

  // Add other service checks...

  return checks;
}
```

---

## 📚 Additional Resources

- [MCP Server Development Guide](../development/mcp-server-guide.md)
- [Claude Code Setup](../claude-code/setup.md)
- [Testing Guide](../testing/guide.md)
- [Deployment Guide](../deployment/guide.md)

**Still having issues?** Check the specific documentation section for your problem area, or create an issue with:
1. Error message (full stack trace)
2. Environment details (Node.js version, OS)
3. Configuration files
4. Steps to reproduce

*This troubleshooting guide is based on real-world deployment experience and community feedback.*