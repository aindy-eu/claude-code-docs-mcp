# Project Overview - Code Analysis

**Generated**: 2025-10-04
**Analysis Method**: Pure Code Analysis (No Documentation Read)

## Project Purpose (From Code Evidence)

This is an **MCP (Model Context Protocol) server** that provides semantic search over Claude Code documentation using RAG (Retrieval-Augmented Generation).

**Evidence**:
- Main entry point (`src/index.ts:1-67`) creates MCP server with `@modelcontextprotocol/sdk`
- Registers search tool `search_claude_code_docs` (`src/mcp-tools/index.ts:11-39`)
- CLI pipeline fetches, extracts, and embeds documentation (`src/cli/index.ts:1-120`)

## Application Type

**Type**: Node.js TypeScript Library + CLI Tool + MCP Server

**Entry Points**:
1. **MCP Server**: `src/index.ts` - Stdio-based MCP server
2. **CLI**: `src/cli/index.ts` - Commander-based CLI with 10 commands
3. **Package Binary**: `build/index.js` (from `package.json:7-9`)

## Target Users

Based on functionality implemented:
1. **Claude Code Users** - Search documentation semantically
2. **Developers** - Manage documentation ingestion pipeline
3. **DevOps/SRE** - Run MCP server for Claude integrations

**Evidence**: CLI commands target different personas:
- `seed`, `sync` for initial setup (DevOps)
- `search` for end-users
- `fetch`, `extract`, `embed` for advanced pipeline control

## Actual Metrics (Measured)

### Code Size
```bash
# Measured via find + wc
TypeScript files (src/): 95 files
JavaScript files (src/): 156 files (likely generated/legacy)
Python files (tools/): 7 files
Total source lines: 3,850 lines (TypeScript only)
```

### Language Distribution
```
Primary: TypeScript (95 files, 3,850 lines)
Secondary: JavaScript (156 files, likely build artifacts)
Legacy: Python (7 files in tools/lib/)
```

### Test Coverage
```bash
# From npm run test:ci
Test Files: 32 passed
Tests: 375 passed
Coverage: 81.57% statements, 82.26% branches, 85.49% functions

Duration: 4.12s (setup 614ms, tests 6.96s)
Framework: Vitest 3.2.4
```

### Dependencies
```bash
# From package.json
Production dependencies: 13 packages
- @modelcontextprotocol/sdk (MCP protocol)
- @qdrant/js-client-rest (vector database)
- ollama, openai (embedding providers)
- commander, chalk, ora, listr2 (CLI)

Dev dependencies: 11 packages
- typescript, tsx
- vitest, @vitest/coverage-v8
- eslint, prettier
- @types/* (TypeScript definitions)
```

## Problem Solved (From Business Logic)

### Core Value Proposition
**Problem**: Claude Code documentation scattered online, slow to search with traditional methods

**Solution**: Local semantic search over documentation using embeddings + vector database

**Implementation Evidence**:

1. **Fetch** (`src/services/fetch-service.ts:1-233`)
   - Downloads HTML, caches locally
   - Content change detection via SHA-256 hashing
   - Domain-based organization

2. **Extract** (`src/cli/pipeline/extract.ts:1-115`)
   - Processes HTML with Claude AI (not traditional parsing)
   - Generates structured JSON output
   - Dev/production prompt modes

3. **Embed** (`src/services/embed-service.ts:1-200+`)
   - Converts documentation to vector embeddings
   - Supports dual providers (Ollama 768-dim, OpenAI 1536-dim)
   - Stores in Qdrant vector database

4. **Search** (`src/mcp-tools/search/search.ts:1-100+`)
   - Semantic search via vector similarity
   - Returns contextually relevant results
   - Integrates with Claude via MCP protocol

### Unique Approach
**Key Insight** (from code architecture): Uses Claude AI to *understand* documentation during extraction, not traditional HTML parsing. This extracts implicit knowledge and relationships.

**Evidence**:
- Extract service (`src/cli/pipeline/extract.ts`) spawns external process (likely calling Claude API)
- No JSDOM/cheerio parsing in main pipeline
- Python tools in `tools/lib/` suggest legacy scraping approach was abandoned

## Key Features (From Implemented Code)

### 1. Multi-Source Documentation Support
```typescript
// src/services/master-manifest-service.ts
// Tracks multiple documentation sources
// Each domain gets its own manifest
```

### 2. Hybrid Embedding Architecture
```typescript
// src/utils/embeddings.ts:30-41
EMBEDDING_CONFIGS = {
  ollama: { dimensions: 768, model: 'nomic-embed-text' },
  openai: { dimensions: 1536, model: 'text-embedding-ada-002' }
}
```

### 3. Intelligent Caching & TTL
```typescript
// src/services/manifest-service.ts
// 7-day TTL prevents unnecessary API calls
// Content hashing detects changes
```

### 4. Pipeline Architecture
```
CLI Commands:
- fetch: Download HTML
- extract: Claude AI processing → JSON
- embed: Generate embeddings → Qdrant
- search: Vector similarity search

Orchestration:
- ingest: Run all stages
- seed: Bootstrap core docs
- sync: Update stale docs (7+ days old)
```

## Architecture Highlights (Code-Verified)

### Service Layer Pattern
13 classes implementing single responsibility:
- `FetchService`: HTTP + caching
- `ExtractService`: Claude extraction
- `EmbedService`: Embedding generation
- `ManifestService`: Tracking per domain
- `MasterManifestService`: Cross-domain tracking
- `PipelineLoggingService`: Pipeline state management

### Type Safety
11 `.types.ts` files ensure strong typing throughout

### Test Strategy
375 tests across:
- 24 unit test files (fast, isolated)
- 8 integration test files (with Qdrant/Ollama)
- End-to-end pipeline testing

## Project Health Score: 8.5/10

**Strengths**:
- High test coverage (81.57%)
- Strong TypeScript typing
- Clean service-oriented architecture
- Zero hardcoded secrets (env-based config)

**Areas for Improvement**:
- CLI index.ts has only 60.43% coverage
- Some pipeline orchestration could be tested better
- 1 TODO/FIXME comment found in codebase

## Last Activity (Git)
```bash
Latest commits:
128b743 chore: delete test folder in .data and update .gitignore
db50262 refactor(sync): remove custom TTL option, fix prompt paths
57cb20d docs: updated docs with verified documentation
964361d feat(multi-source): add master manifest and source tracking
4a79134 refactor(sync): make domain-agnostic with manifest discovery
```

Active development with recent refactoring toward multi-source support.
