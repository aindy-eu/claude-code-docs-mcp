# Qdrant Vector Operations

This guide covers storage, retrieval, and operational considerations for the Qdrant vector database in our Claude-driven documentation system.

## Document Storage Behavior

### How Documents Are Stored

Each document in Qdrant contains:
- **ID**: UUID v4 (unique for each document)
- **Vector**: Embedding from Ollama/OpenAI
- **Payload**: Metadata including source, title, content, and extraction details

### Re-ingestion Behavior

When you re-ingest the same documentation page:

1. **New UUIDs Generated**: Each ingestion creates completely new documents with fresh UUIDs
2. **No Automatic Cleanup**: Previous versions remain in the database
3. **Result**: Multiple versions of the same content coexist

```bash
# Example: Re-ingesting a page
./tools/ingest https://docs.claude.com/en/docs/claude-code/overview
# Creates new documents with new IDs - old ones remain
```

### Why This Design?

This behavior is intentional:
- **Version History**: Compare how documentation evolved
- **A/B Testing**: Test different extraction prompts
- **Safety**: No accidental data loss
- **Simplicity**: No complex deduplication logic

### Implications

1. **Storage Growth**: Each re-ingestion adds ~8-10 new documents
2. **Search Results**: May return multiple versions of similar content
3. **Performance**: Minimal impact until millions of documents

## Managing Duplicates

### Check Collection Size
```bash
curl -X GET 'http://localhost:6333/collections/claude_code_docs_ollama' | jq .
```

### Manual Cleanup Options

#### Option 1: Clear Entire Collection
```bash
# Delete and recreate collection
curl -X DELETE 'http://localhost:6333/collections/claude_code_docs_ollama'
npm run setup
```

#### Option 2: Delete by Source URL (Future Feature)
Currently not implemented, but could filter by payload.source field.

### Best Practices

1. **Regular Ingestion**: Re-ingest weekly for fresh content
2. **Monitor Growth**: Check collection size monthly
3. **Full Reset**: If needed, clear and re-ingest all pages

## Search Behavior

### How Search Handles Duplicates

Vector similarity naturally handles duplicates:
- Similar content clusters together
- Newer content often has slight variations
- Top-K results typically include best matches regardless

### Metadata Filtering

Use metadata to get latest version:
```typescript
// Example: Search only recent documents
filter: {
  must: [{
    key: "lastUpdated",
    range: {
      gte: "2024-01-01"
    }
  }]
}
```

## Performance Considerations

### Current Scale
- ~10 documents per page
- 6 standard pages = ~60 documents
- Performance impact: Negligible

### Future Scale
At 1000+ pages (10,000+ documents):
- Consider implementing deduplication
- Add source-based cleanup
- Implement version management

## Future Enhancements

Potential improvements for handling re-ingestion:

1. **Deterministic IDs**: Base on URL + section hash
2. **Cleanup Flag**: `--cleanup` option for ingestion scripts
3. **Version Tracking**: Add version number to metadata
4. **Retention Policy**: Auto-remove documents older than X days

## Related Resources

- [Qdrant Setup](./setup.md) - Initial configuration
- [Ingestion Tracking](../ingestion/README.md) - Preventing unnecessary re-ingestion
- [RAG Architecture](../rag/README.md) - Overall storage strategy