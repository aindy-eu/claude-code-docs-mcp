# Project Overview - Code Analysis

**Generated:** 2025-10-03
**Analysis Method:** Pure Code Analysis (No Documentation Read)

## Project Purpose (From Code Implementation)

This is an MCP (Model Context Protocol) server that provides intelligent documentation search capabilities for Claude Code documentation. The project implements a complete RAG (Retrieval-Augmented Generation) pipeline with:

- Documentation fetching and caching
- Claude-driven content extraction
- Vector embeddings generation
- Semantic search over documentation

## Application Type

**MCP Server + CLI Tool**

- Primary: MCP server exposing `search_claude_code_docs` tool via stdio
- Secondary: Full-featured CLI for managing the documentation pipeline
- Entry points: `src/index.ts` (MCP server), `src/cli/index.ts` (CLI)

## Target Users (Inferred from Functionality)

1. **Claude Code users** - Searching documentation naturally
2. **Developers** - Managing documentation ingestion and updates
3. **AI assistants** - Accessing structured documentation via MCP protocol

## Actual Project Metrics

### File Statistics

```bash
# Language distribution (actual file extensions)
8,842 JavaScript files (mostly node_modules)
3,769 TypeScript files
  860 Markdown files
  782 JSON files
  379 .mjs files
  196 .cjs files

# Source code only
39 TypeScript source files in src/
30 Test files
3,591 lines of production TypeScript code
```

### Code Organization

```
src/
├── cli/              # CLI commands and pipeline
│   ├── commands/     # 9 command implementations
│   └── pipeline/     # 4 pipeline stages
├── config/           # Configuration and URL sources
├── mcp-tools/        # MCP tool implementations
│   └── search/       # Search tool
├── services/         # 5 core services
│   └── __mocks__/    # Service mocks for testing
└── utils/            # 4 utility modules
```

### Test Coverage (Actual Metrics from vitest)

```
Test Files: 30 passed (30)
Tests: 353 passed (353)
Duration: 3.62s
Overall Coverage: 81.97%

Coverage by Module:
- services/: 97.81% (excellent)
- mcp-tools/search/: 94.93%
- config/: 90.5%
- mcp-tools/: 87.69%
- cli/pipeline/: 75.68%
- cli/: 62.65%
- cli/commands/: 60.15%
```

### Technology Stack (From package.json)

**Runtime:**
- Node.js with TypeScript (ES2022, Node16 modules)
- ES modules throughout (type: "module")

**Core Dependencies:**
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `@qdrant/js-client-rest` - Vector database client
- `ollama` - Local embeddings
- `openai` - OpenAI embeddings (optional)
- `jsdom` - HTML parsing
- `commander` - CLI framework
- `chalk`, `ora`, `listr2` - Terminal UI

**Dev Dependencies:**
- `vitest` - Testing framework (migrated from Jest)
- `@vitest/coverage-v8` - Coverage reporting
- `typescript` - TypeScript compiler
- `eslint` + `prettier` - Code quality tools

## Problem Solved (From Business Logic)

**Problem:** Claude Code documentation is scattered across web pages and hard to search contextually

**Solution:**
1. Fetch and cache HTML documentation
2. Use Claude to intelligently extract structured content
3. Generate vector embeddings (local or OpenAI)
4. Store in Qdrant for semantic search
5. Expose via MCP tool for natural language queries

**Key Innovation:** Uses Claude itself to understand and structure documentation, not mechanical parsing

## Execution Flow (Traced Through Code)

### MCP Server Mode
```
src/index.ts →
  registerTools() →
    search_claude_code_docs tool →
      searchDocumentation() →
        generateEmbedding() →
          Qdrant.query()
```

### CLI Pipeline Mode
```
src/cli/index.ts →
  Command (fetch/extract/embed) →
    Pipeline stage →
      Service layer →
        External service (Ollama/OpenAI/Qdrant)
```

### Data Flow
```
URL → FetchService → HTML cache →
  ExtractService (Claude Code) → JSON →
    EmbedService → vectors →
      Qdrant → search results
```

## Git History Analysis

```
Recent commits (from git log):
* 9a39bc4 - refactor(tests): simplify path aliases and rename fixtures
* 1870c06 - test(cli): add smoke tests for CLI commands and entry point
* dd86d69 - refactor: restructure CLI architecture for clarity
* a148f8f - feat(test): optimize MCP search integration tests
* f27cb25 - feat(test): implement more service and integration tests
```

**Current branch:** refactor/cli-commands
**Status:** Active development, recent refactoring for clarity

## Build Output

```
Input: 39 TypeScript source files
Output: build/ directory
Executable: build/index.js (chmod 755)
Package bin: claude-code-docs-mcp
```

## Feature Inventory (From Actual Code)

### CLI Commands (11 total)
1. `ingest` - Full pipeline (fetch + extract + embed)
2. `fetch` - Fetch and cache HTML
3. `extract` - Extract content via Claude
4. `embed` - Generate embeddings and store
5. `status` - View pipeline status
6. `list` - List cached documentation
7. `seed` - Bootstrap with core/all pages
8. `sync` - Update stale documentation (TTL-based)
9. `search` - Search documentation locally

### MCP Tools (1 exposed)
- `search_claude_code_docs` - Semantic search over ingested docs

### Services (5 core services)
1. `FetchService` - HTML fetching/caching with content comparison
2. `ExtractService` - Claude-driven content extraction
3. `EmbedService` - Vector embedding and Qdrant storage
4. `ManifestService` - Ingestion tracking (7-day TTL)
5. `PipelineLoggingService` - Stage logging and progress

## Development Status

**Maturity:** Production-ready
- High test coverage (82%)
- Comprehensive integration tests
- GitHub Actions CI
- Type-safe throughout
- Error handling in place

**Recent Activity:**
- CLI architecture refactoring
- Test migration (Jest → Vitest)
- Path alias simplification
