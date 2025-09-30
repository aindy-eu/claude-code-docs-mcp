# Testing Guide

How to test the Claude Code Documentation MCP Server.

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Test Structure

```
tests/
├── fixtures/               # Test data
│   └── mockSearchResults.ts
├── mocks/                  # Mock implementations
│   └── qdrantClient.ts
├── unit/                   # Unit tests
│   ├── embeddings.test.ts
│   ├── search.test.ts
│   ├── types.test.ts
│   └── url-configuration.test.ts
├── integration/            # Integration tests
│   ├── mcp-tools.test.ts
│   └── qdrant.test.ts
└── setup.ts               # Global test setup
```

## Jest Configuration

The project uses Jest with TypeScript and ES modules:

```javascript
// jest.config.js
export default {
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
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.(js|ts)$': '$1'
  },
  testTimeout: 30000
};
```

## Unit Testing

### Testing Search Functionality

```typescript
// tests/unit/search.test.ts
import { formatSearchResults } from '../../src/tools/search.js';
import { mockSearchResults } from '../fixtures/mockSearchResults.js';

describe('Search Functionality', () => {
  it('should format search results correctly', () => {
    const formatted = formatSearchResults(mockSearchResults);

    expect(formatted).toContain('## Claude Code Documentation Search Results');
    expect(formatted).toContain('### 1. Slash Commands Overview');
    expect(formatted).toContain('**Relevance Score:** 95.0%');
  });

  it('should handle empty results', () => {
    const formatted = formatSearchResults([]);
    expect(formatted).toBe('No relevant Claude Code documentation found for your query.');
  });
});
```

### Mocking External Dependencies

```typescript
// Mock Qdrant client
jest.mock('../../src/services/hybrid-embeddings.js', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(768).fill(0.5)),
  getCollectionName: jest.fn().mockReturnValue('test-collection'),
  EMBEDDING_CONFIGS: {
    ollama: { dimensions: 768, model: 'nomic-embed-text' },
    openai: { dimensions: 1536, model: 'text-embedding-3-small' }
  }
}));
```

## Integration Testing

### Testing with Real Qdrant

```typescript
// tests/integration/qdrant.test.ts
import { QdrantClient } from '@qdrant/js-client-rest';

describe('Qdrant Integration', () => {
  let qdrant: QdrantClient;
  const testCollectionName = 'test-collection';

  beforeAll(async () => {
    qdrant = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333')
    });
  });

  beforeEach(async () => {
    try {
      await qdrant.deleteCollection(testCollectionName);
    } catch {
      // Collection might not exist
    }
  });

  it('should create a collection', async () => {
    await qdrant.createCollection(testCollectionName, {
      vectors: {
        size: 768,
        distance: 'Cosine'
      }
    });

    const info = await qdrant.getCollection(testCollectionName);
    expect(info.status).toBe('green');
  });
});
```

### Testing MCP Tools

```typescript
// tests/integration/mcp-tools.test.ts
describe('MCP Tools', () => {
  it('should register search_claude_code_docs tool', async () => {
    const server = new Server(
      { name: 'test', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    registerTools(server, qdrant);

    // Test tool registration and execution
  });
});
```

## Test Fixtures

### Mock Search Results

```typescript
// tests/fixtures/mockSearchResults.ts
export const mockSearchResults: SearchResult[] = [
  {
    content: 'Claude Code supports slash commands for quick actions.',
    title: 'Slash Commands Overview',
    section: 'Getting Started',
    url: getDocUrl('slashCommands'),
    score: 0.95,
    codeExamples: ['/help', '/settings'],
    provider: 'ollama'
  }
];

export const mockEmbedding = new Array(768).fill(0).map(() => Math.random());
```

### Mock Qdrant Client

```typescript
// tests/mocks/qdrantClient.ts
export class MockQdrantClient {
  private collections = new Map<string, any>();

  async createCollection(name: string, config: any) {
    if (this.collections.has(name)) {
      throw new Error(`Collection ${name} already exists`);
    }
    this.collections.set(name, { config, points: [] });
  }

  async query(collection: string, params: any) {
    return {
      points: [{
        id: '1',
        score: 0.95,
        payload: mockSearchResults[0]
      }]
    };
  }

  reset() {
    this.collections.clear();
  }
}
```

## Environment Setup

Create `.env.test` for test-specific configuration:

```bash
# .env.test
QDRANT_HOST=localhost
QDRANT_PORT=6333
DEFAULT_EMBEDDING_PROVIDER=ollama
NODE_ENV=test
```

The `tests/setup.ts` file loads these automatically:

```typescript
// tests/setup.ts
import { config } from 'dotenv';

config({ path: '.env.test' });

beforeAll(async () => {
  // Set defaults if not provided
  process.env.QDRANT_HOST ||= 'localhost';
  process.env.QDRANT_PORT ||= '6333';
});

jest.setTimeout(30000);
```

## Running Tests in CI

Tests run automatically on GitHub Actions for pull requests:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      qdrant:
        image: qdrant/qdrant:latest
        ports:
          - 6333:6333

    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - run: npm ci
    - run: npm test
```

## Debugging Tests

```bash
# Run specific test file
npm test search.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should format"

# Debug with VS Code
# Add breakpoint and use "Debug: Jest Current File"
```

## Common Issues

### Module Resolution Errors
If you see `Cannot find module` errors, ensure:
- Files use `.js` extensions in imports (even for `.ts` files)
- The `moduleNameMapper` in Jest config is correct

### Qdrant Connection Failed
Integration tests require Qdrant:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Timeout Errors
Increase timeout in specific tests:
```typescript
it('slow test', async () => {
  // test code
}, 60000);
```