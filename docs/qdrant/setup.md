# Qdrant Vector Database Setup & Operations

Complete guide to setting up, configuring, and operating Qdrant for production RAG systems with embedding storage and retrieval.

## 🎯 Overview

Qdrant is a high-performance vector database designed for similarity search and retrieval. This guide covers production deployment patterns, optimization strategies, and integration with embedding services.

## 🐳 Docker Installation

### Basic Setup

```bash
# Pull and run Qdrant
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# With persistent storage
docker run -p 6333:6333 -p 6334:6334 \\
  -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \\
  qdrant/qdrant

# With configuration
docker run -p 6333:6333 -p 6334:6334 \\
  -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \\
  -v "$(pwd)/qdrant_config.yaml:/qdrant/config/production.yaml" \\
  qdrant/qdrant
```

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage:z
      - ./config/qdrant.yaml:/qdrant/config/production.yaml
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

volumes:
  qdrant_storage:
```

### Production Configuration

```yaml
# config/qdrant.yaml
service:
  http_port: 6333
  grpc_port: 6334
  max_request_size_mb: 32
  max_workers: 0  # Auto-detect CPU cores

storage:
  # Optimize for your use case
  hnsw_config:
    m: 16                    # Number of bi-directional links
    ef_construct: 100        # Size of dynamic candidate list
    max_indexing_threads: 0  # Auto-detect

  # Memory optimization
  optimizers:
    memmap_threshold: 200000
    indexing_threshold: 20000

cluster:
  enabled: false  # Enable for multi-node setup

# Enable telemetry for monitoring
telemetry_disabled: false
```

## 🔧 Client Integration

### TypeScript Client Setup

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333'),
      timeout: 30000,
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      console.error('Qdrant health check failed:', error);
      return false;
    }
  }

  async waitForReady(maxRetries = 10): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      if (await this.healthCheck()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Qdrant failed to become ready');
  }
}
```

### Collection Management

```typescript
export interface CollectionConfig {
  name: string;
  vectorSize: number;
  distance: 'Cosine' | 'Euclid' | 'Dot';
  replicas?: number;
  shards?: number;
}

export class CollectionManager {
  constructor(private client: QdrantClient) {}

  async createCollection(config: CollectionConfig): Promise<void> {
    const { name, vectorSize, distance, replicas = 1, shards = 1 } = config;

    try {
      await this.client.createCollection(name, {
        vectors: {
          size: vectorSize,
          distance: distance
        },
        replication_factor: replicas,
        shard_number: shards,
        
        // Optimization settings
        hnsw_config: {
          m: 16,
          ef_construct: 100,
          full_scan_threshold: 10000
        },
        
        // Memory optimization
        optimizers_config: {
          memmap_threshold: 200000,
          indexing_threshold: 20000
        }
      });
      
      console.log(`✅ Collection "${name}" created successfully`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`⚠️  Collection "${name}" already exists`);
      } else {
        throw error;
      }
    }
  }

  async getCollectionInfo(name: string) {
    const info = await this.client.getCollection(name);
    return {
      name,
      pointsCount: info.points_count || 0,
      vectorSize: info.config?.params?.vectors?.size,
      distance: info.config?.params?.vectors?.distance,
      status: info.status
    };
  }

  async deleteCollection(name: string): Promise<void> {
    await this.client.deleteCollection(name);
    console.log(`🗑️  Collection "${name}" deleted`);
  }
}
```

## 📊 Vector Operations

### Document Ingestion

```typescript
export interface DocumentVector {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

export class VectorOperations {
  constructor(private client: QdrantClient) {}

  async upsertVectors(
    collectionName: string, 
    vectors: DocumentVector[]
  ): Promise<void> {
    const batchSize = 100; // Optimize based on your document size
    
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      
      await this.client.upsert(collectionName, {
        points: batch.map(v => ({
          id: v.id,
          vector: v.vector,
          payload: v.payload
        }))
      });
      
      console.log(`📝 Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
    }
  }

  async searchSimilar(
    collectionName: string,
    queryVector: number[],
    options: {
      limit?: number;
      scoreThreshold?: number;
      filter?: any;
      withPayload?: boolean;
    } = {}
  ) {
    const {
      limit = 10,
      scoreThreshold = 0.0,
      filter,
      withPayload = true
    } = options;

    const results = await this.client.query(collectionName, {
      query: queryVector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: withPayload,
      ...(filter && { filter })
    });

    return results.points.map(point => ({
      id: point.id,
      score: point.score || 0,
      payload: point.payload || {}
    }));
  }

  async searchWithFilters(
    collectionName: string,
    queryVector: number[],
    filters: {
      must?: any[];
      mustNot?: any[];
      should?: any[];
    },
    limit = 10
  ) {
    const filter: any = {};
    
    if (filters.must?.length) filter.must = filters.must;
    if (filters.mustNot?.length) filter.must_not = filters.mustNot;
    if (filters.should?.length) filter.should = filters.should;

    return this.searchSimilar(collectionName, queryVector, {
      limit,
      filter,
      withPayload: true
    });
  }
}
```

### Advanced Querying

```typescript
export class AdvancedSearch {
  constructor(private client: QdrantClient) {}

  async hybridSearch(
    collectionName: string,
    queries: {
      vector: number[];
      weight: number;
    }[],
    limit = 10
  ) {
    // Perform multiple searches and merge results
    const allResults = await Promise.all(
      queries.map(async ({ vector, weight }) => {
        const results = await this.client.query(collectionName, {
          query: vector,
          limit: limit * 2, // Get more results for merging
          with_payload: true
        });

        return results.points.map(point => ({
          ...point,
          score: (point.score || 0) * weight
        }));
      })
    );

    // Merge and deduplicate results
    const merged = new Map<string, any>();
    
    allResults.flat().forEach(result => {
      const id = result.id.toString();
      if (merged.has(id)) {
        const existing = merged.get(id);
        existing.score = Math.max(existing.score, result.score);
      } else {
        merged.set(id, result);
      }
    });

    // Sort by score and limit
    return Array.from(merged.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  }

  async searchWithReranking(
    collectionName: string,
    queryVector: number[],
    rerankFunction: (results: any[]) => Promise<any[]>,
    initialLimit = 50,
    finalLimit = 10
  ) {
    // Get initial results
    const initialResults = await this.client.query(collectionName, {
      query: queryVector,
      limit: initialLimit,
      with_payload: true
    });

    // Apply reranking
    const reranked = await rerankFunction(initialResults.points);
    
    return reranked.slice(0, finalLimit);
  }
}
```

## 🔄 Embedding Integration

### Multi-Provider Architecture

```typescript
export type EmbeddingProvider = 'ollama' | 'openai';

export interface EmbeddingConfig {
  dimensions: number;
  model: string;
  maxTokens?: number;
}

export const EMBEDDING_CONFIGS: Record<EmbeddingProvider, EmbeddingConfig> = {
  ollama: {
    dimensions: 384,
    model: 'nomic-embed-text',
    maxTokens: 2048
  },
  openai: {
    dimensions: 1536,
    model: 'text-embedding-3-small',
    maxTokens: 8191
  }
};

export class EmbeddingService {
  private ollamaClient: any;
  private openaiClient: any;

  constructor() {
    this.ollamaClient = new (require('ollama')).Ollama();
    this.openaiClient = new (require('openai')).OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateEmbedding(
    text: string, 
    provider: EmbeddingProvider
  ): Promise<number[]> {
    const config = EMBEDDING_CONFIGS[provider];
    
    try {
      switch (provider) {
        case 'ollama':
          return await this.generateOllamaEmbedding(text, config);
        case 'openai':
          return await this.generateOpenAIEmbedding(text, config);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Embedding generation failed for ${provider}:`, error);
      throw error;
    }
  }

  private async generateOllamaEmbedding(
    text: string, 
    config: EmbeddingConfig
  ): Promise<number[]> {
    const response = await this.ollamaClient.embed({
      model: config.model,
      input: text
    });

    if (!response.embeddings?.[0]) {
      throw new Error('No embeddings returned from ollama');
    }

    return response.embeddings[0];
  }

  private async generateOpenAIEmbedding(
    text: string, 
    config: EmbeddingConfig
  ): Promise<number[]> {
    const response = await this.openaiClient.embeddings.create({
      model: config.model,
      input: text
    });

    if (!response.data?.[0]?.embedding) {
      throw new Error('No embeddings returned from OpenAI');
    }

    return response.data[0].embedding;
  }

  async generateBatchEmbeddings(
    texts: string[],
    provider: EmbeddingProvider,
    batchSize = 10
  ): Promise<number[][]> {
    const results: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text, provider))
      );
      
      results.push(...batchResults);
      
      console.log(`📊 Generated embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
    }
    
    return results;
  }
}
```

### Hybrid Embedding Strategy

```typescript
export class HybridEmbeddingManager {
  private embeddingService: EmbeddingService;
  private vectorOps: VectorOperations;

  constructor(
    embeddingService: EmbeddingService,
    vectorOps: VectorOperations
  ) {
    this.embeddingService = embeddingService;
    this.vectorOps = vectorOps;
  }

  async indexDocument(
    document: {
      id: string;
      content: string;
      metadata: Record<string, any>;
    },
    providers: EmbeddingProvider[] = ['ollama', 'openai']
  ): Promise<void> {
    for (const provider of providers) {
      try {
        const embedding = await this.embeddingService.generateEmbedding(
          document.content,
          provider
        );

        const collectionName = this.getCollectionName(provider);
        
        await this.vectorOps.upsertVectors(collectionName, [{
          id: document.id,
          vector: embedding,
          payload: {
            ...document.metadata,
            content: document.content,
            provider,
            indexed_at: new Date().toISOString()
          }
        }]);

        console.log(`✅ Indexed document ${document.id} with ${provider}`);
      } catch (error) {
        console.error(`❌ Failed to index with ${provider}:`, error);
        // Continue with other providers
      }
    }
  }

  async searchAcrossProviders(
    query: string,
    providers: EmbeddingProvider[] = ['ollama', 'openai'],
    limit = 10
  ) {
    const allResults = [];

    for (const provider of providers) {
      try {
        const queryEmbedding = await this.embeddingService.generateEmbedding(
          query,
          provider
        );

        const collectionName = this.getCollectionName(provider);
        
        const results = await this.vectorOps.searchSimilar(
          collectionName,
          queryEmbedding,
          { limit: Math.ceil(limit / providers.length) }
        );

        allResults.push(...results.map(r => ({ ...r, provider })));
      } catch (error) {
        console.error(`Search failed for ${provider}:`, error);
        // Continue with other providers
      }
    }

    // Merge and deduplicate
    const merged = this.mergeResults(allResults);
    
    return merged
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private mergeResults(results: any[]) {
    const merged = new Map<string, any>();
    
    results.forEach(result => {
      const id = result.id.toString();
      if (merged.has(id)) {
        const existing = merged.get(id);
        // Take the highest score across providers
        if (result.score > existing.score) {
          merged.set(id, result);
        }
      } else {
        merged.set(id, result);
      }
    });

    return Array.from(merged.values());
  }

  private getCollectionName(provider: EmbeddingProvider): string {
    return `claude-docs-${provider}`;
  }
}
```

## 📈 Performance Optimization

### Indexing Optimization

```typescript
export class PerformanceOptimizer {
  constructor(private client: QdrantClient) {}

  async optimizeCollection(collectionName: string): Promise<void> {
    // Trigger index optimization
    await this.client.updateCollection(collectionName, {
      optimizers_config: {
        deleted_threshold: 0.2,
        vacuum_min_vector_number: 1000,
        default_segment_number: 0,
        max_segment_size: 200000,
        memmap_threshold: 200000,
        indexing_threshold: 20000,
        flush_interval_sec: 5,
        max_optimization_threads: 2
      }
    });

    console.log(`🚀 Collection ${collectionName} optimization started`);
  }

  async getCollectionStats(collectionName: string) {
    const info = await this.client.getCollection(collectionName);
    
    return {
      pointsCount: info.points_count || 0,
      segmentsCount: info.segments_count || 0,
      diskUsage: info.disk_usage_bytes || 0,
      ramUsage: info.ram_usage_bytes || 0,
      config: info.config
    };
  }

  async monitorPerformance(collectionName: string) {
    const stats = await this.getCollectionStats(collectionName);
    
    console.log(`📊 Collection Stats for ${collectionName}:`);
    console.log(`  Points: ${stats.pointsCount.toLocaleString()}`);
    console.log(`  Segments: ${stats.segmentsCount}`);
    console.log(`  Disk Usage: ${(stats.diskUsage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RAM Usage: ${(stats.ramUsage / 1024 / 1024).toFixed(2)} MB`);
    
    // Performance recommendations
    if (stats.segmentsCount > 10) {
      console.log(`⚠️  High segment count (${stats.segmentsCount}). Consider optimization.`);
    }
    
    if (stats.pointsCount > 1000000) {
      console.log(`ℹ️  Large collection (${stats.pointsCount} points). Monitor memory usage.`);
    }
  }
}
```

### Caching Layer

```typescript
export class VectorCache {
  private cache = new Map<string, { 
    vector: number[]; 
    timestamp: number; 
  }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async getOrGenerateEmbedding(
    text: string,
    provider: EmbeddingProvider,
    embeddingService: EmbeddingService
  ): Promise<number[]> {
    const key = `${provider}:${this.hashText(text)}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.vector;
    }

    const vector = await embeddingService.generateEmbedding(text, provider);
    
    this.cache.set(key, {
      vector,
      timestamp: Date.now()
    });

    return vector;
  }

  private hashText(text: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      memoryUsage: this.cache.size * 1536 * 4 // Approximate bytes for OpenAI embeddings
    };
  }
}
```

## 🔍 Monitoring & Health Checks

### Health Monitoring

```typescript
export class QdrantMonitor {
  constructor(private client: QdrantClient) {}

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const start = Date.now();
      const collections = await this.client.getCollections();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        details: {
          responseTime,
          collectionsCount: collections.collections.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async getSystemMetrics() {
    try {
      // Note: These endpoints may not be available in all Qdrant versions
      const collections = await this.client.getCollections();
      
      const metrics = {
        collections: collections.collections.length,
        timestamp: new Date().toISOString()
      };

      // Get detailed stats for each collection
      for (const collection of collections.collections) {
        try {
          const info = await this.client.getCollection(collection.name);
          metrics[collection.name] = {
            points: info.points_count || 0,
            segments: info.segments_count || 0
          };
        } catch (error) {
          console.warn(`Failed to get stats for collection ${collection.name}`);
        }
      }

      return metrics;
    } catch (error) {
      throw new Error(`Failed to get system metrics: ${error.message}`);
    }
  }
}
```

## 🛡️ Security & Access Control

### Connection Security

```typescript
export class SecureQdrantClient {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333'),
      
      // API key authentication (if available)
      apiKey: process.env.QDRANT_API_KEY,
      
      // HTTPS configuration
      https: process.env.QDRANT_HTTPS === 'true',
      
      // Request timeout
      timeout: 30000,
      
      // Custom headers
      headers: {
        'User-Agent': 'MCP-Server/1.0.0'
      }
    });
  }

  async secureQuery(
    collectionName: string,
    queryVector: number[],
    userId?: string
  ) {
    // Add user-based filtering if needed
    const filter = userId ? {
      must: [{ key: 'user_id', match: { value: userId } }]
    } : undefined;

    return this.client.query(collectionName, {
      query: queryVector,
      limit: 10,
      with_payload: true,
      filter
    });
  }
}
```

## 📚 Best Practices

### 1. Collection Design
- Use descriptive collection names
- Choose appropriate vector dimensions
- Configure distance metrics correctly
- Plan for multiple providers

### 2. Performance
- Batch operations when possible
- Use appropriate indexing settings
- Monitor memory and disk usage
- Implement caching for frequent queries

### 3. Reliability
- Implement health checks
- Handle connection failures gracefully
- Use retry logic with exponential backoff
- Monitor collection statistics

### 4. Security
- Use API keys in production
- Implement user-based filtering
- Secure network connections
- Audit access patterns

---

## 📖 Related Documentation

- [Embedding Providers](../embeddings/providers.md)
- [RAG Architecture](../rag/architecture.md)
- [Performance Optimization](../embeddings/optimization.md)
- [Monitoring Guide](../deployment/monitoring.md)

*This guide provides a production-ready foundation for Qdrant operations with embedding services.*