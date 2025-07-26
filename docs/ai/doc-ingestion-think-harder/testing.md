# Testing Guide - Think Harder Level

## Advanced Testing Strategy

### Testing Philosophy
- **Property-Based Testing** - Test invariants, not just examples
- **Chaos Engineering** - Introduce controlled failures
- **Performance Profiling** - Continuous performance monitoring
- **Contract Testing** - Verify component interfaces
- **Mutation Testing** - Test the tests themselves

## Test Architecture

```
tests/
├── unit/
│   ├── core/
│   ├── intelligence/
│   └── integration/
├── property/
│   ├── chunking.property.ts
│   ├── caching.property.ts
│   └── orchestration.property.ts
├── integration/
│   ├── e2e/
│   ├── contracts/
│   └── performance/
├── chaos/
│   ├── fault-injection/
│   └── stress-tests/
└── benchmarks/
    ├── semantic-chunking.bench.ts
    ├── parallel-processing.bench.ts
    └── cache-efficiency.bench.ts
```

## Property-Based Testing

### Semantic Chunking Properties
```typescript
// tests/property/chunking.property.ts
import fc from 'fast-check';
import { SemanticChunker } from '../../src/intelligence/SemanticChunker';

describe('SemanticChunker Properties', () => {
  const chunker = new SemanticChunker(mockEmbeddingService);

  test('chunks never exceed target size', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1000, maxLength: 50000 }),
        fc.integer({ min: 500, max: 2000 }),
        async (content, targetSize) => {
          const chunks = await chunker.chunkDocument(content, {
            targetChunkSize: targetSize,
            overlapRatio: 0.1,
            minSemanticScore: 0.7,
            contextWindow: 100
          });

          for (const chunk of chunks) {
            const tokens = encode(chunk.content).length;
            expect(tokens).toBeLessThanOrEqual(targetSize * 1.2); // 20% tolerance
          }
        }
      )
    );
  });

  test('semantic coherence is maintained', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 100 }), { minLength: 5, maxLength: 20 }),
        async (paragraphs) => {
          const content = paragraphs.join('\n\n');
          const chunks = await chunker.chunkDocument(content, defaultOptions);

          // Each chunk should have high internal coherence
          for (const chunk of chunks) {
            expect(chunk.semanticScore).toBeGreaterThan(0.6);
          }

          // Adjacent chunks should have reasonable similarity
          for (let i = 0; i < chunks.length - 1; i++) {
            const similarity = cosineSimilarity(
              chunks[i].embedding!,
              chunks[i + 1].embedding!
            );
            expect(similarity).toBeGreaterThan(0.3);
          }
        }
      )
    );
  });

  test('overlapping preserves context', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5000 }),
        fc.float({ min: 0.05, max: 0.3 }),
        async (content, overlapRatio) => {
          const chunks = await chunker.chunkDocument(content, {
            ...defaultOptions,
            overlapRatio
          });

          for (let i = 0; i < chunks.length - 1; i++) {
            const currentEnd = chunks[i].content.slice(-100);
            const nextStart = chunks[i + 1].content.slice(0, 100);
            
            // There should be some overlap in content
            const overlap = findLongestCommonSubstring(currentEnd, nextStart);
            expect(overlap.length).toBeGreaterThan(10);
          }
        }
      )
    );
  });
});
```

### Worker Pool Properties
```typescript
// tests/property/worker-pool.property.ts
describe('WorkerPool Properties', () => {
  test('all tasks complete regardless of failure rate', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.string(),
          shouldFail: fc.boolean(),
          duration: fc.integer({ min: 10, max: 1000 })
        }), { minLength: 10, maxLength: 100 }),
        fc.integer({ min: 1, max: 8 }),
        async (tasks, workerCount) => {
          const pool = new WorkerPool('./test-worker.js', {
            minWorkers: workerCount,
            maxWorkers: workerCount,
            taskTimeout: 5000
          });

          const results = await pool.executeBatch(tasks);
          
          // All tasks should have results (success or failure)
          expect(results).toHaveLength(tasks.length);
          
          // Task IDs should match
          const resultIds = results.map(r => r.id).sort();
          const taskIds = tasks.map(t => t.id).sort();
          expect(resultIds).toEqual(taskIds);
          
          // Failed tasks should have errors
          const expectedFailures = tasks.filter(t => t.shouldFail);
          const actualFailures = results.filter(r => r.error);
          expect(actualFailures.length).toBeGreaterThanOrEqual(expectedFailures.length);
          
          await pool.shutdown();
        }
      )
    );
  });

  test('parallel execution is faster than sequential', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 50, max: 200 }), 
          { minLength: 10, maxLength: 30 }
        ),
        async (durations) => {
          const tasks = durations.map((d, i) => ({
            id: `task-${i}`,
            data: { delay: d }
          }));

          // Sequential baseline
          const sequentialStart = Date.now();
          for (const task of tasks) {
            await new Promise(resolve => setTimeout(resolve, task.data.delay));
          }
          const sequentialTime = Date.now() - sequentialStart;

          // Parallel execution
          const pool = new WorkerPool('./delay-worker.js', {
            minWorkers: 4,
            maxWorkers: 4,
            taskTimeout: 5000
          });

          const parallelStart = Date.now();
          await pool.executeBatch(tasks);
          const parallelTime = Date.now() - parallelStart;

          await pool.shutdown();

          // Parallel should be significantly faster
          expect(parallelTime).toBeLessThan(sequentialTime * 0.5);
        }
      )
    );
  });
});
```

## Contract Testing

### Component Interface Contracts
```typescript
// tests/integration/contracts/embedding-service.contract.ts
import { EmbeddingService } from '../../../src/services/EmbeddingService';

const embeddingServiceContract = {
  generateEmbedding: {
    input: z.string().min(1),
    output: z.array(z.number()).length(384),
    behavior: async (service: EmbeddingService, input: string) => {
      const embedding = await service.generateEmbedding(input);
      
      // Verify normalization
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 2);
      
      // Verify determinism
      const embedding2 = await service.generateEmbedding(input);
      expect(embedding).toEqual(embedding2);
    }
  }
};

describe('EmbeddingService Contract', () => {
  const providers = ['ollama', 'openai', 'mock'];
  
  providers.forEach(provider => {
    describe(`Provider: ${provider}`, () => {
      const service = new EmbeddingService(provider);
      
      test('generateEmbedding contract', async () => {
        await testContract(embeddingServiceContract.generateEmbedding, service);
      });
    });
  });
});
```

## Chaos Engineering

### Fault Injection Tests
```typescript
// tests/chaos/fault-injection/network-chaos.ts
import { ChaosMonkey } from '../../utils/chaos-monkey';

describe('Network Chaos Tests', () => {
  const chaos = new ChaosMonkey();

  beforeEach(() => {
    chaos.reset();
  });

  test('handles intermittent network failures', async () => {
    // Configure 20% failure rate
    chaos.configure({
      networkFailureRate: 0.2,
      networkLatency: { min: 100, max: 2000 }
    });

    const orchestrator = new IngestionOrchestrator({
      httpClient: chaos.wrapHttpClient(httpClient)
    });

    const urls = Array(20).fill(0).map((_, i) => 
      `https://docs.example.com/page-${i}`
    );

    const results = await orchestrator.ingestBatch(urls);
    
    // Should complete despite failures
    expect(results.successful.length).toBeGreaterThan(15); // 75% success minimum
    expect(results.failed.length).toBeLessThan(5);
    
    // Should have retried failures
    const metrics = chaos.getMetrics();
    expect(metrics.totalRequests).toBeGreaterThan(20);
    expect(metrics.retriedRequests).toBeGreaterThan(0);
  });

  test('handles storage failures gracefully', async () => {
    let failureCount = 0;
    const maxFailures = 3;

    // Inject controlled Qdrant failures
    const mockQdrant = {
      upsert: jest.fn().mockImplementation(async () => {
        if (failureCount++ < maxFailures) {
          throw new Error('Connection timeout');
        }
        return { status: 'ok' };
      })
    };

    const orchestrator = new IngestionOrchestrator({
      storage: mockQdrant
    });

    const result = await orchestrator.ingestDocument(testUrl);
    
    // Should succeed after retries
    expect(result.success).toBe(true);
    expect(mockQdrant.upsert).toHaveBeenCalledTimes(maxFailures + 1);
  });
});
```

### Stress Testing
```typescript
// tests/chaos/stress-tests/memory-pressure.ts
describe('Memory Pressure Tests', () => {
  test('handles large documents without OOM', async () => {
    const largeDocument = generateLargeDocument(100_000_000); // 100MB
    const memoryBefore = process.memoryUsage().heapUsed;

    const chunker = new SemanticChunker(embeddingService);
    
    // Should use streaming/chunking to avoid loading all in memory
    const chunks = await chunker.chunkDocument(largeDocument, {
      targetChunkSize: 1000,
      streaming: true
    });

    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryIncrease = memoryAfter - memoryBefore;

    // Memory increase should be much less than document size
    expect(memoryIncrease).toBeLessThan(10_000_000); // Less than 10MB increase
    expect(chunks.length).toBeGreaterThan(0);
  });

  test('worker pool handles resource exhaustion', async () => {
    const pool = new WorkerPool('./heavy-worker.js', {
      minWorkers: 2,
      maxWorkers: 4,
      taskTimeout: 5000,
      memoryLimit: 512 // MB per worker
    });

    // Generate tasks that consume memory
    const heavyTasks = Array(50).fill(0).map((_, i) => ({
      id: `heavy-${i}`,
      data: { allocateMB: 100 }
    }));

    const results = await pool.executeBatch(heavyTasks);
    
    // Should complete all tasks by recycling workers
    const successful = results.filter(r => !r.error);
    expect(successful.length).toBe(50);
    
    // Should have recycled workers
    const metrics = pool.getMetrics();
    expect(metrics.workersRecycled).toBeGreaterThan(0);
  });
});
```

## Performance Benchmarking

### Semantic Chunking Benchmark
```typescript
// tests/benchmarks/semantic-chunking.bench.ts
import { Suite } from 'benchmark';
import { SemanticChunker } from '../../src/intelligence/SemanticChunker';

const suite = new Suite('Semantic Chunking Performance');

// Test data
const documents = {
  small: generateDocument(1000),    // 1KB
  medium: generateDocument(50000),  // 50KB
  large: generateDocument(500000),  // 500KB
  huge: generateDocument(5000000)   // 5MB
};

const chunkers = {
  semantic: new SemanticChunker(embeddingService),
  structural: new StructuralChunker(),
  hybrid: new HybridChunker(embeddingService)
};

Object.entries(documents).forEach(([size, content]) => {
  Object.entries(chunkers).forEach(([type, chunker]) => {
    suite.add(`${type} chunking - ${size}`, {
      defer: true,
      fn: async (deferred: any) => {
        await chunker.chunkDocument(content, defaultOptions);
        deferred.resolve();
      }
    });
  });
});

suite
  .on('cycle', (event: any) => {
    console.log(String(event.target));
    
    // Log additional metrics
    const stats = event.target.stats;
    console.log(`  Mean: ${stats.mean * 1000}ms`);
    console.log(`  Deviation: ${stats.deviation * 1000}ms`);
    console.log(`  Throughput: ${1 / stats.mean} docs/sec`);
  })
  .on('complete', function(this: any) {
    console.log('\nFastest:', this.filter('fastest').map('name'));
    
    // Generate performance report
    generatePerformanceReport(this);
  })
  .run({ async: true });
```

### Parallel Processing Benchmark
```typescript
// tests/benchmarks/parallel-processing.bench.ts
async function benchmarkParallelProcessing() {
  const configurations = [
    { workers: 1, batch: 10 },
    { workers: 2, batch: 10 },
    { workers: 4, batch: 10 },
    { workers: 8, batch: 10 },
    { workers: 4, batch: 50 },
    { workers: 4, batch: 100 }
  ];

  const results = [];

  for (const config of configurations) {
    const pool = new WorkerPool('./benchmark-worker.js', {
      minWorkers: config.workers,
      maxWorkers: config.workers,
      taskTimeout: 30000
    });

    const tasks = Array(config.batch).fill(0).map((_, i) => ({
      id: `task-${i}`,
      data: { complexity: 'medium' }
    }));

    const start = performance.now();
    await pool.executeBatch(tasks);
    const duration = performance.now() - start;

    results.push({
      ...config,
      duration,
      throughput: config.batch / (duration / 1000),
      efficiency: (1 / config.workers) / (duration / (config.batch * 1000))
    });

    await pool.shutdown();
  }

  // Generate visualization
  console.table(results);
  await generateSpeedupChart(results);
}
```

## Load Testing

### Concurrent User Simulation
```typescript
// tests/integration/performance/load-test.ts
import autocannon from 'autocannon';

describe('Load Testing', () => {
  test('MCP server handles concurrent requests', async () => {
    const instance = autocannon({
      url: 'http://localhost:3000',
      connections: 50,
      pipelining: 10,
      duration: 30,
      requests: [
        {
          method: 'POST',
          path: '/tools/call',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            name: 'ingest_document',
            arguments: {
              url: 'https://docs.example.com/test',
              options: { parallelWorkers: 2 }
            }
          })
        }
      ]
    });

    const results = await instance;
    
    // Performance assertions
    expect(results.requests.mean).toBeGreaterThan(100); // 100+ req/sec
    expect(results.latency.p99).toBeLessThan(5000);     // 99th percentile < 5s
    expect(results.errors).toBe(0);                      // No errors
    
    // Generate report
    console.log('Load test results:', {
      throughput: `${results.requests.mean} req/sec`,
      latency: {
        p50: `${results.latency.p50}ms`,
        p95: `${results.latency.p95}ms`,
        p99: `${results.latency.p99}ms`
      },
      errors: results.errors
    });
  });
});
```

## Mutation Testing

### Test Quality Verification
```typescript
// tests/mutation/test-quality.ts
import { runMutationTesting } from 'stryker';

async function assessTestQuality() {
  const config = {
    mutate: ['src/**/*.ts'],
    testRunner: 'jest',
    reporters: ['html', 'clear-text', 'progress'],
    thresholds: { high: 90, low: 70, break: 60 },
    jest: {
      projectType: 'node',
      configFile: 'jest.config.js'
    }
  };

  const result = await runMutationTesting(config);
  
  console.log('Mutation testing results:');
  console.log(`Mutation score: ${result.mutationScore}%`);
  console.log(`Killed: ${result.killed}`);
  console.log(`Survived: ${result.survived}`);
  console.log(`Timeout: ${result.timeout}`);
  
  // Ensure test quality
  expect(result.mutationScore).toBeGreaterThan(80);
}
```

## Continuous Testing

### Performance Regression Detection
```typescript
// tests/performance/regression-guard.ts
interface PerformanceBaseline {
  operation: string;
  p50: number;
  p95: number;
  p99: number;
}

const baselines: PerformanceBaseline[] = [
  { operation: 'semantic-chunk-1mb', p50: 200, p95: 500, p99: 1000 },
  { operation: 'embed-batch-100', p50: 1000, p95: 2000, p99: 3000 },
  { operation: 'qdrant-store-chunk', p50: 50, p95: 100, p99: 200 }
];

describe('Performance Regression Tests', () => {
  baselines.forEach(baseline => {
    test(`${baseline.operation} performance`, async () => {
      const samples = await collectPerformanceSamples(
        baseline.operation,
        100 // iterations
      );
      
      const stats = calculateStatistics(samples);
      
      // Allow 10% degradation
      expect(stats.p50).toBeLessThan(baseline.p50 * 1.1);
      expect(stats.p95).toBeLessThan(baseline.p95 * 1.1);
      expect(stats.p99).toBeLessThan(baseline.p99 * 1.1);
      
      // Log for trending
      await logPerformanceMetrics({
        operation: baseline.operation,
        timestamp: new Date(),
        stats,
        baseline
      });
    });
  });
});
```

## Test Orchestration

### Intelligent Test Suite
```yaml
# .github/workflows/advanced-testing.yml
name: Advanced Testing Suite

on: [push, pull_request]

jobs:
  property-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        seed: [1, 42, 99, 256, 512]
    steps:
      - uses: actions/checkout@v3
      - name: Run property tests with seed ${{ matrix.seed }}
        run: npm run test:property -- --seed=${{ matrix.seed }}

  chaos-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run chaos engineering tests
        run: npm run test:chaos
      - name: Upload chaos reports
        uses: actions/upload-artifact@v3
        with:
          name: chaos-reports
          path: chaos-reports/

  performance-benchmarks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run benchmarks
        run: npm run bench
      - name: Compare with baseline
        run: npm run bench:compare
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: bench-results/

  mutation-testing:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - name: Run mutation tests
        run: npm run test:mutation
      - name: Comment PR with mutation score
        uses: actions/github-script@v6
        with:
          script: |
            const score = require('./mutation-report.json').mutationScore;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🧬 Mutation Score: ${score}%`
            });
```

## Testing Checklist

### Pre-deployment Advanced Tests
- [ ] Property tests pass with 1000+ iterations
- [ ] Contract tests verify all interfaces
- [ ] Chaos tests show graceful degradation
- [ ] Performance benchmarks meet baselines
- [ ] Load tests confirm scalability
- [ ] Mutation score > 80%
- [ ] Memory leak detection clean
- [ ] Security fuzzing finds no issues

### Quality Metrics
- Code coverage: > 95%
- Mutation score: > 80%
- Performance regression: < 10%
- Chaos resilience: > 90% success under failure
- Property test confidence: 99.9%