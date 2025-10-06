# Claude Code Documentation MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-375%20passing-brightgreen.svg)](https://github.com/aindy-eu/claude-code-docs-mcp)
[![Coverage](https://img.shields.io/badge/coverage-81.52%25-green.svg)](https://github.com/aindy-eu/claude-code-docs-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

MCP server that uses Claude to read and understand documentation for intelligent semantic search.

> **Project status:** Archived hobby project. I treat this as a finished weekend build, so the code stays available but I’m not actively shepherding new features.

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

I’m happy if this sparks ideas, but I rarely review changes anymore. If you do open something, please skim [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development setup instructions
- Code quality guidelines
- Testing requirements
- Pull request process

See also: [Testing Guide](./docs/testing.md) and [Architecture](./docs/architecture.md)

## 🔒 Security

Found a security vulnerability? Please see [SECURITY.md](./SECURITY.md) for responsible disclosure guidelines.

## 📄 License

MIT - see [LICENSE](./LICENSE) for details.

## 💎 Hidden Gems for the Curious

### 🔍 The Code-Truth Analyzer

A slash command that forces Claude to analyze code **without reading any documentation**. Zero assumptions, pure discovery.

**[→ Read the full gem documentation](./docs/gems/code-analysis.md)** to learn:
- How to force AI to verify every assumption
- Why Sonnet won on accuracy but Opus won on brevity
- How to try this on your own projects
- The "code is truth" philosophy

### 📝 AI Handovers

A system for preserving **institutional knowledge** across AI context resets. When Claude's memory fills up, handovers capture the "why" that code can't show.

**[→ Read the full gem documentation](./docs/gems/ai-handovers.md)** to learn:
- How to preserve reasoning across AI sessions
- Real examples: security fixes, test overhauls, architecture decisions
- Why "failed attempts" are as valuable as successes
- How to onboard new AI or human developers instantly

### 🎯 scruaim Framework

**Scrum + AI** - A lightweight framework for systematic development with AI assistance. This entire project was built using scruaim.

**[→ Read the full gem documentation](./docs/gems/scruaim-framework.md)** to learn:
- How pre-flight verification prevents wasted work
- The 2+ Rule (avoid premature abstraction)
- Real user story example (adding React docs)
- Why bash verification beats reading docs
- How to build institutional knowledge story by story

---

**Built with Claude Code, TypeScript, and Qdrant** · Pioneering AI-driven documentation understanding
