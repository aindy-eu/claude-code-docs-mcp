# Technical Architecture - Code Analysis

**Analysis Method:** Code Inspection Only

## Tech Stack (Verified from Code)

### Runtime & Language
```typescript
// From package.json and tsconfig.json
Runtime: Node.js (ES2022 + ES Modules)
Language: TypeScript 5.6.3
Module System: Node16 (ESM)
Target: ES2022
```

### Core Dependencies (from package.json)
```json
{
  "framework": "@modelcontextprotocol/sdk ^1.0.0",
  "vectorDB": "@qdrant/js-client-rest ^1.12.0",
  "embedding_providers": {
    "local": "ollama ^0.5.9",
    "cloud": "openai ^4.67.1"
  },
  "utilities": {
    "cli": "commander ^14.0.1",
    "ui": ["chalk ^5.6.2", "ora ^9.0.0", "listr2 ^9.0.4"],
    "web": ["node-fetch ^3.3.2", "jsdom ^25.0.1"],
    "utils": ["dotenv ^16.4.5", "uuid ^10.0.0"]
  }
}
```

### Testing Stack (from jest.config.js)
```javascript
{
  "framework": "jest ^30.0.5",
  "typescript": "ts-jest ^29.4.0",
  "preset": "ts-jest/presets/default-esm",
  "environment": "node",
  "timeout": 30000
}
```

### Quality Tools (from eslint.config.js)
```javascript
{
  "linter": "eslint ^9.36.0",
  "typescript": "@typescript-eslint/* ^8.45.0",
  "formatter": "prettier ^3.6.2",
  "plugins": ["jest", "prettier"]
}
```

## Architecture Patterns

### 1. Layered Service Architecture

```
┌─────────────────────────────────────┐
│   MCP Server Layer (index.ts)       │
│   - Stdio transport                 │
│   - Tool registration               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   MCP Tools Layer                   │
│   - search_claude_code_docs         │
│   - Parameter validation            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Service Layer                     │
│   - FetchService                    │
│   - ExtractService                  │
│   - EmbedService                    │
│   - ManifestService                 │
│   - PipelineLoggingService          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   External Systems                  │
│   - Qdrant (vectors)                │
│   - Ollama/OpenAI (embeddings)      │
│   - Claude CLI (extraction)         │
└─────────────────────────────────────┘
```

### 2. Pipeline Orchestration Pattern

**From src/cli/orchestrator/index.ts:**

```typescript
class PipelineOrchestrator {
  // Three-stage pipeline
  async ingest(url) {
    1. fetch(url)    → HTML caching + change detection
    2. extract(url)  → Claude extraction → JSON
    3. embed(url)    → Generate vectors → Qdrant
  }
}
```

**Key Design Decisions:**

- **Resumable**: Each stage cached independently
- **Skippable**: Unchanged content skips pipeline
- **Observable**: Spinner UI + logging at each stage
- **Flexible**: Stages can run independently

### 3. Strategy Pattern for Embeddings

**From src/utils/embeddings.ts:**

```typescript
type EmbeddingProvider = 'ollama' | 'openai';

const EMBEDDING_CONFIGS: Record<EmbeddingProvider, EmbeddingConfig> = {
  ollama: {
    model: 'nomic-embed-text',
    dimensions: 768
  },
  openai: {
    model: 'text-embedding-ada-002',
    dimensions: 1536
  }
};

async function generateEmbedding(text: string, provider: EmbeddingProvider)
```

**Benefits:**
- Single interface for multiple providers
- Easy to add new providers
- Different vector dimensions handled automatically
- Separate Qdrant collections per provider

### 4. Service-Oriented Design

Each service has:
- **Single responsibility**
- **Type definitions** (*.types.ts)
- **Independent caching**
- **Error handling**

**Example from FetchService:**

```typescript
class FetchService {
  private domain: string;
  private baseDir: string;

  // Caching strategy
  getCachePaths(url: string): CachePaths

  // Content comparison
  private compareContent(old, new): ContentComparison

  // Main operation
  async fetch(url: string, force: boolean): FetchResult
}
```

## Data Flow Architecture

### Ingestion Pipeline

```
User: npm run cli -- batch
  ↓
BatchCommand (src/cli/commands/batch.ts)
  ↓ for each URL
  ├─→ FetchService.fetch(url)
  │   ├─→ node-fetch (network)
  │   ├─→ Content diff (detect changes)
  │   └─→ .data/{domain}/cache/{path}/content.html
  │
  ├─→ ExtractService + Python Script
  │   ├─→ tools/extract.py
  │   ├─→ Claude CLI (subprocess)
  │   └─→ .data/{domain}/structured/{page}.json
  │
  └─→ EmbedService.embed(json)
      ├─→ Ollama/OpenAI (embeddings)
      ├─→ QdrantClient.upsert(points)
      └─→ ManifestService.update(status)
```

### Search Flow

```
Claude Code User: "How do I implement hooks?"
  ↓
MCP Server (stdio transport)
  ↓
search_claude_code_docs tool
  ↓
searchDocumentation(qdrant, params)
  ├─→ generateEmbedding(query, provider)
  ├─→ qdrant.search(collection, vector)
  └─→ formatSearchResults(hits)
  ↓
Return formatted text to Claude
```

## Database Schema (Qdrant)

**From src/services/embed-service.ts:**

```typescript
// Qdrant Point Structure
{
  id: UUID,
  vector: number[],  // 768 (Ollama) or 1536 (OpenAI)
  payload: {
    content: string,           // The actual text
    title: string,             // Document title
    section: string,           // Section name
    url: string,               // Source URL
    codeExamples: string[],    // Code snippets
    keyConcepts: string[],     // Extracted concepts
    searchKeywords: string[],  // Semantic keywords
    aliases: string[],         // Alternative names
    provider: string,          // 'ollama' | 'openai'
    lastUpdated: string,       // ISO timestamp
    extractionMethod: 'claude-driven',
    pageTitle: string,
    summary: string
  }
}
```

**Collections:**
- `claude-code-docs-ollama` (768 dimensions)
- `claude-code-docs-openai` (1536 dimensions)

## File System Structure

**From code analysis:**

```
.data/{domain}/
  ├── cache/{url-path}/
  │   ├── content.html      # Raw HTML
  │   └── meta.json         # Fetch metadata
  │
  ├── structured/
  │   └── {page}.json       # Claude-extracted JSON
  │
  ├── logs/
  │   ├── pipeline/         # Pipeline logs
  │   └── errors/           # Error logs
  │
  └── manifest.json         # Ingestion tracking
```

## API Endpoints & Interfaces

### MCP Tool Interface

**From src/mcp-tools/index.ts:**

```typescript
{
  name: 'search_claude_code_docs',
  inputSchema: {
    query: string,           // required
    provider: 'ollama' | 'openai' | 'both',  // default: 'ollama'
    limit: number            // default: 3, max: 10
  }
}
```

### CLI Commands

**From src/cli/index.ts:**

```bash
claude-code-docs-mcp batch [options]
  --pages <pages...>     # Specific pages
  --provider <provider>  # ollama|openai|both
  --model <model>        # Claude model
  --force               # Re-ingest
  --dry-run             # Preview only
  --ttl-days <days>     # Cache TTL

claude-code-docs-mcp search <query> [options]
  --provider <provider>  # ollama|openai|both
  --limit <number>       # Max results

claude-code-docs-mcp list
```

## External Service Integration

### 1. Qdrant Vector Database

**Connection from src/index.ts:**

```typescript
const qdrant = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: parseInt(process.env.QDRANT_PORT || '6333')
});
```

**Operations used:**
- `createCollection()` - Setup with dimensions
- `upsert()` - Batch insert points
- `search()` - Vector similarity search
- `getCollection()` - Check existence

### 2. Ollama (Local Embeddings)

**From src/utils/embeddings.ts:**

```typescript
import ollama from 'ollama';

const response = await ollama.embeddings({
  model: 'nomic-embed-text',
  prompt: text
});
return response.embedding; // number[] (768 dims)
```

### 3. OpenAI (Cloud Embeddings)

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await client.embeddings.create({
  model: 'text-embedding-ada-002',
  input: text
});
return response.data[0].embedding; // number[] (1536 dims)
```

### 4. Claude CLI (via Python)

**From tools/extract.py:**

```python
# Subprocess call to Claude CLI
result = subprocess.run([
    'claude',
    '--output', 'text',
    prompt
], capture_output=True, text=True, timeout=300)
```

**Integration pattern:**
- TypeScript → Python subprocess
- Python → Claude CLI subprocess
- Claude reads HTML file with Read tool
- Returns structured JSON

## Infrastructure Code

### Environment Configuration

**From .env.example:**

```bash
# Required for MCP Server
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Required for embeddings
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
DEFAULT_EMBEDDING_PROVIDER=ollama

# Optional (for OpenAI)
OPENAI_API_KEY=sk-...
```

### CI/CD (GitHub Actions)

**From .github/workflows/test.yml:**

```yaml
jobs:
  unit-tests:
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    steps:
      - npm ci
      - npm run build
      - npm run test:unit

  integration-tests:
    services:
      qdrant:
        image: qdrant/qdrant:latest
        ports: [6333:6333]
    steps:
      - npm run test:integration

  lint-and-format:
    steps:
      - npm run build
      - npx depcheck
```

## Performance Characteristics

### Async/Await Usage
- **35 files** use async/await patterns
- All service methods are asynchronous
- Proper error handling with try/catch

### Batch Operations
- Batch embedding generation
- Batch Qdrant upsert (reduces network calls)
- Parallel stage execution support

### Caching Strategy
- Content-based cache invalidation (hash comparison)
- 7-day TTL on manifest tracking
- Normalized HTML for comparison (removes noise)

## Architecture Decisions & Trade-offs

**Why MCP Protocol?**
- Native Claude integration
- Standardized tool interface
- Seamless user experience

**Why Hybrid Embedding Support?**
- Privacy (local Ollama)
- Quality (cloud OpenAI)
- User choice

**Why Python for Extraction?**
- Claude CLI subprocess management
- Mature subprocess handling
- Easy logging and error handling

**Why Service Pattern?**
- Testable units
- Independent caching
- Clear responsibilities
- Easy to extend
