# RAG System Architecture

This guide explains the Retrieval-Augmented Generation (RAG) architecture implemented in the Claude Code Documentation MCP Server.

## Overview

Our RAG system combines Claude's natural language understanding with vector similarity search to provide intelligent documentation retrieval.

```
User Query → Embedding → Vector Search → Retrieve Documents → Format Response
                ↓                ↓
            (Ollama/OpenAI)  (Qdrant)
```

## Core Components

### 1. Document Ingestion Pipeline

The ingestion flow that powers our RAG system:

```
Claude reads docs → Extracts structure → Generate embeddings → Store in Qdrant
```

Key features:
- **Claude-driven extraction** - Natural language understanding
- **Rich metadata** - Key concepts, code examples, best practices
- **Hybrid embeddings** - Support for both Ollama and OpenAI

### 2. Vector Storage (Qdrant)

Documents are stored with:
- **Vector embeddings** - 768-dim (Ollama) or 1536-dim (OpenAI)
- **Structured payload** - Title, content, source, metadata
- **Unique IDs** - UUID v4 for each document chunk

### 3. Search & Retrieval

The search process:

1. **Query Embedding**: User query → vector embedding
2. **Similarity Search**: Find top-K nearest neighbors in Qdrant
3. **Metadata Enhancement**: Include Claude-extracted concepts
4. **Result Ranking**: Score by relevance and recency

## Architectural Decisions

### Why Hybrid Embeddings?

Supporting both Ollama and OpenAI provides:
- **Privacy**: Ollama runs locally
- **Cost**: Ollama is free
- **Quality**: OpenAI option for better embeddings
- **Flexibility**: Switch providers as needed

### Why Chunk Documents?

Each documentation page creates multiple chunks:
- **Overview chunk** - Page summary and key concepts
- **Section chunks** - Individual sections with details
- **Code chunks** - Standalone code examples

Benefits:
- More precise retrieval
- Better context windows
- Improved relevance scoring

### Why Claude for Extraction?

Traditional parsing misses:
- Implicit relationships
- Conceptual connections
- Best practices not explicitly stated
- Context and nuance

Claude provides:
- Human-like understanding
- Structured extraction
- Relationship mapping
- Quality metadata

## Implementation Details

### Document Processing

```typescript
interface ProcessedDocument {
  id: string;           // UUID v4
  source: string;       // Original URL
  title: string;        // Page or section title
  content: string;      // Main text content
  metadata: {
    section: string;
    codeExamples: string[];      // Code example strings
    keyConcepts: string[];       // Key concepts extracted
    lastUpdated: string;
    provider: 'claude-extracted';
    extractionMethod: 'claude-driven';
    qualityScore?: number;       // Optional quality metric
  };
}
```

### Embedding Generation

```typescript
// Ollama (default)
const embedding = await generateEmbedding(content, 'ollama');
// Returns 768-dimensional vector

// OpenAI (optional)
const embedding = await generateEmbedding(content, 'openai');
// Returns 1536-dimensional vector
```

### Search Implementation

```typescript
async function search(query: string, limit: number = 3) {
  // 1. Generate query embedding
  const queryVector = await generateEmbedding(query, provider);

  // 2. Search Qdrant
  const results = await qdrantClient.search(collectionName, {
    vector: queryVector,
    limit,
    withPayload: true,
    scoreThreshold: 0.75  // High-quality results only (SEARCH_SCORE_THRESHOLD)
  });

  // 3. Format results with metadata
  return formatSearchResults(results);
}
```

## MCP Integration

The RAG system integrates with Model Context Protocol:

### Available Tool

**search_claude_code_docs** - Search documentation

Input schema:
```typescript
{
  query: string;                              // Required: search query
  provider?: 'ollama' | 'openai' | 'both';   // Optional: embedding provider (default: 'ollama')
  limit?: number;                             // Optional: 1-10 results (default: 3)
}
```

### Response Format

Search results include:
- Relevant content chunks
- Similarity scores
- Claude-extracted metadata
- Source URLs for reference

## Performance Considerations

### Embedding Dimensions
- **Ollama (768)**: Fast, medium-sized index, good quality
- **OpenAI (1536)**: Better quality, larger index

### Chunk Size
- Target: 500-2000 tokens per chunk
- Balance between context and precision

### Collection Scaling
- Current: ~10 chunks per page
- Tested with 100+ documents
- Qdrant handles thousands of documents efficiently

## Related Documentation

- [Qdrant Operations](../qdrant/operations.md) - Vector database details
- [Enhanced Search](./enhanced-search.md) - Advanced search features
- [Ingestion Guide](../ingestion/README.md) - How documents are processed