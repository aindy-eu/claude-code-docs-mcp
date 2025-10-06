# Performance & Scalability Analysis

**Generated**: 2025-10-04
**Method**: Code analysis and architecture review

## Performance Characteristics

### Async/Await Usage

**Async Files** (from grep analysis):
```bash
Files using async/await: 24 out of 28 source files
Percentage: ~86%
```

**Pattern**:
```typescript
// All services are fully async
export class FetchService {
  async fetch(url: string): Promise<FetchResult> { }
  async save(url: string, html: string): Promise<void> { }
  async get(url: string): Promise<string | null> { }
}
```

✅ **Excellent** - Non-blocking I/O throughout

### Database Queries

**Vector Search Performance** (`src/mcp-tools/search/search.ts`):
```typescript
const searchResults = await qdrant.search(collectionName, {
  vector: embedding,
  limit: params.limit || 3,
  with_payload: true
});
```

**Characteristics**:
- ✅ Parameterized limit (prevents large result sets)
- ✅ Qdrant is optimized for vector similarity (HNSW algorithm)
- ⚠️ No pagination for large result sets
- ⚠️ No query timeout configured

**Expected Performance**:
- Small collections (< 10K docs): < 50ms
- Medium collections (< 100K docs): < 200ms
- Scales logarithmically with HNSW index

### N+1 Query Problems

**Vector Upsert** (`src/services/embed-service.ts`):
```typescript
// Processes documents in batch
const points = processedDocs.map((doc, index) => ({
  id: doc.id,
  vector: embeddings[index],
  payload: doc.metadata
}));

await this.qdrantClient.upsert(collectionName, {
  wait: true,
  points: points
});
```

✅ **Good** - Batch upsert, not individual inserts

**Embedding Generation**:
```typescript
// Sequential embedding generation
for (const doc of documents) {
  const embedding = await generateEmbedding(doc.content);
  embeddings.push(embedding);
}
```

⚠️ **N+1 Pattern** - Could parallelize with `Promise.all()`

**Recommendation**: Batch embedding requests or use parallel generation

### Caching Implementation

#### Multi-Layer Caching

**Layer 1: HTML Cache** (`FetchService`):
```typescript
// src/services/fetch-service.ts:67-95
async fetch(url: string): Promise<FetchResult> {
  // Check cache first
  const cached = await this.get(url);
  if (cached && !this.hasContentChanged(cached, url)) {
    return { html: cached, cached: true };
  }

  // Fetch if not cached or changed
  const fresh = await this.fetchFresh(url);
  await this.save(url, fresh);
  return { html: fresh, cached: false };
}
```

**Layer 2: Structured JSON Cache** (`ExtractService`):
```typescript
// src/services/extract-service.ts:72-80
async get(url: string): Promise<unknown | null> {
  const jsonPath = this.getJsonPath(url);
  if (!existsSync(jsonPath)) {
    return null;
  }
  return JSON.parse(readFileSync(jsonPath, 'utf-8'));
}
```

**Layer 3: Vector Embeddings** (Qdrant):
- Persistent in vector database
- Fast similarity search
- No cache expiration (7-day TTL via manifest)

**Cache Strategy**: ✅ Excellent multi-layer approach

#### Cache Invalidation

**TTL-Based** (`ManifestService`):
```typescript
// src/services/manifest-service.ts
const DEFAULT_TTL_DAYS = 7;

shouldUpdate(url: string): boolean {
  const record = this.getRecord(url);
  if (!record) return true;

  const age = Date.now() - record.lastUpdated;
  const ttl = DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000;
  return age > ttl;
}
```

**Content-Based** (FetchService):
```typescript
// src/services/fetch-service.ts:97-121
private async hasContentChanged(cached: string, url: string): Promise<boolean> {
  const cachedHash = this.hashContent(cached);
  const metadataPath = `${this.getHtmlPath(url)}.meta.json`;

  if (existsSync(metadataPath)) {
    const metadata = JSON.parse(readFileSync(metadataPath));
    return metadata.hash !== cachedHash;
  }
  return true;
}
```

✅ **Smart Invalidation** - TTL + content hash

### Resource Limits

#### Memory Management

**No Explicit Limits Found**:
```bash
# No max memory settings in code
# No stream processing for large files
# All files loaded into memory
```

⚠️ **Risk** - Large HTML files could cause memory issues

**File Reading**:
```typescript
// src/services/fetch-service.ts
const html = readFileSync(path, 'utf-8');  // Entire file in memory
```

**Recommendation**: Use streaming for files > 10MB

#### Connection Pooling

**Qdrant Client** (`src/index.ts`):
```typescript
const qdrant = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: parseInt(process.env.QDRANT_PORT || '6333')
});
// Reused across all operations
```

✅ **Good** - Single client instance reused

**HTTP Fetch**:
```typescript
// Uses node-fetch
import fetch from 'node-fetch';
// Uses Node.js http.Agent internally (default pooling)
```

✅ **Default Pooling** - node-fetch handles connection pooling

**OpenAI/Ollama Clients**:
```typescript
// Lazy-loaded, singleton pattern
let openaiClient: OpenAI | null = null;
function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: key });
  }
  return openaiClient;
}
```

✅ **Good** - Client reuse via lazy singleton

## Scalability Analysis

### Horizontal Scalability

**Current Architecture**: Single-process design

**Parallelization Points**:
```typescript
// CLI can run multiple instances manually
npm run cli -- fetch &
npm run cli -- extract &
npm run cli -- embed &
```

⚠️ **Limited** - No built-in job queue or worker pool

**Bottlenecks**:
1. Sequential embedding generation
2. Single Qdrant instance
3. File-based locking (none implemented)

### Vertical Scalability

**Memory Usage**:
```typescript
// Estimated per operation:
- Fetch: ~1-5MB per page (HTML)
- Extract: ~5-20MB (Claude API processing)
- Embed: ~10MB per batch (embedding generation)
- Search: ~1MB per query
```

**Expected Limits**:
- Small dataset (< 1K docs): < 500MB
- Medium dataset (< 10K docs): < 2GB
- Large dataset (< 100K docs): < 10GB (Qdrant)

✅ **Good** - Efficient for intended use case

### Database Indexing

**Qdrant Vector Index**:
```typescript
// Collection creation (from integration tests)
await qdrant.createCollection(collectionName, {
  vectors: {
    size: config.dimensions,  // 768 or 1536
    distance: 'Cosine'        // Optimized for embeddings
  }
});
```

**Index Type**: HNSW (Hierarchical Navigable Small World)
- ✅ Logarithmic search time O(log n)
- ✅ Excellent for high-dimensional vectors
- ✅ Memory-efficient

**No Additional Indexes**: Qdrant handles vector indexing automatically

### Concurrency Handling

**Pipeline Stages**:
```typescript
// src/cli/pipeline/index.ts
export async function runPipeline(
  urls: string[],
  options: PipelineOptions
): Promise<void> {
  for (const url of urls) {
    await runFetchStage(url);
    await runExtractStage(url);
    await runEmbedStage(url);
  }
}
```

⚠️ **Sequential** - Processes one URL at a time

**Potential Improvement**:
```typescript
// Could parallelize with:
await Promise.all(urls.map(url => runPipeline(url, options)));
```

**Race Conditions**:
- ✅ None detected (sequential execution)
- File writes are atomic (single process)
- Qdrant handles concurrent upserts

### Load Balancing

**Not Applicable**:
- Single-process application
- Local development tool
- No load balancer needed

**If Scaled**:
- Multiple Qdrant nodes (sharding)
- Worker pool for embeddings
- Queue system (Bull, BullMQ)

## Performance Optimizations Found

### 1. Lazy Loading

**OpenAI Client**:
```typescript
// Only initialized when needed
let openaiClient: OpenAI | null = null;
```

✅ Reduces startup time and memory

### 2. Batch Processing

**Embedding Upsert**:
```typescript
// Batches multiple documents
await qdrant.upsert(collection, { points: batchPoints });
```

✅ Reduces network overhead

### 3. Content Hashing

**Change Detection**:
```typescript
private hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
```

✅ Avoids unnecessary reprocessing

### 4. Early Returns

**Manifest Checks**:
```typescript
if (!this.shouldUpdate(url)) {
  logger.info('Skipping (up to date)');
  return;
}
```

✅ Skips unnecessary work

### 5. Separate Collections

**Provider-Specific Collections**:
```typescript
getCollectionName(provider) {
  return `claude_code_docs_${provider}`;
}
```

✅ Allows parallel provider usage

## Performance Bottlenecks

### 1. Sequential Embedding Generation (High Impact)

**Current**:
```typescript
for (const doc of documents) {
  const embedding = await generateEmbedding(doc.content);
}
```

**Impact**: 10 docs × 200ms = 2 seconds

**Fix**:
```typescript
const embeddings = await Promise.all(
  documents.map(doc => generateEmbedding(doc.content))
);
```

**Expected Improvement**: 10× faster (200ms total)

### 2. Claude Extraction (Medium Impact)

**Current**: External Python process per URL
```typescript
spawn('python3', ['tools/extract.py'], { env: { DOC_URL: url } });
```

**Impact**: ~5-10 seconds per page (Claude API)

**Not Optimizable**: API-bound operation

### 3. No Request Pooling (Low Impact)

**OpenAI/Ollama**: No concurrent request limits

**Impact**: Could overwhelm APIs with large batches

**Fix**: Implement request queue with concurrency limit (p-limit)

## Scalability Recommendations

### Immediate (Low Effort)

1. **Parallelize Embedding Generation**
   ```typescript
   // Use Promise.all() for concurrent embeddings
   ```

2. **Add Request Concurrency Limits**
   ```typescript
   import pLimit from 'p-limit';
   const limit = pLimit(5);  // Max 5 concurrent API calls
   ```

3. **Stream Large Files**
   ```typescript
   // For HTML > 10MB, use streams instead of readFileSync
   ```

### Short Term (Medium Effort)

1. **Worker Pool for Pipeline**
   ```typescript
   // Process multiple URLs concurrently
   const pool = new WorkerPool(3);
   await pool.map(urls, url => runPipeline(url));
   ```

2. **Progress Tracking**
   ```typescript
   // Already using Listr2, enhance with ETA
   ```

3. **Retry Logic with Backoff**
   ```typescript
   // For API failures
   async function retry(fn, attempts = 3) { }
   ```

### Long Term (High Effort)

1. **Queue System (Bull/BullMQ)**
   - Durable job queue
   - Distributed processing
   - Job retries and scheduling

2. **Qdrant Clustering**
   - Horizontal scaling for large datasets
   - Sharding across nodes
   - Replication for availability

3. **Caching Layer (Redis)**
   - Cache embeddings temporarily
   - Share state across workers
   - Rate limiting

## Performance Monitoring

**Currently**: None implemented

**Recommended Metrics**:
```typescript
// Add timing metrics
const start = Date.now();
await operation();
const duration = Date.now() - start;
logger.info(`Operation took ${duration}ms`);
```

**Tools to Add**:
- `clinic` - Node.js profiling
- `prom-client` - Prometheus metrics
- `winston` - Structured logging

## Load Testing

**Not Performed**

**Recommended Tests**:
1. 100 documents ingestion
2. 1,000 concurrent searches
3. Memory leak detection (long-running server)

**Tools**:
- `autocannon` for HTTP load testing
- `0x` for flame graphs
- `heapdump` for memory profiling

## Resource Optimization Opportunities

### CPU
- ✅ Async I/O (non-blocking)
- ⚠️ Sequential embeddings (could parallelize)
- ✅ No CPU-intensive operations in Node.js

### Memory
- ⚠️ All files loaded in memory (could stream)
- ✅ Qdrant stores vectors externally
- ✅ No obvious memory leaks in code

### Network
- ✅ Connection pooling (default)
- ⚠️ No request batching for embeddings
- ✅ Local Qdrant (minimal latency)

### Disk I/O
- ✅ Cache reduces repeated fetches
- ⚠️ No compression for cached HTML
- ✅ JSON is compact and fast

## Scalability Score: 7/10

**Current State**: Well-optimized for small-medium scale

**Strengths**:
- Async/await throughout
- Multi-layer caching
- Batch upsert to Qdrant
- Efficient vector indexing

**Limitations**:
- Sequential processing (not parallel)
- No distributed architecture
- Single-process design
- No resource limits enforced

**Capacity Estimate**:
- Current: 1-10K documents, 100s of searches/min
- With improvements: 100K documents, 1000s of searches/min
- With architecture change: Millions of documents, unlimited scale
