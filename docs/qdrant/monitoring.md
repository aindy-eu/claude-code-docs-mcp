# Qdrant Monitoring & Security

Health monitoring, observability, security best practices, and troubleshooting for Qdrant deployments.

> **⚠️ IMPORTANT**: This entire document contains EXAMPLE/FUTURE implementations (🔮) that are NOT currently in the codebase.
>
> **Currently Implemented**: The project uses basic `QdrantClient` from `@qdrant/js-client-rest` with simple error handling and console logging. None of the advanced monitoring, health checks, metrics collection, tracing, or security features shown below are implemented yet.
>
> These examples are provided as future reference for when monitoring needs arise.

## 🏥 Health Monitoring

### 🔮 Basic Health Check (EXAMPLE - NOT IMPLEMENTED)

```typescript
export class QdrantHealthMonitor {
  constructor(private client: QdrantClient) {}

  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    try {
      const start = Date.now();

      // Try to get collections list
      const collections = await this.client.getCollections();
      const responseTime = Date.now() - start;

      // Check response time
      if (responseTime > 5000) {
        return {
          status: 'degraded',
          details: {
            message: 'Slow response time',
            responseTime,
            collections: collections.collections.length
          }
        };
      }

      return {
        status: 'healthy',
        details: {
          responseTime,
          collections: collections.collections.length,
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

  async continuousHealthCheck(intervalMs: number = 30000) {
    setInterval(async () => {
      const health = await this.checkHealth();

      if (health.status !== 'healthy') {
        console.error(`⚠️ Qdrant ${health.status}:`, health.details);
        // Trigger alerts here
      }
    }, intervalMs);
  }
}
```

### 🔮 Collection Health Metrics (EXAMPLE - NOT IMPLEMENTED)

```typescript
export async function getCollectionHealth(
  client: QdrantClient,
  collectionName: string
) {
  const info = await client.getCollection(collectionName);

  const health = {
    name: collectionName,
    status: info.status,
    points: info.points_count || 0,
    segments: info.segments_count || 0,
    diskUsageMB: ((info.disk_data_size || 0) / 1024 / 1024).toFixed(2),
    memoryUsageMB: ((info.ram_data_size || 0) / 1024 / 1024).toFixed(2),
    indexedVectors: info.indexed_vectors_count || 0,
    warnings: [] as string[]
  };

  // Check for potential issues
  if (health.segments > 10) {
    health.warnings.push(`High segment count (${health.segments}). Consider optimization.`);
  }

  if (health.points === 0) {
    health.warnings.push('Collection is empty');
  }

  if (parseFloat(health.memoryUsageMB) > 1000) {
    health.warnings.push('High memory usage. Consider using disk storage.');
  }

  return health;
}
```

## 📊 Metrics Collection

### System Metrics

```typescript
export class MetricsCollector {
  private metrics: Map<string, any[]> = new Map();

  async collectSystemMetrics(client: QdrantClient) {
    try {
      // Get all collections
      const collections = await client.getCollections();

      const systemMetrics = {
        timestamp: new Date().toISOString(),
        totalCollections: collections.collections.length,
        collections: {} as Record<string, any>
      };

      // Collect metrics for each collection
      for (const col of collections.collections) {
        const info = await client.getCollection(col.name);

        systemMetrics.collections[col.name] = {
          points: info.points_count || 0,
          segments: info.segments_count || 0,
          status: info.status
        };
      }

      this.recordMetric('system', systemMetrics);
      return systemMetrics;
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      return null;
    }
  }

  async collectOperationMetrics(
    operationName: string,
    operation: () => Promise<any>
  ) {
    const start = Date.now();
    let success = true;

    try {
      const result = await operation();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - start;

      this.recordMetric('operations', {
        name: operationName,
        duration,
        success,
        timestamp: new Date().toISOString()
      });
    }
  }

  private recordMetric(category: string, data: any) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }

    const categoryMetrics = this.metrics.get(category)!;
    categoryMetrics.push(data);

    // Keep only last 1000 entries
    if (categoryMetrics.length > 1000) {
      categoryMetrics.shift();
    }
  }

  getMetricsSummary() {
    const summary: Record<string, any> = {};

    for (const [category, data] of this.metrics) {
      summary[category] = {
        count: data.length,
        latest: data[data.length - 1]
      };

      // Calculate operation statistics
      if (category === 'operations') {
        const operations = data as any[];
        const successRate = operations.filter(op => op.success).length / operations.length;
        const avgDuration = operations.reduce((sum, op) => sum + op.duration, 0) / operations.length;

        summary[category].successRate = `${(successRate * 100).toFixed(1)}%`;
        summary[category].avgDuration = `${avgDuration.toFixed(2)}ms`;
      }
    }

    return summary;
  }
}
```

## 🔍 Logging & Observability

### Structured Logging

```typescript
export class QdrantLogger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  log(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };

    console.log(JSON.stringify(logEntry));
  }

  async logOperation(
    operation: string,
    fn: () => Promise<any>
  ) {
    const start = Date.now();
    const correlationId = Math.random().toString(36).substring(7);

    this.log('info', `Starting ${operation}`, { correlationId });

    try {
      const result = await fn();
      const duration = Date.now() - start;

      this.log('info', `Completed ${operation}`, {
        correlationId,
        duration,
        success: true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      this.log('error', `Failed ${operation}`, {
        correlationId,
        duration,
        error: error.message,
        success: false
      });

      throw error;
    }
  }
}
```

### Request Tracing

```typescript
export class RequestTracer {
  private traces: Map<string, any> = new Map();

  startTrace(traceId: string) {
    this.traces.set(traceId, {
      id: traceId,
      startTime: Date.now(),
      spans: []
    });
  }

  addSpan(traceId: string, spanName: string, data?: any) {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.spans.push({
      name: spanName,
      timestamp: Date.now() - trace.startTime,
      data
    });
  }

  endTrace(traceId: string) {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.duration = Date.now() - trace.startTime;
    console.log('Trace:', JSON.stringify(trace, null, 2));

    this.traces.delete(traceId);
    return trace;
  }
}

// Usage
const tracer = new RequestTracer();
const traceId = 'search-123';

tracer.startTrace(traceId);
tracer.addSpan(traceId, 'generate-embedding');
const embedding = await generateEmbedding(query);
tracer.addSpan(traceId, 'vector-search');
const results = await qdrantClient.search(...);
tracer.addSpan(traceId, 'format-results');
tracer.endTrace(traceId);
```

## 🔒 Security Configuration

### Secure Client Setup

```typescript
export class SecureQdrantClient {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333'),

      // Security configurations
      apiKey: process.env.QDRANT_API_KEY,
      https: process.env.NODE_ENV === 'production',

      // Timeouts to prevent hanging
      timeout: 30000,

      // Custom headers for additional security
      headers: {
        'X-Client-Version': '1.0.0',
        'X-Request-ID': () => Math.random().toString(36)
      }
    });
  }

  // Add request validation
  async secureSearch(
    collectionName: string,
    vector: number[],
    userId?: string
  ) {
    // Validate inputs
    if (!this.isValidCollectionName(collectionName)) {
      throw new Error('Invalid collection name');
    }

    if (!this.isValidVector(vector)) {
      throw new Error('Invalid vector format');
    }

    // Add user context to filter if provided
    const filter = userId ? {
      must: [
        { key: 'user_id', match: { value: userId } }
      ]
    } : undefined;

    return this.client.search(collectionName, {
      vector,
      limit: 10,
      filter,
      with_payload: true
    });
  }

  private isValidCollectionName(name: string): boolean {
    // Only allow alphanumeric and underscores
    return /^[a-zA-Z0-9_]+$/.test(name);
  }

  private isValidVector(vector: any): boolean {
    return Array.isArray(vector) &&
           vector.length > 0 &&
           vector.every(v => typeof v === 'number');
  }
}
```

### API Key Management

```bash
# Generate secure API key
openssl rand -hex 32

# Store in environment
echo "QDRANT_API_KEY=your_generated_key" >> .env

# Never commit .env files
echo ".env" >> .gitignore
```

### Network Security

```yaml
# docker-compose.yml with security
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "127.0.0.1:6333:6333"  # Only bind to localhost
    environment:
      - QDRANT__SERVICE__API_KEY=${QDRANT_API_KEY}
      - QDRANT__SERVICE__ENABLE_TLS=true
    volumes:
      - ./qdrant_storage:/qdrant/storage:z
      - ./certs:/qdrant/certs:ro  # TLS certificates
    networks:
      - qdrant_network

networks:
  qdrant_network:
    driver: bridge
    internal: true  # No external access
```

## 🚨 Alerting

### Alert Manager

```typescript
export class AlertManager {
  private thresholds = {
    responseTime: 5000,      // 5 seconds
    errorRate: 0.1,          // 10% error rate
    memoryUsageMB: 1000,     // 1GB
    segmentCount: 20,
    queueSize: 100
  };

  async checkAlerts(metrics: any) {
    const alerts: string[] = [];

    // Check response time
    if (metrics.responseTime > this.thresholds.responseTime) {
      alerts.push(`High response time: ${metrics.responseTime}ms`);
    }

    // Check error rate
    if (metrics.errorRate > this.thresholds.errorRate) {
      alerts.push(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
    }

    // Check memory usage
    if (metrics.memoryUsageMB > this.thresholds.memoryUsageMB) {
      alerts.push(`High memory usage: ${metrics.memoryUsageMB}MB`);
    }

    // Send alerts
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }

    return alerts;
  }

  private async sendAlerts(alerts: string[]) {
    console.error('🚨 ALERTS:', alerts);

    // Implement your alerting mechanism here:
    // - Send to Slack
    // - Send email
    // - Write to monitoring system
    // - Trigger PagerDuty
  }
}
```

## 📈 Dashboard Metrics

### Key Metrics to Monitor

```typescript
export function getDashboardMetrics(client: QdrantClient) {
  return {
    // System Health
    health: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },

    // Collection Metrics
    collections: {
      total: 0,
      totalPoints: 0,
      totalSize: 0
    },

    // Operation Metrics
    operations: {
      searches: { count: 0, avgTime: 0, errors: 0 },
      inserts: { count: 0, avgTime: 0, errors: 0 },
      updates: { count: 0, avgTime: 0, errors: 0 }
    },

    // Performance Metrics
    performance: {
      cacheHitRate: 0,
      queueDepth: 0,
      activeConnections: 0
    }
  };
}
```

## 🔧 Troubleshooting Guide

### Common Issues

#### 1. Connection Timeout

```typescript
// Diagnosis
async function diagnoseConnection() {
  console.log('Testing Qdrant connection...');

  try {
    const response = await fetch('http://localhost:6333/health');
    console.log('Health endpoint:', response.status);
  } catch (error) {
    console.error('Cannot reach Qdrant:', error.message);
    console.log('Solutions:');
    console.log('1. Check if Qdrant is running: docker ps');
    console.log('2. Check port binding: lsof -i :6333');
    console.log('3. Check firewall rules');
  }
}
```

#### 2. High Memory Usage

```bash
# Check current usage
curl http://localhost:6333/collections/claude_code_docs_ollama | \
  jq '.result.ram_data_size'

# Solutions:
# 1. Enable disk storage for large collections
# 2. Increase Docker memory limit
# 3. Optimize collection settings
```

#### 3. Slow Searches

```typescript
// Performance diagnosis
async function diagnoseSearchPerformance() {
  const timings: Record<string, number> = {};

  // Test embedding generation
  console.time('embedding');
  const vector = await generateEmbedding('test query', 'ollama');
  timings.embedding = console.timeEnd('embedding');

  // Test Qdrant search
  console.time('search');
  await qdrantClient.search('claude_code_docs_ollama', {
    vector,
    limit: 10
  });
  timings.search = console.timeEnd('search');

  // Analyze results
  if (timings.embedding > 500) {
    console.log('⚠️ Slow embedding generation');
  }
  if (timings.search > 100) {
    console.log('⚠️ Slow vector search');
  }
}
```

## 📋 Monitoring Checklist

### Daily Checks
- [ ] Health endpoint responding
- [ ] Collection point counts stable
- [ ] Response times < 1 second
- [ ] No error alerts

### Weekly Checks
- [ ] Segment count optimization
- [ ] Memory usage trends
- [ ] Disk space availability
- [ ] Backup verification

### Monthly Checks
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Update Qdrant version
- [ ] Review access logs

## 🔗 Related Guides

- [Setup](./setup.md) - Initial configuration
- [Performance](./performance.md) - Optimization strategies
- [Client Integration](./client-integration.md) - Client usage

## 📚 Resources

- [Qdrant Monitoring](https://qdrant.tech/documentation/monitoring/)
- [Qdrant Security](https://qdrant.tech/documentation/security/)
- [Prometheus Integration](https://qdrant.tech/documentation/monitoring/prometheus/)
- [Grafana Dashboards](https://github.com/qdrant/qdrant-grafana)