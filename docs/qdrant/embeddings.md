# Embedding Integration Guide

Configure and use embedding providers (Ollama and OpenAI) for vector generation in the Claude Code Documentation system.

> **Implementation Status**: This document contains both implemented features (✅) and example/future implementations (🔮). Look for the status indicators throughout.

## 🎯 Overview

Embeddings convert text into numerical vectors that capture semantic meaning. This project supports two providers:

- **Ollama** (Local, free, privacy-focused)
- **OpenAI** (Cloud, higher quality, requires API key)

## 📊 Provider Comparison

| Feature        | Ollama                  | OpenAI                 |
| -------------- | ----------------------- | ---------------------- |
| **Location**   | Local (localhost:11434) | Cloud API              |
| **Cost**       | Free                    | Pay per use            |
| **Privacy**    | 100% local              | Data sent to OpenAI    |
| **Model**      | nomic-embed-text        | text-embedding-ada-002 |
| **Dimensions** | 768                     | 1536                   |
| **Speed**      | ~50-200ms               | ~100-500ms             |
| **Quality**    | Good                    | Better                 |
| **Setup**      | Install Ollama          | API key only           |

## 🦙 Ollama Setup

### Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

### Start Ollama Service

```bash
# Start the service
ollama serve

# Pull the embedding model
ollama pull nomic-embed-text

# Verify it's working
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "test"
}'
```

### Environment Variables

```bash
# .env
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
DEFAULT_EMBEDDING_PROVIDER=ollama
```

## 🔑 OpenAI Setup

### Get API Key

1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to API Keys section
3. Create new secret key
4. Copy and save securely

### Configure Environment

```bash
# .env
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
DEFAULT_EMBEDDING_PROVIDER=openai  # If preferring OpenAI
```

### Cost Estimation

- **Model**: text-embedding-ada-002
- **Price**: ~$0.0001 per 1K tokens
- **Average doc**: ~500 tokens
- **1000 docs**: ~$0.05

## 💻 Implementation

### ✅ Current Implementation (ACTUALLY IN CODEBASE)

The actual implementation in this project (`src/utils/embeddings.ts`):

```typescript
import OpenAI from 'openai';
import ollama from 'ollama';

export type EmbeddingProvider = 'openai' | 'ollama';

export const EMBEDDING_CONFIGS = {
  ollama: {
    provider: 'ollama',
    dimensions: 768,
    model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'
  },
  openai: {
    provider: 'openai',
    dimensions: 1536,
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002'
  }
};

export async function generateEmbedding(
  text: string,
  provider: EmbeddingProvider = 'ollama'
): Promise<number[]> {
  if (provider === 'ollama') {
    const response = await ollama.embeddings({
      model: EMBEDDING_CONFIGS.ollama.model,
      prompt: text
    });
    return response.embedding;
  } else {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.embeddings.create({
      model: EMBEDDING_CONFIGS.openai.model,
      input: text
    });
    return response.data[0].embedding;
  }
}

export function getCollectionName(provider: EmbeddingProvider): string {
  return `claude_code_docs_${provider}`;
}
```

### ✅ Using Embeddings (ACTUALLY IMPLEMENTED)

```typescript
// Generate embedding for search query
const queryEmbedding = await generateEmbedding('How to implement slash commands?', 'ollama');

// Generate embeddings for document
const docEmbedding = await generateEmbedding(documentContent, 'ollama');

// Use with Qdrant
const results = await qdrantClient.search(getCollectionName('ollama'), {
  vector: queryEmbedding,
  limit: 5
});
```

## 🔄 Hybrid Strategy

### 🔮 Using Both Providers (EXAMPLE/FUTURE IMPLEMENTATION)

The system can use both providers simultaneously:

```typescript
// Search across both providers
async function hybridSearch(query: string) {
  const results = [];

  // Search Ollama collection
  if (await isOllamaAvailable()) {
    const ollamaEmbedding = await generateEmbedding(query, 'ollama');
    const ollamaResults = await qdrantClient.search('claude_code_docs_ollama', {
      vector: ollamaEmbedding,
      limit: 5
    });
    results.push(...ollamaResults);
  }

  // Search OpenAI collection
  if (process.env.OPENAI_API_KEY) {
    const openaiEmbedding = await generateEmbedding(query, 'openai');
    const openaiResults = await qdrantClient.search('claude_code_docs_openai', {
      vector: openaiEmbedding,
      limit: 5
    });
    results.push(...openaiResults);
  }

  // Merge and deduplicate
  return mergeResults(results);
}
```

### 🔮 Provider Selection Strategy (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
async function selectBestProvider(): Promise<EmbeddingProvider> {
  // Priority order:
  // 1. User preference (DEFAULT_EMBEDDING_PROVIDER)
  // 2. OpenAI if API key available (better quality)
  // 3. Ollama if running (free, local)
  // 4. Throw error if none available

  const preferred = process.env.DEFAULT_EMBEDDING_PROVIDER as EmbeddingProvider;

  if (preferred && (await isProviderAvailable(preferred))) {
    return preferred;
  }

  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }

  if (await isOllamaAvailable()) {
    return 'ollama';
  }

  throw new Error('No embedding provider available');
}

async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    return response.ok;
  } catch {
    return false;
  }
}
```

## 🚀 Batch Processing

### 🔮 Efficient Batch Embeddings (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
async function batchGenerateEmbeddings(
  texts: string[],
  provider: EmbeddingProvider,
  batchSize = 10
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    // Process batch in parallel
    const batchEmbeddings = await Promise.all(batch.map(text => generateEmbedding(text, provider)));

    embeddings.push(...batchEmbeddings);

    console.log(`Processed ${Math.min(i + batchSize, texts.length)}/${texts.length} texts`);

    // Rate limiting for OpenAI
    if (provider === 'openai') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return embeddings;
}
```

## 📏 Text Preparation

### 🔮 Optimal Text Length (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
function prepareTextForEmbedding(text: string, maxTokens: number = 2048): string {
  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Truncate if too long (rough estimate: 1 token ≈ 4 chars)
  const maxChars = maxTokens * 4;
  if (text.length > maxChars) {
    text = text.substring(0, maxChars) + '...';
  }

  return text;
}
```

### 🔮 Chunking Strategy (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
function chunkDocument(content: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    chunks.push(content.substring(start, end));
    start = end - overlap; // Overlap for context continuity
  }

  return chunks;
}
```

## 🔍 Testing Embeddings

### Verify Provider

```bash
# Test Ollama
curl -X POST http://localhost:11434/api/embeddings \
  -d '{"model":"nomic-embed-text","prompt":"test"}'

# Test OpenAI (replace with your key)
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{"input": "test", "model": "text-embedding-ada-002"}'
```

### 🔮 Compare Similarity (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// Test semantic similarity
const embed1 = await generateEmbedding('error handling', provider);
const embed2 = await generateEmbedding('exception management', provider);
const similarity = cosineSimilarity(embed1, embed2);
console.log(`Similarity: ${similarity}`); // Should be > 0.7
```

## ⚡ Performance Tips

### 🔮 Caching (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
const embeddingCache = new Map<string, number[]>();

async function getCachedEmbedding(text: string, provider: EmbeddingProvider): Promise<number[]> {
  const key = `${provider}:${text}`;

  if (!embeddingCache.has(key)) {
    const embedding = await generateEmbedding(text, provider);
    embeddingCache.set(key, embedding);
  }

  return embeddingCache.get(key)!;
}
```

### 🔮 Connection Pooling (EXAMPLE/FUTURE IMPLEMENTATION)

```typescript
// Reuse client instances
const clients = {
  openai: null as OpenAI | null,

  getOpenAI(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        maxRetries: 3
      });
    }
    return this.openai;
  }
};
```

## 🛠️ Troubleshooting

### Ollama Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List available models
ollama list

# Re-pull model if corrupted
ollama pull nomic-embed-text

# Check logs
journalctl -u ollama -f  # Linux
```

### OpenAI Issues

```typescript
// Test API key
async function testOpenAIKey(): Promise<boolean> {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'test'
    });
    console.log('✅ OpenAI API key is valid');
    return true;
  } catch (error) {
    console.error('❌ OpenAI API key error:', error.message);
    return false;
  }
}
```

## 📚 Related Guides

- [Client Integration](./client-integration.md) - Using embeddings with Qdrant
- [Performance](./performance.md) - Optimization strategies
- [RAG Architecture](../rag/README.md) - How embeddings power search

## 🔗 Resources

- [Ollama Documentation](https://ollama.ai/docs)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Nomic Embed Model](https://ollama.ai/library/nomic-embed-text)
- [Embedding Best Practices](https://platform.openai.com/docs/guides/embeddings/use-cases)
