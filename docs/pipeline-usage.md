# pipeline usage guide

## overview

The three-stage pipeline transforms the monolithic ingestion process into separate, cacheable stages for 10x faster re-processing:

```
fetch (HTML cache) → extract (JSON cache) → embed (vector DB)
```

## quick start

### pipeline mode (recommended for development)

```bash
# First run: ~2 minutes (fetches from network, Claude extraction, embedding)
./tools/ingest https://docs.claude.com/en/docs/claude-code/hooks --pipeline

# Second run: <5 seconds (uses cached HTML and JSON)
./tools/ingest https://docs.claude.com/en/docs/claude-code/hooks --pipeline
```

### monolithic mode (original behavior)

```bash
# Always takes 2+ minutes (no caching between runs)
./tools/ingest https://docs.claude.com/en/docs/claude-code/hooks
```

## individual stage tools

### fetch - HTML caching with content-based invalidation

```bash
# Basic usage
./tools/fetch https://docs.claude.com/en/docs/claude-code/hooks

# Force refresh (ignore cache)
./tools/fetch https://docs.claude.com/en/docs/claude-code/hooks --force

# Custom TTL
./tools/fetch https://docs.claude.com/en/docs/claude-code/hooks --ttl 14

# Save to file
./tools/fetch https://docs.claude.com/en/docs/claude-code/hooks --output page.html

# Show metadata
./tools/fetch https://docs.claude.com/en/docs/claude-code/hooks --metadata
```

**cache location**: `.cache/html/`
**default TTL**: 7 days
**invalidation**: Content hash + structure hash + TTL

### extract - Claude understanding with JSON caching

```bash
# From URL (uses fetch cache)
./tools/extract https://docs.claude.com/en/docs/claude-code/hooks

# From HTML file
./tools/extract page.html

# Force re-extraction
./tools/extract https://docs.claude.com/en/docs/claude-code/hooks --force

# Custom output
./tools/extract https://docs.claude.com/en/docs/claude-code/hooks --output custom.json
```

**cache location**: `.cache/json/`
**prompt versions**: Future support for A/B testing prompts

### embed - vector generation and storage

```bash
# Generate embeddings
./tools/embed claude-outputs/hooks.json

# Choose provider
./tools/embed claude-outputs/hooks.json --provider openai

# Batch process directory
./tools/embed --batch claude-outputs/

# Force re-embedding
./tools/embed claude-outputs/hooks.json --force
```

**providers**: ollama (default), openai, both
**storage**: Qdrant vector database

## advanced usage

### partial pipeline execution

```bash
# Only fetch and extract (skip embedding)
./tools/ingest URL --pipeline --stages fetch,extract

# Only embed existing JSON
./tools/ingest URL --pipeline --stages embed

# Only fetch HTML
./tools/ingest URL --pipeline --stages fetch
```

### batch operations

```bash
# Process multiple URLs
for url in $(cat urls.txt); do
  ./tools/ingest "$url" --pipeline
done

# Parallel processing (careful with rate limits)
cat urls.txt | xargs -P 3 -I {} ./tools/ingest {} --pipeline --quiet

# Batch embed all JSON files
./tools/embed --batch claude-outputs/
```

### cache management

```bash
# Check cache size
du -sh .cache/

# Clear HTML cache older than 30 days
find .cache/html -type f -mtime +30 -delete

# Clear JSON cache
rm -rf .cache/json/*

# Full cache reset
rm -rf .cache/
```

## performance comparison

| operation | monolithic | pipeline (first run) | pipeline (cached) |
|-----------|------------|---------------------|-------------------|
| fetch HTML | 2-5s | 2-5s | <0.1s |
| Claude extraction | 30-60s | 30-60s | <0.1s |
| Generate embeddings | 2-5s | 2-5s | 2-5s |
| **Total** | **~2 min** | **~2 min** | **<5s** |

## how caching works

### HTML cache (fetch stage)

1. Fetches HTML from URL
2. Normalizes content (removes timestamps, tracking scripts)
3. Generates content hash and structure hash
4. Stores in `.cache/html/{url-hash}.html`
5. Creates metadata with headers, fetch time

**Cache invalidation triggers**:
- Content hash changes (actual content modified)
- Structure hash changes (DOM structure modified)
- TTL expiration (default 7 days)
- Forced refresh (`--force` flag)

### JSON cache (extract stage)

1. Checks if extraction exists for URL + prompt version
2. Validates extraction age (7 day TTL)
3. If valid, returns cached JSON
4. Otherwise, runs Claude extraction
5. Stores in `.cache/json/{url-hash}-{prompt-version}.json`

### embedding cache (via ingestion manifest)

1. Checks `ingestion-manifest.json` for URL
2. Verifies if already embedded with provider
3. Skip if recent and same provider
4. Otherwise, generate new embeddings

## troubleshooting

### pipeline not working

```bash
# Check if tools are executable
ls -la tools/fetch tools/extract tools/embed

# Make executable if needed
chmod +x tools/fetch tools/extract tools/embed

# Verify build is current
npm run build
```

### cache issues

```bash
# Check cache directory exists
ls -la .cache/

# Create if missing
mkdir -p .cache/{html,json,logs}

# Check disk space
df -h .

# Clear cache if corrupted
rm -rf .cache/ && mkdir -p .cache/{html,json,logs}
```

### extraction failures

```bash
# Test with cached HTML
./tools/extract --source .cache/html/{hash}.html

# Check prompt file exists
ls docs/ingestion/prompts/claude-docs.prompt.md

# Try with simple test
echo "<html><body>Test</body></html>" > test.html
./tools/extract test.html
```

## best practices

1. **Use pipeline mode during development** - Saves time on re-runs
2. **Run monolithic mode for production** - Simpler, fewer moving parts
3. **Set appropriate TTL** - 7 days default, adjust based on doc update frequency
4. **Monitor cache size** - Clean old entries periodically
5. **Use `--force` sparingly** - Only when you know content has changed

## environment variables

```bash
# Set default embedding provider
export EMBEDDING_PROVIDER=openai

# Custom cache directory (future)
export CACHE_DIR=/tmp/doc-cache
```

## migration from monolithic

No changes needed! The enhanced ingest tool is backward compatible:

```bash
# Old way still works (monolithic mode)
./tools/ingest URL

# New way with caching (pipeline mode)
./tools/ingest URL --pipeline
```

## future enhancements

- **Prompt versioning**: Test different extraction prompts
- **Selective extraction**: Extract only changed sections
- **Compression**: Gzip cache files to save space
- **Remote cache**: Share cache between team members
- **Smart invalidation**: Detect meaningful vs cosmetic changes

## architecture benefits

1. **Separation of concerns**: Each stage has one job
2. **Failure isolation**: Retry individual stages
3. **Development speed**: Iterate on extraction without re-fetching
4. **Resource efficiency**: Reduce API calls and network usage
5. **Debugging**: Inspect intermediate outputs easily