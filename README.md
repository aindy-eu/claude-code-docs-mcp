# Claude Code Documentation MCP Server

A Model Context Protocol (MCP) server that provides RAG (Retrieval-Augmented Generation) capabilities for Claude Code documentation. This solves the knowledge gap where Claude Code was released after Claude's knowledge cutoff date.

## Features

- 🔍 **Semantic Search** - Find Claude Code documentation using natural language queries
- 🧠 **Hybrid Embeddings** - Support for both Ollama (local) and OpenAI embeddings
- 📚 **Comprehensive Coverage** - Indexes all major Claude Code documentation sections
- 🚀 **Fast Local Search** - Uses Qdrant vector database for efficient similarity search
- 🔧 **MCP Integration** - Seamlessly integrates with Claude Code via MCP protocol

## Quick Start

### Prerequisites

1. **Docker** (for Qdrant)
2. **Node.js** 18+
3. **Ollama** (recommended) or OpenAI API key

### Setup

1. **Start Qdrant**:
   ```bash
   docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
   ```

2. **Install Ollama and embedding model**:
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull embedding model
   ollama pull nomic-embed-text
   ```

3. **Setup project**:
   ```bash
   npm install
   cp .env.example .env
   # Edit .env if using OpenAI
   ```

4. **Create collections**:
   ```bash
   npm run setup
   ```

5. **Index documentation**:
   ```bash
   # Index with Ollama (recommended)
   npm run fetch-docs ollama
   
   # Or with both providers
   npm run fetch-docs ollama openai
   ```

6. **Test setup**:
   ```bash
   npm test
   ```

7. **Start MCP server**:
   ```bash
   npm start
   ```

## Usage with Claude Code

Once the MCP server is running, you can use it with Claude Code:

```bash
# Search for specific features
claude "How do I implement custom slash commands?" --mcp-server ./mcp-server.ts

# Ask about configuration
claude "How do I configure hooks in Claude Code?" --mcp-server ./mcp-server.ts

# Query about MCP integration
claude "Show me examples of MCP server configuration" --mcp-server ./mcp-server.ts
```

## Available Tools

### `search_claude_code_docs`

Search Claude Code documentation with semantic similarity.

**Parameters:**
- `query` (required): What to search for
- `provider` (optional): 'ollama', 'openai', or 'both' (default: 'ollama')  
- `limit` (optional): Max results to return (default: 3)

**Example:**
```json
{
  "query": "slash commands implementation",
  "provider": "ollama",
  "limit": 5
}
```

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Claude    │ -> │ MCP Server  │ -> │   Qdrant    │
│    Code     │    │             │    │  Vector DB  │
└─────────────┘    └─────────────┘    └─────────────┘
                           |
                   ┌───────┴───────┐
                   │               │
            ┌──────▼──────┐ ┌──────▼──────┐
            │   Ollama    │ │   OpenAI    │
            │ Embeddings  │ │ Embeddings  │
            └─────────────┘ └─────────────┘
```

## Configuration

Environment variables in `.env`:

```bash
# OpenAI (optional)
OPENAI_API_KEY=sk-your-key-here

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Ollama  
OLLAMA_HOST=localhost
OLLAMA_PORT=11434

# Default provider
DEFAULT_EMBEDDING_PROVIDER=ollama
```

## Scripts

- `npm run setup` - Create Qdrant collections
- `npm run fetch-docs [ollama|openai]` - Index Claude Code docs
- `npm start` - Start MCP server
- `npm test` - Test all components

## Troubleshooting

### Qdrant Connection Issues
```bash
# Make sure Qdrant is running
docker ps | grep qdrant

# Check Qdrant health
curl http://localhost:6333/health
```

### Ollama Issues
```bash
# Check if Ollama is running
ollama list

# Pull embedding model if missing
ollama pull nomic-embed-text
```

### No Search Results
```bash
# Check if docs are indexed
npm test

# Re-index if needed
npm run fetch-docs ollama
```

## Development

The project uses TypeScript with ESM modules. Key files:

- `mcp-server.ts` - Main MCP server implementation
- `hybrid-embeddings.ts` - Embedding generation (Ollama + OpenAI)
- `fetch-docs.ts` - Documentation scraper and indexer
- `setup-collection.ts` - Qdrant collection setup

## License

MIT