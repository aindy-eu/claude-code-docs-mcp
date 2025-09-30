# Documentation Ingestion

Use Claude to read and understand documentation, then store it for semantic search.

## Table of Contents

- [`README.md`](README.md) - This overview (you are here)
- [`prompts/`](prompts/) - Actual prompt templates used by the tools
- [`prompt-engineering.md`](prompt-engineering.md) - How to craft effective prompts
- [`url-configuration.md`](url-configuration.md) - Centralized URL management and automatic migration system 
- [`advanced.md`](advanced.md) - Advanced techniques for contextual reading and validation
- [`troubleshooting.md`](troubleshooting.md) - Common issues and monitoring guidance
- [`claude-output-example.json`](claude-output-example.json) - Example of Claude's output


## Simple Workflow

Claude reads documentation naturally and extracts:

- Content with full context
- Code examples with their purpose
- Relationships between concepts
- Implementation details

Result: Semantic search that understands meaning, not just keywords.

## Quick Start

```bash
# Ingest all configured Claude Code docs (10 pages)
./tools/batch-ingest

# Force re-ingestion (ignore 7-day cache)
./tools/batch-ingest --force

# Ingest a single page (any URL)
./tools/ingest https://docs.claude.com/en/docs/claude-code/overview
```

## How It Works

1. **Claude reads** the documentation URL
2. **Outputs JSON** with structured information
3. **Generate embeddings** (Ollama or OpenAI)
4. **Store in Qdrant** for vector search
5. **Track ingestion** to avoid duplicates (7-day TTL)

## Configuration

```bash
# Environment variables
DEFAULT_EMBEDDING_PROVIDER=ollama  # or openai
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

## Prompts

The `prompts/` folder contains templates for extraction. See [`prompts/claude-docs.prompt.md`](prompts/claude-docs.prompt.md) for the main template.

Key features:

- Extracts explicit and implicit knowledge
- Includes confidence levels
- Preserves all code examples with context

## Output Structure

Claude outputs JSON like this:

```json
{
  "source": "URL",
  "pageTitle": "Title",
  "sections": [{
    "content": "Main text",
    "codeExamples": [...],
    "keyConcepts": [...],
    "confidence": "explicit"
  }]
}
```

## Advanced Usage

### Process existing JSON

```bash
npm run process-claude file.json
```

### Check ingestion status

```bash
npm run ingestion-status
```

Shows:

- Which pages are up to date
- Which need updating (> 7 days old)
- Failed ingestions that need attention
- Overall statistics

#### Skip Fresh Pages

The batch script automatically skips recently ingested pages:

```bash
./tools/batch-ingest
# Output: ⏭️ Skipping (ingested 2 days ago, still fresh)
```

## Creating Custom Prompts

You can create custom prompts for different documentation types:

```bash
# Copy the template
cp docs/ingestion/prompts/claude-docs.prompt.md my-custom.prompt.md
```

## Using Different Embedding Providers

```bash
# Default (Ollama)
npm run process-claude claude-output.json

# Using OpenAI
npm run process-claude claude-output.json --provider openai

# Process and search with specific provider
npm run search "your query" -- --provider openai
```

## Best Practices

1. **Study the example output** - Understand the expected JSON structure
2. **Customize prompts** - Adapt the template for your specific documentation needs
3. **Validate JSON** - Always check that Claude's output is valid JSON
4. **Use structured extraction** - Follow the example's approach to organized data

## See Also

- `tools/` - Operational scripts for ingestion
- `src/config/documentation-urls.ts` - URL configuration
