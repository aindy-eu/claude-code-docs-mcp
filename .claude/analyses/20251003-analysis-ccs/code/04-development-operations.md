# Development Operations - Code Analysis

**Generated:** 2025-10-03
**Source:** Actual configuration files and package.json scripts

## Development Setup (From Actual Files)

### Prerequisites (Inferred from Dependencies)

**Required:**
- Node.js (ES2022 + ES modules support)
- TypeScript 5.6+
- Qdrant running on localhost:6333
- Ollama running on localhost:11434 (for default embedding provider)

**Optional:**
- OpenAI API key (if using OpenAI embeddings)

### Installation (From package.json)

```bash
# Standard npm setup
npm install

# Builds automatically via prepare hook
npm run prepare → npm run build
```

**Dependencies Installed:**
- 10 production dependencies
- 11 dev dependencies
- Total: ~300+ packages (including transitive)

## npm Scripts (From package.json:10-43)

### Build & Development

```bash
# TypeScript compilation
npm run build           # tsc && chmod 755 build/src/index.js
npm run watch          # tsc --watch (continuous compilation)

# Development server
npm run start          # tsx src/index.ts (MCP server)
npm run debug          # MCP inspector with node build/index.js
```

### CLI Commands (Direct Execution)

```bash
# Run CLI without building
npm run cli            # tsx src/cli/index.ts
npm run cli:help       # tsx src/cli/index.ts --help

# Pipeline stages
npm run cli:ingest     # tsx src/cli/index.ts ingest
npm run cli:fetch      # tsx src/cli/index.ts fetch
npm run cli:extract    # tsx src/cli/index.ts extract
npm run cli:embed      # tsx src/cli/index.ts embed
npm run cli:status     # tsx src/cli/index.ts status
npm run cli:list       # tsx src/cli/index.ts list

# Search & management
npm run search         # tsx src/cli/index.ts search
npm run seed           # tsx src/cli/index.ts seed
npm run seed:all       # tsx src/cli/index.ts seed --all
npm run seed:dev       # tsx src/cli/index.ts seed --dev

# Sync commands
npm run sync           # tsx src/cli/index.ts sync
npm run sync:check     # tsx src/cli/index.ts sync --check
```

### Testing (Vitest)

```bash
# Test execution
npm test               # vitest run (one-time execution)
npm run test:watch     # vitest (watch mode)
npm run test:ci        # vitest run --coverage (CI mode)
npm run test:ui        # vitest --ui (browser UI)

# Test suites
npm run test:unit      # vitest run tests/unit
npm run test:integration # vitest run tests/integration
npm run test:coverage  # vitest run --coverage

# Legacy
npm run test:runner    # tsx tests/test-runner.ts (manual runner)
```

**Test Results (Actual):**
```
✓ 30 test files passed
✓ 353 tests passed
Duration: 3.62s
Coverage: 81.97%
```

### Code Quality

```bash
# Linting
npm run lint           # eslint . --ext .ts,.tsx
npm run lint:fix       # eslint . --ext .ts,.tsx --fix

# Formatting
npm run format         # prettier --write "src/**/*.{ts,tsx,json}" "tests/**/*.{ts,tsx}"
npm run format:check   # prettier --check "src/**/*.{ts,tsx,json}" "tests/**/*.{ts,tsx}"
```

**Actual Tools:**
- ESLint 9.36.0 (flat config)
- Prettier 3.6.2
- TypeScript ESLint 8.45.0

### Utilities

```bash
# Setup
npm run setup          # tsx src/utils/setup-collection.ts

# Integration testing
npm run integration-test # tsx src/utils/integration-test.ts
```

## CI/CD Pipeline (From .github/workflows/test.yml)

**Actual Workflow:**

```yaml
name: test
on:
  push:
    branches: [main, refactor/cli-commands]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm install
      - run: npm run lint
      - run: npm run format:check
      - run: npm run build
      - run: npm run test:ci
```

**CI Checks:**
1. ✅ Linting (ESLint)
2. ✅ Code formatting (Prettier)
3. ✅ TypeScript compilation
4. ✅ All tests with coverage

**No deployment steps** - this is a local MCP server, not deployed

## Environment Configuration

### .env.example (Actual Template)

```bash
# OpenAI API Key (optional, only needed if using OpenAI embeddings)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Qdrant Configuration
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Ollama Configuration
OLLAMA_HOST=localhost
OLLAMA_PORT=11434

# Default embedding provider: 'ollama' or 'openai'
DEFAULT_EMBEDDING_PROVIDER=ollama

# Ollama model to use for embeddings
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# OpenAI model to use for embeddings
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
```

**Environment Loading:**
```typescript
// src/index.ts:6
import { config } from 'dotenv';
config();  // Loads .env file
```

### Configuration Files Found

```bash
# TypeScript
tsconfig.json               # Main TS config
tsconfig.eslint.json        # ESLint-specific

# Linting/Formatting
eslint.config.mjs           # ESLint flat config (new format)
.prettierrc.json           # Prettier settings

# Testing
vitest.config.ts           # Vitest configuration

# Environment
.env.example               # Template
.env                       # Local (gitignored)
.env.test                  # Test environment
```

## Dependency Management

### Production Dependencies (10 total)

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "@qdrant/js-client-rest": "^1.12.0",
  "chalk": "^5.6.2",
  "commander": "^14.0.1",
  "dotenv": "^16.4.5",
  "jsdom": "^25.0.1",
  "listr2": "^9.0.4",
  "node-fetch": "^3.3.2",
  "ollama": "^0.5.9",
  "openai": "^4.67.1",
  "ora": "^9.0.0",
  "uuid": "^10.0.0"
}
```

### Dev Dependencies (11 total)

```json
{
  "@eslint/js": "^9.36.0",
  "@modelcontextprotocol/inspector": "latest",
  "@types/jsdom": "^21.1.7",
  "@types/node": "^22.9.0",
  "@types/uuid": "^10.0.0",
  "@typescript-eslint/eslint-plugin": "^8.45.0",
  "@typescript-eslint/parser": "^8.45.0",
  "@vitest/coverage-v8": "^3.2.4",
  "@vitest/ui": "^3.2.4",
  "eslint": "^9.36.0",
  "eslint-config-prettier": "^10.1.8",
  "eslint-plugin-prettier": "^5.5.4",
  "prettier": "^3.6.2",
  "tsx": "^4.19.2",
  "typescript": "^5.6.3",
  "vitest": "^3.2.4"
}
```

**Lock File:** package-lock.json (exists)

### No Package Manager Alternatives Found

- ❌ No yarn.lock
- ❌ No pnpm-lock.yaml
- ❌ No bun.lockb

**Conclusion:** Uses npm exclusively

## Development Workflow (Inferred from Scripts)

### Local Development

```bash
# 1. First time setup
npm install
# (auto-runs: npm run build)

# 2. Start external services
docker run -p 6333:6333 qdrant/qdrant  # Qdrant
ollama serve                           # Ollama

# 3. Development
npm run watch  # Terminal 1: Auto-compile TS
npm run start  # Terminal 2: Run MCP server

# 4. Testing changes
npm run lint:fix    # Fix linting issues
npm run test        # Run tests
npm run build       # Compile
```

### CLI Development

```bash
# Quick iteration
npm run cli -- ingest --url https://docs.claude.com/overview

# Test specific commands
npm run cli:seed
npm run cli:status
npm run search "hooks documentation"
```

### Testing Workflow

```bash
# Unit tests only (fast)
npm run test:unit

# Integration tests (requires Qdrant + Ollama)
npm run test:integration

# Full test suite
npm run test:ci
```

## Build System

### TypeScript Compilation

**Command:**
```bash
tsc && chmod 755 build/src/index.js
```

**Input:** src/**/*.ts (39 files)
**Output:** build/ directory

**Compilation Settings (tsconfig.json):**
- Module: Node16 (native ESM)
- Target: ES2022
- Strict: true
- outDir: ./build
- No source maps
- No declarations (.d.ts)

### Build Artifacts

```
build/
├── index.js         # MCP server entry point (executable)
├── src/             # All compiled source
└── tests/           # Compiled tests (for coverage)
```

**Package Distribution (package.json):**
```json
{
  "main": "build/index.js",
  "bin": {
    "claude-code-docs-mcp": "./build/index.js"
  },
  "files": ["build"]
}
```

## No Container Infrastructure Found

**Checked for:**
- ❌ Dockerfile
- ❌ docker-compose.yml
- ❌ .dockerignore
- ❌ kubernetes/ or k8s/
- ❌ helm charts

**Reason:** Local development tool, not containerized application

## Development Tools in Use

### Code Execution
- **tsx:** TypeScript execution without compilation (dev mode)
- **node:** Running compiled JavaScript (production)

### Code Quality
- **ESLint 9:** Linting with flat config
- **Prettier:** Code formatting
- **TypeScript:** Type checking

### Testing
- **Vitest:** Test runner (migrated from Jest)
- **@vitest/ui:** Browser-based test UI
- **@vitest/coverage-v8:** V8 coverage provider

### Debugging
- **@modelcontextprotocol/inspector:** MCP server debugging

## Quality Checklist (From Project Conventions)

**Before Committing (from CLAUDE.md):**
1. `npm run lint:fix` - Fix linting issues
2. `npm run build` - Ensure TypeScript compiles
3. `npm run test:unit` - Quick test verification
4. `npm test` - Full test suite

**Actual Enforcement:**
- CI runs: lint → format:check → build → test:ci
- Prevents merging broken code

## Release Process (Inferred)

**No release automation found:**
- ❌ No semantic-release
- ❌ No version bump scripts
- ❌ No changelog generation
- ❌ No npm publish workflow

**Conclusion:** Manual versioning (package.json version field)
