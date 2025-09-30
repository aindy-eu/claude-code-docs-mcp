# Claude Code Documentation MCP Server

MCP server that uses Claude to read and understand documentation for intelligent semantic search.

## ✨ Key Innovation

Instead of parsing HTML, Claude reads documentation naturally - understanding context, relationships, and implicit knowledge. This creates dramatically better search results.

## 🚀 Quick Start

### Prerequisites

1. **Docker** - For running Qdrant (vector database)
2. **Node.js 18+** - For running the MCP server
3. **Embedding Provider** (choose one):
   - **Ollama** (default, free, local) - Recommended for privacy and cost
   - **OpenAI API** - Better quality embeddings but requires API key and costs money
4. **Claude Code** - For reading documentation

### Setup (5 minutes)

1. **Start services:**

```bash
# Start Qdrant vector database
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# For Ollama users (default):
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull nomic-embed-text

# For OpenAI users (skip if using Ollama):
# Add your API key to .env file: OPENAI_API_KEY=sk-...
```

2. **Install and configure:**

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Initialize the vector database
npm run setup
```

3. **Ingest documentation:**

```bash
# Make scripts executable
chmod +x tools/ingest tools/batch-ingest

# Ingest all 10 Claude Code documentation pages
./tools/batch-ingest
```

The batch script ingests these Claude Code documentation pages:
- **Overview** - Introduction to Claude Code
- **Quickstart** - Getting started guide
- **Slash Commands** - Custom command creation
- **Hooks** - Event-driven automation
- **Settings** - Configuration options
- **MCP** - Model Context Protocol integration
- **Memory** - Context management system
- **Common Workflows** - Typical usage patterns
- **Interactive Mode** - Chat-based coding
- **CLI Reference** - Command line options

It will save outputs to `claude-outputs/` and generate embeddings for search.

4. **Test search:**

```bash
npm run search "how do hooks work"
```

## 🤖 Using with Claude Code

Once your knowledge base is populated, use it with Claude Code via MCP:

```bash
# Build the MCP server
npm run build

# Add the server to Claude Code
claude mcp add claude-docs node $(pwd)/build/index.js

# Use Claude normally - it now has access to the docs
claude "search for slash commands with parameters"
```

The MCP server provides a `search_claude_code_docs` tool that Claude can use to search your ingested documentation.

## 📖 Documentation

- [Overview](docs/README.md) - Documentation for this project
- [How Ingestion Works](docs/ingestion/README.md) - Claude-driven documentation processing
- [Qdrant](docs/qdrant/README.md) - What is Qdrant – how to setup and operate
- [RAG Architecture](docs/rag/README.md) - The RAG System design and Architecture
- [Setup Guide](docs/mcp-server-guide.md) - Detailed MCP configuration
- [Testing](docs/testing.md) - How to test the RAG System


## 🚀 Performance & Caching

The ingestion pipeline uses intelligent caching to make re-processing 10x faster:

- **HTML Cache**: Stores fetched content with TTL-based expiration (7 days default)
- **Content Normalization**: Ignores timestamps and tracking scripts when detecting changes
- **Structure Detection**: Identifies meaningful DOM changes vs cosmetic updates

Cache is automatically used - no configuration needed. First run takes ~2 minutes per page, subsequent runs take <5 seconds.

## 🛠️ Commands

### Ingestion

- `./tools/batch-ingest` - Ingest all 10 configured Claude Code docs
- `./tools/ingest <url>` - Ingest any single documentation page
- `./tools/batch-ingest --force` - Re-ingest everything (ignore cache)

### Search & Management

- `npm run search "query"` - Search your knowledge base
- `npm run search "query" -- --provider openai` - Search using OpenAI embeddings
- `npm run ingestion-status` - Check what's been ingested
- `npm run process-claude <file.json>` - Process existing Claude output

### Development

- `npm run build` - Build the MCP server (✅ working)
- `npm test` - Run tests (⚠️ some tests need fixing - contributions welcome!)
- `npm run test:unit` - Run unit tests only
- `npm run debug` - Debug with MCP inspector

## 🔧 Configuration

See `.env.example` for all configuration options. Key settings:

```bash
DEFAULT_EMBEDDING_PROVIDER=ollama  # or openai
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

## 📁 Project Structure

```
├── tools/                # Ingestion scripts
│   ├── ingest           # Single page ingestion
│   └── batch-ingest     # Batch ingestion (all pages)
├── .cache/              # Pipeline cache (git-ignored)
│   ├── html/            # Cached HTML content
│   └── json/            # Cached extractions
├── .claude/             # Planning and architecture
│   ├── plans/           # Roadmaps and vision docs
│   └── archive/         # Historical planning docs
├── docs/
│   └── ingestion/       # Documentation for the ingestion system
│       ├── README.md    # How it works
│       ├── prompts/     # Prompt templates
│       └── *.md         # Guides and troubleshooting
├── src/
│   ├── config/          # URL configuration
│   ├── services/        # Core services (including HTMLCache)
│   ├── scripts/         # CLI tools
│   └── index.ts         # MCP server entry point
└── claude-outputs/      # Ingestion outputs (git-ignored)
```

## 🤝 Contributing

We welcome contributions! Please ensure:

- Tests pass (`npm test`)
- Code follows existing patterns
- Documentation is updated if needed

## 📄 License

MIT

---

_Built with Claude Code, TypeScript, and Qdrant. Pioneering the use of AI for intelligent documentation understanding._
