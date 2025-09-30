# Codebase Structure

## Directory Tree with File Counts

```
claude-code-docs-mcp/
├── src/ (16 TypeScript files)
│   ├── index.ts                    # Main entry point, MCP server setup
│   ├── prompts/                    # Prompt templates
│   │   └── ingestion-prompts.ts    # Templates for Claude ingestion
│   ├── scripts/ (3 files)          # Standalone executables
│   │   ├── ingestion-status.ts     # Check ingestion manifest status
│   │   ├── process-claude-output.ts # Process Claude JSON output
│   │   └── test-search.ts          # Test search functionality
│   ├── services/ (3 files)         # Core business logic
│   │   ├── claude-output-processor.ts # Process Claude's structured output
│   │   ├── hybrid-embeddings.ts    # Ollama/OpenAI embedding abstraction
│   │   └── ingestion-tracker.ts    # Track processed documents with TTL
│   ├── tools/ (2 files)            # MCP tool implementations
│   │   ├── index.ts                # Tool registration
│   │   └── search.ts               # Documentation search tool
│   ├── types/ (3 files)            # TypeScript type definitions
│   │   ├── claude-ingestion.ts     # Claude output types
│   │   ├── index.ts                # Main type exports
│   │   └── ingestion-manifest.ts   # Ingestion tracking types
│   └── utils/ (4 files)            # Utility functions
│       ├── logger.ts               # Logging utility
│       ├── setup-collection.ts     # Qdrant collection setup
│       └── test.ts                 # Test utilities
├── tests/ (9 TypeScript files)
│   ├── setup.ts                    # Test configuration
│   ├── test-runner.ts              # Custom test runner
│   ├── fixtures/                   # Test data
│   │   └── mockSearchResults.ts
│   ├── mocks/                      # Mock implementations
│   │   └── qdrantClient.ts
│   ├── unit/ (3 test files)        # Unit tests
│   │   ├── embeddings.test.ts
│   │   ├── search.test.ts
│   │   └── types.test.ts
│   └── integration/ (2 test files) # Integration tests
│       ├── mcp-tools.test.ts
│       └── qdrant.test.ts
├── build/ (Compiled JavaScript)    # TypeScript build output
├── tools/ (4 shell scripts)        # Build and deployment tools
├── claude-outputs/                 # Claude processing outputs
└── local-resources/                # Local development resources
```

## Module Dependencies

### Core Dependency Graph

```
index.ts (Entry Point)
    ├── @modelcontextprotocol/sdk
    ├── @qdrant/js-client-rest
    └── tools/index.ts
            └── tools/search.ts
                    ├── services/hybrid-embeddings.ts
                    │       ├── ollama
                    │       └── openai
                    └── types/index.ts

services/claude-output-processor.ts
    ├── @qdrant/js-client-rest
    ├── uuid
    ├── services/hybrid-embeddings.ts
    ├── types/claude-ingestion.ts
    └── utils/logger.ts

services/ingestion-tracker.ts
    ├── fs (Node.js built-in)
    ├── crypto (Node.js built-in)
    └── types/ingestion-manifest.ts
```

### Import Analysis

#### External Dependencies (npm packages)
- **MCP SDK**: Server protocol implementation
- **Qdrant Client**: Vector database operations
- **Ollama**: Local embeddings
- **OpenAI**: Cloud embeddings
- **UUID**: Document ID generation
- **Dotenv**: Environment configuration

#### Internal Module Structure
1. **Services import from**:
   - Types (type definitions)
   - Utils (shared utilities)
   - Other services (hybrid-embeddings)

2. **Tools import from**:
   - Services (business logic)
   - Types (interfaces)

3. **Scripts import from**:
   - Services (processing logic)
   - Tools (search functionality)
   - Types (data structures)

## Entry Points

### Primary Entry Point
- `src/index.ts` → `build/index.js`
  - Executable via shebang: `#!/usr/bin/env node`
  - Registered in package.json bin field

### Script Entry Points
1. `npm run setup` → `setup-collection.ts`
2. `npm run process-claude` → `process-claude-output.ts`
3. `npm run search` → `test-search.ts`
4. `npm run ingestion-status` → `ingestion-status.ts`

### Test Entry Points
- `npm test` → Jest test runner
- `npm run test:runner` → Custom test runner

## Configuration Files

### Build Configuration
- `tsconfig.json`: TypeScript compiler options
- `jest.config.js`: Test runner configuration
- `package.json`: Project metadata and scripts

### Environment Configuration
- `.env`: Local environment variables
- `.env.example`: Template for environment setup
- `.env.test`: Test environment configuration

### CI/CD Configuration
- `.github/workflows/test.yml`: GitHub Actions workflow

## Execution Flow

### Main Server Flow
1. `index.ts` starts MCP server
2. Connects StdioServerTransport
3. Initializes QdrantClient
4. Registers tools via `registerTools()`
5. Listens for MCP protocol messages

### Search Flow
1. MCP tool request received
2. `search.ts` processes query
3. `hybrid-embeddings.ts` generates embedding
4. Qdrant vector search executed
5. Results formatted and returned

### Ingestion Flow
1. Claude output received (JSON)
2. `process-claude-output.ts` invoked
3. `claude-output-processor.ts` extracts documents
4. Embeddings generated per provider
5. Vectors stored in Qdrant
6. `ingestion-tracker.ts` updates manifest

## Dead Code and Orphaned Files

### Potentially Unused
- `jsdom` dependency (legacy from scraping phase)
- `node-fetch` dependency (may be legacy)

### Active Development Areas
- `tools/` directory contains build scripts
- `claude-outputs/` suggests active ingestion
- `local-resources/` for development assets

## Module Cohesion Analysis

### High Cohesion Modules
- **services/**: Single responsibility per service
- **types/**: Pure type definitions
- **tools/**: MCP-specific implementations

### Coupling Points
- `QdrantClient` used across multiple services
- `hybrid-embeddings.ts` is a central dependency
- Type definitions shared across all modules

## Build Process

### TypeScript Compilation
```bash
tsc                 # Compile TypeScript
build/              # Output directory
chmod 755 build/index.js  # Make executable
```

### Module Resolution
- ES Modules with `.js` extensions in imports
- TypeScript resolves `.ts` files during compilation