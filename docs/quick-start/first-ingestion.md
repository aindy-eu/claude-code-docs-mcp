# First Documentation Ingestion with Claude

This guide walks you through your first Claude-driven documentation ingestion in 5 minutes.

## Prerequisites

- Claude Code installed and working
- Docker running with Qdrant container
- Ollama installed with `nomic-embed-text` model
- Project set up (`npm install` and `npm run setup` completed)

## Step 1: Understand the Process

Instead of scraping HTML, we use Claude Code to:
1. Read documentation naturally
2. Extract structured information with context
3. Generate embeddings for semantic search

## Step 2: Your First Ingestion

### Option A: Use the Example (Quickest)

We've included an example output to get you started immediately:

```bash
# Process the example Claude output
npm run process-claude examples/claude-output-example.json

# Test the search
npm run search "slash commands"
```

### Option B: Ingest Real Documentation

```bash
# Make the script executable
chmod +x examples/ingest-single.sh

# Ingest a documentation page
./examples/ingest-single.sh https://docs.anthropic.com/en/docs/claude-code/overview

# The script will:
# 1. Use Claude to read the documentation
# 2. Save output to claude-outputs/overview.json
# 3. Process it into embeddings
# 4. Show you how to search
```

## Step 3: Verify It Worked

```bash
# Search your knowledge base
npm run search "Claude Code overview"

# You should see results with:
# - Key concepts extracted by Claude
# - Relevance scores
# - Code examples (if any)
# - Extraction method: "claude-driven"
```

## Step 4: Ingest More Documentation

For multiple pages, use the batch script:

```bash
# Make executable
chmod +x examples/ingest-batch.sh

# Run batch ingestion
./examples/ingest-batch.sh

# This will process 6 key documentation pages
# Check progress in claude-outputs/ingestion-log.txt
```

## What Just Happened?

1. **Claude Read the Docs** - Using its natural language understanding
2. **Extracted Structure** - Sections, code examples, key concepts
3. **Generated Embeddings** - For semantic search capability
4. **Stored in Qdrant** - Ready for fast retrieval

## Next Steps

- **Add More Pages**: Use `./examples/ingest-single.sh <url>`
- **Customize Prompts**: Edit `examples/prompts/overview-prompt.txt`
- **Use with Claude Code**: `claude "search for X" --mcp-server ./build/index.js`
- **Monitor Quality**: Check `claude-outputs/` for Claude's extractions

## Troubleshooting

### "Claude command not found"
Make sure Claude Code is installed and in your PATH.

### "Invalid JSON output"
- Check `claude-outputs/` for the raw output
- Ensure you asked for "JSON only" in the prompt
- Try a simpler page first

### "No embeddings generated"
- Verify Ollama is running: `ollama list`
- Check Qdrant is up: `curl http://localhost:6333/health`

## Tips

- **Be Patient**: Claude takes a few seconds to read each page
- **Check Quality**: Review JSON files in `claude-outputs/`
- **Iterate**: Improve prompts based on what Claude extracts

Congratulations! You've successfully ingested documentation using Claude's intelligence instead of traditional scraping. 🎉