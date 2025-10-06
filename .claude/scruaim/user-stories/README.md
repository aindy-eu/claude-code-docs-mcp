---
token_estimate: 715
updated_at: '2025-10-06 08:59:43'
---
# User Stories - Claude Code Documentation MCP Server

## Story Categories (When to Use Each)

### Core Pipeline
- **INGEST** - Documentation fetching, extraction, manifest updates
  - *When*: Adding sources, improving fetch/extract logic, handling new doc formats
- **EMBED** - Embedding generation (Ollama/OpenAI dual support)
  - *When*: Provider issues, vector quality, caching, batch performance
- **SEARCH** - Vector search, relevance, cross-source queries
  - *When*: Result quality, multi-source ranking, query optimization

### MCP Integration
- **MCP** - Protocol tools, resources, server functionality
  - *When*: New tools, protocol updates, client integration issues
- **TRACK** - Manifest system, ingestion state, deduplication
  - *When*: Tracking improvements, manifest schema, sync issues

### Data & Config
- **CLEAN** - Claude output validation, JSON processing
  - *When*: Extraction quality, output format issues, validation rules
- **CONFIG** - Provider setup, environment, CLI configuration
  - *When*: New providers, config options, environment setup

### Expansion Features
- **MULTI** - Multi-source documentation support
  - *When*: Adding new doc sources (React, Next.js, Vue, etc.)
- **VERSION** - Version tracking and awareness
  - *When*: Handling multiple framework versions (React 18 vs 17)

### Quality & Performance
- **PERF** - Performance optimizations, parallelization
  - *When*: Slow pipelines, batch improvements, caching strategies
- **TEST** - Testing infrastructure, coverage
  - *When*: Test utilities, fixtures, integration tests
- **DEBUG** - Developer debugging tools, logging
  - *When*: Troubleshooting tools, enhanced logging, introspection

### Documentation
- **DOC** - Project documentation updates
  - *When*: README changes, guides, architecture docs

## MCP Architecture (Key Patterns)

### Service-Oriented Pipeline
```
Fetch → Extract → Clean → Embed → Store → Track
```
**Never bypass services** - each step has a dedicated service with specific responsibility.

Verify services exist:
```bash
ls src/services/{fetch,extract,embed,search,manifest,master-manifest}-service.ts
```

### Dual Provider Support
- **Ollama** (default): Local, privacy-focused, free, nomic-embed-text (4096 dims)
- **OpenAI** (fallback): Cloud-based, cost per use, text-embedding-3-small (1536 dims)

**Critical**: ALWAYS support both providers in any embedding-related work.

### Domain-Agnostic Design
- Auto-extract domain from any URL: `new URL(url).hostname`
- Multi-source storage: `.data/{domain}/`
- Two-tier manifests:
  - Master: `.data/manifest.json` (tracks all sources)
  - Per-domain: `.data/{domain}/manifest.json` (tracks domain pages)

### Metadata-Rich Approach
Our competitive advantage over basic scrapers:
```typescript
{
  id, content, vector,           // Standard
  url, title, sections,           // Enhanced
  codeExamples, timestamp,        // Rich metadata
  relatedPages, tags              // Relationships
}
```
**Always preserve metadata** - it enables smarter search and relationships.

## Common Anti-Patterns

### ❌ Don't Hardcode Domains
```typescript
// BAD: Hardcoded domain
if (url.includes('docs.claude.com'))

// GOOD: Generic domain extraction
const domain = new URL(url).hostname
```

### ❌ Don't Skip Services
```typescript
// BAD: Direct Qdrant access
import { QdrantClient } from '@qdrant/js-client-rest'

// GOOD: Use SearchService
import { SearchService } from '@/services/search-service.js'
```

### ❌ Don't Assume Provider
```typescript
// BAD: OpenAI only
const embeddings = await openai.embeddings.create()

// GOOD: Use EmbedService (dual provider)
const embeddings = await embedService.generateEmbeddings()
```

### ❌ Don't Lose Metadata
```typescript
// BAD: Minimal metadata
{ id, content, vector }

// GOOD: Rich metadata (competitive advantage)
{ id, content, vector, url, title, sections, codeExamples, timestamp }
```

## File Locations (Quick Reference)

### Services (Business Logic)
- `src/services/fetch-service.ts` - URL fetching, domain extraction
- `src/services/extract-service.ts` - Claude-based content extraction
- `src/services/embed-service.ts` - Dual provider embeddings
- `src/services/search-service.ts` - Cross-source vector search
- `src/services/manifest-service.ts` - Domain-specific manifests
- `src/services/master-manifest-service.ts` - Cross-domain tracking

### CLI & Orchestration
- `src/cli/commands/` - CLI commands (ingest, search, sync, etc.)
- `src/cli/orchestrator/` - Pipeline orchestration

### MCP Integration
- `src/tools/search.ts` - MCP search tool implementation
- `src/index.ts` - MCP server entry point

### Configuration
- `src/config/claude-code-documentation-urls.ts` - Source definitions
- `src/prompts/*.prompt.md` - Extraction prompts per doc type

## Stack Specifics

### TypeScript ES Modules
```typescript
// ALWAYS use .js extension (even for .ts files)
import { SearchService } from '@/services/search-service.js'
```

### Qdrant Collections
- Naming: `claude_code_docs_{ollama|openai}`
- Dimensions: Ollama (4096), OpenAI (1536)
- Verify: `npm run list-collections`

### Testing & Quality
- **Framework**: Vitest (not Jest)
- **Coverage**: 375 tests, 81.57% coverage
- **Commands**: `npm test` (watch), `npm run test:ci` (once)

### Error Handling
```typescript
// Standard pattern (17 instances in codebase)
try {
  await service.process()
} catch (error) {
  logger.error('Context-specific message', error)
  throw error // Re-throw for caller
}
```

## User Story Workflow

For detailed story creation workflow, templates, verification commands, and quality gates:

**→ See `.claude/scruaim/user-stories/INSTRUCTIONS.md`**

This README provides project context. INSTRUCTIONS.md provides the implementation workflow.
