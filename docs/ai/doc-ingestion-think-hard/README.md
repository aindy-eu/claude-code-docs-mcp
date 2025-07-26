# Documentation Ingestion - Think Hard Level

## Semi-Automated Approach with Error Handling

A refined implementation that adds robustness, batch processing, and real embeddings while maintaining Claude-driven ingestion.

## Key Improvements Over Basic Level

1. **Batch Processing** - Process multiple URLs with single command
2. **Error Handling** - Graceful failures and retry logic
3. **Real Embeddings** - Integration with Ollama/OpenAI
4. **Progress Tracking** - Visual feedback during processing
5. **Resume Capability** - Continue from failures
6. **Schema Validation** - Ensure consistent output
7. **Quality Metrics** - Track extraction quality

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Batch Runner   │────▶│  Claude Reader   │────▶│ Embedding Pipeline│
│  (Node.js)      │     │  (Structured)    │     │ (Ollama/OpenAI)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Progress Track  │     │ JSON Validator   │     │   Qdrant Store   │
│ (checkpoint.json)│     │ (Joi/Zod)       │     │  (with retries)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Implementation Components

### 1. Batch Configuration File
```json
{
  "urls": [
    "https://docs.anthropic.com/claude-code/overview",
    "https://docs.anthropic.com/claude-code/quickstart",
    "https://docs.anthropic.com/claude-code/slash-commands"
  ],
  "settings": {
    "maxRetries": 3,
    "delayBetweenDocs": 5000,
    "embeddingProvider": "ollama",
    "validateSchema": true
  }
}
```

### 2. Smart Batch Runner
```javascript
// Handles failures, retries, and progress
class DocIngestionRunner {
  async processUrl(url) {
    try {
      const json = await this.askClaudeToRead(url);
      const validated = await this.validateSchema(json);
      const embedded = await this.generateEmbeddings(validated);
      await this.storeInQdrant(embedded);
      this.updateProgress(url, 'completed');
    } catch (error) {
      this.handleError(url, error);
    }
  }
}
```

### 3. Claude Prompt Template
```javascript
const INGESTION_PROMPT = `
Read the documentation at {url} and output a JSON structure following this exact schema:

{
  "url": "{url}",
  "title": "Page title",
  "lastUpdated": "ISO date string",
  "sections": [
    {
      "id": "unique-section-id",
      "heading": "Section heading",
      "content": "Section text content",
      "codeExamples": ["example1", "example2"],
      "relatedConcepts": ["concept1", "concept2"]
    }
  ],
  "metadata": {
    "wordCount": number,
    "codeBlockCount": number,
    "extractionQuality": "high|medium|low"
  }
}

Important:
- Ensure all code examples are complete and runnable
- Include metadata about extraction confidence
- Group related content logically
`;
```

## Usage

### Basic Batch Processing
```bash
# Process a batch of documentation
node ingest-batch.js --config=batch-config.json

# Output shows progress
Processing documentation batch...
✓ overview (1/10) - 2.3s
✓ quickstart (2/10) - 3.1s
⚠ slash-commands (3/10) - Retry 1/3
✓ slash-commands (3/10) - 4.2s
```

### Resume from Failure
```bash
# Automatically resumes from last checkpoint
node ingest-batch.js --resume

# Or specify checkpoint
node ingest-batch.js --checkpoint=./checkpoints/2024-01-15.json
```

### Quality Validation
```bash
# Validate extraction quality
node validate-quality.js --compare-with=dom-parsed

# Output
Extraction Quality Report:
- Content completeness: 94%
- Code example accuracy: 98%
- Section detection: 91%
- Overall quality: HIGH
```

## Error Handling Strategies

1. **Network Failures** - Exponential backoff retry
2. **Claude Failures** - Fallback prompts with simpler requirements
3. **Validation Failures** - Log and skip with detailed error report
4. **Embedding Failures** - Queue for later retry
5. **Storage Failures** - Local cache until Qdrant available

## Advantages

✅ Semi-automated but controlled  
✅ Robust error handling  
✅ Production-ready quality  
✅ Progress tracking and resume  
✅ Real embeddings  
✅ Validated, consistent output  

## When to Use

- Regular documentation updates (weekly/monthly)
- Teams needing reliable ingestion
- Quality-critical applications
- Medium-scale documentation (10-100 pages)

## Next Evolution

See `doc-ingestion-think-harder` for fully integrated MCP tools and intelligent chunking strategies.