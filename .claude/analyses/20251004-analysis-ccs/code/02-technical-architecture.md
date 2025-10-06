# Technical Architecture - Code Analysis

**Generated**: 2025-10-04
**Source**: Code inspection only

## Tech Stack (Verified from Imports)

### Runtime & Language
```typescript
// From package.json and tsconfig.json
Language: TypeScript 5.6.3
Runtime: Node.js (ES2022 target)
Module System: ES Modules (type: "module")
Transpilation: TypeScript Compiler + tsx for dev
```

### Core Dependencies (From package.json + Import Analysis)

**MCP & AI**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import OpenAI from 'openai';                    // OpenAI embeddings
import ollama from 'ollama';                    // Local Ollama embeddings
```

**Vector Database**:
```typescript
import { QdrantClient } from '@qdrant/js-client-rest';  // Used in 8 files
```

**HTTP & Parsing**:
```typescript
import fetch from 'node-fetch';                 // HTTP client
import { JSDOM } from 'jsdom';                 // HTML parsing (limited use)
```

**CLI & UI**:
```typescript
import { Command } from 'commander';           // CLI framework
import chalk from 'chalk';                      // Terminal colors
import ora from 'ora';                          // Spinners
import { Listr } from 'listr2';                // Task lists
```

**Utilities**:
```typescript
import { v4 as uuidv4 } from 'uuid';           // ID generation
import { config } from 'dotenv';               // Environment variables
```

## Architecture Patterns (From Code Structure)

### 1. Service-Oriented Architecture

**Service Layer** (`src/services/`):
```
FetchService          - HTTP fetching + caching
ExtractService        - Claude extraction + JSON storage
EmbedService          - Embedding generation + Qdrant storage
ManifestService       - Per-domain tracking
MasterManifestService - Cross-domain tracking
PipelineLoggingService - Pipeline state management
```

**Evidence**: All services follow class-based pattern with:
- Constructor injection
- Clear single responsibility
- Type-safe interfaces (`.types.ts` files)
- Async/await throughout (24/28 files use async)

### 2. Pipeline Pattern

**Implementation** (`src/cli/pipeline/`):
```typescript
// Each stage is independent and composable
fetch.ts   → HTML retrieval
extract.ts → Claude processing
embed.ts   → Vector generation
index.ts   → Orchestration
```

**Characteristics**:
- Each stage can run independently
- File-based caching between stages
- Idempotent operations (re-run safe)
- Progress tracking via PipelineLoggingService

### 3. Command Pattern

**CLI Structure** (`src/cli/commands/`):
```typescript
// src/cli/index.ts:4-10
// Simple commands: Function registration
registerIngestCommand()
registerFetchCommand()
registerExtractCommand()

// Complex commands: Class-based
class SeedCommand { async run(options) {...} }
class SyncCommand { async run(options) {...} }
class SearchCommand { async run(query, options) {...} }
```

**Rule** (from code comments): Use class when business logic > 20 lines

### 4. Dual-Provider Pattern

**Embedding Providers** (`src/utils/embeddings.ts:30-41`):
```typescript
EMBEDDING_CONFIGS = {
  ollama: {
    provider: 'ollama',
    dimensions: 768,
    model: 'nomic-embed-text'
  },
  openai: {
    provider: 'openai',
    dimensions: 1536,
    model: 'text-embedding-ada-002'
  }
}
```

**Separate Collections**:
```typescript
// src/utils/embeddings.ts:67-69
getCollectionName(provider) {
  return `claude_code_docs_${provider}`;  // Separate Qdrant collections
}
```

**Why**: Different embedding dimensions require different vector spaces

## Database Architecture

### Vector Database: Qdrant

**Connection** (`src/index.ts:30-33`):
```typescript
const qdrant = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: parseInt(process.env.QDRANT_PORT || '6333')
});
```

**Collections**:
- `claude_code_docs_ollama` (768 dimensions)
- `claude_code_docs_openai` (1536 dimensions)

**Document Schema** (inferred from `src/services/embed-service.types.ts`):
```typescript
interface ProcessedDocument {
  id: string;              // UUID
  content: string;         // Text to embed
  metadata: {
    url: string;
    title: string;
    section?: string;
    category?: string;
    keywords?: string[];
    // Rich metadata preserved from extraction
  }
}
```

**Vector Operations**:
- Upsert with `id` (allows updates)
- Similarity search via cosine distance
- Metadata filtering supported

### File-Based Caching

**Structure** (`.data/{domain}/`):
```
.data/
  docs.claude.com/
    manifest.json          # Tracking (7-day TTL)
    cache/
      {page-name}.html     # Original HTML
    structured/
      {page-name}.json     # Claude-extracted JSON
```

**Evidence**:
- `FetchService.urlToPath()` converts URLs to cache paths
- `ExtractService.getJsonPath()` manages structured output
- `ManifestService` tracks ingestion state

## API Endpoints (None - This is a Server, Not API)

**No HTTP API**: This is an MCP server using stdio transport.

**MCP Tool** (`src/mcp-tools/index.ts:42-72`):
```typescript
// Single tool exposed via MCP protocol
CallToolRequestSchema → 'search_claude_code_docs'

Input:
  - query: string
  - provider: 'ollama' | 'openai' | 'both'
  - limit: number (1-10, default 3)

Output:
  - Formatted search results as text
  - Error messages with troubleshooting
```

## External Services & APIs

### 1. Qdrant Vector Database
**Connection**: HTTP REST API
**Port**: 6333 (configurable)
**Usage**: 8 files import QdrantClient
**Operations**: Collection management, vector upsert, similarity search

### 2. Ollama (Local LLM)
**Connection**: HTTP (localhost:11434 default)
**Usage**: `src/utils/embeddings.ts:48-53`
```typescript
await ollama.embeddings({
  model: 'nomic-embed-text',
  prompt: text
});
```

### 3. OpenAI API
**Connection**: HTTPS (api.openai.com)
**Auth**: API key (env: `OPENAI_API_KEY`)
**Usage**: `src/utils/embeddings.ts:59-63`
```typescript
await openai.embeddings.create({
  model: 'text-embedding-ada-002',
  input: text
});
```
**Lazy Loading**: Client only initialized when needed

### 4. Claude AI (Implicit)
**Usage**: Extract pipeline (`src/cli/pipeline/extract.ts:54-71`)
```typescript
// Spawns external process, passes URL via env
const process = spawn('python3', ['tools/extract.py'], {
  env: { ...process.env, DOC_URL: url }
});
```
**Evidence**: Python tool (`tools/lib/claude_client.py`) exists

## Infrastructure Configuration

### Environment Variables (From .env.example)

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Ollama
OLLAMA_HOST=localhost
OLLAMA_PORT=11434

# Defaults
DEFAULT_EMBEDDING_PROVIDER=ollama
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
```

**Security**: No secrets hardcoded (verified via grep)

### File System Structure

**Data Directory** (`.data/`):
```
.data/
  {domain}/
    manifest.json           # Per-domain tracking
    cache/{page}.html       # HTML cache
    structured/{page}.json  # Extracted JSON
```

**Build Output** (`build/`):
```
build/
  src/
    index.js              # MCP server entry
    cli/                  # CLI commands
    services/             # Service layer
    mcp-tools/            # MCP tool implementations
```

## Key Architectural Decisions

### 1. File-Based Caching
**Rationale**: Enables pipeline restartability, debugging, and offline development

### 2. Dual Embedding Providers
**Rationale**: Privacy (Ollama local) vs Performance (OpenAI hosted)

### 3. Domain-Based Organization
**Rationale**: Multi-source support, independent update cycles

### 4. External Claude Extraction
**Rationale**: Python tooling for Claude API, separate from Node runtime

### 5. MCP Stdio Transport
**Rationale**: Integrates with Claude Code via standard input/output

## Technology Choices (Verified)

| Technology | Purpose | Files Using |
|------------|---------|-------------|
| TypeScript | Type safety | 95 files |
| Qdrant | Vector DB | 8 files |
| Vitest | Testing | 32 test files |
| Commander | CLI | 1 (cli/index.ts) |
| ESLint + Prettier | Code quality | Config files |
| Node Fetch | HTTP | 1 (fetch-service) |

## Performance Characteristics

**Async Operations**: 24 files use async/await
**Parallel Capable**: Service layer designed for concurrent execution
**Caching Strategy**: Multi-level (HTML, JSON, vectors)
**Connection Pooling**: QdrantClient reused across operations
