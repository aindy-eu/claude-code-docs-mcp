# Testing Guide for MCP Servers

Comprehensive testing strategies for TypeScript MCP servers, covering unit tests, integration tests, mocking, and CI/CD automation.

## 🎯 Overview

This guide provides battle-tested patterns for comprehensive testing of MCP servers, based on production experience with Claude Code documentation systems.

## 🏗️ Test Architecture

### Directory Structure

```
tests/
├── fixtures/               # Test data and mock responses
│   ├── mockSearchResults.ts
│   └── sampleDocuments.ts
├── mocks/                  # Mock implementations
│   ├── qdrantClient.ts
│   └── embeddingService.ts
├── unit/                   # Unit tests (isolated components)
│   ├── tools/
│   ├── services/
│   └── utils/
├── integration/            # Integration tests (real services)
│   ├── database.test.ts
│   └── api.test.ts
├── e2e/                    # End-to-end tests
│   └── mcp-workflow.test.ts
├── setup.ts               # Global test configuration
└── test-runner.ts         # Custom test runner
```

### Testing Pyramid

```
    E2E Tests (Few)
  ─────────────────
 Integration Tests (Some)  
─────────────────────────
   Unit Tests (Many)
```

- **Unit Tests**: Fast, isolated, comprehensive coverage
- **Integration Tests**: Real services, key workflows
- **E2E Tests**: Full system validation

## ⚙️ Jest Configuration

### ES Modules + TypeScript Setup

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
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.(js|ts)$': '$1'
  },
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  roots: ['<rootDir>/src', '<rootDir>/tests']
};
```

### Global Test Setup

```typescript
// tests/setup.ts
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set default test environment variables
  if (!process.env.QDRANT_HOST) {
    process.env.QDRANT_HOST = 'localhost';
  }
  if (!process.env.QDRANT_PORT) {
    process.env.QDRANT_PORT = '6333';
  }
  
  // Increase timeout for integration tests
  jest.setTimeout(30000);
});

// Global test teardown
afterAll(async () => {
  // Cleanup resources
});
```

### Test Environment Variables

```bash
# .env.test
QDRANT_HOST=localhost
QDRANT_PORT=6333
NODE_ENV=test
LOG_LEVEL=error

# Mock API keys (not real)
OPENAI_API_KEY=test-key-for-mocking
```

## 🧪 Unit Testing Patterns

### Testing Tools with Mocks

```typescript
// tests/unit/search.test.ts
import { formatSearchResults, searchDocumentation } from '../../src/tools/search.js';
import { SearchResult, SearchParams } from '../../src/types/index.js';
import { mockSearchResults } from '../fixtures/mockSearchResults.js';

// Mock external dependencies
jest.mock('../../src/services/hybrid-embeddings.js', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(384).fill(0.5)),
  getCollectionName: jest.fn().mockReturnValue('test-collection'),
  EMBEDDING_CONFIGS: {
    ollama: { dimensions: 384, model: 'nomic-embed-text' },
    openai: { dimensions: 1536, model: 'text-embedding-3-small' }
  }
}));

describe('Search Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatSearchResults', () => {
    it('should format search results correctly', () => {
      const formatted = formatSearchResults(mockSearchResults);
      
      expect(formatted).toContain('## Claude Code Documentation Search Results');
      expect(formatted).toContain('### 1. Slash Commands Overview');
      expect(formatted).toContain('**Relevance Score:** 95.0%');
      expect(formatted).toContain('/help');
    });

    it('should handle empty results', () => {
      const formatted = formatSearchResults([]);
      expect(formatted).toBe('No relevant Claude Code documentation found for your query.');
    });

    it('should truncate long content', () => {
      const longResult: SearchResult = {
        ...mockSearchResults[0],
        content: 'A'.repeat(1000)
      };
      
      const formatted = formatSearchResults([longResult]);
      expect(formatted).toContain('A'.repeat(800) + '...');
    });
  });

  describe('searchDocumentation', () => {
    it('should search with default parameters', async () => {
      const mockQdrant = {
        query: jest.fn().mockResolvedValue({
          points: [
            {
              id: '1',
              score: 0.95,
              payload: mockSearchResults[0]
            }
          ]
        })
      };

      const params: SearchParams = { query: 'test query' };
      const results = await searchDocumentation(mockQdrant as any, params);
      
      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.95);
    });

    it('should handle search errors gracefully', async () => {
      const badQdrant = {
        query: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };

      const params: SearchParams = { query: 'test query' };
      
      await expect(searchDocumentation(badQdrant as any, params))
        .rejects
        .toThrow('Connection failed');
    });
  });
});
```

### Mock Data Patterns

```typescript
// tests/fixtures/mockSearchResults.ts
import { SearchResult } from '../../src/types/index.js';

export const mockSearchResults: SearchResult[] = [
  {
    content: 'Claude Code supports slash commands for quick actions.',
    title: 'Slash Commands Overview',
    section: 'Getting Started',
    url: 'https://docs.anthropic.com/claude-code/slash-commands',
    score: 0.95,
    codeExamples: ['/help', '/settings'],
    provider: 'ollama'
  },
  {
    content: 'MCP allows Claude Code to connect to external tools.',
    title: 'MCP Integration',
    section: 'Advanced Features', 
    url: 'https://docs.anthropic.com/claude-code/mcp',
    score: 0.87,
    codeExamples: ['claude --mcp-server ./server.js'],
    provider: 'openai'
  }
];

export const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
```

### Service Mocking

```typescript
// tests/mocks/qdrantClient.ts
export class MockQdrantClient {
  private collections: Set<string> = new Set();
  private points: Map<string, any[]> = new Map();

  async createCollection(name: string, config: any) {
    if (this.collections.has(name)) {
      throw new Error(`Collection ${name} already exists`);
    }
    this.collections.add(name);
    this.points.set(name, []);
    return { result: true };
  }

  async query(collectionName: string, params: any) {
    if (!this.collections.has(collectionName)) {
      throw new Error(`Collection ${collectionName} not found`);
    }
    
    // Return realistic mock results
    return {
      points: [
        {
          id: '1',
          score: 0.95,
          payload: { title: 'Mock Result', content: 'Mock content' }
        }
      ]
    };
  }

  reset() {
    this.collections.clear();
    this.points.clear();
  }
}
```

## 🔗 Integration Testing

### Database Integration Tests

```typescript
// tests/integration/qdrant.test.ts
import { QdrantClient } from '@qdrant/js-client-rest';

describe('Qdrant Integration Tests', () => {
  let qdrant: QdrantClient;
  const testCollection = 'test-collection';

  beforeAll(async () => {
    qdrant = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333')
    });

    // Wait for Qdrant to be ready
    await waitForService(qdrant);
  });

  beforeEach(async () => {
    // Clean up test collection
    try {
      await qdrant.deleteCollection(testCollection);
    } catch (error) {
      // Collection might not exist
    }
  });

  it('should create and manage collections', async () => {
    await qdrant.createCollection(testCollection, {
      vectors: { size: 384, distance: 'Cosine' }
    });

    const collections = await qdrant.getCollections();
    const names = collections.collections.map(c => c.name);
    expect(names).toContain(testCollection);
  });

  it('should store and retrieve vectors', async () => {
    await qdrant.createCollection(testCollection, {
      vectors: { size: 384, distance: 'Cosine' }
    });

    const testVector = new Array(384).fill(0).map(() => Math.random());
    
    await qdrant.upsert(testCollection, {
      points: [{
        id: 'test-1',
        vector: testVector,
        payload: { title: 'Test Document' }
      }]
    });

    const results = await qdrant.query(testCollection, {
      query: testVector,
      limit: 1,
      with_payload: true
    });

    expect(results.points).toHaveLength(1);
    expect(results.points[0].payload?.title).toBe('Test Document');
  });
});

async function waitForService(qdrant: QdrantClient, retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      await qdrant.getCollections();
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### End-to-End MCP Tests

```typescript
// tests/integration/mcp-tools.test.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerTools } from '../../src/tools/index.js';

describe('MCP Tools Integration', () => {
  let server: Server;

  beforeAll(async () => {
    server = new Server(
      { name: 'test-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    
    registerTools(server);
  });

  it('should list available tools', async () => {
    const request = { method: 'tools/list', params: {} };
    const handler = server['requestHandlers'].get('tools/list');
    
    const response = await handler!(request as any);
    
    expect(response.tools).toHaveLength(1);
    expect(response.tools[0].name).toBe('search_claude_code_docs');
  });

  it('should execute search tool', async () => {
    const request = {
      method: 'tools/call',
      params: {
        name: 'search_claude_code_docs',
        arguments: { query: 'test query', limit: 1 }
      }
    };

    const handler = server['requestHandlers'].get('tools/call');
    const response = await handler!(request as any);

    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe('text');
  });
});
```

## 🚀 Custom Test Runner

```typescript
// tests/test-runner.ts
#!/usr/bin/env tsx

import { execSync } from 'child_process';

async function checkDependencies() {
  const checks = {
    qdrant: await checkService('http://localhost:6333/health'),
    ollama: await checkService('http://localhost:11434/api/tags')
  };
  
  console.log('🔍 Dependency Check:');
  Object.entries(checks).forEach(([service, available]) => {
    console.log(`  ${service}: ${available ? '✅' : '❌'}`);
  });
  
  return checks;
}

async function runTests() {
  const testType = process.argv[2] || 'all';
  const dependencies = await checkDependencies();
  
  try {
    switch (testType) {
      case 'unit':
        execSync('jest tests/unit', { stdio: 'inherit' });
        break;
        
      case 'integration':
        if (!dependencies.qdrant) {
          throw new Error('Qdrant not available for integration tests');
        }
        execSync('jest tests/integration', { stdio: 'inherit' });
        break;
        
      case 'all':
        execSync('jest tests/unit', { stdio: 'inherit' });
        if (dependencies.qdrant) {
          execSync('jest tests/integration', { stdio: 'inherit' });
        }
        break;
        
      default:
        execSync('jest', { stdio: 'inherit' });
    }
    
    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

async function checkService(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

runTests().catch(console.error);
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Upload coverage
      if: matrix.node-version == '20.x'
      uses: codecov/codecov-action@v4

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      qdrant:
        image: qdrant/qdrant:latest
        ports:
          - 6333:6333
        options: >-
          --health-cmd "curl -f http://localhost:6333/health"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Wait for Qdrant
      run: |
        for i in {1..30}; do
          if curl -f http://localhost:6333/health; then break; fi
          sleep 2
        done
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        QDRANT_HOST: localhost
        QDRANT_PORT: 6333
```

## 📊 Test Strategies

### Test Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: Key workflows covered
- **E2E Tests**: Critical user paths validated

### Performance Testing

```typescript
describe('Performance Tests', () => {
  it('should handle concurrent requests', async () => {
    const start = Date.now();
    
    const promises = Array.from({ length: 100 }, () =>
      searchTool.handler({ query: 'test', limit: 1 })
    );
    
    const results = await Promise.all(promises);
    const duration = Date.now() - start;
    
    expect(results).toHaveLength(100);
    expect(duration).toBeLessThan(5000); // 5 second limit
  });
});
```

### Error Scenario Testing

```typescript
describe('Error Handling', () => {
  it('should handle network failures gracefully', async () => {
    const flakyService = {
      query: jest.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ points: [] })
    };

    const result = await searchWithRetry(flakyService, { query: 'test' });
    
    expect(result).toBeDefined();
    expect(flakyService.query).toHaveBeenCalledTimes(2);
  });
});
```

## 🛠️ Testing Utilities

### Custom Jest Matchers

```typescript
// tests/matchers.ts
expect.extend({
  toBeSortedBy(received: any[], key: string, options = {}) {
    const { descending = false } = options;
    
    for (let i = 1; i < received.length; i++) {
      const current = received[i][key];
      const previous = received[i - 1][key];
      
      if (descending ? current > previous : current < previous) {
        return {
          message: () => `Expected array to be sorted by ${key}`,
          pass: false,
        };
      }
    }
    
    return { message: () => '', pass: true };
  },
});

// Usage
expect(searchResults).toBeSortedBy('score', { descending: true });
```

### Test Data Factories

```typescript
// tests/factories.ts
export function createMockSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    content: 'Default test content',
    title: 'Test Title',
    section: 'Test Section',
    url: 'https://test.com',
    score: 0.85,
    codeExamples: ['example1', 'example2'],
    provider: 'ollama',
    ...overrides
  };
}

export function createMockSearchResults(count: number): SearchResult[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSearchResult({
      title: `Test Title ${i + 1}`,
      score: 0.9 - (i * 0.1)
    })
  );
}
```

## 📚 Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use clear, descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### 2. Mocking Strategy
- Mock external dependencies
- Use realistic mock data
- Test both success and failure scenarios
- Mock at the service boundary

### 3. Integration Testing
- Test with real services when possible
- Use containers for consistent environments
- Include cleanup in test lifecycle
- Test service health before running tests

### 4. CI/CD Best Practices
- Run unit tests on every commit
- Run integration tests on PRs
- Use matrix testing for multiple Node versions
- Generate and upload coverage reports

### 5. Performance
- Keep unit tests fast (< 100ms each)
- Use parallel execution for test suites
- Mock expensive operations
- Profile and optimize slow tests

## 🎯 Common Testing Anti-Patterns

❌ **Don't:**
- Test implementation details
- Share state between tests
- Use random data without seeds
- Skip cleanup in integration tests
- Test multiple things in one test

✅ **Do:**
- Test behavior and outcomes
- Make tests deterministic
- Use meaningful test data
- Clean up resources
- Focus on one thing per test

---

## 📖 Related Documentation

- [Mock Strategies](./mocking.md)
- [CI/CD Setup](./ci-cd.md)
- [Performance Testing](../advanced/performance.md)
- [Debugging Tests](../troubleshooting/testing.md)

*This testing strategy provides comprehensive coverage while maintaining fast feedback loops and reliable CI/CD pipelines.*