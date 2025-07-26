# Think Harder Implementation Guide

## Advanced Project Structure

```
doc-ingestion-think-harder/
├── src/
│   ├── core/
│   │   ├── EventBus.ts              # Central event system
│   │   ├── WorkerPool.ts            # Parallel processing
│   │   ├── StateMachine.ts          # Workflow orchestration
│   │   └── DependencyContainer.ts   # IoC container
│   ├── intelligence/
│   │   ├── SemanticChunker.ts       # Context-aware chunking
│   │   ├── QualityScorer.ts         # ML-based scoring
│   │   ├── RelationshipMapper.ts    # Document relationships
│   │   └── EmbeddingAnalyzer.ts     # Semantic analysis
│   ├── integration/
│   │   ├── ClaudeMCPTool.ts         # Direct MCP integration
│   │   ├── MultiTierCache.ts        # Advanced caching
│   │   ├── IncrementalUpdater.ts    # Smart updates
│   │   └── StreamProcessor.ts       # Memory-efficient processing
│   ├── plugins/
│   │   ├── PluginManager.ts         # Plugin lifecycle
│   │   ├── CodeAnalyzerPlugin.ts    # Code quality analysis
│   │   └── LinkValidatorPlugin.ts   # Reference validation
│   └── orchestration/
│       ├── IngestionOrchestrator.ts # Main coordinator
│       ├── WorkflowEngine.ts        # Complex workflows
│       └── CircuitBreaker.ts        # Fault tolerance
├── mcp-server/
│   └── doc-ingestion-tools.ts      # MCP tool definitions
├── workers/
│   └── ingestion.worker.ts         # Worker thread implementation
└── config/
    └── advanced-config.schema.ts    # Type-safe configuration
```

## Core Components Implementation

### 1. Event-Driven Architecture
```typescript
// src/core/EventBus.ts
import { EventEmitter } from 'events';
import { Logger } from 'winston';

interface EventPayload {
  timestamp: Date;
  correlationId: string;
  data: any;
}

interface EventHandler<T = any> {
  (payload: EventPayload & { data: T }): Promise<void>;
}

export class EventBus extends EventEmitter {
  private logger: Logger;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private middleware: Array<(event: string, payload: EventPayload) => Promise<EventPayload>> = [];

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    this.setMaxListeners(100);
  }

  async publish<T>(event: string, data: T, correlationId?: string): Promise<void> {
    let payload: EventPayload = {
      timestamp: new Date(),
      correlationId: correlationId || this.generateCorrelationId(),
      data
    };

    // Apply middleware
    for (const mw of this.middleware) {
      payload = await mw(event, payload);
    }

    this.logger.debug(`Publishing event: ${event}`, { correlationId: payload.correlationId });
    
    // Async event handling
    const handlers = this.handlers.get(event) || new Set();
    const promises = Array.from(handlers).map(handler => 
      handler(payload).catch(error => {
        this.logger.error(`Handler error for ${event}:`, error);
        this.emit('handler.error', { event, error, payload });
      })
    );

    await Promise.allSettled(promises);
  }

  subscribe<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    this.handlers.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  use(middleware: (event: string, payload: EventPayload) => Promise<EventPayload>): void {
    this.middleware.push(middleware);
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 2. Worker Pool for Parallel Processing
```typescript
// src/core/WorkerPool.ts
import { Worker } from 'worker_threads';
import { Queue } from 'bull';
import { CircuitBreaker } from './CircuitBreaker';

interface WorkerTask<T, R> {
  id: string;
  data: T;
  timeout?: number;
}

interface WorkerResult<R> {
  id: string;
  result?: R;
  error?: Error;
  duration: number;
}

export class WorkerPool<T = any, R = any> {
  private workers: Worker[] = [];
  private queue: Queue;
  private circuitBreaker: CircuitBreaker;
  private activeJobs: Map<string, { 
    worker: Worker; 
    timeout: NodeJS.Timeout;
    startTime: number;
  }> = new Map();

  constructor(
    private workerScript: string,
    private options: {
      minWorkers: number;
      maxWorkers: number;
      taskTimeout: number;
      queueOptions?: any;
    }
  ) {
    this.queue = new Queue('worker-pool', options.queueOptions);
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000
    });
    
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.options.minWorkers; i++) {
      this.spawnWorker();
    }
  }

  private spawnWorker(): Worker {
    const worker = new Worker(this.workerScript, {
      workerData: {
        workerId: `worker-${Date.now()}-${Math.random()}`
      }
    });

    worker.on('message', (message) => {
      if (message.type === 'result') {
        this.handleWorkerResult(message);
      }
    });

    worker.on('error', (error) => {
      this.handleWorkerError(worker, error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        this.replaceWorker(worker);
      }
    });

    this.workers.push(worker);
    return worker;
  }

  async execute(task: WorkerTask<T, R>): Promise<R> {
    return this.circuitBreaker.execute(async () => {
      const worker = await this.getAvailableWorker();
      
      return new Promise<R>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.activeJobs.delete(task.id);
          reject(new Error(`Task ${task.id} timed out`));
        }, task.timeout || this.options.taskTimeout);

        this.activeJobs.set(task.id, {
          worker,
          timeout,
          startTime: Date.now()
        });

        const messageHandler = (result: WorkerResult<R>) => {
          if (result.id === task.id) {
            clearTimeout(timeout);
            this.activeJobs.delete(task.id);
            worker.off('message', messageHandler);
            
            if (result.error) {
              reject(result.error);
            } else {
              resolve(result.result!);
            }
          }
        };

        worker.on('message', messageHandler);
        worker.postMessage({ type: 'task', ...task });
      });
    });
  }

  async executeBatch(tasks: WorkerTask<T, R>[]): Promise<WorkerResult<R>[]> {
    const results: WorkerResult<R>[] = [];
    const batchSize = this.workers.length;
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(task => this.execute(task))
      );
      
      results.push(...batchResults.map((result, index) => ({
        id: batch[index].id,
        result: result.status === 'fulfilled' ? result.value : undefined,
        error: result.status === 'rejected' ? result.reason : undefined,
        duration: Date.now() - (this.activeJobs.get(batch[index].id)?.startTime || Date.now())
      })));
    }
    
    return results;
  }

  private async getAvailableWorker(): Promise<Worker> {
    // Simple round-robin for now, could be enhanced with load balancing
    const availableWorker = this.workers.find(w => 
      !Array.from(this.activeJobs.values()).some(job => job.worker === w)
    );
    
    if (availableWorker) {
      return availableWorker;
    }
    
    // Scale up if needed and possible
    if (this.workers.length < this.options.maxWorkers) {
      return this.spawnWorker();
    }
    
    // Wait for a worker to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const worker = this.workers.find(w => 
          !Array.from(this.activeJobs.values()).some(job => job.worker === w)
        );
        if (worker) {
          clearInterval(checkInterval);
          resolve(worker);
        }
      }, 100);
    });
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.workers.map(worker => worker.terminate()));
    await this.queue.close();
  }
}
```

### 3. Semantic Chunking Engine
```typescript
// src/intelligence/SemanticChunker.ts
import { encoding_for_model } from '@dqbd/tiktoken';
import { EmbeddingService } from '../services/EmbeddingService';

interface SemanticSegment {
  content: string;
  embedding?: number[];
  semanticScore: number;
  boundaries: {
    start: number;
    end: number;
    confidence: number;
  };
  context: {
    before: string;
    after: string;
  };
}

export class SemanticChunker {
  private encoder = encoding_for_model('gpt-4');
  private embeddingService: EmbeddingService;
  
  constructor(embeddingService: EmbeddingService) {
    this.embeddingService = embeddingService;
  }

  async chunkDocument(
    content: string,
    options: {
      targetChunkSize: number;
      overlapRatio: number;
      minSemanticScore: number;
      contextWindow: number;
    }
  ): Promise<SemanticSegment[]> {
    // Step 1: Initial segmentation based on structure
    const structuralSegments = this.detectStructuralBoundaries(content);
    
    // Step 2: Semantic boundary detection using embeddings
    const semanticBoundaries = await this.detectSemanticBoundaries(
      structuralSegments,
      options.minSemanticScore
    );
    
    // Step 3: Optimize chunk sizes with overlap
    const optimizedChunks = this.optimizeChunkSizes(
      semanticBoundaries,
      options.targetChunkSize,
      options.overlapRatio
    );
    
    // Step 4: Add context windows
    return this.addContextWindows(optimizedChunks, content, options.contextWindow);
  }

  private detectStructuralBoundaries(content: string): string[] {
    const segments: string[] = [];
    const lines = content.split('\n');
    
    let currentSegment = '';
    let inCodeBlock = false;
    let codeBlockDepth = 0;
    
    for (const line of lines) {
      // Track code blocks to keep them together
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        codeBlockDepth = inCodeBlock ? codeBlockDepth + 1 : codeBlockDepth - 1;
      }
      
      // Detect natural boundaries
      const isHeading = /^#{1,6}\s/.test(line);
      const isListStart = /^[-*]\s/.test(line.trim());
      const isEmptyLine = line.trim() === '';
      
      if (isHeading && !inCodeBlock && currentSegment.length > 0) {
        segments.push(currentSegment.trim());
        currentSegment = line + '\n';
      } else if (isEmptyLine && !inCodeBlock && currentSegment.length > 100) {
        segments.push(currentSegment.trim());
        currentSegment = '';
      } else {
        currentSegment += line + '\n';
      }
    }
    
    if (currentSegment.trim()) {
      segments.push(currentSegment.trim());
    }
    
    return segments;
  }

  private async detectSemanticBoundaries(
    segments: string[],
    minScore: number
  ): Promise<SemanticSegment[]> {
    const embeddings = await Promise.all(
      segments.map(seg => this.embeddingService.generateEmbedding(seg))
    );
    
    const semanticSegments: SemanticSegment[] = [];
    let currentGroup: { segments: string[]; embeddings: number[][] } = {
      segments: [],
      embeddings: []
    };
    
    for (let i = 0; i < segments.length; i++) {
      if (currentGroup.segments.length === 0) {
        currentGroup.segments.push(segments[i]);
        currentGroup.embeddings.push(embeddings[i]);
        continue;
      }
      
      // Calculate semantic similarity with current group
      const avgEmbedding = this.averageEmbeddings(currentGroup.embeddings);
      const similarity = this.cosineSimilarity(embeddings[i], avgEmbedding);
      
      if (similarity >= minScore) {
        // High similarity, add to current group
        currentGroup.segments.push(segments[i]);
        currentGroup.embeddings.push(embeddings[i]);
      } else {
        // Low similarity, start new group
        semanticSegments.push({
          content: currentGroup.segments.join('\n\n'),
          embedding: avgEmbedding,
          semanticScore: this.calculateGroupCohesion(currentGroup.embeddings),
          boundaries: {
            start: 0, // Will be calculated later
            end: 0,
            confidence: similarity
          },
          context: { before: '', after: '' }
        });
        
        currentGroup = {
          segments: [segments[i]],
          embeddings: [embeddings[i]]
        };
      }
    }
    
    // Don't forget the last group
    if (currentGroup.segments.length > 0) {
      semanticSegments.push({
        content: currentGroup.segments.join('\n\n'),
        embedding: this.averageEmbeddings(currentGroup.embeddings),
        semanticScore: this.calculateGroupCohesion(currentGroup.embeddings),
        boundaries: { start: 0, end: 0, confidence: 1.0 },
        context: { before: '', after: '' }
      });
    }
    
    return semanticSegments;
  }

  private optimizeChunkSizes(
    segments: SemanticSegment[],
    targetSize: number,
    overlapRatio: number
  ): SemanticSegment[] {
    const optimized: SemanticSegment[] = [];
    
    for (const segment of segments) {
      const tokens = this.encoder.encode(segment.content);
      
      if (tokens.length <= targetSize) {
        optimized.push(segment);
      } else {
        // Split large segments intelligently
        const chunks = this.splitLargeSegment(segment, targetSize, overlapRatio);
        optimized.push(...chunks);
      }
    }
    
    // Merge small adjacent segments if semantically similar
    return this.mergeSmallSegments(optimized, targetSize);
  }

  private splitLargeSegment(
    segment: SemanticSegment,
    targetSize: number,
    overlapRatio: number
  ): SemanticSegment[] {
    const sentences = this.sentenceTokenizer(segment.content);
    const chunks: SemanticSegment[] = [];
    const overlapSize = Math.floor(targetSize * overlapRatio);
    
    let currentChunk: string[] = [];
    let currentTokens = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentenceTokens = this.encoder.encode(sentences[i]).length;
      
      if (currentTokens + sentenceTokens > targetSize && currentChunk.length > 0) {
        // Create chunk with overlap
        const chunkContent = currentChunk.join(' ');
        chunks.push({
          ...segment,
          content: chunkContent,
          semanticScore: segment.semanticScore * 0.9 // Slightly lower score for splits
        });
        
        // Keep overlap sentences
        const overlapSentences: string[] = [];
        let overlapTokenCount = 0;
        
        for (let j = currentChunk.length - 1; j >= 0 && overlapTokenCount < overlapSize; j--) {
          overlapSentences.unshift(currentChunk[j]);
          overlapTokenCount += this.encoder.encode(currentChunk[j]).length;
        }
        
        currentChunk = overlapSentences;
        currentTokens = overlapTokenCount;
      }
      
      currentChunk.push(sentences[i]);
      currentTokens += sentenceTokens;
    }
    
    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      chunks.push({
        ...segment,
        content: currentChunk.join(' '),
        semanticScore: segment.semanticScore * 0.9
      });
    }
    
    return chunks;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private averageEmbeddings(embeddings: number[][]): number[] {
    const avg = new Array(embeddings[0].length).fill(0);
    for (const embedding of embeddings) {
      for (let i = 0; i < embedding.length; i++) {
        avg[i] += embedding[i] / embeddings.length;
      }
    }
    return avg;
  }

  private calculateGroupCohesion(embeddings: number[][]): number {
    if (embeddings.length < 2) return 1.0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < embeddings.length - 1; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        totalSimilarity += this.cosineSimilarity(embeddings[i], embeddings[j]);
        comparisons++;
      }
    }
    
    return totalSimilarity / comparisons;
  }

  private sentenceTokenizer(text: string): string[] {
    // Sophisticated sentence tokenization
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.map(s => s.trim());
  }

  private mergeSmallSegments(segments: SemanticSegment[], targetSize: number): SemanticSegment[] {
    const merged: SemanticSegment[] = [];
    let i = 0;
    
    while (i < segments.length) {
      const current = segments[i];
      const currentTokens = this.encoder.encode(current.content).length;
      
      if (currentTokens < targetSize * 0.5 && i < segments.length - 1) {
        const next = segments[i + 1];
        const nextTokens = this.encoder.encode(next.content).length;
        
        if (currentTokens + nextTokens <= targetSize * 1.2) {
          // Merge if semantically similar
          const similarity = this.cosineSimilarity(
            current.embedding || [],
            next.embedding || []
          );
          
          if (similarity > 0.7) {
            merged.push({
              content: `${current.content}\n\n${next.content}`,
              embedding: this.averageEmbeddings([
                current.embedding || [],
                next.embedding || []
              ]),
              semanticScore: (current.semanticScore + next.semanticScore) / 2,
              boundaries: {
                start: current.boundaries.start,
                end: next.boundaries.end,
                confidence: similarity
              },
              context: current.context
            });
            i += 2;
            continue;
          }
        }
      }
      
      merged.push(current);
      i++;
    }
    
    return merged;
  }

  private addContextWindows(
    segments: SemanticSegment[],
    fullContent: string,
    windowSize: number
  ): SemanticSegment[] {
    return segments.map((segment, index) => {
      const before = index > 0 
        ? segments[index - 1].content.slice(-windowSize)
        : '';
      
      const after = index < segments.length - 1
        ? segments[index + 1].content.slice(0, windowSize)
        : '';
      
      return {
        ...segment,
        context: { before, after }
      };
    });
  }
}
```

### 4. Direct MCP Tool Integration
```typescript
// mcp-server/doc-ingestion-tools.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { IngestionOrchestrator } from '../src/orchestration/IngestionOrchestrator';
import { z } from 'zod';

const IngestionOptionsSchema = z.object({
  url: z.string().url(),
  options: z.object({
    semanticChunking: z.boolean().default(true),
    qualityThreshold: z.number().min(0).max(1).default(0.8),
    parallelWorkers: z.number().min(1).max(10).default(4),
    incrementalUpdate: z.boolean().default(true),
    plugins: z.array(z.string()).default([])
  }).optional()
});

const server = new Server({
  name: 'doc-ingestion-advanced',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

const orchestrator = new IngestionOrchestrator({
  // Configuration loaded from environment
});

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'ingest_document',
      description: 'Intelligently ingest documentation with semantic understanding',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Documentation URL to ingest' },
          options: {
            type: 'object',
            properties: {
              semanticChunking: { type: 'boolean' },
              qualityThreshold: { type: 'number' },
              parallelWorkers: { type: 'number' },
              incrementalUpdate: { type: 'boolean' },
              plugins: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        required: ['url']
      }
    },
    {
      name: 'check_updates',
      description: 'Check which documents have updates available',
      inputSchema: {
        type: 'object',
        properties: {
          urls: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'URLs to check for updates'
          }
        }
      }
    },
    {
      name: 'analyze_quality',
      description: 'Analyze the quality of ingested documentation',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          compareWith: { type: 'string', enum: ['dom', 'previous', 'reference'] }
        },
        required: ['url']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'ingest_document': {
      const { url, options } = IngestionOptionsSchema.parse(args);
      
      const result = await orchestrator.ingestDocument(url, {
        ...options,
        // Enable plugins by name
        plugins: options?.plugins?.map(name => 
          orchestrator.pluginManager.getPlugin(name)
        ).filter(Boolean) || []
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully ingested ${url}\n` +
                  `Chunks created: ${result.chunks.length}\n` +
                  `Quality score: ${result.qualityScore.toFixed(2)}\n` +
                  `Processing time: ${result.duration}ms`
          }
        ]
      };
    }

    case 'check_updates': {
      const { urls } = args;
      const updates = await orchestrator.checkForUpdates(urls);
      
      return {
        content: [
          {
            type: 'text',
            text: 'Update check results:\n' + 
                  updates.map(u => 
                    `- ${u.url}: ${u.hasChanges ? `${u.changes.length} changes` : 'up to date'}`
                  ).join('\n')
          }
        ]
      };
    }

    case 'analyze_quality': {
      const { url, compareWith } = args;
      const analysis = await orchestrator.analyzeQuality(url, compareWith);
      
      return {
        content: [
          {
            type: 'text',
            text: `Quality Analysis for ${url}:\n` +
                  `Overall Score: ${analysis.overall.toFixed(2)}/1.0\n` +
                  `Content Completeness: ${analysis.completeness.toFixed(2)}\n` +
                  `Structure Quality: ${analysis.structure.toFixed(2)}\n` +
                  `Code Accuracy: ${analysis.codeAccuracy.toFixed(2)}\n` +
                  `Semantic Coherence: ${analysis.coherence.toFixed(2)}`
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 5. Incremental Update System
```typescript
// src/integration/IncrementalUpdater.ts
import { createHash } from 'crypto';
import { diff_match_patch } from 'diff-match-patch';
import { MultiTierCache } from './MultiTierCache';
import { EventBus } from '../core/EventBus';

interface DocumentSnapshot {
  url: string;
  hash: string;
  chunks: ChunkSnapshot[];
  lastChecked: Date;
  version: number;
}

interface ChunkSnapshot {
  id: string;
  hash: string;
  content: string;
  embedding?: number[];
}

interface ChangeSet {
  url: string;
  hasChanges: boolean;
  changes: Change[];
  efficiency: number; // Percentage of content that didn't need reprocessing
}

interface Change {
  type: 'added' | 'modified' | 'removed';
  chunkId?: string;
  content?: string;
  semanticDrift?: number;
}

export class IncrementalUpdater {
  private dmp = new diff_match_patch();
  private cache: MultiTierCache;
  private eventBus: EventBus;
  
  constructor(cache: MultiTierCache, eventBus: EventBus) {
    this.cache = cache;
    this.eventBus = eventBus;
    
    // Configure diff settings
    this.dmp.Diff_Timeout = 2.0;
    this.dmp.Diff_EditCost = 4;
  }

  async detectChanges(url: string, newContent: string): Promise<ChangeSet> {
    const snapshot = await this.cache.get<DocumentSnapshot>(`snapshot:${url}`);
    
    if (!snapshot) {
      return {
        url,
        hasChanges: true,
        changes: [{ type: 'added', content: newContent }],
        efficiency: 0
      };
    }

    const newHash = this.computeHash(newContent);
    
    if (snapshot.hash === newHash) {
      return {
        url,
        hasChanges: false,
        changes: [],
        efficiency: 100
      };
    }

    // Perform intelligent diff
    const changes = await this.computeSemanticDiff(snapshot, newContent);
    const efficiency = this.calculateEfficiency(snapshot, changes);
    
    await this.eventBus.publish('document.changes_detected', {
      url,
      changes,
      efficiency
    });

    return {
      url,
      hasChanges: true,
      changes,
      efficiency
    };
  }

  private async computeSemanticDiff(
    snapshot: DocumentSnapshot,
    newContent: string
  ): Promise<Change[]> {
    const changes: Change[] = [];
    
    // First, do a line-level diff to identify changed regions
    const oldContent = snapshot.chunks.map(c => c.content).join('\n\n');
    const diffs = this.dmp.diff_main(oldContent, newContent);
    this.dmp.diff_cleanupSemantic(diffs);
    
    // Map diffs to chunk boundaries
    let oldPos = 0;
    let newPos = 0;
    const affectedChunks = new Set<string>();
    
    for (const [op, text] of diffs) {
      if (op === 0) { // Equal
        oldPos += text.length;
        newPos += text.length;
      } else if (op === -1) { // Deletion
        const affected = this.findAffectedChunks(snapshot.chunks, oldPos, oldPos + text.length);
        affected.forEach(chunkId => {
          affectedChunks.add(chunkId);
          changes.push({ type: 'removed', chunkId });
        });
        oldPos += text.length;
      } else if (op === 1) { // Insertion
        const nearestChunk = this.findNearestChunk(snapshot.chunks, oldPos);
        if (nearestChunk) {
          affectedChunks.add(nearestChunk);
        }
        changes.push({ type: 'added', content: text });
        newPos += text.length;
      }
    }
    
    // Check for semantic drift in modified chunks
    for (const chunkId of affectedChunks) {
      const oldChunk = snapshot.chunks.find(c => c.id === chunkId);
      if (oldChunk && !changes.some(c => c.chunkId === chunkId && c.type === 'removed')) {
        // This chunk was modified, not removed
        const semanticDrift = await this.calculateSemanticDrift(oldChunk, newContent);
        changes.push({
          type: 'modified',
          chunkId,
          semanticDrift
        });
      }
    }
    
    return changes;
  }

  private findAffectedChunks(chunks: ChunkSnapshot[], start: number, end: number): string[] {
    const affected: string[] = [];
    let currentPos = 0;
    
    for (const chunk of chunks) {
      const chunkEnd = currentPos + chunk.content.length;
      
      if (start < chunkEnd && end > currentPos) {
        affected.push(chunk.id);
      }
      
      currentPos = chunkEnd + 2; // Account for paragraph breaks
    }
    
    return affected;
  }

  private findNearestChunk(chunks: ChunkSnapshot[], position: number): string | null {
    let currentPos = 0;
    
    for (const chunk of chunks) {
      const chunkEnd = currentPos + chunk.content.length;
      
      if (position <= chunkEnd) {
        return chunk.id;
      }
      
      currentPos = chunkEnd + 2;
    }
    
    return chunks.length > 0 ? chunks[chunks.length - 1].id : null;
  }

  private async calculateSemanticDrift(
    oldChunk: ChunkSnapshot,
    newContent: string
  ): Promise<number> {
    if (!oldChunk.embedding) {
      return 1.0; // Maximum drift if no embedding available
    }
    
    // Extract the likely new content for this chunk
    // This is a simplified version - real implementation would be more sophisticated
    const newChunkContent = this.extractChunkContent(newContent, oldChunk.id);
    
    if (!newChunkContent) {
      return 1.0;
    }
    
    // Calculate embedding similarity
    const newEmbedding = await this.generateEmbedding(newChunkContent);
    return 1 - this.cosineSimilarity(oldChunk.embedding, newEmbedding);
  }

  private calculateEfficiency(snapshot: DocumentSnapshot, changes: Change[]): number {
    const totalChunks = snapshot.chunks.length;
    const unchangedChunks = totalChunks - changes.filter(c => 
      c.type === 'modified' || c.type === 'removed'
    ).length;
    
    return (unchangedChunks / totalChunks) * 100;
  }

  async saveSnapshot(url: string, chunks: ChunkSnapshot[]): Promise<void> {
    const content = chunks.map(c => c.content).join('\n\n');
    const snapshot: DocumentSnapshot = {
      url,
      hash: this.computeHash(content),
      chunks,
      lastChecked: new Date(),
      version: await this.getNextVersion(url)
    };
    
    await this.cache.set(`snapshot:${url}`, snapshot, { ttl: 86400 * 30 }); // 30 days
    await this.eventBus.publish('snapshot.saved', { url, version: snapshot.version });
  }

  private computeHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private async getNextVersion(url: string): Promise<number> {
    const current = await this.cache.get<DocumentSnapshot>(`snapshot:${url}`);
    return current ? current.version + 1 : 1;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    // Implementation reused from SemanticChunker
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private extractChunkContent(fullContent: string, chunkId: string): string | null {
    // Simplified - real implementation would use more sophisticated matching
    return fullContent; // Placeholder
  }

  private async generateEmbedding(content: string): Promise<number[]> {
    // Placeholder - would use actual embedding service
    return new Array(384).fill(0).map(() => Math.random());
  }
}
```

## Configuration Schema

```typescript
// config/advanced-config.schema.ts
import { z } from 'zod';

export const AdvancedConfigSchema = z.object({
  orchestration: z.object({
    workers: z.number().min(1).max(10).default(4),
    taskTimeout: z.number().min(1000).default(30000),
    retryPolicy: z.object({
      maxRetries: z.number().default(3),
      backoffMultiplier: z.number().default(2),
      maxBackoff: z.number().default(60000)
    })
  }),
  
  intelligence: z.object({
    chunkingStrategy: z.enum(['semantic', 'structural', 'hybrid']).default('semantic'),
    targetChunkSize: z.number().min(100).max(10000).default(1500),
    overlapRatio: z.number().min(0).max(0.5).default(0.1),
    qualityThreshold: z.number().min(0).max(1).default(0.8),
    semanticThreshold: z.number().min(0).max(1).default(0.7)
  }),
  
  cache: z.object({
    memory: z.object({
      maxSize: z.number().default(100),
      ttl: z.number().default(300)
    }),
    redis: z.object({
      host: z.string().default('localhost'),
      port: z.number().default(6379),
      ttl: z.number().default(3600)
    }),
    s3: z.object({
      bucket: z.string(),
      region: z.string(),
      ttl: z.number().default(86400)
    }).optional()
  }),
  
  plugins: z.array(z.string()).default([]),
  
  monitoring: z.object({
    enabled: z.boolean().default(true),
    metricsPort: z.number().default(9090),
    healthCheckInterval: z.number().default(30000)
  })
});

export type AdvancedConfig = z.infer<typeof AdvancedConfigSchema>;
```

## Usage Examples

### Direct Claude MCP Usage
```bash
# Claude uses the advanced ingestion tool
claude "Use the ingest_document tool to process the Claude Code MCP documentation with semantic chunking and code analysis plugins"

# Check for updates
claude "Check which Claude Code documentation pages have been updated since yesterday"

# Analyze quality
claude "Analyze the ingestion quality of the hooks documentation compared to the previous version"
```

### Programmatic Usage
```typescript
import { IngestionOrchestrator } from './src/orchestration/IngestionOrchestrator';
import { CodeAnalyzerPlugin } from './src/plugins/CodeAnalyzerPlugin';

const orchestrator = new IngestionOrchestrator({
  workers: 4,
  plugins: [new CodeAnalyzerPlugin()],
  intelligence: {
    chunkingStrategy: 'semantic',
    qualityThreshold: 0.9
  }
});

// Subscribe to events
orchestrator.events.subscribe('chunk.processed', async ({ data }) => {
  console.log(`Processed chunk: ${data.chunkId} (quality: ${data.qualityScore})`);
});

// Ingest with full monitoring
const result = await orchestrator.ingestDocument(
  'https://docs.anthropic.com/claude-code/mcp',
  {
    incrementalUpdate: true,
    parallelWorkers: 4
  }
);

console.log(`Ingestion complete: ${result.chunks.length} chunks, ${result.efficiency}% efficiency`);
```