# Codebase Structure - Code Analysis

**Generated:** 2025-10-03
**Method:** Directory traversal and file inspection

## Directory Tree

```
claude-code-docs-mcp/
├── .data/                      # Runtime data (cache, manifests)
├── .github/
│   └── workflows/
│       └── test.yml            # CI/CD pipeline
├── analysis/
│   └── code/                   # This analysis
├── build/                      # TypeScript compilation output
│   ├── src/
│   └── tests/
├── node_modules/               # 8,842 JS files from dependencies
├── src/                        # 39 TypeScript source files
│   ├── cli/
│   │   ├── commands/           # 9 command implementations
│   │   │   ├── embed.ts
│   │   │   ├── extract.ts
│   │   │   ├── fetch.ts
│   │   │   ├── ingest.ts
│   │   │   ├── list.ts
│   │   │   ├── search.ts       # SearchCommand class
│   │   │   ├── search.types.ts
│   │   │   ├── seed.ts         # SeedCommand class
│   │   │   ├── seed.types.ts
│   │   │   ├── status.ts
│   │   │   ├── sync.ts         # SyncCommand class
│   │   │   └── sync.types.ts
│   │   ├── pipeline/           # 4 pipeline stages
│   │   │   ├── embed.ts        # Embedding stage
│   │   │   ├── extract.ts      # Extraction stage
│   │   │   ├── fetch.ts        # Fetch stage
│   │   │   ├── index.ts        # Pipeline orchestration
│   │   │   └── types.ts        # Shared types
│   │   └── index.ts            # CLI entry point (#!/usr/bin/env node)
│   ├── config/
│   │   ├── constants.ts        # DEFAULT_TTL_DAYS = 7
│   │   ├── documentation-urls.ts       # URL source definitions
│   │   └── documentation-urls.types.ts # DocumentationSource types
│   ├── mcp-tools/
│   │   ├── search/
│   │   │   ├── search.ts       # searchDocumentation, formatSearchResults
│   │   │   └── search.types.ts # SearchResult, SearchParams
│   │   └── index.ts            # registerTools (MCP tool registration)
│   ├── services/
│   │   ├── __mocks__/          # Service mocks for tests
│   │   ├── embed-service.ts            # EmbedService class (326 lines)
│   │   ├── embed-service.types.ts      # ClaudeDocOutput, ProcessedDocument
│   │   ├── extract-service.ts          # ExtractService class
│   │   ├── extract-service.types.ts
│   │   ├── fetch-service.ts            # FetchService class (246 lines)
│   │   ├── fetch-service.types.ts      # FetchResult, CachePaths
│   │   ├── manifest-service.ts         # ManifestService class
│   │   ├── manifest-service.types.ts   # ManifestEntry
│   │   ├── pipeline-logging-service.ts # PipelineLoggingService
│   │   └── pipeline-logging-service.types.ts
│   ├── utils/
│   │   ├── embeddings.ts       # generateEmbedding, EMBEDDING_CONFIGS
│   │   ├── integration-test.ts # Manual integration test
│   │   ├── logger.ts           # logger utility
│   │   └── setup-collection.ts # Qdrant collection setup
│   └── index.ts                # MCP server entry point (#!/usr/bin/env node)
├── tests/                      # 30 test files
│   ├── fixtures/               # Test data
│   ├── integration/            # 6 integration tests
│   │   ├── embed-service.test.ts
│   │   ├── extract-service.test.ts
│   │   ├── fetch-service.test.ts
│   │   ├── manifest-tracking.test.ts
│   │   ├── mcp-tools.test.ts
│   │   ├── pipeline-end-to-end.test.ts
│   │   └── qdrant.test.ts
│   ├── unit/                   # 24 unit tests
│   │   ├── cli/
│   │   │   ├── commands/       # 8 command tests
│   │   │   ├── pipeline/       # 4 pipeline tests
│   │   │   └── index.test.ts
│   │   ├── config/
│   │   │   └── documentation-urls.test.ts
│   │   ├── mcp-tools/
│   │   │   └── search/
│   │   ├── services/           # 4 service tests
│   │   └── utils/
│   └── setup.ts                # Vitest setup
├── tools/                      # Legacy scripts (deprecated)
│   └── lib/
├── .env.example                # Environment template
├── .prettierrc.json           # Prettier config
├── eslint.config.mjs          # ESLint flat config
├── package-lock.json          # Locked dependencies
├── package.json               # Project manifest
├── tsconfig.eslint.json       # ESLint-specific TS config
├── tsconfig.json              # Main TypeScript config
└── vitest.config.ts           # Vitest configuration
```

## File Count by Type

```
TypeScript Source Files:    39 (src/)
Test Files:                 30 (tests/)
Configuration Files:         7 (.prettierrc, tsconfig, etc.)
Total TypeScript:           69 files
JavaScript (node_modules): 8,842 files
```

## Lines of Code Analysis

```bash
# Actual count from find + wc
TypeScript source:  3,591 lines (src/)
Test code:         ~2,000 lines estimated (tests/)
Total codebase:    ~5,600 lines
```

## Module Organization

### Entry Points (Actual Executables)

1. **MCP Server:** `src/index.ts` (#!/usr/bin/env node)
   - Starts MCP server with stdio transport
   - Registers search_claude_code_docs tool
   - Connects to Qdrant

2. **CLI:** `src/cli/index.ts` (#!/usr/bin/env node)
   - Registers 11 commands
   - Uses Commander for parsing
   - Executes pipeline stages

3. **Build Artifacts:**
   - `build/index.js` - Compiled MCP server
   - `build/src/index.js` - chmod 755 for execution
   - Package bin: `claude-code-docs-mcp`

### Service Layer (5 Services)

**FetchService** (246 lines, src/services/fetch-service.ts)
- HTML fetching and caching
- Content comparison with hashing
- Cache path management
- Redirect handling

**ExtractService** (src/services/extract-service.ts)
- Spawns Claude Code subprocess
- JSON cleaning (removes markdown wrappers)
- Output validation
- Error handling

**EmbedService** (326 lines, src/services/embed-service.ts)
- Document extraction from ClaudeDocOutput
- Embedding generation
- Qdrant batch upsert
- Collection management

**ManifestService** (src/services/manifest-service.ts)
- Ingestion tracking
- 7-day TTL management
- Stage progression tracking
- JSON persistence

**PipelineLoggingService** (src/services/pipeline-logging-service.ts)
- Stage logging
- Progress tracking
- Error aggregation

### Command Layer (11 Commands)

**Simple Commands** (function-based):
- `fetch`, `extract`, `embed`, `ingest`
- `status`, `list`

**Complex Commands** (class-based):
- `SearchCommand` - Search with formatting
- `SeedCommand` - Bootstrap database
- `SyncCommand` - TTL-based updates

**Command Pattern:**
```typescript
// Simple: src/cli/commands/fetch.ts
export function registerFetchCommand(program: Command) {
  program.command('fetch').action(async () => {
    await fetchStage({ url });
  });
}

// Complex: src/cli/commands/seed.ts
export class SeedCommand {
  async run(options: SeedOptions) {
    // 50+ lines of business logic
  }
}
```

### Configuration Layer

**constants.ts:**
```typescript
export const DEFAULT_TTL_DAYS = 7;
export const CACHE_DIR = '.data';
```

**documentation-urls.ts:**
```typescript
export const DOCUMENTATION_SOURCES: DocumentationSource[] = [
  {
    name: 'Claude Code Documentation',
    baseUrl: process.env.DOCS_BASE_URL || 'https://docs.claude.com',
    corePages: [...],
    allPages: [...]
  }
];
```

## Module Dependencies (Import Graph)

### High-Level Dependency Flow

```
CLI/MCP Entry Points
  ↓
Commands/Tools
  ↓
Pipeline Stages
  ↓
Services (FetchService, ExtractService, EmbedService)
  ↓
Utils (embeddings, logger)
  ↓
External Services (Qdrant, Ollama, OpenAI)
```

### Internal Imports (Most Common)

```typescript
// logger.ts - imported by ALL services
import { logger } from '../utils/logger.js';

// embeddings.ts - imported by embed and search
import { generateEmbedding, getCollectionName } from '@/utils/embeddings.js';

// Service imports
import { FetchService } from '@/services/fetch-service.js';
import { ExtractService } from '@/services/extract-service.js';
import { EmbedService } from '@/services/embed-service.js';

// Type imports (extensive)
import type { ClaudeDocOutput } from '@/services/embed-service.types.js';
```

### Path Aliases (tsconfig.json)

```json
"paths": {
  "@/*": ["src/*"],
  "@tests/*": ["tests/*"]
}
```

**Usage:** Simplified imports throughout codebase
```typescript
import { logger } from '@/utils/logger.js';
import { SearchCommand } from '@/cli/commands/search.js';
```

## Configuration Files (Actual)

### TypeScript Configuration

**tsconfig.json:**
- Target: ES2022
- Module: Node16 (native ESM)
- Strict mode: enabled
- Declaration: false (no .d.ts generation)
- Source maps: false

**tsconfig.eslint.json:**
- Extends main config
- Includes test files for linting

### Code Quality

**.prettierrc.json:**
```json
{
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "semi": true
}
```

**eslint.config.mjs:**
- Flat config format (ESLint 9)
- TypeScript parser
- Prettier integration
- Custom rules for this project

### Testing

**vitest.config.ts:**
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
```

## Dead Code Analysis

**Deprecated/Orphaned:**
- `tools/` directory - legacy scripts, replaced by CLI
- `tools/lib/` - old utilities, not imported anywhere

**Verification:**
```bash
# Check if tools/ is imported anywhere
$ grep -r "tools/" src/
# Result: No matches (confirmed dead code)
```

## Code Organization Patterns

1. **Separation of Concerns**
   - Commands: CLI interface only
   - Pipeline: Orchestration logic
   - Services: Business logic
   - Utils: Shared utilities

2. **Type Safety**
   - Every service has a `.types.ts` file
   - Extensive use of TypeScript interfaces
   - No `any` types found

3. **Testing Structure**
   - Tests mirror src/ structure
   - Unit tests in tests/unit/
   - Integration tests in tests/integration/
   - Fixtures in tests/fixtures/

4. **Service Mocking**
   - `src/services/__mocks__/` for test doubles
   - Vitest auto-mocking support

## Build Output Structure

```
build/
├── src/              # Compiled TypeScript
│   ├── cli/
│   ├── config/
│   ├── mcp-tools/
│   ├── services/
│   ├── utils/
│   └── index.js      # MCP server (chmod 755)
└── tests/            # Compiled tests (for coverage)
```

**Build Command:**
```bash
tsc && chmod 755 build/src/index.js
```
