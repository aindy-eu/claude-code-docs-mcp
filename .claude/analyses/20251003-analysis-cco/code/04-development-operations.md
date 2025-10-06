# 04 - Development Operations (Code Analysis Only)

## Found Configuration Files

### Build & Compilation
```
tsconfig.json              # TypeScript compiler configuration
tsconfig.eslint.json       # TypeScript ESLint configuration
package.json               # Node.js dependencies and scripts
package-lock.json          # Dependency lock file
```

### Code Quality
```
eslint.config.js           # ESLint configuration
.prettierrc.json          # Prettier formatting rules
```

### Testing
```
vitest.config.ts          # Vitest test runner configuration (implied)
jest.config.js            # Jest configuration (legacy, found but using Vitest)
```

### CI/CD
```
.github/workflows/test.yml # GitHub Actions workflow
```

### Environment
```
.env                      # Local environment variables
.env.example              # Environment template
.env.test                 # Test environment configuration
```

## Package Scripts Analysis (from package.json)

### Development Scripts
```bash
npm run build         # TypeScript compilation + chmod
npm run watch        # TypeScript watch mode
npm start            # Run MCP server
npm run debug        # MCP inspector mode
```

### Testing Scripts
```bash
npm test             # Run Vitest (watch mode)
npm run test:ci      # Run tests with coverage (CI mode)
npm run test:unit    # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage # Generate coverage report
npm run test:ui      # Interactive test UI
npm run test:runner  # Custom test runner
```

### Code Quality Scripts
```bash
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run format:check # Prettier check
```

### CLI Operations
```bash
npm run cli          # Main CLI interface
npm run cli:help     # Show CLI help
npm run cli:ingest   # Run full ingestion
npm run cli:fetch    # Fetch documentation
npm run cli:extract  # Extract content
npm run cli:embed    # Generate embeddings
npm run cli:status   # Check status
npm run cli:list     # List documents
npm run cli:search   # Search documents
npm run cli:seed     # Seed data
npm run cli:sync     # Sync manifest
```

## CI/CD Pipeline (GitHub Actions)

### Workflow: test.yml
**Triggers**: Push/PR to main, develop branches

### Job 1: Unit Tests
```yaml
Strategy: Matrix testing (Node 18.x, 20.x, 22.x)
Steps:
1. Checkout code
2. Setup Node.js with npm cache
3. Install dependencies (npm ci)
4. Build TypeScript
5. Run unit tests
6. Upload coverage to Codecov (Node 20.x only)
```

### Job 2: Integration Tests
```yaml
Services: Qdrant container (ports 6333, 6334)
Steps:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Build project
5. Wait for Qdrant health check
6. Run integration tests
Environment:
  - QDRANT_HOST=localhost
  - QDRANT_PORT=6333
```

### Job 3: Lint and Format
```yaml
Steps:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Check TypeScript compilation
5. Check for unused dependencies
```

## Dependency Management

### Production Dependencies (11 total)
```
@modelcontextprotocol/sdk  # Core MCP protocol
@qdrant/js-client-rest     # Vector database
chalk                      # Terminal styling
commander                  # CLI framework
dotenv                     # Environment config
jsdom                      # HTML parsing
listr2                     # Task lists
node-fetch                 # HTTP client
ollama                     # Local AI
openai                     # OpenAI API
ora                        # Spinners
uuid                       # UUID generation
```

### Development Dependencies (18 total)
```
TypeScript tooling:
  - typescript (^5.6.3)
  - tsx (^4.19.2)
  - @types/* packages

Testing:
  - vitest (^3.2.4)
  - @vitest/coverage-v8
  - @vitest/ui

Linting/Formatting:
  - eslint (^9.36.0)
  - @typescript-eslint/*
  - prettier (^3.6.2)
  - eslint-config-prettier

Other:
  - @modelcontextprotocol/inspector
```

## Build Process

### TypeScript Configuration (from tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Build Output Structure
```
build/
├── src/
│   ├── index.js (chmod 755)
│   ├── cli/
│   ├── services/
│   ├── mcp-tools/
│   └── utils/
└── *.d.ts, *.js.map files
```

## Test Infrastructure

### Test Framework: Vitest
- Not Jest (despite jest.config.js presence)
- Coverage with V8
- UI mode available
- Watch mode by default

### Test Organization
```
tests/
├── unit/            # Unit tests for all modules
│   ├── cli/         # CLI command tests
│   ├── services/    # Service layer tests
│   ├── mcp-tools/   # MCP tool tests
│   └── config/      # Configuration tests
├── integration/     # End-to-end tests
└── mocks/          # Shared test mocks
```

### Coverage Metrics (from test run)
```
Test Suites: 20 total, 19 passed, 1 failed
Tests: 290 total, 285 passed, 5 failed
Coverage: ~95% (V8 coverage enabled)
Execution: ~1.8 seconds
```

## Environment Configuration

### Required Environment Variables
```bash
QDRANT_HOST           # Default: localhost
QDRANT_PORT           # Default: 6333
DEFAULT_EMBEDDING_PROVIDER # Default: ollama
```

### Optional Environment Variables
```bash
OPENAI_API_KEY        # For OpenAI embeddings
OLLAMA_BASE_URL       # Default: http://localhost:11434
```

## Development Workflow (Inferred)

### Local Development
1. `npm install` - Install dependencies
2. `npm run build` - Compile TypeScript
3. `npm test` - Run tests in watch mode
4. `npm run lint:fix` - Fix linting issues
5. `npm run cli:ingest` - Test ingestion locally

### Pre-commit Checks
1. `npm run lint:fix` - Auto-fix issues
2. `npm run format` - Format code
3. `npm run build` - Ensure compilation
4. `npm run test:ci` - Run all tests

### Deployment Process
1. Build: `npm run build`
2. Package includes only `/build` directory
3. Entry point: `build/index.js` (executable)

## Quality Gates

### Automated Checks
- TypeScript compilation must succeed
- ESLint rules enforced
- Prettier formatting required
- Unit tests must pass
- Integration tests with real Qdrant
- Multi-version Node.js compatibility (18, 20, 22)

### Manual Processes
- No automated deployment found
- No Docker containerization
- No Kubernetes manifests
- Manual MCP server registration required

## Missing DevOps Components

### Not Found (Searched but absent)
- Dockerfile or docker-compose.yml
- Kubernetes manifests
- Terraform/CloudFormation
- Makefile
- Release automation
- Semantic versioning tools
- Changelog generation

## Development Tools Integration

### IDE Support
- TypeScript declarations generated
- Source maps for debugging
- ESLint integration ready
- Prettier formatting available

### Debugging
- MCP Inspector support (`npm run debug`)
- Source maps enabled
- Vitest UI for test debugging