# Claude-Driven Ingestion Examples

This directory contains examples and utilities for ingesting documentation using Claude Code.

## Files

### Scripts
- **`ingest-single.sh`** - Ingest a single documentation page
- **`ingest-batch.sh`** - Process multiple documentation pages in batch
- **`ingest-demo.sh`** - Demo script showing the full workflow

### Templates
- **`prompts/overview-prompt.txt`** - Prompt template for extracting documentation

### Example Output
- **`claude-output-example.json`** - Example of Claude's structured output

## Usage

### Single Page Ingestion

```bash
# Make script executable (first time only)
chmod +x examples/ingest-single.sh

# Ingest a single page
./examples/ingest-single.sh https://docs.anthropic.com/en/docs/claude-code/overview

# Ingest with custom output name
./examples/ingest-single.sh https://docs.anthropic.com/en/docs/claude-code/hooks hooks-docs
```

### Batch Ingestion

```bash
# Make script executable (first time only)
chmod +x examples/ingest-batch.sh

# Run batch ingestion
./examples/ingest-batch.sh
```

The batch script will:
- Create a `claude-outputs/` directory for all JSON files
- Process each page with a 30-second delay between requests
- Log all operations to `claude-outputs/ingestion-log.txt`
- Validate JSON output before processing
- Generate embeddings for each valid document

### Output Organization

All Claude outputs are saved to `./claude-outputs/` to keep your project directory clean:

```
claude-outputs/
├── overview.json
├── quickstart.json
├── slash-commands.json
├── hooks.json
├── settings.json
├── mcp.json
└── ingestion-log.txt
```

## Best Practices

1. **Use the output directory**: Don't save JSON files in random locations
2. **Validate before processing**: Check JSON validity before generating embeddings
3. **Add delays**: Be respectful when processing multiple pages
4. **Check logs**: Review `ingestion-log.txt` for any failed pages
5. **Rerun failures**: Use grep to find failed pages and reprocess them

## Customizing Prompts

You can create custom prompts for different documentation types:

```bash
# Copy and modify the template
cp examples/prompts/overview-prompt.txt examples/prompts/api-reference-prompt.txt

# Edit to focus on API-specific extraction
# Then use with:
claude "$(cat examples/prompts/api-reference-prompt.txt)
Please read: [API doc URL]" > claude-outputs/api-reference.json
```

## Troubleshooting

If ingestion fails:
1. Check if Claude Code is working: `claude --version`
2. Verify JSON output: `jq . claude-outputs/your-file.json`
3. Check the log file: `cat claude-outputs/ingestion-log.txt`
4. Ensure Qdrant and Ollama are running
5. Try with a smaller/simpler page first