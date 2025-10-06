# MCP Server Guide

This Claude Code Documentation MCP Server implementation.

## What This Server Does

Exposes a single MCP tool: `search_claude_code_docs` that provides semantic search over locally ingested Claude Code documentation using Qdrant vector database.

## Running the Server

### Environment Configuration

Create a `.env` file in the project root (optional):
```bash
QDRANT_HOST=localhost
QDRANT_PORT=6333
DEFAULT_EMBEDDING_PROVIDER=ollama
```

### Start the MCP Server

```bash
npm run start
# or
tsx src/index.ts
```

**Output**:
```
🚀 Starting Claude Code Documentation MCP Server...
📡 Qdrant: localhost:6333
🧠 Default provider: ollama

📖 Available tools:
  - search_claude_code_docs: Search Claude Code documentation

💡 Usage with Claude Code:
  1. Add server: claude mcp add claude-docs node /path/to/build/index.js
  2. Use Claude: claude "How do I implement slash commands?"

✅ Server ready for connections
```

### Debug with MCP Inspector

```bash
npm run debug
```

Opens browser UI for testing MCP tools interactively.

## Integration with Claude Code CLI

### Automatic Registration (Recommended)

After building the project:

```bash
npm run build
claude mcp add claude-docs node $(pwd)/build/index.js
```

This adds the server to local scope (current project only).

### Manual Configuration

Choose the appropriate scope for your use case:

#### Project Scope (Team Sharing)

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "claude-code-docs": {
      "command": "node",
      "args": ["${PROJECT_ROOT}/build/index.js"],
      "env": {
        "QDRANT_HOST": "${QDRANT_HOST:-localhost}",
        "QDRANT_PORT": "${QDRANT_PORT:-6333}",
        "DEFAULT_EMBEDDING_PROVIDER": "${EMBEDDING_PROVIDER:-ollama}"
      }
    }
  }
}
```

**Note**: `${PROJECT_ROOT}` is a Claude Code built-in variable that resolves to the project directory.

**Benefits**:
- ✅ Commit to version control - team members automatically get the server
- ✅ Environment variable expansion with defaults (`${VAR:-default}`)
- ⚠️ Claude Code prompts for approval before using project-scoped servers

#### User Scope (Personal, Cross-Project)

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "claude-code-docs": {
      "command": "node",
      "args": ["/absolute/path/to/claude-code-docs-mcp/build/index.js"],
      "env": {
        "QDRANT_HOST": "localhost",
        "QDRANT_PORT": "6333",
        "DEFAULT_EMBEDDING_PROVIDER": "ollama"
      }
    }
  }
}
```

**Benefits**:
- ✅ Available across all Claude Code projects
- ✅ Private to your machine (not shared)
- ⚠️ Must use absolute paths (no `~` or environment variables)

#### Local Scope (Current Project Only)

Add to `.claude/settings.local.json` (git-ignored):

```json
{
  "mcpServers": {
    "claude-code-docs": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"],
      "env": {
        "QDRANT_HOST": "localhost",
        "QDRANT_PORT": "6333"
      }
    }
  }
}
```

**Benefits**:
- ✅ Private configuration (automatically git-ignored)
- ✅ Project-specific without team sharing
- ⚠️ Only available in current project directory

### Scope Selection Guide

| Scope | When to Use | Configuration File |
|-------|-------------|-------------------|
| **Project** | Team needs shared MCP tools | `.mcp.json` (commit to git) |
| **User** | Personal tool needed across all projects | `~/.claude/settings.json` |
| **Local** | Experimental/personal config in one project | `.claude/settings.local.json` |

**Scope Precedence**: Local → Project → User (local overrides others)

### Verification

After configuration:

```bash
# List configured servers
claude mcp list

# Verify server appears
claude mcp get claude-docs

# Test the server
claude "Use mcp docs slash commands"
```

## Integration with Claude Desktop App

To use this server in **Claude Desktop** (the GUI application, not Claude Code CLI), you need to manually edit Claude Desktop's configuration file.

**Note**: The `claude mcp add` command configures Claude Code CLI only, not Claude Desktop. These are separate applications with different configuration systems.

### Manual Claude Desktop Configuration

Edit Claude Desktop's configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "claude-code-docs": {
      "command": "node",
      "args": ["/absolute/path/to/claude-code-docs-mcp/build/index.js"],
      "env": {
        "QDRANT_HOST": "localhost",
        "QDRANT_PORT": "6333",
        "DEFAULT_EMBEDDING_PROVIDER": "ollama"
      }
    }
  }
}
```

**Important**:
- ✅ Use absolute paths (required)
- ✅ Restart Claude Desktop after configuration changes
- ⚠️ This configures the **Claude Desktop app**, not Claude Code CLI

### Verification (Claude Desktop)

1. Restart Claude Desktop completely
2. Check Settings → Developer → MCP Servers
3. Verify "claude-code-docs" appears in the server list
4. Test: Ask Claude Desktop to "search claude code docs for hooks"

## MCP Tool Reference

### search_claude_code_docs

**Description**: Search locally ingested Claude Code documentation using semantic search.

**Input Schema**:
```typescript
{
  query: string,                            // Required: Search query
  provider?: 'ollama' | 'openai' | 'both',  // Default: 'ollama'
  limit?: number                            // Default: 3, Min: 1, Max: 10
}
```

**Example Queries**:
- `"How do I implement slash commands?"`
- `"MCP integration guide"`
- `"What are hooks in Claude Code?"`

**Response Format**:
```markdown
## Claude Code Documentation Search Results

### 1. Slash Commands
**Section:** Command System
**Source:** [https://docs.claude.com/...]
**Relevance Score:** 85.2%
**Provider:** ollama

Content here...

**Code Examples:**
```typescript
// Example code
```



**Error Response**:
```
Error searching Claude Code documentation: [message]

Make sure:
1. Qdrant is running (docker run -p 6333:6333 qdrant/qdrant)
2. Documentation is indexed (npm run seed or npm run cli:ingest <url>)
3. The specified provider (ollama) is available
```

## Implementation Details

### Server Setup (src/index.ts)

**Entry Point**:
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from 'dotenv';
import { registerTools } from './mcp-tools/index.js';

config(); // Load environment variables from .env file

// Create server
const server = new Server(
  {
    name: 'claude-code-docs',
    version: pkg.version
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Initialize Qdrant
const qdrant = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: parseInt(process.env.QDRANT_PORT || '6333')
});

// Register tools with Qdrant client
registerTools(server, qdrant);

// Start server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Key Points**:
- Uses `StdioServerTransport` for communication
- Qdrant client injected into tool registration
- Graceful shutdown on SIGINT


## Testing the Server

### 1. MCP Inspector (Recommended)

```bash
npm run debug
```

**Test Queries**:
- `{ "query": "slash commands" }`
- `{ "query": "MCP integration", "limit": 5 }`
- `{ "query": "hooks", "provider": "both" }`

### 2. Integration Test

```bash
npm run integration-test
```

Runs full search flow with real Qdrant connection.

### 3. Unit Tests

```bash
npm run test:unit
```

Tests tool registration and search logic with mocks.

## Architecture

**Data Flow**:
```
Claude Desktop
    ↓ (stdio)
MCP Server (src/index.ts)
    ↓
Tool Handler (src/mcp-tools/index.ts)
    ↓
Search Service (src/mcp-tools/search/search.ts)
    ↓ (vector similarity)
Qdrant Client
    ↓
Vector Database (localhost:6333)
```

**Key Components**:
1. **Server**: Stdio transport, tool registration
2. **Tools**: Single tool `search_claude_code_docs`
3. **Search**: Vector similarity search with Qdrant
4. **Embeddings**: Ollama (local) or OpenAI (cloud)

## Performance

**Search Performance**:
- Query embedding: ~50-200ms (Ollama), ~100-500ms (OpenAI)
- Vector search: ~10-50ms (1K docs), ~50-200ms (10K docs)
- Total: ~100-300ms per search

**Optimization**:
- Qdrant uses HNSW index (O(log n) search)
- Cosine distance for similarity
- Score threshold 0.75 ensures high-quality results (configured in `src/config/constants.ts`)

## Security

**Best Practices Implemented**:
1. ✅ No hardcoded API keys (environment variables)
2. ✅ Type-safe error handling
3. ✅ Input validation via JSON schema
4. ✅ No code injection (no `eval()` or `exec()`)
5. ✅ Graceful error responses (no sensitive info leakage)

## Deployment

### Local Development
- Use `npm run start` or `npm run debug`
- Qdrant and Ollama on localhost

### Production Considerations
- Set `QDRANT_URL` to remote Qdrant instance
- Use OpenAI for higher quality embeddings
- Monitor Qdrant memory usage
- Regular documentation sync (`npm run sync`)

## Troubleshooting

**Server won't start**:
1. Check Qdrant is running: `curl http://localhost:6333`
2. Verify build succeeded: `ls build/index.js`
3. Check environment variables: `echo $QDRANT_HOST`

**No search results**:
1. Check collection exists: `curl http://localhost:6333/collections`
2. Verify documents ingested: `npm run cli:list`
3. Check provider matches ingestion: `ollama` vs `openai`

**Claude Desktop integration issues**:
1. Verify absolute path in config
2. Check server is executable: `chmod +x build/index.js`
3. Test server manually: `node build/index.js`
4. View logs: Claude Desktop → Settings → Developer

## Related Documentation

- [Architecture Overview](./architecture.md) - System design and service layer
- [Pipeline Stages](./pipeline.md) - Ingestion process

## Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
