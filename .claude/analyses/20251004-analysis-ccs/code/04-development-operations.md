# Development Operations - Code Analysis

**Generated**: 2025-10-04
**Source**: Actual configuration files found

## Build System

### TypeScript Compilation

**Compiler**: TypeScript 5.6.3

**Build Command** (`package.json:11`):
```bash
npm run build
# Runs: tsc && chmod 755 build/src/index.js
```

**Configuration** (`tsconfig.json`):
```json
{
  "target": "ES2022",
  "module": "Node16",
  "outDir": "./build",
  "strict": true,
  "paths": {
    "@/*": ["src/*"],
    "@tests/*": ["tests/*"]
  }
}
```

**Output**:
- Compiled JavaScript in `build/`
- Mirrors `src/` directory structure
- Entry point: `build/index.js` (made executable)

**No Bundling**: Raw TypeScript compilation, no webpack/vite bundling

## Development Scripts (package.json)

### Core Development

```bash
# Development
npm run watch          # TypeScript watch mode
npm run cli            # Run CLI in dev mode (tsx)
npm run start          # Start MCP server in dev mode

# Building
npm run build          # Compile TypeScript
npm run prepare        # Pre-publish hook (runs build)

# Code Quality
npm run lint           # Check linting (ESLint)
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code (Prettier)
npm run format:check   # Check formatting
```

### Testing

```bash
# Unit Tests
npm test               # Run all tests (vitest run)
npm run test:watch     # Watch mode (vitest)
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests only

# Coverage
npm run test:ci        # Tests + coverage report
npm run test:coverage  # Same as test:ci

# Advanced
npm run test:ui        # Visual test UI
npm run test:runner    # Custom test runner
```

### CLI Commands (via npm)

```bash
# Pipeline stages
npm run cli:ingest     # Full pipeline
npm run cli:fetch      # Fetch HTML
npm run cli:extract    # Extract with Claude
npm run cli:embed      # Generate embeddings

# Management
npm run cli:status     # Check ingestion status
npm run cli:list       # List documents
npm run cli:sources    # List sources

# Search
npm run search         # Search documentation

# Seeding
npm run seed           # Bootstrap core docs
npm run seed:all       # Seed all docs
npm run seed:dev       # Dev mode (fast)

# Syncing
npm run sync           # Update stale docs
npm run sync:check     # Preview what would update
npm run sync:source    # Sync specific source
npm run sync:type      # Sync by type

# Utilities
npm run setup          # Setup Qdrant collection
npm run debug          # MCP inspector
npm run integration-test # Integration test runner
```

**Total Scripts**: 30+ npm scripts defined

## Testing Infrastructure

### Test Framework: Vitest 3.2.4

**Configuration** (`vitest.config.ts` exists):
```typescript
// Vitest configuration
// Coverage: v8 provider
// UI mode supported
```

**Test Structure**:
```
tests/
  ├── setup.ts              # Global test setup
  ├── unit/                 # Fast, isolated tests (24 files)
  ├── integration/          # Qdrant/Ollama tests (8 files)
  ├── fixtures/             # Test data
  └── mocks/                # Mock implementations
```

**Test Results** (from npm run test:ci):
```
Test Files: 32 passed
Tests: 375 passed
Coverage: 81.57% statements, 82.26% branches
Duration: 4.12s total (tests: 6.96s)
```

**Coverage Thresholds**: Not enforced (no thresholds in config)

**Tools Available**:
- `vitest` - Installed locally in node_modules
- `eslint` - Installed locally in node_modules
- `prettier` - Installed locally in node_modules

**Global Tools**: None required (all local to project)

## CI/CD Configuration

### GitHub Actions

**File**: `.github/workflows/test.yml`

**Content**:
```yaml
# (File exists with 2427 bytes)
# Runs tests on push/PR
```

**No Other CI**: No `.gitlab-ci.yml`, `.circleci/`, `azure-pipelines.yml` found

## Dependency Management

### Package Manager: npm

**Lockfile**: `package-lock.json` present

**Dependencies**:
```json
Production (13 packages):
  @modelcontextprotocol/sdk: ^1.0.0
  @qdrant/js-client-rest: ^1.12.0
  chalk: ^5.6.2
  commander: ^14.0.1
  dotenv: ^16.4.5
  jsdom: ^25.0.1
  listr2: ^9.0.4
  node-fetch: ^3.3.2
  ollama: ^0.5.9
  openai: ^4.67.1
  ora: ^9.0.0
  uuid: ^10.0.0

DevDependencies (11 packages):
  @eslint/js: ^9.36.0
  @modelcontextprotocol/inspector: latest
  @types/* (3 packages)
  @typescript-eslint/* (2 packages)
  @vitest/* (2 packages)
  eslint: ^9.36.0
  eslint-config-prettier: ^10.1.8
  eslint-plugin-prettier: ^5.5.4
  prettier: ^3.6.2
  tsx: ^4.19.2
  typescript: ^5.6.3
  vitest: ^3.2.4
```

**No Outdated Check Run**: Would need `npm outdated` to verify

## Code Quality Tools

### ESLint Configuration

**File**: `eslint.config.js` (Flat config format)

**Rules Enforced**:
```javascript
// TypeScript-ESLint recommended rules
@typescript-eslint/no-explicit-any: warn
@typescript-eslint/no-unused-vars: error (ignores _prefixed)
no-console: warn (allows warn/error/info)
prefer-const: error
no-var: error
prettier/prettier: error  // Prettier integration
```

**Test-Specific Rules**:
```javascript
// More permissive in test files
@typescript-eslint/no-explicit-any: off
```

**Ignored**:
```javascript
ignores: [
  'build/', 'dist/', 'node_modules/', 'coverage/',
  '*.config.js', '*.config.ts',
  'docs/', 'examples/', 'analysis/', 'tools/',
  '.local/**', '.data/**'
]
```

### Prettier Configuration

**File**: `.prettierrc.json`

```json
{
  // Formatting rules
  // Integrated with ESLint via plugin
}
```

### Type Checking

**Strict Mode**: Enabled (`tsconfig.json:7`)

```json
{
  "strict": true,
  "forceConsistentCasingInFileNames": true,
  "skipLibCheck": true
}
```

## Environment Management

### Environment Files

**Files Found**:
```
.env.example    # Template (checked in)
.env            # Local config (gitignored)
.env.test       # Test environment (gitignored)
```

**Required Variables**:
```bash
# Optional (has defaults)
QDRANT_HOST=localhost
QDRANT_PORT=6333
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
DEFAULT_EMBEDDING_PROVIDER=ollama

# Required only for OpenAI
OPENAI_API_KEY=sk-...
```

**Loading**: `dotenv` package (`import { config } from 'dotenv'`)

## Local Development Setup

### Prerequisites (From Code Analysis)

**Required**:
1. Node.js (ES2022 support)
2. npm (package manager)
3. Qdrant (vector database)
   - Running on localhost:6333
   - Can start with Docker: `docker run -p 6333:6333 qdrant/qdrant`

**Optional**:
1. Ollama (local embeddings)
   - Running on localhost:11434
   - Model: `nomic-embed-text`
2. OpenAI API key (alternative embeddings)
3. Python 3 (for extraction tool)

### Setup Steps (Inferred from Scripts)

```bash
# 1. Clone and install
git clone <repo>
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# 4. Setup collection
npm run setup

# 5. Seed documentation
npm run seed

# 6. Test search
npm run search "hooks"

# 7. Start MCP server
npm run build
npm run start
```

## Git Workflow

### Version Control

**Repository**: Git (`.git/` directory present)

**Branch**: `main` (from git status)

**Ignored Files** (`.gitignore`):
```
node_modules/
build/
dist/
.env
.env.local
.data/              # Runtime data
.local/             # Dev artifacts
coverage/
*.log
.DS_Store
```

**Recent Commits**:
```
128b743 chore: delete test folder in .data and update .gitignore
db50262 refactor(sync): remove custom TTL option, fix prompt paths
57cb20d docs: updated docs with verified documentation
964361d feat(multi-source): add master manifest and source tracking
4a79134 refactor(sync): make domain-agnostic with manifest discovery
```

**Commit Convention**: Conventional Commits (type: description)

## Containerization

### Docker

**No Dockerfiles Found**:
- No `Dockerfile` in root
- No `docker-compose.yml`

**Docker Usage**: Only for Qdrant dependency

## Development Workflow (Actual)

### 1. Start Development

```bash
npm install
npm run build
npm run watch  # Auto-rebuild on changes
```

### 2. Run Tests

```bash
npm run test:watch  # Interactive
npm run test:ci     # Full coverage
```

### 3. Code Quality

```bash
npm run lint:fix    # Auto-fix issues
npm run format      # Format code
```

### 4. Run CLI

```bash
npm run cli -- <command>  # Dev mode (tsx)
# or
node build/cli/index.js <command>  # Prod mode
```

### 5. Debug MCP Server

```bash
npm run debug
# Uses @modelcontextprotocol/inspector
```

## Release Process

### Publishing (package.json)

```json
{
  "name": "claude-code-docs-mcp",
  "version": "1.0.0",
  "license": "MIT",
  "files": ["build"],      // Only ship compiled code
  "main": "build/index.js",
  "bin": {
    "claude-code-docs-mcp": "./build/index.js"
  },
  "prepare": "npm run build"  // Pre-publish hook
}
```

**No Publishing Config**: No `.npmrc` or publish scripts

## Performance Tools

**None Configured**:
- No profiling tools
- No benchmarking setup
- No performance budgets

**Would Need to Add**:
- `clinic` for Node.js profiling
- `benchmark.js` for benchmarks

## Security Scanning

**None Configured**:
- No `npm audit` in CI
- No Snyk/Dependabot config visible
- No security scanning tools

**Available**:
```bash
npm audit  # Built into npm
```

## Development Issues Found

### Missing Configurations

1. **No .nvmrc**: Node version not specified
2. **No package-lock.json check**: Could have version drift
3. **No pre-commit hooks**: Could use Husky
4. **No coverage thresholds**: Tests could regress

### Strengths

1. **Complete test suite**: 375 tests, 81% coverage
2. **Linting enforced**: ESLint + Prettier integration
3. **Type safety**: Strict TypeScript mode
4. **Dev scripts**: Comprehensive npm scripts
5. **Local tooling**: No global dependencies needed
