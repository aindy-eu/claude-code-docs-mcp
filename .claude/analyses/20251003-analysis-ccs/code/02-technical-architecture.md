# Technical Architecture - Code Analysis

**Generated:** 2025-10-03
**Source:** Actual code inspection and imports

## Tech Stack (From Actual Dependencies)

### Runtime & Language
```json
"type": "module"
"compilerOptions": {
  "target": "ES2022",
  "module": "Node16",
  "moduleResolution": "Node16"
}
```
- **TypeScript 5.6.3** with strict mode enabled
- **Node.js** ES modules (not CommonJS)
- **ES2022** target for modern JavaScript features

### Core Dependencies (From package.json)

**MCP Integration:**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```
- MCP SDK ^1.0.0 for protocol implementation
- Stdio transport for Claude integration

**Vector Database:**
```typescript
import { QdrantClient } from '@qdrant/js-client-rest';
```
- Qdrant JS client ^1.12.0
- REST API client (not gRPC)
- Default: localhost:6333

**Embedding Providers:**
```typescript
import OpenAI from 'openai';        // ^4.67.1
import ollama from 'ollama';         // ^0.5.9
```
- **Ollama:** Local embeddings (default), 768 dimensions, nomic-embed-text
- **OpenAI:** Cloud embeddings (optional), 1536 dimensions, text-embedding-ada-002

**HTML Processing:**
```typescript
import { JSDOM } from 'jsdom';       // ^25.0.1
```
- Full DOM implementation for HTML parsing
- Used in ExtractService

**CLI Framework:**
```typescript
import { Command } from 'commander'; // ^14.0.1
import chalk from 'chalk';           // ^5.6.2
import ora from 'ora';               // ^9.0.0
import { Listr } from 'listr2';      // ^9.0.4
```
- Commander for argument parsing
- Chalk for colored output
- Ora for spinners
- Listr2 for task lists

**Utilities:**
```typescript
import { config } from 'dotenv';     // ^16.4.5
import fetch from 'node-fetch';      // ^3.3.2
import { v4 as uuidv4 } from 'uuid'; // ^10.0.0
```

## Architecture Pattern: Service-Oriented Design

### Layer Structure (From Code Organization)

```
┌─────────────────────────────────────┐
│   MCP Server / CLI Interface        │
│   (src/index.ts, src/cli/index.ts) │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   Command Layer                     │
│   - 9 CLI commands                  │
│   - 1 MCP tool                      │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   Pipeline Stages                   │
│   - fetch, extract, embed           │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   Service Layer (5 services)        │
│   - FetchService                    │
│   - ExtractService                  │
│   - EmbedService                    │
│   - ManifestService                 │
│   - PipelineLoggingService          │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   External Services                 │
│   - Qdrant (vectors)                │
│   - Ollama/OpenAI (embeddings)      │
│   - Claude Code (extraction)        │
│   - HTTP (documentation sources)    │
└─────────────────────────────────────┘
```

## Data Storage (From Code Implementation)

### Filesystem Storage

```typescript
// FetchService cache structure
.data/
└── {domain}/
    └── cache/
        └── {url-path}/
            ├── content.html
            └── meta.json

// ManifestService tracking
.data/
└── {domain}/
    └── manifest.json  // 7-day TTL tracking
```

**Cache Metadata (from FetchService.ts:104-110):**
```typescript
{
  url: string,
  cachedAt: ISO8601,
  size: bytes,
  contentHash: sha256,
  headers: Record<string, string>
}
```

**Manifest Tracking (from ManifestService):**
```typescript
{
  url: string,
  lastIngested: ISO8601,
  stage: 'fetched' | 'extracted' | 'embedded',
  ttlDays: 7,
  metadata: {
    finalUrl: string,
    skipPipeline: boolean,
    extraction?: { ... }
  }
}
```

### Vector Database: Qdrant

**Collections (from embeddings.ts:67-69):**
- `claude_code_docs_ollama` - 768 dimensions, Cosine distance
- `claude_code_docs_openai` - 1536 dimensions, Cosine distance

**Point Payload (from embed-service.ts:79-96):**
```typescript
{
  content: string,
  title: string,
  section: string,
  url: string,
  codeExamples: string[],
  keyConcepts: string[],
  searchKeywords: string[],
  aliases: string[],
  provider: 'ollama' | 'openai',
  lastUpdated: ISO8601,
  extractionMethod: 'claude-driven',
  pageTitle: string,
  summary: string
}
```

## API Endpoints & Routes

### External API Calls

**Ollama (from embeddings.ts:48-53):**
```typescript
POST http://localhost:11434/api/embeddings
{
  model: 'nomic-embed-text',
  prompt: string
}
→ { embedding: number[] }  // 768 dimensions
```

**OpenAI (from embeddings.ts:59-63):**
```typescript
POST https://api.openai.com/v1/embeddings
{
  model: 'text-embedding-ada-002',
  input: string
}
→ { data: [{ embedding: number[] }] }  // 1536 dimensions
```

**Qdrant (from QdrantClient):**
```typescript
// Collection management
GET  http://localhost:6333/collections/{name}
POST http://localhost:6333/collections/{name}

// Vector operations
POST http://localhost:6333/collections/{name}/points
POST http://localhost:6333/collections/{name}/points/search
```

**Claude Code (subprocess, from extract.ts:74-96):**
```bash
claude -e -m {model} {prompt-file}
# Runs Claude Code CLI in expert mode
# Returns structured JSON output
```

### MCP Tool Interface

**Single Tool Exposed (from mcp-tools/index.ts):**

```typescript
Tool: search_claude_code_docs
Input: {
  query: string,
  provider?: 'ollama' | 'openai' | 'both',
  limit?: number  // default: 3
}
Output: {
  results: SearchResult[],
  formatted: string  // Markdown
}
```

## Configuration Management (From Actual Code)

### Environment Variables (from .env.example)

```bash
# Required for OpenAI
OPENAI_API_KEY=sk-...

# Qdrant configuration
QDRANT_HOST=localhost      # default: localhost
QDRANT_PORT=6333          # default: 6333
QDRANT_URL=http://...     # alternative to HOST/PORT

# Ollama configuration
OLLAMA_HOST=localhost     # default: localhost
OLLAMA_PORT=11434

# Embedding provider selection
DEFAULT_EMBEDDING_PROVIDER=ollama  # 'ollama' or 'openai'
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# Debug logging
DEBUG=1  # enables debug logs
```

### Type Safety Configuration

**tsconfig.json (actual settings):**
```json
{
  "strict": true,
  "esModuleInterop": true,
  "forceConsistentCasingInFileNames": true,
  "isolatedModules": true,
  "allowSyntheticDefaultImports": true,
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"],
    "@tests/*": ["tests/*"]
  }
}
```

## Execution Flow (Traced Through Code)

### 1. Ingestion Pipeline

```
CLI: tsx src/cli/index.ts ingest --url {url}
  ↓
ingestCommand (commands/ingest.ts)
  ↓
Pipeline (pipeline/index.ts)
  ├─→ fetchStage() → FetchService
  │   ├─ fetch(url)
  │   ├─ compareContent() [skip if unchanged]
  │   └─ saveHTML()
  ↓
  ├─→ extractStage() → ExtractService
  │   ├─ spawn('claude', ['-e', prompt])
  │   ├─ cleanJSON() [remove markdown wrappers]
  │   └─ validateOutput()
  ↓
  └─→ embedStage() → EmbedService
      ├─ extractDocuments() [split into chunks]
      ├─ generateEmbedding() → Ollama/OpenAI
      └─ qdrant.upsert() [batch insert]
```

### 2. Search Flow

```
MCP Client: search_claude_code_docs(query)
  ↓
registerTools() (mcp-tools/index.ts)
  ↓
searchDocumentation() (mcp-tools/search/search.ts:53-109)
  ├─ generateEmbedding(query, provider)
  ├─ qdrant.query(collection, { query, limit, threshold: 0.5 })
  ├─ map results to SearchResult[]
  ├─ sort by score
  └─ formatSearchResults() → Markdown
```

## Infrastructure Code

**No containers found:**
- No Dockerfile
- No docker-compose.yml
- No Kubernetes configs

**CI/CD (from .github/workflows/test.yml):**
```yaml
name: test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - npm install
      - npm run lint
      - npm run build
      - npm run test:ci
```

## Module Dependencies (From Import Analysis)

**Most Imported Modules:**
1. `utils/logger.js` - Logging across all services
2. `utils/embeddings.js` - Embedding generation
3. Services - Heavy cross-service dependencies
4. Type modules - Extensive type imports

**External Dependencies:**
- Minimal external API calls (Ollama/OpenAI/Qdrant)
- No third-party analytics
- No monitoring services
- Local-first architecture

## Architecture Patterns Found

1. **Service Layer Pattern** - All business logic in services/
2. **Dependency Injection** - Services passed to commands
3. **Provider Pattern** - Pluggable embedding providers
4. **Repository Pattern** - ManifestService for persistence
5. **Facade Pattern** - Pipeline stages wrap complex operations
6. **Factory Pattern** - Dynamic collection name generation
