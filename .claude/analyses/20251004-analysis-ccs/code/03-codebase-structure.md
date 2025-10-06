# Codebase Structure - Code Analysis

**Generated**: 2025-10-04
**Method**: Directory tree + import analysis

## Directory Structure (Excluding node_modules)

```
claude-code-docs-mcp/
│
├── src/                          # Main source code (3,850 lines TS)
│   ├── index.ts                  # MCP server entry point
│   ├── cli/                      # CLI application
│   │   ├── index.ts              # CLI entry (120 lines)
│   │   ├── commands/             # Command implementations
│   │   │   ├── seed.ts           # Bootstrap command (class)
│   │   │   ├── sync.ts           # Update stale docs (class)
│   │   │   ├── search.ts         # Search command (class)
│   │   │   ├── sources.ts        # List sources (class)
│   │   │   ├── ingest.ts         # Full pipeline (function)
│   │   │   ├── fetch.ts          # Fetch stage (function)
│   │   │   ├── extract.ts        # Extract stage (function)
│   │   │   ├── embed.ts          # Embed stage (function)
│   │   │   ├── status.ts         # Status check (function)
│   │   │   └── list.ts           # List docs (function)
│   │   └── pipeline/             # Pipeline orchestration
│   │       ├── index.ts          # Pipeline runner
│   │       ├── fetch.ts          # Fetch stage
│   │       ├── extract.ts        # Extract stage
│   │       ├── embed.ts          # Embed stage
│   │       └── types.ts          # Shared types
│   ├── services/                 # Core business logic
│   │   ├── fetch-service.ts      # HTTP + caching (233 lines)
│   │   ├── extract-service.ts    # Claude extraction (100+ lines)
│   │   ├── embed-service.ts      # Embedding generation (200+ lines)
│   │   ├── manifest-service.ts   # Per-domain tracking
│   │   ├── master-manifest-service.ts  # Cross-domain tracking
│   │   ├── pipeline-logging-service.ts # Pipeline state
│   │   └── *.types.ts            # Type definitions (11 files)
│   ├── mcp-tools/                # MCP protocol implementations
│   │   ├── index.ts              # Tool registration
│   │   └── search/               # Search tool
│   │       ├── search.ts         # Search implementation
│   │       └── search.types.ts   # Search types
│   ├── config/                   # Configuration
│   │   ├── constants.ts          # App constants (TTL, etc)
│   │   └── claude-code-documentation-urls.ts  # URL config
│   └── utils/                    # Shared utilities
│       ├── embeddings.ts         # Embedding utilities
│       ├── logger.ts             # Logging
│       ├── setup-collection.ts   # Qdrant setup
│       └── integration-test.ts   # Integration test runner
│
├── tests/                        # Test suite (375 tests)
│   ├── setup.ts                  # Test configuration
│   ├── unit/                     # Unit tests (24 files)
│   │   ├── cli/                  # CLI tests
│   │   ├── services/             # Service tests
│   │   ├── mcp-tools/            # MCP tool tests
│   │   ├── config/               # Config tests
│   │   └── utils/                # Util tests
│   ├── integration/              # Integration tests (8 files)
│   ├── fixtures/                 # Test data
│   └── mocks/                    # Test mocks
│
├── tools/                        # Python extraction tools
│   ├── extract.py                # Claude extraction script
│   └── lib/                      # Python libraries
│       ├── claude_client.py      # Claude API client
│       ├── html_cleaner.py       # HTML preprocessing
│       ├── json_utils.py         # JSON utilities
│       └── logger.py             # Python logging
│
├── .data/                        # Runtime data (gitignored)
│   └── {domain}/                 # Per-domain storage
│       ├── manifest.json         # Tracking
│       ├── cache/                # HTML cache
│       └── structured/           # Extracted JSON
│
├── .local/                       # Development artifacts (gitignored)
│   ├── legacy/                   # Old implementations
│   ├── claude-outputs/           # Claude test outputs
│   └── examples/                 # Example data
│
├── .claude/                      # Claude Code workspace
│   ├── handovers/                # Session handovers
│   └── analyses/                 # Previous analyses
│
├── build/                        # Compiled TypeScript
│   └── src/                      # Mirrors src/ structure
│
├── analysis/                     # This analysis
│   └── code/                     # Code analysis reports
│
└── node_modules/                 # Dependencies (13 prod + 11 dev)

Config files (root):
├── package.json                  # Dependencies + scripts
├── tsconfig.json                 # TypeScript config
├── vitest.config.ts              # Test config
├── eslint.config.js              # Linting config
├── .prettierrc.json              # Code formatting
├── .env.example                  # Environment template
└── .gitignore                    # Git exclusions
```

## File Counts by Directory

```bash
src/              95 .ts files
tests/            32 test files
tools/            7 .py files
```

## Module Dependencies (Import Analysis)

### Core Entry Points

**1. MCP Server** (`src/index.ts`):
```typescript
Imports:
  @modelcontextprotocol/sdk     → MCP protocol
  @qdrant/js-client-rest        → Vector database
  dotenv                         → Config
  ./mcp-tools/index.js          → Tool registry

Exports:
  [None - executable server]
```

**2. CLI** (`src/cli/index.ts`):
```typescript
Imports:
  commander                      → CLI framework
  chalk                          → Terminal styling
  ./commands/*                   → All CLI commands
  ./pipeline/*                   → Pipeline orchestration

Exports:
  [None - executable CLI]
```

**3. Services** (all in `src/services/`):
```typescript
FetchService:
  node-fetch                     → HTTP client
  crypto                         → Content hashing
  fs, path                       → File operations

ExtractService:
  fs, path                       → File operations
  ./extract-service.types.ts     → Types

EmbedService:
  @qdrant/js-client-rest        → Vector DB
  uuid                           → ID generation
  ../utils/embeddings.js         → Embedding utils
  ./embed-service.types.ts       → Types

ManifestService:
  fs, path                       → File operations
  ./master-manifest-service.js   → Cross-domain tracking

MasterManifestService:
  fs, path                       → File operations

PipelineLoggingService:
  fs, path                       → File operations
```

### Dependency Graph (Layered)

```
Layer 1 (Foundation):
  utils/embeddings.ts            → Embedding generation
  utils/logger.ts                → Logging
  config/constants.ts            → App constants

Layer 2 (Services):
  services/fetch-service.ts      → Uses: logger
  services/extract-service.ts    → Uses: logger
  services/embed-service.ts      → Uses: embeddings, logger
  services/manifest-service.ts   → Uses: logger, master-manifest
  services/master-manifest-service.ts → Uses: logger

Layer 3 (Pipeline):
  cli/pipeline/fetch.ts          → Uses: FetchService, logging-service
  cli/pipeline/extract.ts        → Uses: ExtractService, logging-service
  cli/pipeline/embed.ts          → Uses: EmbedService, logging-service
  cli/pipeline/index.ts          → Uses: all pipeline stages

Layer 4 (Commands):
  cli/commands/*.ts              → Uses: pipeline, services

Layer 5 (Entry):
  src/index.ts                   → Uses: mcp-tools
  src/cli/index.ts               → Uses: commands
```

**Key Insight**: Clean layered architecture, no circular dependencies detected

## Largest Files (Lines of Code)

```bash
# From wc -l analysis
 233 src/services/fetch-service.ts          # HTTP + caching logic
 200+ src/services/embed-service.ts         # Embedding + Qdrant
 120 src/cli/index.ts                       # CLI router
 115 src/cli/pipeline/extract.ts            # Extract orchestration
 100+ src/services/extract-service.ts       # Extraction logic
```

**Pattern**: Largest files are services, not commands (good separation)

## Configuration Files

### TypeScript Configuration

**tsconfig.json**:
```json
{
  "target": "ES2022",
  "module": "Node16",           // ES modules
  "moduleResolution": "Node16",
  "outDir": "./build",
  "strict": true,               // Strict type checking
  "paths": {
    "@/*": ["src/*"],           // Path aliases
    "@tests/*": ["tests/*"]
  }
}
```

**tsconfig.eslint.json**:
```json
{
  // Extended config for ESLint
  // Includes test files
}
```

### Test Configuration

**vitest.config.ts**:
```typescript
// Vitest 3.2.4
// Coverage: v8
// UI mode available
// Separate unit/integration configs
```

### Linting & Formatting

**eslint.config.js**:
```javascript
// Flat config (new ESLint format)
// TypeScript-ESLint + Prettier integration
// Strict rules for production
// Relaxed rules for tests
// Ignores: build/, .data/, .local/
```

**.prettierrc.json**:
```json
{
  // Code formatting rules
  // Integrated with ESLint
}
```

## Execution Flow (Traced)

### MCP Server Flow

```
1. Start: src/index.ts
2. Load env: dotenv.config()
3. Initialize Qdrant client
4. Register tools: mcp-tools/index.ts
   └─> search_claude_code_docs
5. Start stdio transport
6. Wait for MCP requests
```

### CLI Search Flow

```
1. Entry: src/cli/index.ts
2. Parse command: 'search <query>'
3. Create SearchCommand instance
4. Execute: SearchCommand.run()
   ├─> Connect to Qdrant
   ├─> Generate query embedding (embeddings.ts)
   ├─> Search vector DB (search.ts)
   └─> Format + display results
```

### Ingestion Flow (seed/sync)

```
1. Entry: src/cli/index.ts
2. Parse command: 'seed' or 'sync'
3. Create command instance
4. Execute pipeline:

   Stage 1 - Fetch:
   ├─> cli/pipeline/fetch.ts
   ├─> FetchService.fetch()
   ├─> HTTP GET + cache to .data/{domain}/cache/
   └─> Update manifest

   Stage 2 - Extract:
   ├─> cli/pipeline/extract.ts
   ├─> Spawn Python process (tools/extract.py)
   ├─> Claude AI processes HTML → JSON
   ├─> ExtractService.save()
   └─> Cache to .data/{domain}/structured/

   Stage 3 - Embed:
   ├─> cli/pipeline/embed.ts
   ├─> EmbedService.embed()
   ├─> Generate embeddings (Ollama/OpenAI)
   ├─> Upsert to Qdrant
   └─> Update manifest with timestamp
```

## Dead Code Analysis

**Legacy Python Tools** (`tools/lib/`):
```python
# 7 Python files still present
# Used by extract pipeline (tools/extract.py)
# Not dead code - actively used
```

**Legacy TypeScript** (`.local/legacy/`):
```
# Old implementations preserved
# Not in build, not imported
# Safe to remove (archived)
```

## Orphaned Files

**None detected** - All source files trace back to entry points

## Build Artifacts

**build/** directory:
- Mirrors `src/` structure
- JavaScript + source maps
- Entry: `build/index.js` (from package.json bin)
- Generated by: `tsc` (TypeScript compiler)

## Key Patterns

1. **Type Co-location**: Every service has companion `.types.ts`
2. **Test Mirroring**: Test structure mirrors `src/` structure
3. **Single Entry Points**: Clear entry for MCP, CLI, and tests
4. **Environment-Based Config**: No hardcoded values
5. **Separation of Concerns**: CLI → Pipeline → Services → Utils
