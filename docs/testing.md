# Testing Guide

Complete guide to the test architecture and practices in this project.

## Overview

**Test Statistics:**
- **32 test files** with **375 tests** passing
- **~80% code coverage**
- Mix of unit tests (fast, mocked) and integration tests (real services)

## Test Structure

```
tests/
├── unit/                      # 25 test files - Fast, isolated tests
│   ├── cli/
│   │   ├── commands/         # CLI command tests
│   │   ├── pipeline/         # Pipeline stage tests
│   │   └── index.test.ts     # CLI entry point smoke test
│   ├── config/               # Configuration tests
│   ├── mcp-tools/            # MCP tool tests
│   ├── services/             # Service layer tests
│   └── utils/                # Utility function tests
│
├── integration/               # 7 test files - Real service tests
│   ├── pipeline-end-to-end.test.ts
│   ├── fetch-service.test.ts
│   ├── extract-service.test.ts
│   ├── embed-service.test.ts
│   ├── manifest-tracking.test.ts
│   ├── qdrant.test.ts
│   └── mcp-tools.test.ts
│
├── fixtures/                  # Test data (realistic examples)
│   ├── embedServiceFixtures.ts
│   ├── extractServiceFixtures.ts
│   ├── fetchServiceFixtures.ts
│   ├── manifestFixtures.ts
│   └── searchResultFixtures.ts
│
└── mocks/                     # Fake implementations
    └── qdrantClient.ts       # Mock Qdrant client

```

## Running Tests

### Quick Commands

```bash
# Run all tests once and exit
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run with coverage (CI/production)
npm run test:ci

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit          # Unit tests only (fast)
npm run test:integration   # Integration tests (requires services)

# Interactive UI for debugging
npm run test:ui
```

### Quality Checklist (Before Committing)

Always run these commands before marking any task complete:

1. `npm run lint:fix` - Fix all linting/formatting issues
2. `npm run build` - Ensure TypeScript compiles
3. `npm run test:unit` - Run unit tests quickly
4. `npm test` - Verify all tests pass

## Test Patterns

### Fixtures vs Mocks

**Fixtures** (`tests/fixtures/`) - **Test data** (what data looks like)
- Real HTML samples
- Claude extraction results
- Embedding vectors
- Manifest records
- Search results

**Mocks** (`tests/mocks/`) - **Fake implementations** (how dependencies behave)
- `MockQdrantClient` - Simulates Qdrant database behavior

### Path Aliases

Tests use clean imports with path aliases:

```typescript
import { Service } from '@/services/foo.js';              // Production code
import { MockClient } from '@tests/mocks/qdrant.js';      // Test mocks
import { fixture } from '@tests/fixtures/results.js';     // Test data
```

Configured in:
- `tsconfig.json` - TypeScript path mapping
- `vitest.config.ts` - Vitest module resolution

### Test Naming Conventions

**Unit Tests:**
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should do expected behavior', () => {
      // Test single behavior
    });
  });
});
```

**Integration Tests:**
```typescript
describe('Feature Integration (requires Services)', () => {
  beforeAll(async () => {
    // Check service availability
    // Set up real connections
  });

  it('should perform end-to-end operation', async () => {
    // Test real service interaction
  }, 60000); // Realistic timeout
});
```

## Testing Best Practices

### 1. Educational Tests
Tests should teach developers about the system:
- Clear naming (`should resume from extracted state`)
- Helpful comments explaining "why"
- Realistic examples

### 2. Smoke vs Business Logic

**Smoke Tests** - Simple commands, just verify registration:
```typescript
it('should register the ingest command', () => {
  registerIngestCommand(mockProgram);
  expect(mockProgram.command).toHaveBeenCalledWith('ingest <url>');
});
```

**Business Logic Tests** - Complex commands, test actual logic:
```typescript
it('should identify stale documents (>7 days old)', async () => {
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  mockGetRecord.mockResolvedValue({
    status: 'embedded',
    lastIngestedAt: eightDaysAgo.toISOString()
  });
  await syncCommand.run({});
  expect(mockGetRecord).toHaveBeenCalled();
});
```

### 3. Integration Test Safety

Always use unique collections to avoid production data corruption:

```typescript
const testCollectionName = `test_pipeline_e2e_${Date.now()}`;
```

Always clean up after tests:

```typescript
afterAll(async () => {
  if (qdrant) {
    await qdrant.deleteCollection(testCollectionName);
  }
});
```

### 4. Graceful Degradation

Integration tests should skip gracefully when services unavailable:

```typescript
const qdrantAvailable = await checkQdrantAvailable();
if (!qdrantAvailable) {
  console.info('⚠️  Qdrant is not running - skipping integration tests');
  return;
}
```

## Framework: Vitest

We use **Vitest** (not Jest) for better performance and TypeScript support.

**Key differences from Jest:**
- `vi` instead of `jest` for mocking
- Much faster execution (~1-3s typical)
- Watch mode via `npm run test:watch`
- CI mode via `npm run test:ci` (includes coverage)

**Vitest advantages:**
- Native ESM support
- Faster test execution
- Better TypeScript integration
- Compatible with Vite ecosystem

## Common Patterns

### Mocking Services

```typescript
vi.mock('@/services/fetch.js', () => ({
  FetchService: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue({ finalUrl: 'https://...' })
  }))
}));
```

### Testing Async Operations

```typescript
it('should complete async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
}, 30000); // Timeout for slow operations
```

### Testing Error Handling

```typescript
it('should handle errors gracefully', async () => {
  mockService.mockRejectedValue(new Error('Test error'));
  await expect(service.method()).rejects.toThrow('Test error');
});
```

## Debugging Tests

### Interactive UI

```bash
npm run test:ui
```

Opens Vitest UI for:
- Filtering tests
- Viewing coverage
- Debugging failures
- Re-running specific tests

### Watch Mode Tips

In watch mode (`npm run test:watch`):
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename
- Press `q` to quit

### Coverage Reports

```bash
npm run test:coverage
```

Generates:
- Console summary
- `coverage/lcov-report/index.html` (detailed HTML report)

## Continuous Integration

Tests run automatically in CI via `npm run test:ci`:
- Runs all tests once
- Fails on any test failure
- Ideal for GitHub Actions / CI pipelines

**Note:** Integration tests requiring external services (Qdrant, Claude API) are skipped in CI unless services are available.

## Future Improvements

**Potential additions:**
1. E2E CLI tests using child processes
2. Performance benchmarks for critical paths
3. Snapshot tests for CLI output formatting
4. Contract tests for MCP protocol compliance

**Coverage targets:**
- Increase Sync command coverage (currently 43%)
- Add edge case tests for error handling
- Test CLI error message formatting
