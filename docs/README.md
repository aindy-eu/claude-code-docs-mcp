# Claude Code Documentation MCP Server

MCP server that enables Claude to search documentation it has read and understood.

## Quick Start

```bash
# 1. Install Qdrant
docker run -p 6333:6333 qdrant/qdrant

# 2. Setup project
npm install
npm run setup

# 3. Add to Claude
claude mcp add claude-docs node $(pwd)/build/index.js

# 4. Search
claude "search the docs for error handling"
```

## How It Works

1. **Claude reads** documentation pages naturally (not HTML parsing)
2. **Extracts** content, code examples, concepts, relationships
3. **Stores** as vector embeddings in Qdrant
4. **Searches** semantically - finds meaning, not just keywords

That's it. No complex architecture. Just AI understanding + vector search.

## Documentation

- [**Ingestion**](./ingestion/README.md) - How Claude reads and processes docs
- [**Search**](./rag/README.md) - How semantic search works with metadata
- [**Storage**](./qdrant/README.md) - Qdrant vector database 
- [**Setup Guide**](./mcp-server-guide.md) - Detailed MCP configuration
- [**Testing**](./testing.md) - Running the test suite

## Development

```bash
# Ingest Claude Code docs
./tools/batch-ingest

# Process existing Claude output
npm run process-claude file.json

# Search from CLI
npm run search "your query"

# Check ingestion status
npm run ingestion-status

# Run tests
npm test
```

## Project Structure

```
src/
  config/         # URL configuration
  scripts/        # Processing scripts
  services/       # Core services (embeddings, ingestion)
  tools/          # MCP tool definitions
docs/
  ingestion/      # Ingestion documentation
  rag/            # Search architecture
  qdrant/         # Vector storage
tools/            # Shell scripts for operations
tests/            # Test suite
```

## Key Features

- **Natural Understanding**: Claude reads docs like a human would
- **Rich Metadata**: Extracts concepts, relationships, best practices
- **Flexible Storage**: Supports Ollama (local) or OpenAI embeddings
- **Smart Caching**: 7-day TTL prevents redundant API calls

---

For the main project overview, see [../README.md](../README.md)