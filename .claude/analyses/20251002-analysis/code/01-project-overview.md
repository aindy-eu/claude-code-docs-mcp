# Project Overview - Code Analysis

**Analysis Date:** 2025-10-02
**Analysis Method:** Pure Code Inspection (No Documentation)

## Project Purpose

Based on code analysis, this is an **MCP (Model Context Protocol) Server** that provides semantic search capabilities over Claude Code documentation. The system:

1. **Ingests documentation** from docs.claude.com using a Claude-driven extraction pipeline
2. **Generates embeddings** using either local Ollama or OpenAI models
3. **Stores vectors** in Qdrant for semantic search
4. **Exposes MCP tools** for Claude to search documentation intelligently

## Application Type

- **Primary**: MCP Server (Model Context Protocol)
- **Architecture**: RAG (Retrieval-Augmented Generation) System
- **Deployment**: CLI tool + MCP server
- **Runtime**: Node.js with TypeScript

## Target Users

Based on implemented features:

1. **Claude Code users** - searching documentation through Claude
2. **Developers** - building on Claude Code documentation
3. **Documentation maintainers** - keeping docs searchable and up-to-date

## Actual Metrics

### File Counts (from code analysis)
```bash
# Language distribution
TypeScript:   58 files (4,305 .ts in total including node_modules)
Python:       7 files (ingestion tooling)
JavaScript:   10,866 .js files (mostly dependencies)
Configuration: ~50 files (.json, .yml, .md)
```

### Code Size
- **Source Code**: 3,315 lines of TypeScript
- **Total Bytes**: 185,177 bytes
- **Test Files**: 15 test files
- **Test Suites**: 11 test suites
- **Tests**: 132 tests (130 passed, 2 skipped)

### Test Coverage (from npm run test:coverage)
```
Overall: 56.04% statements
Branches: 47.31%
Functions: 53.84%
Lines: 56.04%

Key Coverage by Module:
- MCP Tools: 100% (perfect)
- Search: 95.74%
- Config: 91.66%
- Manifest Service: 71.71%
- Extract Service: 100%
- Embed Service: 0% (not tested)
- Fetch Service: 0% (not tested)
```

### Dependencies
```bash
# From package.json analysis
Production Dependencies: 9
- @modelcontextprotocol/sdk
- @qdrant/js-client-rest
- chalk, commander, dotenv
- jsdom, node-fetch, listr2
- ollama, openai, ora, uuid

Dev Dependencies: 14
- TypeScript tooling (ts-jest, tsx, typescript)
- Testing (jest, @types/jest)
- Linting (eslint, prettier)
- Type definitions
```

### Git History
```bash
Last Commit: b7e4063
Message: "feat: add content diff to skip pipeline when docs unchanged"
Branch: feature/ingestion-cache
```

## Problem Solved

**Core Innovation**: Using Claude's natural language understanding to extract structured data from documentation, rather than traditional web scraping.

### The Problem
- Documentation is unstructured and hard to search
- Traditional parsing misses implicit knowledge and context
- Users need semantic search, not keyword matching

### The Solution
1. **Claude reads docs** like a human would
2. **Extracts rich metadata**: concepts, examples, relationships
3. **Generates embeddings** for semantic similarity
4. **Enables intelligent search** through MCP protocol

### Why This Approach Matters
- **Human-level understanding**: Claude extracts what parsers can't
- **Rich metadata**: Search keywords, aliases, concepts, best practices
- **Hybrid embedding support**: Works with local (Ollama) or cloud (OpenAI)
- **Privacy-first**: Default to local embeddings, no data leaves machine

## Key Features (from implementation)

### 1. Documentation Ingestion Pipeline
```typescript
// From src/cli/orchestrator/index.ts
fetch(url) → extract(url) → embed(url) → store(qdrant)
```

### 2. Dual Embedding Providers
```typescript
// From src/utils/embeddings.ts
- Ollama: nomic-embed-text (768 dimensions)
- OpenAI: text-embedding-ada-002 (1536 dimensions)
```

### 3. Smart Caching & Change Detection
```typescript
// From src/services/fetch-service.ts
- Content diffing to skip unchanged docs
- 7-day TTL on ingestion tracking
- Hash-based change detection
```

### 4. MCP Integration
```typescript
// From src/index.ts & src/mcp-tools/index.ts
Tool: search_claude_code_docs
- Semantic search over docs
- Multi-provider support
- Configurable result limits
```

### 5. CLI Interface
```typescript
// From package.json scripts
npm run cli -- batch          # Batch ingest docs
npm run cli -- search "query" # Search docs
npm run cli -- list           # List ingested docs
```

## Project Maturity

**Stage**: Active Development (feature branch)

**Evidence**:
- Recent commits focused on optimization (caching, content diff)
- 98.5% test pass rate (130/132 tests)
- Good test coverage on core features (MCP tools at 100%)
- Production-ready infrastructure (CI/CD, linting, formatting)

## Technical Debt

**Found in code analysis:**

1. **Incomplete test coverage** (56% overall)
   - Embed service: 0%
   - Fetch service: 0%

2. **Code quality issues** (from eslint)
   - 13 prettier formatting errors
   - 15 console.log warnings (should use logger)
   - 3 instances of 'any' type warnings

3. **Python-TypeScript hybrid**
   - Python scripts for Claude CLI invocation
   - Could consolidate to single language

## Success Indicators

✅ **Working Tests**: 130/132 tests passing
✅ **Core Feature Coverage**: MCP tools at 100%
✅ **CI/CD**: GitHub Actions with matrix testing (Node 18, 20, 22)
✅ **Real Usage**: Active feature branch with recent commits
✅ **Code Quality Tools**: ESLint, Prettier, Jest configured
