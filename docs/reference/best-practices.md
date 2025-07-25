# Best Practices & Patterns

Curated collection of proven patterns and best practices for MCP server development, based on production experience.

## 🏗️ Architecture Patterns

### Modular Design

```typescript
// ✅ Good: Modular architecture
src/
├── tools/
│   ├── index.ts        # Tool registry
│   ├── search.ts       # Search tools
│   └── analysis.ts     # Analysis tools
├── services/
│   ├── embeddings.ts   # Embedding providers
│   └── database.ts     # Database operations
└── types/
    └── index.ts        # Shared types

// ❌ Bad: Everything in one file
src/
└── index.ts            # 1000+ lines
```

### Service Abstraction

```typescript
// ✅ Good: Interface-based design
interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  getDimensions(): number;
}

class OllamaProvider implements EmbeddingProvider {
  async generateEmbedding(text: string): Promise<number[]> {
    // Implementation
  }
  getDimensions(): number { return 384; }
}

// ❌ Bad: Direct coupling
async function searchDocuments(query: string) {
  const embedding = await ollama.embed(query); // Tightly coupled
}
```

## 🔧 Tool Design

### Input Validation

```typescript
// ✅ Good: Comprehensive validation
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(50).default(10),
  provider: z.enum(['ollama', 'openai']).default('ollama')
});

export const searchTool = {
  async handler(args: unknown) {
    const params = searchSchema.parse(args); // Throws on invalid input
    // Process validated params
  }
};

// ❌ Bad: No validation
export const searchTool = {
  async handler(args: any) {
    const { query, limit } = args; // Could be undefined/invalid
    // Proceed without validation
  }
};
```

### Error Handling

```typescript
// ✅ Good: Graceful error handling
async function searchWithFallback(query: string) {
  const providers = ['ollama', 'openai'];
  
  for (const provider of providers) {
    try {
      return await searchWithProvider(query, provider);
    } catch (error) {
      console.warn(`Search failed with ${provider}:`, error.message);
      // Continue to next provider
    }
  }
  
  throw new Error('All search providers failed');
}

// ❌ Bad: No error handling
async function search(query: string) {
  return await searchWithProvider(query, 'ollama'); // May throw
}
```

### Response Formatting

```typescript
// ✅ Good: Consistent response format
interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

function formatToolResponse(data: any): { content: Array<{ type: 'text'; text: string }> } {
  const response: ToolResponse = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      provider: 'ollama'
    }
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response, null, 2)
    }]
  };
}

// ❌ Bad: Inconsistent responses
// Sometimes returns string, sometimes object, sometimes throws
```

## 🗄️ Database Patterns

### Connection Management

```typescript
// ✅ Good: Singleton with health checks
class DatabaseManager {
  private static instance: DatabaseManager;
  private client: QdrantClient;
  private healthy = false;

  private constructor() {
    this.client = new QdrantClient(config);
    this.startHealthMonitoring();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async query(params: any) {
    if (!this.healthy) {
      throw new Error('Database not healthy');
    }
    return this.client.query(params);
  }

  private startHealthMonitoring() {
    setInterval(async () => {
      try {
        await this.client.getCollections();
        this.healthy = true;
      } catch {
        this.healthy = false;
      }
    }, 30000);
  }
}

// ❌ Bad: New connection per request
async function search() {
  const client = new QdrantClient(config); // Creates new connection
  return client.query(params);
}
```

### Batch Operations

```typescript
// ✅ Good: Efficient batching
async function indexDocuments(documents: Document[]) {
  const batchSize = 100;
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    
    const vectors = await Promise.all(
      batch.map(doc => generateEmbedding(doc.content))
    );
    
    await qdrant.upsert(collectionName, {
      points: batch.map((doc, idx) => ({
        id: doc.id,
        vector: vectors[idx],
        payload: doc.metadata
      }))
    });
    
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}`);
  }
}

// ❌ Bad: Individual operations
async function indexDocuments(documents: Document[]) {
  for (const doc of documents) {
    const vector = await generateEmbedding(doc.content);
    await qdrant.upsert(collectionName, {
      points: [{ id: doc.id, vector, payload: doc.metadata }]
    }); // Many small requests
  }
}
```

## 🧪 Testing Patterns

### Comprehensive Coverage

```typescript
// ✅ Good: Test pyramid approach
describe('Search Tool', () => {
  describe('Unit Tests', () => {
    it('validates input correctly', () => {
      // Fast, isolated tests
    });
    
    it('handles errors gracefully', () => {
      // Mock external dependencies
    });
  });

  describe('Integration Tests', () => {
    it('searches with real database', async () => {
      // Test with actual Qdrant instance
    });
  });

  describe('E2E Tests', () => {
    it('completes full search workflow', async () => {
      // Test entire system integration
    });
  });
});

// ❌ Bad: Only integration tests
describe('Search Tool', () => {
  it('does everything', async () => {
    // Slow, hard to debug when failing
  });
});
```

### Mock Strategies

```typescript
// ✅ Good: Strategic mocking
jest.mock('../services/embeddings.js', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(mockEmbedding),
  // Mock only external dependencies
}));

// Keep business logic real for testing
import { searchTool } from '../tools/search.js'; // Real implementation

// ❌ Bad: Over-mocking
jest.mock('../tools/search.js'); // Mocking what you're trying to test
```

## 🚀 Performance Patterns

### Caching Strategy

```typescript
// ✅ Good: Multi-level caching
class CacheManager {
  private memoryCache = new Map<string, any>();
  private diskCache: any; // Redis/file system
  
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Level 1: Memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // Level 2: Disk cache
    const diskValue = await this.diskCache.get(key);
    if (diskValue) {
      this.memoryCache.set(key, diskValue);
      return diskValue;
    }
    
    // Level 3: Fetch and cache
    const value = await fetcher();
    this.memoryCache.set(key, value);
    await this.diskCache.set(key, value);
    return value;
  }
}

// ❌ Bad: No caching
async function getEmbedding(text: string) {
  return await provider.generateEmbedding(text); // Always refetch
}
```

### Resource Management

```typescript
// ✅ Good: Proper cleanup
class ResourceManager {
  private resources = new Set<any>();

  async createResource() {
    const resource = await expensive_operation();
    this.resources.add(resource);
    return resource;
  }

  async cleanup() {
    for (const resource of this.resources) {
      await resource.close();
    }
    this.resources.clear();
  }
}

process.on('SIGTERM', async () => {
  await resourceManager.cleanup();
  process.exit(0);
});

// ❌ Bad: Resource leaks
async function createResource() {
  return await expensive_operation(); // Never cleaned up
}
```

## 🔒 Security Patterns

### Input Sanitization

```typescript
// ✅ Good: Comprehensive sanitization
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  // Remove HTML tags
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // Limit length
  const truncated = cleaned.slice(0, 1000);
  
  // Remove control characters
  return truncated.replace(/[\x00-\x1F\x7F]/g, '');
}

export const searchTool = {
  async handler(args: any) {
    const query = sanitizeInput(args.query);
    // Process sanitized input
  }
};

// ❌ Bad: Direct usage
export const searchTool = {
  async handler(args: any) {
    const query = args.query; // Potentially unsafe
    // Process raw input
  }
};
```

### API Key Management

```typescript
// ✅ Good: Secure key handling
class SecureConfig {
  private static keys = new Map<string, string>();

  static loadKeys() {
    const requiredKeys = ['OPENAI_API_KEY', 'QDRANT_API_KEY'];
    
    for (const key of requiredKeys) {
      const value = process.env[key];
      if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
      this.keys.set(key, value);
    }
  }

  static getKey(name: string): string {
    const key = this.keys.get(name);
    if (!key) {
      throw new Error(`API key not found: ${name}`);
    }
    return key;
  }

  // Never log keys
  static maskKey(key: string): string {
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
  }
}

// ❌ Bad: Insecure handling
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'default-key';
console.log('Using API key:', OPENAI_API_KEY); // Logs secret
```

## 📊 Monitoring Patterns

### Observability

```typescript
// ✅ Good: Comprehensive monitoring
class MetricsCollector {
  private metrics = {
    requests: 0,
    errors: 0,
    responseTime: [] as number[]
  };

  async recordRequest<T>(operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.metrics.requests++;
    
    try {
      const result = await operation();
      this.metrics.responseTime.push(Date.now() - start);
      return result;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  getStats() {
    const responseTimes = this.metrics.responseTime;
    return {
      totalRequests: this.metrics.requests,
      errorRate: this.metrics.errors / this.metrics.requests,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: this.percentile(responseTimes, 0.95)
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// ❌ Bad: No monitoring
async function handleRequest() {
  // Process request with no metrics
}
```

### Health Checks

```typescript
// ✅ Good: Comprehensive health checks
interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
}

class HealthMonitor {
  private checks: HealthCheck[] = [
    {
      name: 'database',
      check: () => this.checkDatabase(),
      critical: true
    },
    {
      name: 'embedding_service',
      check: () => this.checkEmbeddings(),
      critical: false
    }
  ];

  async getHealth() {
    const results = await Promise.allSettled(
      this.checks.map(async check => ({
        name: check.name,
        healthy: await check.check(),
        critical: check.critical
      }))
    );

    const healthResults = results.map(r => 
      r.status === 'fulfilled' ? r.value : { 
        name: 'unknown', 
        healthy: false, 
        critical: true 
      }
    );

    const critical_failures = healthResults.filter(r => !r.healthy && r.critical);
    
    return {
      healthy: critical_failures.length === 0,
      checks: healthResults,
      timestamp: new Date().toISOString()
    };
  }
}

// ❌ Bad: No health checks
// System fails silently
```

## 📚 Documentation Patterns

### Self-Documenting Code

```typescript
// ✅ Good: Clear, self-documenting
interface SearchOptions {
  /** Search query text (1-1000 characters) */
  query: string;
  
  /** Maximum results to return (1-50, default: 10) */
  limit?: number;
  
  /** Minimum relevance score (0-1, default: 0.7) */
  threshold?: number;
  
  /** Embedding provider to use */
  provider?: 'ollama' | 'openai';
}

async function searchDocuments(options: SearchOptions): Promise<SearchResult[]> {
  // Implementation clearly follows interface
}

// ❌ Bad: Unclear parameters
async function search(q: string, l?: number, t?: number, p?: string) {
  // What do these parameters mean?
}
```

---

## 🎯 Key Principles

### 1. **Fail Fast**
- Validate inputs immediately
- Check dependencies on startup
- Use strict TypeScript settings

### 2. **Be Explicit**
- Clear naming conventions
- Comprehensive error messages
- Document edge cases

### 3. **Plan for Failure**
- Graceful degradation
- Circuit breakers
- Retry mechanisms

### 4. **Optimize for Maintainability**
- Modular architecture
- Comprehensive tests
- Clear documentation

### 5. **Security by Design**
- Input validation
- Secure defaults
- Principle of least privilege

### 6. **Monitor Everything**
- Health checks
- Performance metrics
- Error tracking

---

*These patterns are battle-tested from production MCP server deployments and represent accumulated wisdom from real-world usage.*