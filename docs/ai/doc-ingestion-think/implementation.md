# Basic Implementation Guide

## Prerequisites

- Claude Code installed
- Qdrant running locally
- Basic Node.js setup

## Step-by-Step Workflow

### 1. Manual Documentation Reading

Ask Claude to read and structure documentation:

```bash
# Example for slash commands
claude "Please read https://docs.anthropic.com/claude-code/slash-commands and output a JSON structure with:
- url
- title  
- sections array containing:
  - id (unique identifier)
  - heading
  - content (the text)
  - codeExamples array"
```

### 2. Create Simple Processing Script

```javascript
// File: process-claude-output.js
const fs = require('fs');
const path = require('path');

// Read Claude's output
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node process-claude-output.js <json-file>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

// Basic validation
if (!data.sections || !Array.isArray(data.sections)) {
  console.error('Invalid JSON structure - missing sections array');
  process.exit(1);
}

// Process each section
console.log(`Processing ${data.sections.length} sections from ${data.title}`);

// For now, just validate and prepare for embedding
data.sections.forEach((section, index) => {
  console.log(`Section ${index + 1}: ${section.heading}`);
  console.log(`  Content length: ${section.content.length} chars`);
  console.log(`  Code examples: ${section.codeExamples?.length || 0}`);
});

// Save processed data
const outputFile = path.join('processed', path.basename(inputFile));
fs.mkdirSync('processed', { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

console.log(`\nProcessed data saved to: ${outputFile}`);
```

### 3. Basic Embedding Script

```javascript
// File: embed-to-qdrant.js
const { QdrantClient } = require('@qdrant/js-client-rest');
const fs = require('fs');

const client = new QdrantClient({ 
  host: 'localhost', 
  port: 6333 
});

async function embedAndStore(jsonFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  
  for (const section of data.sections) {
    // For "think" level - just store text directly
    // Real implementation would generate actual embeddings
    const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
    
    await client.upsert('claude_docs_simple', {
      points: [{
        id: section.id,
        vector: mockEmbedding,
        payload: {
          title: section.heading,
          content: section.content,
          url: data.url,
          codeExamples: section.codeExamples || []
        }
      }]
    });
    
    console.log(`Stored: ${section.heading}`);
  }
}

embedAndStore(process.argv[2]).catch(console.error);
```

## Complete Workflow Example

```bash
# 1. Create output directory
mkdir -p output processed

# 2. Ask Claude to read documentation
claude "Read https://docs.anthropic.com/claude-code/hooks and output JSON with url, title, and sections array" > output/hooks.json

# 3. Process the output
node process-claude-output.js output/hooks.json

# 4. Embed and store
node embed-to-qdrant.js processed/hooks.json

# 5. Repeat for other pages
claude "Read https://docs.anthropic.com/claude-code/mcp and output JSON..." > output/mcp.json
node process-claude-output.js output/mcp.json
node embed-to-qdrant.js processed/mcp.json
```

## Testing the Implementation

```bash
# Simple test query
node test-search.js "how do hooks work"
```

## Limitations of Think Level

1. **Manual process** - Each page requires manual commands
2. **No error handling** - Scripts assume perfect input
3. **Mock embeddings** - Using random vectors for simplicity
4. **Basic chunking** - Relies on Claude's judgment
5. **No deduplication** - May store duplicate content

## Why This Works

Despite its simplicity, this approach:
- Proves Claude can read and structure docs effectively
- Shows the JSON pipeline concept works
- Demonstrates manual ingestion is viable
- Provides foundation for automation

## Next Steps

The "think-hard" level will add:
- Error handling
- Real embeddings
- Batch processing
- Better validation