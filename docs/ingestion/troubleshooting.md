# Troubleshooting Ingestion, Monitoring & Maintenance

## Common Issues

1. **Invalid JSON Output**
   - Claude may wrap JSON in markdown blocks (```json...```)
   - The `tools/ingest` and `tools/batch-ingest` scripts automatically clean this
   - Manual cleaning only needed if calling Claude directly
   - Always validate with `jq` before processing

2. **Missing Embeddings**
   - Verify Ollama is running: `curl http://localhost:11434/api/tags`
   - Check collection exists in Qdrant
   - Ensure embedding dimensions match

3. **Poor Search Results**
   - Check if content was properly chunked
   - Verify embedding provider consistency
   - Adjust score threshold if needed

### Respect Rate Limits**
Add delays between requests when processing multiple pages:
```bash
sleep 30  # 30 seconds between pages
```

### Validate Output**
Always check Claude's JSON output before processing:
```bash
# Validate JSON
jq . claude-output.json > /dev/null || echo "Invalid JSON!"

# Check structure
jq '.sections | length' claude-output.json
```

## 📊 Monitoring & Maintenance

### Check Ingestion Status
```bash
# View detailed ingestion status
npm run ingestion-status

# See verbose details
npm run ingestion-status -- --verbose

# Check collection stats
curl http://localhost:6333/collections/claude_code_docs_ollama
```

### Understanding the Manifest
The system maintains `claude-outputs/ingestion-manifest.json` to track:
- When each page was last ingested
- Success/failure status
- Content hashes (to detect changes)
- Embedding counts and providers

Default TTL: 7 days (pages older than this are considered stale)

### Update Documentation
```bash
# Re-ingest specific pages that have changed
./tools/ingest https://docs.claude.com/en/docs/claude-code/hooks

# Or force re-ingest all pages
./tools/batch-ingest --force
```

### Clean Up Old Data
```bash
# Remove and rebuild collection if needed
curl -X DELETE http://localhost:6333/collections/claude_code_docs_ollama
npm run setup
```
