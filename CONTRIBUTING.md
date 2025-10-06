# About This Project

## Status: Educational Archive

This project is **complete** and serves as an educational reference for:
- Building MCP (Model Context Protocol) servers
- Implementing RAG (Retrieval Augmented Generation) pipelines
- Using Claude for intelligent document processing
- Production-quality TypeScript architecture

**Not actively maintained** - but fully functional and well-documented.

## What You Can Do

### Use It As-Is

**[→ See Quick Start in README](./README.md#-quick-start)** for full setup instructions.

The project is ready to run - no modifications needed.

### Learn From It

- Study the [Architecture](./docs/architecture.md) - Service-oriented design with dependency injection
- Review the [Testing Patterns](./docs/testing.md) - 375 tests, 81.52% coverage
- Understand the [Pipeline Design](./docs/pipeline.md) - Claude-driven extraction philosophy
- Explore the [Manifest System](./docs/manifest-system.md) - Two-tier state tracking

**Key Learning Areas**:
- MCP protocol implementation and tool registration
- Vector databases (Qdrant) and semantic search
- Hybrid embeddings (Ollama local + OpenAI cloud)
- CLI design with Commander.js
- TypeScript strict mode patterns
- Integration testing with external services

### Fork & Extend

This is a **solid foundation** for:
- Provider-agnostic documentation tools (currently Claude Code-specific)
- Multi-source knowledge bases (works with any documentation URL)
- MCP server development (real-world example)
- RAG experimentation (complete fetch→extract→embed pipeline)

**Architecture Highlights**:
- Clean separation: CLI → Pipeline → Services → External Services
- Dependency injection throughout
- Testable design (98% service coverage)
- Content hash-based change detection
- Resume-on-failure pipeline stages

### Take It Further

The author's unrealized vision:
- **True multi-provider support**: Not locked to Claude, support GPT-4, local models, etc.
- **Documentation hub**: Centralized, shareable vector DBs (think npm for documentation)
- **MCP-native service**: Host Qdrant collections, distribute via MCP
- **Universal ingestion**: One tool for React docs, Rails guides, API references, etc.

**If you build something cool with this, open an issue and share it!**

## Development Setup (If You Want to Hack)

### Prerequisites

- **Node.js 18+**
- **Docker** (for Qdrant)
- **Ollama** (recommended) or OpenAI API key
- **Claude Code** (for extraction)

### Setup Steps

If you want to hack on the code:

```bash
# 1. Fork and clone YOUR fork (not the original)
git clone https://github.com/yourusername/claude-code-docs-mcp.git
cd claude-code-docs-mcp
npm install

# 2. Follow Quick Start in README to get services running
#    (Qdrant, Ollama/OpenAI, npm run setup, npm run seed)

# 3. Optional: Configure OpenAI instead of Ollama
cp .env.example .env
# Edit .env with OPENAI_API_KEY

# 4. Verify everything works
npm test  # 375 tests should pass

# Now you're ready to make changes
```

### Code Quality Tools

```bash
# Before committing (if you care)
npm run lint:fix  # Fix linting issues
npm run build     # Ensure TypeScript compiles
npm test          # All tests pass
```

## Code Walkthrough

### Where to Start Reading

1. **Entry Points**:
   - `src/index.ts` - MCP server setup
   - `src/cli/index.ts` - CLI commands

2. **Core Pipeline**:
   - `src/cli/pipeline/fetch.ts` - HTML fetching + content change detection
   - `src/cli/pipeline/extract.ts` - Claude-driven extraction
   - `src/cli/pipeline/embed.ts` - Vector embeddings + Qdrant storage

3. **Services Layer**:
   - `src/services/fetch-service.ts` - HTTP fetching, caching, SHA-256 hashing
   - `src/services/extract-service.ts` - JSON storage management
   - `src/services/embed-service.ts` - Embeddings + Qdrant operations
   - `src/services/manifest-service.ts` - Domain manifest tracking
   - `src/services/master-manifest-service.ts` - Multi-source registry

4. **MCP Integration**:
   - `src/mcp-tools/index.ts` - Tool registration
   - `src/mcp-tools/search/search.ts` - Semantic search implementation

### Interesting Patterns

**Content Change Detection** (`fetch-service.ts`):
```typescript
// Normalizes HTML, computes SHA-256 hash
// Skips pipeline if content unchanged (saves ~30s per URL)
private compareContent(oldHtml: string, newHtml: string)
```

**Claude-Driven Extraction** (`extract.ts`):
```typescript
// Uses spawn() not exec() for security
// Claude reads HTML like a human, outputs structured JSON
spawn('python3', [extractScript, htmlPath, promptPath, model])
```

**Two-Tier Manifests**:
- Master manifest (`.data/manifest.json`) - tracks all sources
- Domain manifests (`.data/{domain}/manifest.json`) - tracks individual URLs
- 7-day TTL system for staleness detection

## Why This Exists

Started as a weekend project to:
1. Learn MCP protocol (before official docs existed)
2. Experiment with RAG pipelines (vector search is fun)
3. Solve "how do I search Claude Code docs effectively"

Ended up being better than expected. Maybe useful to others learning the same concepts.

**Key Innovation**: Using Claude to *understand* documentation rather than mechanically parse it. Traditional scrapers miss context, relationships, and implicit knowledge. Claude gets it.

## What Makes This Different

**Not another web scraper**:
- Claude reads docs like a human developer would
- Extracts implicit knowledge (prerequisites, use cases, best practices)
- Rich metadata beyond just text content
- Works with ANY documentation source, not just specific formats

**Production-ready quality**:
- 375 tests with 81.52% coverage
- Zero linting errors
- Comprehensive documentation
- Type-safe with TypeScript strict mode
- Proper error handling and logging

**Real-world architecture**:
- Service-oriented design
- Dependency injection
- Testable components
- Resume-on-failure pipeline
- Content change optimization

## Support & Questions

- **Questions?** Check the [documentation](./docs/)
- **Found a bug?** You're welcome to fix it (no promises on PR review)
- **Want to chat?** Open a GitHub Discussion
- **Built something?** Share it in Issues!

No email, no formal process - just code in the wild.

---

**Built with curiosity. Shared with hope it helps someone.** 🚀

*P.S. - If someone actually builds the "documentation hub" vision, please let me know. That would be cool to see.*
