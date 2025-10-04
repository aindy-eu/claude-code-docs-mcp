# Enhanced Search with Claude-Extracted Metadata

This guide explains how our search leverages Claude's natural language understanding to provide superior documentation search results.

## What Makes Our Search "Enhanced"?

Traditional documentation search relies on keyword matching or basic embeddings. Our Claude-driven approach adds rich contextual understanding.

### Traditional Search

```
Query: "how to handle errors"
Results: Pages containing "error" or "handle"
```

### Our Enhanced Search

```
Query: "how to handle errors"
Results:
- Error handling best practices (even if not explicitly titled)
- Related concepts: debugging, logging, exceptions
- Code examples showing error patterns
- Conceptually related content Claude identified
```

## The Power of Claude-Extracted Metadata

### 1. Key Concepts Extraction

Claude identifies concepts that aren't always explicit:

```json
{
  "keyConcepts": [
    "terminal-based AI coding assistant",
    "interactive CLI tool",
    "software engineering automation",
    "context-aware code generation"
  ]
}
```

These become searchable, even if the exact phrases don't appear in the text.

### 2. Relationship Mapping

Claude understands relationships between concepts:

```json
{
  "relatedSections": [
    "Getting Started with Claude Code",
    "MCP Integration Guide",
    "Advanced Features",
    "Troubleshooting"
  ]
}
```

Searching for related topics might return Claude Code docs because Claude understood the conceptual connection between sections.

### 3. Best Practices Identification

Claude extracts implicit best practices:

```json
{
  "bestPractices": [
    "Always review generated code before running",
    "Use specific, detailed prompts for better results",
    "Leverage context from previous commands"
  ]
}
```

## Search Features

### Semantic Search

Our vector embeddings capture meaning, not just keywords:

```bash
# These queries find similar results:
npm run search "fix bugs in my code"
npm run search "debug software issues"
npm run search "troubleshoot programming errors"
```

### Metadata Boosting

Search results include why they matched:

```
🔍 Search Result:
Title: Claude Code Overview - Error Handling
Score: 0.87
Key Concepts: error-handling, debugging, code-review
Why Matched: Contains best practices for handling errors in AI-generated code
```

### Multi-Faceted Matching

A single query matches against:

1. Main content (vector similarity)
2. Key concepts (metadata)
3. Code examples (structured data)
4. Best practices (extracted wisdom)

## Advanced Search Patterns

### Concept-Based Search

Find documentation by concept, not just keywords:

```bash
# Finds async/await documentation even if query doesn't match exactly
npm run search "handling asynchronous operations"
```

### Code Pattern Search

Search for code patterns Claude identified:

```bash
# Finds examples of error handling patterns
npm run search "try catch patterns"
```

### Best Practice Discovery

Find implicit knowledge:

```bash
# Discovers practices Claude extracted
npm run search "claude code best practices"
```

## Implementation Details

### Search Scoring

Results are scored by:

1. **Vector Similarity** (0.0-1.0) - How close embeddings are
2. **Concept Overlap** - Matching key concepts
3. **Recency** - Newer content slightly preferred
4. **Section Relevance** - Overview vs specific sections

### Result Formatting

Each result includes:

```typescript
{
  content: string;        // Relevant text chunk
  score: number;          // Similarity score
  metadata: {
    title: string;
    source: string;       // Original URL
    keyConcepts: string[];
    codeExamples: number;
    extractionMethod: 'claude-driven';
  };
}
```

### Query Processing

Before searching, queries are:

1. Normalized (lowercase, trimmed)
2. Embedded using same model as documents
3. Optionally expanded (future feature)

## Search Tips

### For Best Results

1. **Use Natural Language**: "How do I handle errors?" vs "error handling"
2. **Be Specific**: "Claude Code MCP server setup" vs "setup"
3. **Include Context**: "debugging TypeScript in Claude Code"

### Understanding Scores

- **0.9+**: Nearly exact match
- **0.7-0.9**: Highly relevant
- **0.5-0.7**: Related content
- **<0.5**: Loosely related

### Leveraging Metadata

Look for results that match your intent, not just your words:

- Check the "Key Concepts" field
- Review why the result was included
- Explore related concepts

## Comparison with Traditional Search

| Feature            | Traditional    | Our Enhanced Search       |
| ------------------ | -------------- | ------------------------- |
| Keyword Matching   | ✅ Exact match | ✅ Semantic understanding |
| Typo Tolerance     | ❌ Limited     | ✅ Vector similarity      |
| Concept Search     | ❌ No          | ✅ Claude-extracted       |
| Code Understanding | ❌ Text only   | ✅ Structured examples    |
| Best Practices     | ❌ If explicit | ✅ Claude identifies      |
| Relationships      | ❌ No          | ✅ Connected concepts     |

## API Usage

### From Command Line

```bash
npm run search "your query" -- --limit 10 --provider ollama
```

### Via MCP Server

```bash
# Add server once
claude mcp add claude-docs node $(pwd)/build/index.js

# Then search normally
claude "search for error handling in the docs"
```

### Programmatic Access

```typescript
// Via the search service
import { searchDocumentation } from './mcp-tools/search/search.js';

const results = await searchDocumentation(
  qdrantClient,
  { query: "your query", limit: 5, provider: "ollama" }
);
```

## Related Documentation

- [RAG Architecture](./README.md) - The RAG System design and Architecture
- [Pipeline Stages](../pipeline.md) - How documents are ingested and processed
- [CLI Guide](../how-to-use-the-cli.md) - Command-line search usage
