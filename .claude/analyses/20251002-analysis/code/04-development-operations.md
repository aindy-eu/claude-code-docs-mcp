# Development Operations - Code Analysis

**Analysis Method:** Configuration File Inspection

## Development Setup

### Prerequisites (from package.json)

```json
{
  "engines": "Not specified",
  "runtime": "Node.js",
  "language": "TypeScript 5.6.3",
  "package_manager": "npm (package-lock.json present)"
}
```

### Installation Steps (from code)

```bash
# 1. Clone repository
git clone <repo-url>
cd claude-code-docs-mcp

# 2. Install dependencies
npm ci  # or npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Build TypeScript
npm run build

# 5. Start Qdrant (required)
docker run -p 6333:6333 qdrant/qdrant

# 6. Optional: Set up Ollama
docker run -p 11434:11434 ollama/ollama
```

## Build System

### TypeScript Compilation

**Configuration (tsconfig.json):**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "declaration": false,
    "sourceMap": false
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "build"]
}
```

**Build Command:**

```bash
npm run build
# Runs: tsc && chmod 755 build/index.js
```

**Output:**
- Source: `src/**/*.ts`
- Build: `build/**/*.js`
- Entry: `build/index.js` (executable)

### No Bundling

Project uses native ES modules, no webpack/rollup/esbuild bundling.

## Testing Infrastructure

### Test Framework (jest.config.js)

```javascript
{
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2022'
      }
    }]
  },
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  testTimeout: 30000,  // 30 seconds
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
}
```

### Test Commands

```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # With coverage report
npm run test:watch       # Watch mode
npm run test:ci          # CI mode (no watch)
npm run test:runner      # Custom test runner
```

### Test Coverage Configuration

```javascript
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/index.ts',        // Exclude MCP server entry
  '!src/**/*.d.ts'        // Exclude type definitions
],
coverageDirectory: 'coverage',
coverageReporters: ['text', 'lcov', 'html']
```

### Test Setup (tests/setup.ts)

```typescript
// Found from imports in test files
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Global test configuration
// (Actual implementation would be in the file)
```

## Code Quality Tools

### Linting (eslint.config.js)

**Configuration:**

```javascript
{
  extends: [
    eslint.configs.recommended,
    prettierConfig
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'jest',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',  // Not error
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'prettier/prettier': 'error'
  }
}
```

**Commands:**

```bash
npm run lint         # Check for issues
npm run lint:fix     # Auto-fix issues
```

**Current Status (from npm run lint):**

```
13 prettier formatting errors
15 console.log warnings
3 'any' type warnings
```

### Formatting (Prettier)

**Commands:**

```bash
npm run format       # Format all files
npm run format:check # Check formatting only
```

**Target Patterns:**

```
src/**/*.{ts,tsx,json}
tests/**/*.{ts,tsx}
```

## CI/CD Pipeline

### GitHub Actions (.github/workflows/test.yml)

**1. Unit Tests Job:**

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
  - run: npm ci
  - run: npm run build
  - run: npm run test:unit
  - uses: codecov/codecov-action@v4  # Upload coverage
```

**2. Integration Tests Job:**

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports: [6333:6333, 6334:6334]
    options: --health-cmd "curl -f http://localhost:6333/health"

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
  - run: npm ci
  - run: npm run build
  - run: npm run test:integration
    env:
      QDRANT_HOST: localhost
      QDRANT_PORT: 6333
      OPENAI_API_KEY: mock-key-for-testing
```

**3. Lint & Format Job:**

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
  - run: npm ci
  - run: npm run build
  - run: npx depcheck --ignores="@types/*,tsx,jest,ts-jest"
```

**Triggers:**

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

## Dependencies Management

### Production Dependencies (9)

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

### Development Dependencies (14)

```json
{
  "@eslint/js": "^9.36.0",
  "@modelcontextprotocol/inspector": "latest",
  "@types/jest": "^30.0.0",
  "@types/jsdom": "^21.1.7",
  "@types/node": "^22.9.0",
  "@types/uuid": "^10.0.0",
  "@typescript-eslint/eslint-plugin": "^8.45.0",
  "@typescript-eslint/parser": "^8.45.0",
  "eslint": "^9.36.0",
  "eslint-config-prettier": "^10.1.8",
  "eslint-plugin-jest": "^29.0.1",
  "eslint-plugin-prettier": "^5.5.4",
  "jest": "^30.0.5",
  "prettier": "^3.6.2",
  "ts-jest": "^29.4.0",
  "tsx": "^4.19.2",
  "typescript": "^5.6.3"
}
```

### Dependency Analysis

```bash
# From CI/CD
npx depcheck --ignores="@types/*,tsx,jest,ts-jest"
```

**No unused dependencies** detected (from CI success).

## Runtime Configuration

### Environment Variables (.env.example)

```bash
# Required
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Embedding Provider Selection
DEFAULT_EMBEDDING_PROVIDER=ollama  # or 'openai'

# Ollama Configuration
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# OpenAI Configuration (optional)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
```

### Test Environment (.env.test)

```bash
# From existence check
QDRANT_HOST=localhost
QDRANT_PORT=6333
OPENAI_API_KEY=mock-key-for-testing
```

## Development Workflow

### Local Development

```bash
# 1. Start dependencies
docker run -p 6333:6333 qdrant/qdrant          # Required
docker run -p 11434:11434 ollama/ollama        # Optional

# 2. Run in development mode
npm run start                # MCP server
npm run cli -- batch         # CLI commands

# 3. Watch mode for TypeScript
npm run watch                # tsc --watch

# 4. Run tests while developing
npm run test:watch           # Jest watch mode
```

### Pre-commit Checks

```bash
# Recommended workflow (not automated)
npm run format               # Format code
npm run lint                 # Check linting
npm test                     # Run tests
npm run build                # Verify build
```

**Note:** No pre-commit hooks detected (no husky, lint-staged).

## Debugging

### MCP Inspector

```bash
npm run debug
# Runs: npx @modelcontextprotocol/inspector node build/index.js
```

Starts MCP Inspector for debugging MCP server.

### Integration Test

```bash
npm run integration-test
# Runs: tsx src/utils/integration-test.ts
```

Custom integration test runner for manual testing.

### Collection Setup

```bash
npm run setup
# Runs: tsx src/utils/setup-collection.ts
```

Utility to set up Qdrant collections.

## Deployment

### Build for Production

```bash
npm run build
# Output: build/ directory with compiled JS
```

### Package Distribution

```json
{
  "files": ["build"],
  "bin": {
    "claude-code-docs-mcp": "./build/index.js"
  },
  "main": "build/index.js"
}
```

**Installation as package:**

```bash
npm install -g .
claude-code-docs-mcp --help
```

### MCP Server Setup

```bash
# From src/index.ts console output
claude mcp add claude-docs node /path/to/build/index.js
```

## Infrastructure Requirements

### Required Services

1. **Qdrant Vector Database**
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

2. **Ollama** (if using local embeddings)
   ```bash
   docker run -p 11434:11434 ollama/ollama
   ollama pull nomic-embed-text
   ```

3. **Claude CLI** (for extraction)
   ```bash
   # Must be installed and in PATH
   which claude
   ```

### Optional Services

1. **OpenAI API** (if using cloud embeddings)
   - Requires `OPENAI_API_KEY`

### Resource Requirements

**From code analysis:**

- **Disk**: ~200MB for dependencies
- **Memory**: Not specified (Node.js default)
- **CPU**: Not specified
- **Network**: Required for:
  - Fetching documentation
  - Ollama/OpenAI API calls
  - Qdrant connection

## Development Tools Used

### Found from analysis

✅ **TypeScript 5.6.3** - Type safety
✅ **Jest 30.0.5** - Testing
✅ **ESLint 9.36.0** - Linting
✅ **Prettier 3.6.2** - Formatting
✅ **tsx 4.19.2** - TypeScript execution
✅ **GitHub Actions** - CI/CD
✅ **npm** - Package management
✅ **dotenv** - Environment config

### Not Found

❌ **Pre-commit hooks** (husky, lint-staged)
❌ **Bundler** (webpack, rollup, esbuild)
❌ **Monorepo tools** (nx, turborepo, lerna)
❌ **Documentation generator** (typedoc)
❌ **Release automation** (semantic-release)

## Quality Metrics from Development Tools

### Test Results (npm test)

```
Test Suites: 11 passed, 11 total
Tests:       130 passed, 2 skipped, 132 total
Time:        1.929 s
```

**Pass Rate:** 98.5% (130/132)

### Test Coverage (npm run test:coverage)

```
Overall Coverage:
  Statements:  56.04%
  Branches:    47.31%
  Functions:   53.84%
  Lines:       56.04%
```

### Linting Results (npm run lint)

```
Total Issues: 31
  Errors: 13 (prettier formatting)
  Warnings: 18 (console.log + any types)
```

### Build Status

✅ TypeScript compilation successful
✅ No build errors
✅ Executable created and made executable

## Development Process Observations

### Strengths

✅ Comprehensive testing infrastructure
✅ Multi-version Node.js testing (18, 20, 22)
✅ CI/CD with proper service mocking
✅ Separate test environments
✅ Good developer experience (npm scripts)

### Areas for Improvement

⚠️ No pre-commit hooks (manual quality checks)
⚠️ Test coverage below 60%
⚠️ Linting issues not enforced in CI
⚠️ No automated releases
⚠️ No documentation generation
