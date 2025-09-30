# Development Operations

## Package Management

### Found Configuration: `package.json`
- **Package Manager**: npm (package-lock.json present)
- **Node Version Requirements**: Tested on 18.x, 20.x, 22.x (from CI)
- **Type**: ES Module (`"type": "module"`)

### NPM Scripts (Actual Commands)
```json
"setup": "tsx src/utils/setup-collection.ts"
"process-claude": "tsx src/scripts/process-claude-output.ts"
"search": "tsx src/scripts/test-search.ts"
"ingestion-status": "tsx src/scripts/ingestion-status.ts"
"start": "tsx src/index.ts"
"build": "tsc && chmod 755 build/index.js"
"prepare": "npm run build"
"watch": "tsc --watch"
"debug": "npx @modelcontextprotocol/inspector node build/index.js"
"test": "jest"
"test:unit": "jest tests/unit"
"test:integration": "jest tests/integration"
"test:watch": "jest --watch"
"test:coverage": "jest --coverage"
"test:ci": "jest --ci --coverage --watchAll=false"
"test:runner": "tsx tests/test-runner.ts"
"integration-test": "tsx src/utils/test.ts"
```

### Dependency Management
- **Production Dependencies**: 8 packages
- **Dev Dependencies**: 9 packages
- **Auto-build on install**: `"prepare": "npm run build"`

## CI/CD Pipeline (GitHub Actions)

### Workflow File: `.github/workflows/test.yml`

#### Job 1: Unit Tests
- **Matrix Testing**: Node 18.x, 20.x, 22.x
- **Steps**:
  1. Checkout code
  2. Setup Node.js with npm cache
  3. Install dependencies (`npm ci`)
  4. TypeScript compilation
  5. Run unit tests
  6. Upload coverage to Codecov (20.x only)

#### Job 2: Integration Tests
- **Services**: Qdrant container (latest)
- **Ports**: 6333, 6334
- **Health Check**: Polls Qdrant health endpoint
- **Environment**:
  - `QDRANT_HOST=localhost`
  - `QDRANT_PORT=6333`
  - Mock OpenAI key for testing

#### Job 3: Lint and Format
- **Checks**:
  - TypeScript compilation
  - Unused dependencies via depcheck
  - Ignores: `@types/*`, `tsx`, `jest`, `ts-jest`

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

## Development Environment Setup

### Required Services
1. **Qdrant Vector Database**
   - Default: `localhost:6333`
   - Health endpoint: `/health`
   - Required for integration tests

2. **Ollama (Optional)**
   - Local embedding generation
   - Model: nomic-embed-text

3. **OpenAI API (Optional)**
   - Requires API key
   - Model: text-embedding-3-small

### Environment Variables
```bash
# From .env.example analysis
QDRANT_HOST=localhost
QDRANT_PORT=6333
DEFAULT_EMBEDDING_PROVIDER=ollama
OPENAI_API_KEY=<your-key>
MANIFEST_FILE=<path-to-manifest>
```

## Build Process

### TypeScript Build
- **Compiler**: `tsc` (TypeScript 5.6.3)
- **Output Directory**: `build/`
- **Post-build**: Makes index.js executable
- **Watch Mode**: Available via `npm run watch`

### Build Artifacts
- Source maps generated (.map files)
- ES Module output
- Preserves file structure in build/

## Testing Infrastructure

### Test Framework
- **Runner**: Jest 30.0.5
- **TypeScript Support**: ts-jest 29.4.0
- **Configuration**: `jest.config.js`

### Test Categories
1. **Unit Tests** (`tests/unit/`)
   - embeddings.test.ts
   - search.test.ts
   - types.test.ts

2. **Integration Tests** (`tests/integration/`)
   - mcp-tools.test.ts
   - qdrant.test.ts

### Test Utilities
- Mock Qdrant client
- Mock search results fixtures
- Custom test runner
- Test setup configuration

### Coverage Reporting
- Jest coverage enabled
- Reports to `./coverage/`
- Codecov integration for CI

## Development Tools

### Shell Scripts in `tools/`
Found 4 files in tools directory for build/deployment automation

### MCP Inspector
```bash
npm run debug
# Uses @modelcontextprotocol/inspector
```

### Development Workflow
1. **Local Development**: `npm run watch`
2. **Testing**: `npm test:watch`
3. **Debugging**: MCP inspector
4. **Building**: `npm run build`

## Container Support

### Docker Integration (from CI)
- Qdrant runs in Docker for tests
- Health checks implemented
- Port mapping configured

## Deployment Configuration

### Binary Distribution
```json
"bin": {
  "claude-code-docs-mcp": "./build/index.js"
}
```
- Installable as global npm package
- Executable via `claude-code-docs-mcp`

### File Distribution
```json
"files": ["build"]
```
- Only build directory published to npm

## Quality Checks

### Automated Checks (CI)
1. TypeScript compilation verification
2. Unit test execution
3. Integration test execution
4. Dependency audit via depcheck
5. Multi-version Node.js compatibility

### Manual Checks Available
- `npm run test:coverage` - Coverage report
- `npm run debug` - Interactive debugging
- `npm run integration-test` - Standalone integration test

## Release Process (Inferred)

1. Development on feature branches
2. PR to `develop` branch
3. CI validation (tests, build, lint)
4. Merge to `main` for release
5. Auto-build via `prepare` script

## Monitoring and Logging

### Logging Infrastructure
- Custom logger utility (`utils/logger.ts`)
- Console-based output
- Startup diagnostics in index.ts

### Health Checks
- Qdrant connectivity validation
- Provider availability checks
- Collection existence verification