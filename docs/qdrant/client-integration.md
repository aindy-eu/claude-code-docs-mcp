# Qdrant Client Integration

TypeScript/JavaScript client setup and usage for Qdrant vector database operations.

> **Implementation Status**: This document contains both implemented features (✅) and example/future implementations (🔮). Look for the status indicators throughout.

## 📦 Installation

```bash
npm install @qdrant/js-client-rest
```

## 🔌 Basic Client Setup

### ✅ Simple Connection (ACTUALLY USED IN CODEBASE)

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: parseInt(process.env.QDRANT_PORT || '6333')
});
```

### 🔮 Production Client (EXAMPLE - NOT IMPLEMENTED)

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333'),
      apiKey: process.env.QDRANT_API_KEY, // For Qdrant Cloud
      https: process.env.QDRANT_HTTPS === 'true',
      timeout: 30000, // 30 seconds
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
        console.log('✅ Qdrant is ready');
        return;
      }
      console.log(`⏳ Waiting for Qdrant... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Qdrant failed to become ready');
  }
}
```

## 📚 Collection Management

### ✅ Create Collection (ACTUALLY IMPLEMENTED IN setup-collection.ts)

> Note: The actual implementation is simpler than shown below - no HNSW or optimizer configs

```typescript
async function createCollection(
  client: QdrantClient,
  name: string,
  vectorSize: number,
  distance: 'Cosine' | 'Euclid' | 'Dot' = 'Cosine'
): Promise<void> {
  try {
    await client.createCollection(name, {
      vectors: {
        size: vectorSize,
        distance: distance,
      },
    });
    console.log(`✅ Collection "${name}" created`);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(`⚠️  Collection "${name}" already exists`);
    } else {
      throw error;
    }
  }
}

// Usage for this project
await createCollection(client, 'claude_code_docs_ollama', 768);
await createCollection(client, 'claude_code_docs_openai', 1536);
```

### ✅ Get Collection Info (USED IN CODEBASE)

```typescript
async function getCollectionInfo(client: QdrantClient, name: string) {
  const info = await client.getCollection(name);

  return {
    name,
    pointsCount: info.points_count || 0,
    vectorSize: info.config?.params?.vectors?.size,
    distance: info.config?.params?.vectors?.distance,
    status: info.status,
    segmentsCount: info.segments_count || 0,
  };
}

// Example usage
const info = await getCollectionInfo(client, 'claude_code_docs_ollama');
console.log(`Collection has ${info.pointsCount} documents`);
```

### List All Collections

```typescript
async function listCollections(client: QdrantClient) {
  const response = await client.getCollections();
  return response.collections;
}

// Example
const collections = await listCollections(client);
collections.forEach(col => {
  console.log(`- ${col.name}`);
});
```

### Delete Collection

```typescript
async function deleteCollection(
  client: QdrantClient,
  name: string,
  confirm: boolean = false
): Promise<void> {
  if (!confirm) {
    throw new Error('Must confirm deletion by passing confirm=true');
  }

  await client.deleteCollection(name);
  console.log(`🗑️  Collection "${name}" deleted`);
}
```

## 📝 Vector Operations

### ✅ Upsert (ACTUALLY IMPLEMENTED IN embed-service.ts)

The actual implementation in the codebase uses batch upsert:

```typescript
// From src/services/embed-service.ts
await this.qdrantClient.upsert(collection, {
  points,
  wait: true
});
```

### 🔮 Upsert Single Document (EXAMPLE)

```typescript
import { v4 as uuidv4 } from 'uuid';

async function upsertDocument(
  client: QdrantClient,
  collectionName: string,
  document: {
    content: string;
    vector: number[];
    metadata: Record<string, any>;
  }
): Promise<void> {
  await client.upsert(collectionName, {
    points: [
      {
        id: uuidv4(),
        vector: document.vector,
        payload: {
          content: document.content,
          ...document.metadata,
          indexed_at: new Date().toISOString(),
        },
      },
    ],
  });
}
```

### 🔮 Batch Upsert (EXAMPLE - MORE ADVANCED THAN ACTUAL)

```typescript
async function batchUpsert(
  client: QdrantClient,
  collectionName: string,
  documents: Array<{
    id: string;
    vector: number[];
    payload: Record<string, any>;
  }>,
  batchSize: number = 100
): Promise<void> {
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);

    await client.upsert(collectionName, {
      points: batch,
    });

    console.log(
      `📝 Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        documents.length / batchSize
      )}`
    );
  }
}
```

## 🔍 Search Operations

### ✅ Actual Search Implementation (FROM src/mcp-tools/search/search.ts)

```typescript
// The actual search uses .query() not .search()
const searchResults = await qdrant.query(collectionName, {
  query: queryEmbedding,
  limit: Math.ceil(limit / providersToSearch.length),
  with_payload: true,
  score_threshold: 0.5
});
```

### 🔮 Basic Search Example (DIFFERENT FROM ACTUAL)

```typescript
async function searchSimilar(
  client: QdrantClient,
  collectionName: string,
  queryVector: number[],
  limit: number = 10
) {
  const results = await client.search(collectionName, {
    vector: queryVector,
    limit,
    with_payload: true,
  });

  return results.map(point => ({
    id: point.id,
    score: point.score,
    payload: point.payload,
  }));
}
```

### 🔮 Search with Filters (EXAMPLE - NOT IMPLEMENTED)

```typescript
async function searchWithFilter(
  client: QdrantClient,
  collectionName: string,
  queryVector: number[],
  filter: any,
  limit: number = 10
) {
  const results = await client.search(collectionName, {
    vector: queryVector,
    limit,
    with_payload: true,
    filter,
  });

  return results;
}

// Example: Search only recent documents
const recentFilter = {
  must: [
    {
      key: 'indexed_at',
      range: {
        gte: '2025-01-01T00:00:00Z',
      },
    },
  ],
};

const results = await searchWithFilter(
  client,
  'claude_code_docs_ollama',
  queryVector,
  recentFilter
);
```

### Search with Score Threshold

```typescript
async function searchWithThreshold(
  client: QdrantClient,
  collectionName: string,
  queryVector: number[],
  scoreThreshold: number = 0.5
) {
  const results = await client.search(collectionName, {
    vector: queryVector,
    limit: 20,
    score_threshold: scoreThreshold,
    with_payload: true,
  });

  return results.filter(r => r.score >= scoreThreshold);
}
```

## 🛠️ Utility Functions

### Count Documents

```typescript
async function countDocuments(
  client: QdrantClient,
  collectionName: string
): Promise<number> {
  const info = await client.getCollection(collectionName);
  return info.points_count || 0;
}
```

### Delete by ID

```typescript
async function deletePoints(
  client: QdrantClient,
  collectionName: string,
  ids: string[]
): Promise<void> {
  await client.delete(collectionName, {
    points: ids,
  });
  console.log(`Deleted ${ids.length} points`);
}
```

### Get Point by ID

```typescript
async function getPoint(
  client: QdrantClient,
  collectionName: string,
  id: string
) {
  const result = await client.retrieve(collectionName, {
    ids: [id],
    with_payload: true,
    with_vector: false, // Set true if you need the vector
  });

  return result[0];
}
```

## 🔄 Error Handling

### 🔮 Robust Client Wrapper (EXAMPLE - NOT IMPLEMENTED)

```typescript
export class RobustQdrantClient {
  private client: QdrantClient;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config: any) {
    this.client = new QdrantClient(config);
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(
          `${operationName} failed (attempt ${i + 1}/${this.maxRetries}):`,
          error.message
        );

        if (i < this.maxRetries - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, this.retryDelay * Math.pow(2, i))
          );
        }
      }
    }

    throw new Error(
      `${operationName} failed after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  async upsert(collectionName: string, points: any): Promise<void> {
    return this.withRetry(
      () => this.client.upsert(collectionName, points),
      'Upsert operation'
    );
  }

  async search(collectionName: string, params: any): Promise<any> {
    return this.withRetry(
      () => this.client.search(collectionName, params),
      'Search operation'
    );
  }
}
```

## 📊 Collection Statistics

### 🔮 Detailed Stats Function (EXAMPLE - MORE DETAILED THAN ACTUAL)

```typescript
async function getDetailedStats(client: QdrantClient, collectionName: string) {
  const info = await client.getCollection(collectionName);

  const stats = {
    name: collectionName,
    documents: info.points_count || 0,
    segments: info.segments_count || 0,
    vectorSize: info.config?.params?.vectors?.size || 0,
    distance: info.config?.params?.vectors?.distance || 'Unknown',
    status: info.status,
    diskUsageBytes: info.disk_data_size || 0,
    memoryUsageBytes: info.ram_data_size || 0,
    indexed: info.indexed_vectors_count || 0,
  };

  // Format for display
  console.log(`📊 Collection: ${stats.name}`);
  console.log(`   Documents: ${stats.documents.toLocaleString()}`);
  console.log(`   Vector Size: ${stats.vectorSize}`);
  console.log(`   Distance: ${stats.distance}`);
  console.log(`   Status: ${stats.status}`);
  console.log(
    `   Disk Usage: ${(stats.diskUsageBytes / 1024 / 1024).toFixed(2)} MB`
  );

  return stats;
}
```

## 🔗 Related Guides

- [Setup](./setup.md) - Initial Qdrant installation
- [Embeddings](./embeddings.md) - Generate vectors for documents
- [Performance](./performance.md) - Optimization strategies
- [Operations](./operations.md) - Document management

## 📚 Resources

- [Qdrant JS Client Docs](https://github.com/qdrant/qdrant-js)
- [Qdrant API Reference](https://qdrant.tech/documentation/api-reference/)
- [TypeScript Examples](https://github.com/qdrant/qdrant-js/tree/master/examples)