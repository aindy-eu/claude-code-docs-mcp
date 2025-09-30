# Pipeline Stage Tracking

The ingestion pipeline now tracks documents through multiple stages, providing visibility into where each document is in the process.

## Stages

### 1. **fetched**
- Content successfully downloaded and cleaned
- Stored in: `.data/{domain}/cache/{path}/content.html`
- Manifest fields:
  - `lastFetchedAt`: Timestamp
  - `status`: "fetched"

### 2. **extracted**
- Claude has processed the content and returned raw response
- Stored in: `.data/{domain}/cache/{path}/raw-response.txt`
- Manifest fields:
  - `lastExtractedAt`: Timestamp
  - `status`: "extracted"
  - `rawResponseSize`: Size in bytes

### 3. **formatted**
- JSON successfully extracted and validated from Claude's response
- Stored in: `.data/{domain}/extracted/{name}.json`
- Manifest fields:
  - `lastFormattedAt`: Timestamp
  - `status`: "formatted"
  - `outputSize`: JSON file size
  - `sectionCount`: Number of sections
  - `codeExampleCount`: Number of code examples

### 4. **embedded**
- Embeddings generated and stored in Qdrant
- Final successful state
- Manifest fields:
  - `lastEmbeddedAt`: Timestamp
  - `lastIngestedAt`: Timestamp (for compatibility)
  - `status`: "embedded"
  - `embeddingProvider`: "ollama" or "openai"
  - All metadata from formatting stage

### 5. **failed**
- Any stage can fail and record error
- Manifest fields:
  - `lastFailedAt`: Timestamp
  - `status`: "failed"
  - `lastError`: Error message

## Manifest Structure

```json
{
  "version": "2.0",
  "domain": "docs.claude.com",
  "records": {
    "https://docs.claude.com/page": {
      "url": "https://docs.claude.com/page",
      "lastFetchedAt": "2025-09-30T14:00:00Z",
      "lastExtractedAt": "2025-09-30T14:01:00Z",
      "lastFormattedAt": "2025-09-30T14:01:10Z",
      "lastEmbeddedAt": "2025-09-30T14:01:20Z",
      "status": "embedded",
      "rawResponseSize": 12000,
      "outputSize": 10000,
      "sectionCount": 5,
      "codeExampleCount": 3,
      "embeddingProvider": "ollama"
    }
  }
}
```

## Benefits

1. **Visibility** - Know exactly where each document is in the pipeline
2. **Debugging** - Identify where failures occur
3. **Resumability** - Can restart from any stage
4. **Performance Tracking** - See processing times between stages
5. **TTL Management** - Different TTLs can be applied per stage

## Usage

The manifest is automatically updated at each stage:

```bash
# Fetch updates status to "fetched"
./tools/fetch https://docs.claude.com/page

# Extract updates to "extracted" then "formatted"
./tools/extract https://docs.claude.com/page

# Embed updates to "embedded"
./tools/embed .data/docs.claude.com/extracted/page.json
```

Check status:
```bash
jq '.records["https://docs.claude.com/page"]' .data/docs.claude.com/manifest.json
```

## Recovery

If a document is stuck in an intermediate state:

- **fetched** but not extracted → Run extract
- **extracted** but not formatted → Check raw-response.txt and run format-response
- **formatted** but not embedded → Run embed
- **failed** → Check lastError and restart from appropriate stage