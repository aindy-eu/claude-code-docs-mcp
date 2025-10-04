# Documentation

Navigate the Claude Code Documentation MCP Server documentation.

## 📚 Core Documentation

| Document                                | Purpose                      | Read this if...                               |
| --------------------------------------- | ---------------------------- | --------------------------------------------- |
| [Architecture](./architecture.md)       | System design and components | You want the big picture                      |
| [CLI Guide](./how-to-use-the-cli.md)    | Command reference            | You need to run commands                      |
| [Pipeline](./pipeline.md)               | How ingestion works          | You want to understand fetch→extract→embed    |
| [Manifest System](./manifest-system.md) | State tracking and TTL       | You want to know how we track what's ingested |
| [MCP Server](./mcp-server.md)           | MCP integration              | You want to connect to Claude Desktop         |
| [Testing](./testing.md)                 | Test suite and patterns      | You want to run tests                         |

## 🗺️ Reading Paths

### Path 1: Understanding the System

**Goal**: Comprehend the architecture and design decisions

1. [Architecture Overview](./architecture.md) - Components and flow
2. [Pipeline Stages](./pipeline.md) - How ingestion works + philosophy
3. [Manifest System](./manifest-system.md) - State tracking details

### Path 2: Using the System

**Goal**: Get productive quickly with the CLI

1. [CLI Command Reference](./how-to-use-the-cli.md) - All commands explained
2. [MCP Server Guide](./mcp-server.md) - Connect to Claude Desktop
3. [Pipeline Stages](./pipeline.md#pipeline-commands) - Individual stage commands

### Path 3: Contributing/Developing

**Goal**: Extend or improve the codebase

1. [Architecture Overview](./architecture.md) - System structure
2. [Testing Guide](./testing.md) - Run tests and patterns
3. Specific component docs as needed

## 📖 Additional Resources

### RAG System

- [RAG Overview](./rag/README.md) - How semantic search works
- [Enhanced Search](./rag/enhanced-search.md) - Advanced search features

### Qdrant Vector Database

- [Qdrant Setup](./qdrant/setup.md) - Docker installation and config
- [Client Integration](./qdrant/client-integration.md) - TypeScript client usage
- [Embeddings](./qdrant/embeddings.md) - Ollama vs OpenAI providers
- [Performance](./qdrant/performance.md) - Optimization strategies
- [Monitoring](./qdrant/monitoring.md) - Health checks and security

## 🔍 Quick Reference

### Common Commands

```bash
# Ingest documentation
npm run cli:ingest <url>

# Search your knowledge base
npm run search "your query"

# Sync stale documentation (>7 days)
npm run sync

# Check document status
npm run cli:status <url>
```

### Key Concepts

- **Pipeline**: `fetch → extract → embed` (see [Pipeline](./pipeline.md))
- **Manifests**: Two-tier state tracking (see [Manifest System](./manifest-system.md))
- **TTL**: 7-day default freshness window
- **Claude-driven**: AI understanding vs mechanical parsing (see [Pipeline: The Key Insight](./pipeline.md#the-key-insight))

## 📊 Documentation Status

All documentation has been verified against the actual codebase implementation (as of October 2025):

- ✅ **Verified**: Matches actual code
- 🔮 **Example**: Future/potential implementations (marked in docs)

The Qdrant documentation contains both ✅ implemented features and 🔮 example implementations for future reference. Check individual sections for status markers.

---

**Note**: This documentation represents the current state of the project. For historical documentation, see `docs/.legacy/`.
