# 03 - Codebase Structure (Code Analysis Only)

## Directory Tree with File Counts

```
/ (Project Root)
├── src/ (91 TypeScript files)
│   ├── index.ts                    # MCP server entry point
│   ├── cli/ (6 files)
│   │   ├── index.ts                # CLI main entry
│   │   ├── commands/ (14 files)    # Individual CLI commands
│   │   │   ├── embed.ts            # Embedding generation command
│   │   │   ├── extract.ts          # Content extraction command
│   │   │   ├── fetch.ts            # Documentation fetch command
│   │   │   ├── ingest.ts           # Full pipeline command
│   │   │   ├── list.ts             # List documents command
│   │   │   ├── search.ts           # Search command
│   │   │   ├── seed.ts             # Seed data command
│   │   │   ├── status.ts           # Status check command
│   │   │   └── sync.ts             # Sync manifest command
│   │   └── pipeline/ (7 files)     # Pipeline orchestration
│   │       ├── fetch.ts            # Fetch stage implementation
│   │       ├── extract.ts          # Extract stage implementation
│   │       ├── embed.ts            # Embed stage implementation
│   │       └── types.ts            # Shared pipeline types
│   ├── services/ (13 files)
│   │   ├── embed-service.ts        # Vector embedding service
│   │   ├── extract-service.ts      # Content extraction service
│   │   ├── fetch-service.ts        # Document fetching service
│   │   ├── manifest-service.ts     # Ingestion tracking service
│   │   └── pipeline-logging-service.ts # Logging service
│   ├── config/ (5 files)
│   │   ├── documentation-urls.ts   # URL configuration
│   │   └── embeddings.ts           # Embedding configuration
│   ├── mcp-tools/ (4 files)
│   │   ├── index.ts                # Tool registration
│   │   └── search.ts               # Search tool implementation
│   └── utils/ (6 files)
│       ├── embeddings.ts           # Embedding utilities
│       ├── logger.ts               # Logging utilities
│       └── setup-collection.ts     # Qdrant setup utilities
├── tests/ (~60 test files)
│   ├── unit/ (45+ files)           # Unit tests
│   │   ├── cli/                    # CLI tests
│   │   ├── services/               # Service tests
│   │   ├── mcp-tools/              # MCP tool tests
│   │   └── config/                 # Configuration tests
│   ├── integration/ (6+ files)     # Integration tests
│   └── mocks/ (3 files)            # Test mocks
├── tools/ (12+ files)               # Shell/Python utilities
├── build/ (Compiled JS output)
└── .local/ (Legacy/experimental code)
```

## Module Dependencies (From Import Analysis)

### Core Dependencies Graph
```
index.ts (MCP Server)
    ├── @modelcontextprotocol/sdk
    ├── @qdrant/js-client-rest
    ├── mcp-tools/index.js
    └── dotenv

cli/index.ts (CLI Entry)
    ├── commander
    ├── commands/*
    └── pipeline/*

services/embed-service.ts
    ├── @qdrant/js-client-rest
    ├── uuid
    ├── utils/embeddings.js
    └── openai / ollama

services/fetch-service.ts
    ├── node-fetch
    └── jsdom

services/manifest-service.ts
    ├── @qdrant/js-client-rest
    └── uuid
```

### Import Frequency (Top Imports)
```typescript
1. chalk (15+ occurrences)       // Terminal colors
2. ora (12+ occurrences)          // Spinners
3. @qdrant/js-client-rest (10+)  // Vector DB
4. dotenv (8+)                   // Config
5. path (7+)                     // Path utilities
6. commander (5+)                // CLI framework
```

## Entry Points

### Primary Entry Points
1. **`build/index.js`** - MCP server mode (production)
2. **`src/index.ts`** - MCP server source
3. **`src/cli/index.ts`** - CLI interface

### Secondary Entry Points
- `src/utils/setup-collection.ts` - Collection setup
- `src/utils/integration-test.ts` - Integration testing
- `tests/test-runner.ts` - Test execution

## Configuration Files

### Build & Development
```
tsconfig.json                # TypeScript configuration
eslint.config.js             # ESLint rules
.prettierrc.json            # Code formatting
vitest.config.ts            # Test configuration (if exists)
package.json                # Dependencies & scripts
package-lock.json           # Dependency lock file
```

### Environment
```
.env                        # Local environment
.env.example                # Environment template
.env.test                   # Test environment
```

### CI/CD
```
.github/workflows/          # GitHub Actions (if present)
```

## Execution Flow Tracing

### MCP Server Flow
```
1. src/index.ts
   ↓
2. Initialize Qdrant client
   ↓
3. Register MCP tools (registerTools)
   ↓
4. Start StdioServerTransport
   ↓
5. Listen for tool calls
   ↓
6. Execute search_claude_code_docs
   ↓
7. Query Qdrant → Return results
```

### CLI Pipeline Flow
```
1. cli/index.ts (commander setup)
   ↓
2. Command selection (e.g., 'ingest')
   ↓
3. Pipeline stages:
   a. Fetch (fetch-service)
      → Retrieve HTML from URLs
   b. Extract (extract-service)
      → Parse HTML to structured data
   c. Embed (embed-service)
      → Generate vectors
      → Store in Qdrant
   ↓
4. Update manifest (manifest-service)
   ↓
5. Log results (pipeline-logging-service)
```

## Dead Code and Orphaned Files

### Legacy Code (.local/ directory)
- `legacy/*.ts` - Previous implementation attempts
- `claude-outputs/` - Historical outputs
- `examples/` - Example data/prompts

### Potentially Unused
- `tools/lib/` - Python utilities (project is TypeScript)
- Some test fixtures may be outdated

## Code Organization Patterns

### 1. Service Pattern
- Each service is self-contained
- Clear input/output types
- Single responsibility

### 2. Pipeline Pattern
- Stages are composable
- Each stage can run independently
- Shared types for data flow

### 3. Command Pattern
- Each CLI command is isolated
- Shared option types
- Commander integration

### 4. Type Safety
- Dedicated `.types.ts` files
- Interface definitions for all services
- Strict TypeScript configuration

## File Distribution

### By Purpose
```
Source Code:         91 TypeScript files
Tests:              ~60 test files
Configuration:       10+ config files
Documentation:       Multiple MD files (ignored for this analysis)
Build Output:        Mirrors src structure
```

### By Size (Largest Files)
1. `sync.ts` - 8974 bytes (Complex sync logic)
2. `embed-service.ts` - 10070 bytes (Core embedding logic)
3. `fetch-service.ts` - 7176 bytes (Fetching logic)
4. `manifest-service.ts` - 7467 bytes (Tracking logic)

## Module Boundaries

### Clear Boundaries
- `/services` - Business logic only
- `/cli` - User interaction only
- `/mcp-tools` - MCP protocol only
- `/utils` - Shared utilities only
- `/config` - Configuration only

### Cross-Cutting Concerns
- Logging (via logger utility)
- Error handling (try-catch patterns)
- Type definitions (shared types)

## Dependency Flow

### Inward Dependencies (Most Depended Upon)
1. `utils/embeddings.ts` - Core embedding logic
2. `utils/logger.ts` - Logging infrastructure
3. Service type definitions - Contract enforcement

### Outward Dependencies (Depend on Most)
1. CLI commands - Depend on all services
2. Pipeline stages - Depend on services
3. Integration tests - Depend on everything