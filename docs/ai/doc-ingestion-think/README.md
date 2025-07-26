# Documentation Ingestion - Think Level

## Simple Manual Approach

The most straightforward implementation where Claude Code reads documentation and outputs structured data that we manually process.

## Core Concept

1. Ask Claude to read a documentation page
2. Claude outputs structured JSON
3. Run a simple script to embed and store the data

## Implementation

### Step 1: Claude Reads Documentation

```bash
claude "Read https://docs.anthropic.com/claude-code/slash-commands and output a JSON structure with title, content sections, and code examples"
```

### Step 2: Save Output

```bash
# Claude outputs JSON, we save it
claude "Read the slash commands docs and format as JSON" > output/slash-commands.json
```

### Step 3: Process with Simple Script

```javascript
// simple-ingest.js
const fs = require('fs');
const { generateEmbedding } = require('./embeddings');
const { QdrantClient } = require('@qdrant/js-client-rest');

const json = JSON.parse(fs.readFileSync(process.argv[2]));
const client = new QdrantClient({ host: 'localhost', port: 6333 });

// Simple processing
for (const section of json.sections) {
  const embedding = await generateEmbedding(section.content);
  await client.upsert('claude_docs', {
    points: [{
      id: section.id,
      vector: embedding,
      payload: section
    }]
  });
}
```

### Step 4: Run It

```bash
node simple-ingest.js output/slash-commands.json
```

## JSON Structure Expected

```json
{
  "url": "https://docs.anthropic.com/claude-code/slash-commands",
  "title": "Slash Commands",
  "sections": [
    {
      "id": "slash-commands-intro",
      "heading": "Introduction",
      "content": "Slash commands are...",
      "codeExamples": ["example code here"]
    }
  ]
}
```

## Advantages

- Dead simple to understand
- No complex automation
- Full control over each step
- Easy to debug

## Disadvantages

- Manual process
- Time consuming for many pages
- No error handling
- Basic chunking

## When to Use This Approach

- Proof of concept
- Small documentation sets
- When you need full control
- Testing the idea

## Next Level

See `doc-ingestion-think-hard` for a more refined approach with better error handling and semi-automation.