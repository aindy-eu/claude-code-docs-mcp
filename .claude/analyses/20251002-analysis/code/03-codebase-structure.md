# Codebase Structure - Code Analysis

**Analysis Method:** File System Inspection + Import Analysis

## Directory Tree

```
claude-code-docs-mcp/
├── src/                          # TypeScript source (58 files, 3,315 LOC)
│   ├── index.ts                  # MCP server entry point
│   ├── cli/                      # CLI commands & orchestration
│   │   ├── index.ts              # CLI entry point (Commander)
│   │   ├── commands/             # Command implementations
│   │   │   ├── batch.ts          # Batch ingestion
│   │   │   ├── batch.types.ts
│   │   │   ├── search.ts         # Search command
│   │   │   └── search.types.ts
│   │   └── orchestrator/         # Pipeline orchestration
│   │       ├── index.ts          # Main orchestrator
│   │       ├── types.ts
│   │       ├── fetch.ts          # Fetch stage
│   │       ├── extract.ts        # Extract stage
│   │       └── embed.ts          # Embed stage
│   ├── config/                   # Configuration
│   │   ├── constants.ts          # Global constants
│   │   ├── documentation-urls.ts # URL configuration
│   │   └── documentation-urls.types.ts
│   ├── mcp-tools/                # MCP tool implementations
│   │   ├── index.ts              # Tool registration
│   │   └── search/               # Search tool
│   │       ├── search.ts
│   │       └── search.types.ts
│   ├── services/                 # Core business logic
│   │   ├── embed-service.ts      # Embedding generation
│   │   ├── embed-service.types.ts
│   │   ├── extract-service.ts    # JSON extraction caching
│   │   ├── extract-service.types.ts
│   │   ├── fetch-service.ts      # HTML fetching + caching
│   │   ├── fetch-service.types.ts
│   │   ├── manifest-service.ts   # Ingestion tracking
│   │   ├── manifest-service.types.ts
│   │   ├── pipeline-logging-service.ts
│   │   └── pipeline-logging-service.types.ts
│   └── utils/                    # Utilities
│       ├── embeddings.ts         # Embedding providers
│       ├── logger.ts             # Logging utility
│       ├── integration-test.ts   # Integration test runner
│       └── setup-collection.ts   # Qdrant setup
│
├── tests/                        # Test suite (15 files, 132 tests)
│   ├── setup.ts                  # Jest configuration
│   ├── test-runner.ts            # Test orchestrator
│   ├── fixtures/                 # Test data
│   │   └── mockSearchResults.ts
│   ├── mocks/                    # Mock implementations
│   │   └── qdrantClient.ts
│   ├── unit/                     # Unit tests
│   │   ├── config/
│   │   │   └── documentation-urls.test.ts
│   │   ├── mcp-tools/
│   │   │   └── search/
│   │   │       ├── search.test.ts
│   │   │       └── search-types.test.ts
│   │   └── services/
│   │       ├── embed-service/
│   │       │   └── embeddings.test.ts
│   │       ├── extract-service/
│   │       │   └── extract-service.test.ts
│   │       ├── fetch-service/
│   │       │   └── content-diff.test.ts
│   │       ├── manifest-service/
│   │       │   └── manifest-service.test.ts
│   │       └── pipeline-logging-service/
│   │           └── pipeline-logging-service.test.ts
│   └── integration/              # Integration tests
│       ├── manifest-tracking.test.ts
│       ├── mcp-tools.test.ts
│       └── qdrant.test.ts
│
├── tools/                        # Python extraction tools
│   ├── extract.py                # Claude CLI wrapper
│   └── lib/                      # Python utilities
│       ├── __init__.py
│       ├── claude_client.py      # Claude CLI interface
│       # (html_cleaner.py removed - HTML cleaning now in TypeScript fetch-service)
│       ├── json_utils.py         # JSON validation
│       └── logger.py             # Python logging
│
├── .data/                        # Runtime data (gitignored)
│   └── {domain}/
│       ├── cache/                # HTML cache
│       ├── structured/           # JSON cache
│       ├── logs/                 # Pipeline logs
│       └── manifest.json         # Ingestion tracking
│
├── .github/                      # CI/CD
│   └── workflows/
│       └── test.yml              # GitHub Actions
│
├── build/                        # Compiled output (gitignored)
│   └── *.js
│
├── node_modules/                 # Dependencies (gitignored)
│
├── .env                          # Environment (gitignored)
├── .env.example                  # Environment template
├── .env.test                     # Test environment
├── .gitignore
├── eslint.config.js              # ESLint configuration
├── jest.config.js                # Jest configuration
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Lock file
├── prettier.config.js            # Prettier config
├── tsconfig.json                 # TypeScript config
├── tsconfig.eslint.json          # ESLint TypeScript config
└── CLAUDE.md                     # Project context (this analysis source)
```

## Module Dependencies

### Entry Points

**1. MCP Server Entry**
```typescript
src/index.ts
  → @modelcontextprotocol/sdk
  → @qdrant/js-client-rest
  → ./mcp-tools/index.js (registerTools)
  → dotenv
```

**2. CLI Entry**
```typescript
src/cli/index.ts
  → commander
  → chalk
  → ./orchestrator/index.js (PipelineOrchestrator)
  → ./commands/batch.js (BatchCommand)
  → ./commands/search.js (SearchCommand)
```

**3. Python Entry**
```python
tools/extract.py
  → subprocess (Claude CLI)
  → lib.claude_client
  → lib.json_utils
  → lib.logger
```

### Import Graph (Key Flows)

```
MCP Server Flow:
index.ts
  └─→ mcp-tools/index.ts
      └─→ mcp-tools/search/search.ts
          ├─→ utils/embeddings.ts (generateEmbedding)
          └─→ @qdrant/js-client-rest

CLI Batch Flow:
cli/index.ts
  └─→ cli/commands/batch.ts
      └─→ cli/orchestrator/index.ts
          ├─→ cli/orchestrator/fetch.ts
          │   └─→ services/fetch-service.ts
          ├─→ cli/orchestrator/extract.ts
          │   └─→ services/extract-service.ts
          │       └─→ tools/extract.py (subprocess)
          └─→ cli/orchestrator/embed.ts
              └─→ services/embed-service.ts
                  ├─→ utils/embeddings.ts
                  └─→ services/manifest-service.ts

Search Flow:
cli/commands/search.ts
  └─→ mcp-tools/search/search.ts
      ├─→ utils/embeddings.ts
      └─→ @qdrant/js-client-rest
```

### Service Dependencies

```
services/fetch-service.ts
  → node-fetch (HTTP)
  → crypto (hashing)
  → fs (caching)

services/extract-service.ts
  → fs (JSON caching)
  → No external services

services/embed-service.ts
  → utils/embeddings.ts
  → @qdrant/js-client-rest
  → uuid

services/manifest-service.ts
  → fs (manifest persistence)
  → crypto (hashing)

utils/embeddings.ts
  → ollama (local embeddings)
  → openai (cloud embeddings)
  → dotenv (config)
```

## Configuration Files

### TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "strict": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["src/*"]  // Path alias
    }
  }
}
```

### Jest Configuration

**jest.config.js:**
```javascript
{
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000
}
```

### ESLint Configuration

**eslint.config.js:**
```javascript
{
  plugins: ['@typescript-eslint', 'jest', 'prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'prettier/prettier': 'error'
  }
}
```

### Package Scripts

**package.json scripts:**
```json
{
  "build": "tsc && chmod 755 build/index.js",
  "cli": "tsx src/cli/index.ts",
  "start": "tsx src/index.ts",
  "test": "jest",
  "test:unit": "jest tests/unit",
  "test:integration": "jest tests/integration",
  "test:coverage": "jest --coverage",
  "lint": "eslint . --ext .ts,.tsx",
  "lint:fix": "eslint . --ext .ts,.tsx --fix",
  "format": "prettier --write \"src/**/*.{ts,tsx,json}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,json}\""
}
```

## Execution Flow Tracing

### 1. MCP Server Startup

```
$ node build/index.js

1. src/index.ts (main)
   ↓
2. config() - Load .env
   ↓
3. new Server({ name: 'claude-code-docs', version })
   ↓
4. new QdrantClient({ host, port })
   ↓
5. registerTools(server, qdrant)
   ↓ (from mcp-tools/index.ts)
6. server.setRequestHandler(ListToolsRequestSchema)
   server.setRequestHandler(CallToolRequestSchema)
   ↓
7. new StdioServerTransport()
   ↓
8. server.connect(transport)
   ↓
✓ Ready for MCP requests
```

### 2. Batch Ingestion

```
$ npm run cli -- batch --pages overview

1. src/cli/index.ts
   ↓
2. new Command('claude-code-docs-mcp')
   ↓
3. command('batch') → BatchCommand
   ↓
4. batchCommand.execute(options)
   ↓
5. new PipelineOrchestrator()
   ↓
6. For each URL:
   ├─→ orchestrator.ingest(url, options)
   │   ├─→ fetchStage(url) → FetchService
   │   │   └─→ fetch(url) → HTML + change detection
   │   ├─→ extractStage(url) → ExtractService
   │   │   └─→ exec('python3 tools/extract.py ...')
   │   │       └─→ Claude CLI → JSON
   │   └─→ embedStage(url) → EmbedService
   │       ├─→ generateEmbedding() → Ollama/OpenAI
   │       └─→ qdrant.upsert()
   └─→ ManifestService.update(status)
```

### 3. Search Query

```
$ npm run cli -- search "hooks"

1. src/cli/index.ts → SearchCommand
   ↓
2. searchCommand.execute(query, options)
   ↓
3. searchDocumentation(qdrant, params)
   ↓ (from mcp-tools/search/search.ts)
4. generateEmbedding(query, provider)
   ↓
5. qdrant.search(collection, { vector, limit })
   ↓
6. formatSearchResults(results)
   ↓
7. console.log(formatted)
```

## Dead Code & Orphaned Files

### Found in .local/ Directory

```
.local/
├── legacy/                       # ⚠️ Legacy code (not used)
│   ├── ingestion-manifest.ts
│   ├── migrate-manifest-urls.ts
│   ├── html-cache.test.ts
│   ├── ingestion-prompts.ts
│   ├── structured-cache.ts
│   ├── generate-url-config.ts
│   ├── ingestion-tracker.ts
│   ├── process-claude-output.ts
│   ├── html-cache.ts
│   ├── ingestion-status.ts
│   ├── claude-output-processor.js
│   └── test-search.ts
├── structured-cache.ts           # ⚠️ Replaced by services
└── extract.py                    # ⚠️ Duplicate of tools/extract.py
```

**Analysis**: These are historical implementations before the current service architecture. Not imported anywhere in active code.

### Unused Imports

**From eslint analysis:**
- No significant unused imports detected
- All service imports are actively used

### Type-Only Files

These files only export types (0% coverage is expected):

```
src/config/documentation-urls.types.ts
src/services/embed-service.types.ts
src/services/extract-service.types.ts
src/services/fetch-service.types.ts
src/services/manifest-service.types.ts
src/services/pipeline-logging-service.types.ts
src/mcp-tools/search/search.types.ts
src/cli/commands/batch.types.ts
src/cli/commands/search.types.ts
src/cli/orchestrator/types.ts
```

## File Organization Patterns

### 1. Service Pattern

```
{service-name}/
  ├── {service}.ts        # Implementation
  └── {service}.types.ts  # Type definitions
```

Example:
```
services/
  ├── fetch-service.ts
  └── fetch-service.types.ts
```

### 2. Feature Pattern

```
{feature}/
  ├── index.ts           # Main logic
  └── {feature}.types.ts # Type definitions
```

Example:
```
mcp-tools/search/
  ├── search.ts
  └── search.types.ts
```

### 3. Test Mirroring

Tests mirror source structure:

```
src/services/fetch-service.ts
tests/unit/services/fetch-service/content-diff.test.ts
```

## Module Boundaries

### Clean Boundaries

✅ **MCP Tools** → Only depend on services + utils
✅ **Services** → Only depend on utils + external packages
✅ **Utils** → Only depend on external packages
✅ **CLI** → Can use all layers (top-level)

### Boundary Violations

None found. Clean layered architecture.

## Build Artifacts

### Source → Build Mapping

```
src/index.ts         → build/index.js (executable)
src/**/*.ts          → build/**/*.js
tsconfig.json        → Controls compilation
```

### Executable Setup

```javascript
// src/index.ts
#!/usr/bin/env node

// package.json
"bin": {
  "claude-code-docs-mcp": "./build/index.js"
}

// Build script
"build": "tsc && chmod 755 build/index.js"
```

## Code Organization Quality

### Strengths

✅ Clear separation of concerns (MCP, CLI, Services, Utils)
✅ Consistent naming conventions
✅ Type definitions separated from implementation
✅ Test structure mirrors source structure
✅ No circular dependencies detected
✅ Clean import paths with path aliases

### Areas for Improvement

⚠️ Legacy code in `.local/` should be removed
⚠️ Python tools could be consolidated into one module
⚠️ Some services have 0% test coverage
