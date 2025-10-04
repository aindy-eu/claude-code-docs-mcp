# Qdrant Performance & Optimization

Strategies for optimizing Qdrant performance, caching, and scaling for production workloads.

> **Implementation Status**: This document contains both implemented features (✅) and example/future implementations (🔮). Look for the status indicators throughout.

## 📊 Performance Metrics

### Current System Performance

Based on typical usage with Claude Code docs:

- **Documents**: ~60-100 vectors per full ingestion
- **Query latency**: 10-50ms (local Qdrant)
- **Embedding generation**: 50-200ms (Ollama), 100-500ms (OpenAI)
- **Total search time**: ~100-300ms end-to-end
- **Memory usage**: ~100-200MB for small collections

### Scaling Benchmarks

| Documents | Memory | Query Time | Index Time |
| --------- | ------ | ---------- | ---------- |
| 1K        | 50MB   | <10ms      | <1s        |
| 10K       | 200MB  | 10-20ms    | 5-10s      |
| 100K      | 1GB    | 20-50ms    | 1-2min     |
| 1M        | 8GB    | 50-100ms   | 10-20min   |

## ⚡ Collection Optimization

### 🔮 HNSW Index Configuration (EXAMPLE/FUTURE IMPLEMENTATION)

The Hierarchical Navigable Small World (HNSW) algorithm powers Qdrant's search:

```typescript
// Optimal settings for different collection sizes
const getOptimalHNSWConfig = (expectedSize: number) => {
  if (expectedSize < 10000) {
    // Small collections: Prioritize accuracy
    return {
      m: 16, // More connections
      ef_construct: 100, // Higher quality construction
      full_scan_threshold: 1000 // Use full scan for tiny collections
    };
  } else if (expectedSize < 100000) {
    // Medium collections: Balance
    return {
      m: 16,
      ef_construct: 200,
      full_scan_threshold: 10000
    };
  } else {
    // Large collections: Prioritize speed
    return {
      m: 12, // Fewer connections
      ef_construct: 400, // Better construction
      full_scan_threshold: 20000
    };
  }
};
```

### 🔮 Memory Optimization (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
async function optimizeCollectionMemory(
  client: QdrantClient,
  collectionName: string
): Promise<void> {
  await client.updateCollection(collectionName, {
    optimizers_config: {
      // Move to disk when exceeding threshold
      memmap_threshold: 200000,

      // Delay indexing for batch operations
      indexing_threshold: 20000,

      // Cleanup deleted vectors
      deleted_threshold: 0.2,
      vacuum_min_vector_number: 1000,

      // Segment management
      default_segment_number: 0, // Auto
      max_segment_size: 200000,

      // Flush to disk interval
      flush_interval_sec: 5,

      // Parallel processing
      max_optimization_threads: 2
    }
  });
}
```

### Trigger Manual Optimization

```typescript
// Force optimization after bulk operations
async function forceOptimization(client: QdrantClient, collectionName: string): Promise<void> {
  // This is a placeholder - actual API may vary
  // Check Qdrant docs for current optimization endpoints
  console.log(`🔧 Triggering optimization for ${collectionName}`);

  // Get current stats
  const before = await client.getCollection(collectionName);
  console.log(`Segments before: ${before.segments_count}`);

  // Wait for background optimization
  await new Promise(resolve => setTimeout(resolve, 5000));

  const after = await client.getCollection(collectionName);
  console.log(`Segments after: ${after.segments_count}`);
}
```

## 💾 Caching Strategy

### 🔮 Vector Cache Implementation (EXAMPLE/FUTURE IMPLEMENTATION - NOT IN CODEBASE)

```typescript
export class VectorCache {
  private cache = new Map<
    string,
    {
      vector: number[];
      timestamp: number;
    }
  >();
  private maxSize: number = 1000;
  private ttl: number = 5 * 60 * 1000; // 5 minutes

  async getOrGenerate(
    text: string,
    provider: EmbeddingProvider,
    generator: (text: string) => Promise<number[]>
  ): Promise<number[]> {
    const key = this.getCacheKey(text, provider);
    const cached = this.cache.get(key);

    // Return cached if still valid
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.vector;
    }

    // Generate new embedding
    const vector = await generator(text);

    // Store in cache (with LRU eviction)
    this.set(key, vector);

    return vector;
  }

  private set(key: string, vector: number[]): void {
    // Evict oldest if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      vector,
      timestamp: Date.now()
    });
  }

  private getCacheKey(text: string, provider: string): string {
    // Simple hash for cache key
    const hash = text.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${provider}:${hash}`;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const totalSize = this.cache.size;
    const estimatedMemory = totalSize * 768 * 4; // Rough estimate in bytes

    return {
      entries: totalSize,
      memoryMB: (estimatedMemory / 1024 / 1024).toFixed(2),
      hitRate: this.calculateHitRate()
    };
  }

  private hits = 0;
  private misses = 0;

  private calculateHitRate(): string {
    const total = this.hits + this.misses;
    if (total === 0) return '0%';
    return `${((this.hits / total) * 100).toFixed(1)}%`;
  }
}

// Usage
const cache = new VectorCache();
const embedding = await cache.getOrGenerate('search query', 'ollama', async text =>
  generateEmbedding(text, 'ollama')
);
```

### 🔮 Search Result Cache (EXAMPLE/FUTURE IMPLEMENTATION - NOT IN CODEBASE)

```typescript
export class SearchResultCache {
  private cache = new LRUCache<string, any[]>({
    max: 100,
    ttl: 1000 * 60 * 2 // 2 minutes
  });

  getCacheKey(query: string, provider: string, limit: number): string {
    return `${provider}:${limit}:${query}`;
  }

  async searchWithCache(
    query: string,
    searchFn: () => Promise<any[]>,
    provider: string,
    limit: number
  ): Promise<any[]> {
    const key = this.getCacheKey(query, provider, limit);

    // Check cache
    const cached = this.cache.get(key);
    if (cached) {
      console.log('🎯 Cache hit for search query');
      return cached;
    }

    // Execute search
    console.log('🔍 Cache miss, executing search');
    const results = await searchFn();

    // Store in cache
    this.cache.set(key, results);

    return results;
  }
}
```

## 🚀 Batch Processing

### ✅ Basic Batch Upsert (ACTUALLY IMPLEMENTED IN EMBED SERVICE)

The actual implementation uses batch upsert in `EmbedService`:

```typescript
// From src/services/embed-service.ts
await this.qdrantClient.upsert(collection, {
  points,
  wait: true
});
```

### 🔮 Advanced Batch Processor (EXAMPLE/FUTURE IMPLEMENTATION - NOT IN CODEBASE)

```typescript
export class BatchProcessor {
  constructor(
    private client: QdrantClient,
    private collectionName: string
  ) {}

  async batchIngest(
    documents: Array<{
      content: string;
      metadata: any;
    }>,
    provider: EmbeddingProvider,
    options: {
      batchSize?: number;
      parallel?: number;
      onProgress?: (current: number, total: number) => void;
    } = {}
  ): Promise<void> {
    const { batchSize = 100, parallel = 3, onProgress } = options;

    // Generate embeddings in parallel batches
    const embeddings = await this.parallelEmbeddings(
      documents.map(d => d.content),
      provider,
      parallel
    );

    // Prepare points for Qdrant
    const points = documents.map((doc, i) => ({
      id: uuidv4(),
      vector: embeddings[i],
      payload: {
        ...doc.metadata,
        content: doc.content,
        indexed_at: new Date().toISOString()
      }
    }));

    // Upsert in batches
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);

      await this.client.upsert(this.collectionName, {
        points: batch,
        wait: true // Wait for operation to complete
      });

      if (onProgress) {
        onProgress(Math.min(i + batchSize, points.length), points.length);
      }
    }
  }

  private async parallelEmbeddings(
    texts: string[],
    provider: EmbeddingProvider,
    parallel: number
  ): Promise<number[][]> {
    const results: number[][] = new Array(texts.length);
    const queue = texts.map((text, index) => ({ text, index }));

    const workers = Array(parallel)
      .fill(null)
      .map(async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) break;

          results[item.index] = await generateEmbedding(item.text, provider);
        }
      });

    await Promise.all(workers);
    return results;
  }
}
```

## 📈 Monitoring Performance

### 🔮 Performance Tracker (EXAMPLE/FUTURE IMPLEMENTATION - NOT IN CODEBASE)

```typescript
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  async measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - start;

      this.recordMetric(name, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(values.length * 0.5)],
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)]
    };
  }

  printReport(): void {
    console.log('📊 Performance Report:');
    console.log('─'.repeat(50));

    for (const [name, values] of this.metrics) {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`${name}:`);
        console.log(`  Count: ${stats.count}`);
        console.log(`  Avg: ${stats.avg.toFixed(2)}ms`);
        console.log(`  P50: ${stats.p50.toFixed(2)}ms`);
        console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
        console.log(`  P99: ${stats.p99.toFixed(2)}ms`);
        console.log('');
      }
    }
  }
}

// Usage
const monitor = new PerformanceMonitor();

const results = await monitor.measureOperation('search', async () => searchDocumentation(query));

monitor.printReport();
```

## 🔄 Query Optimization

### ✅ Actual Search Implementation (FROM CODEBASE)

The actual search implementation in `src/mcp-tools/search/search.ts`:

```typescript
const searchResults = await qdrant.query(collectionName, {
  query: queryEmbedding,
  limit: Math.ceil(limit / providersToSearch.length),
  with_payload: true,
  score_threshold: 0.5 // Lowered threshold to capture more results
});
```

### 🔮 Advanced Search Performance Tips (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
// 1. Use appropriate limit
const optimalLimit = Math.min(desiredResults * 1.5, 20);

// 2. Use score threshold to filter early
const scoreThreshold = 0.5; // Adjust based on quality needs

// 3. Use filters to reduce search space
const filter = {
  must: [{ key: 'source', match: { value: 'docs.claude.com' } }]
};

// 4. Optimize ef parameter for search
const searchParams = {
  vector: queryVector,
  limit: optimalLimit,
  score_threshold: scoreThreshold,
  filter,
  params: {
    hnsw_ef: 128 // Higher = more accurate but slower
  }
};
```

### 🔮 Parallel Search Strategy (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
async function parallelSearch(
  queries: string[],
  provider: EmbeddingProvider
): Promise<Map<string, any[]>> {
  const results = new Map();

  // Generate embeddings in parallel
  const embeddings = await Promise.all(queries.map(q => generateEmbedding(q, provider)));

  // Execute searches in parallel
  const searchResults = await Promise.all(
    embeddings.map((vector, i) =>
      qdrantClient.search(getCollectionName(provider), {
        vector,
        limit: 5
      })
    )
  );

  // Map results
  queries.forEach((query, i) => {
    results.set(query, searchResults[i]);
  });

  return results;
}
```

## 🎯 Best Practices

### 1. Collection Design

- Separate collections per embedding provider
- Use appropriate vector dimensions
- Configure HNSW based on expected size

### 2. Batch Operations

- Use batch sizes of 100-500 documents
- Implement parallel embedding generation
- Use `wait: true` for critical operations

### 3. Caching

- Cache embeddings for repeated queries
- Cache search results with short TTL
- Monitor cache hit rates

### 4. Monitoring

- Track query latencies
- Monitor memory usage
- Watch segment count growth

### 5. Maintenance

- Periodically optimize collections
- Clean up deleted vectors
- Monitor and rotate logs

## 🔧 Troubleshooting

### High Memory Usage

```bash
# Check collection stats
curl http://localhost:6333/collections/claude_code_docs_ollama

# Solutions:
# 1. Increase memmap_threshold
# 2. Reduce cache sizes
# 3. Use disk-based indices for large collections
```

### Slow Queries

```typescript
// Diagnose slow queries
async function diagnoseSlowQuery(query: string) {
  console.time('Total');

  console.time('Embedding');
  const vector = await generateEmbedding(query, 'ollama');
  console.timeEnd('Embedding');

  console.time('Search');
  const results = await qdrantClient.search('claude_code_docs_ollama', {
    vector,
    limit: 10
  });
  console.timeEnd('Search');

  console.timeEnd('Total');

  return results;
}
```

## 📚 Related Guides

- [Client Integration](./client-integration.md) - Qdrant client usage
- [Embeddings](./embeddings.md) - Embedding generation
- [Monitoring](./monitoring.md) - Health and metrics

## 🔗 Resources

- [Qdrant Performance Tuning](https://qdrant.tech/documentation/performance/)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
- [Vector Database Benchmarks](https://qdrant.tech/benchmarks/)
