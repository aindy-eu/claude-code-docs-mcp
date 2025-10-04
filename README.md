# Claude Code Documentation MCP Server

MCP server that uses Claude to read and understand documentation for intelligent semantic search.

## ✨ Why This Matters

**Traditional scrapers parse HTML mechanically. This uses Claude to read documentation like a human** - understanding context, relationships, and implicit knowledge. The result: dramatically better semantic search across any documentation source.

## 🚀 Quick Start

### Prerequisites

1. **Docker** - For running Qdrant (vector database)
2. **Node.js 18+** - For running the MCP server
3. **Embedding Provider** (choose one):
   - **Ollama** (default, free, local) - Recommended for privacy and cost
   - **OpenAI API** - Better quality embeddings but requires API key and costs money
4. **Claude Code** - For reading documentation

### Setup (5 minutes)

```bash
# 1. Start Qdrant vector database
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# 2. Install Ollama (default, free) OR configure OpenAI
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull nomic-embed-text
# OR: Add OPENAI_API_KEY to .env file

# 3. Install and initialize
npm install
cp .env.example .env
npm run setup

# 4. Seed with core documentation (5 pages, ~2 min)
npm run seed

# 5. Test it works
npm run search "how do hooks work"
```

**That's it!** You now have a searchable knowledge base of Claude Code documentation.

## 🤖 Connect to Claude Desktop

Enable Claude to search your documentation via MCP:

```bash
# Build the server
npm run build

# Start the MCP server
npm start
```

Then configure Claude Desktop to use the server (see [MCP Server Guide](./docs/mcp-server.md) for details).

Claude can now use the `search_claude_code_docs` tool to search your ingested documentation.

## 📖 Documentation

**[→ Complete Documentation](./docs/README.md)**

Quick links:
- [CLI Commands](./docs/how-to-use-the-cli.md) - All available commands
- [Architecture](./docs/architecture.md) - How the system works
- [MCP Setup](./docs/mcp-server.md) - Claude Desktop integration
- [Testing](./docs/testing.md) - Run tests and contribute

## 🛠️ Essential Commands

```bash
# Ingestion
npm run seed              # Bootstrap with core docs
npm run seed:all          # Ingest all configured pages
npm run sync              # Update stale docs (>7 days)
npm run cli:ingest <url>  # Ingest any single URL

# Search
npm run search "query"                    # Search knowledge base
npm run search "query" -- --provider both # Search with both providers

# Management
npm run sources           # List all ingested sources
npm run cli:status <url>  # Check document status
npm run cli:list          # List all documents

# Development
npm run build             # Build MCP server
npm test                  # Run tests
npm start                 # Start MCP server
```

See [CLI Guide](./docs/how-to-use-the-cli.md) for all commands and options.

## 🤝 Contributing

Contributions welcome! See [Testing Guide](./docs/testing.md) for running tests and [Architecture](./docs/architecture.md) for system design.

## 📄 License

MIT

---

**Built with Claude Code, TypeScript, and Qdrant** · Pioneering AI-driven documentation understanding
