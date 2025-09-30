# Claude Documentation Ingestion Tools

This directory contains operational scripts for ingesting documentation using Claude Code.

## Scripts

### `ingest` - Single Page Ingestion
Ingest a single documentation page with intelligent tracking and caching.

```bash
# Basic usage
./tools/ingest https://docs.claude.com/en/docs/claude-code/overview

# With custom output name
./tools/ingest https://docs.claude.com/en/docs/claude-code/hooks hooks-docs
```

Features:
- Checks if page was recently ingested (7-day TTL)
- Interactive prompt for re-ingestion
- Automatic JSON cleaning
- Progress indicators
- Immediate embedding generation

### `batch-ingest` - Batch Processing
Process multiple documentation pages efficiently.

```bash
# Normal run (skips fresh pages)
./tools/batch-ingest

# Force re-ingestion of all pages
./tools/batch-ingest --force
```

Features:
- Processes predefined list of pages
- Automatically skips recently ingested pages
- 30-second delay between requests
- Comprehensive logging
- Summary statistics

### `utils/clean-json` - JSON Cleaner
Utility to clean Claude's JSON output when it includes markdown formatting.

```bash
# Clean a specific file
./tools/utils/clean-json input.json output.json
```

Handles:
- Markdown code block wrappers (```json...```)
- Leading/trailing whitespace
- Text before JSON content

## Configuration

### Ingestion Tracking
- Manifest stored in `claude-outputs/ingestion-manifest.json`
- Default TTL: 7 days (configurable)
- Tracks success/failure status
- Prevents unnecessary API calls

### Output Location
All outputs are saved to `./claude-outputs/`:
- JSON files from Claude
- Ingestion manifest
- Processing logs

## Best Practices

1. **Check Status First**: Run `npm run ingestion-status` to see what needs updating
2. **Use Batch for Multiple Pages**: More efficient than running single ingestions
3. **Respect Rate Limits**: Don't remove the delays between requests
4. **Monitor Logs**: Check `claude-outputs/ingestion-log.txt` for issues
5. **Clean Up**: Periodically remove old JSON files you no longer need

## Integration with MCP Server

After ingestion, the documentation is available through the MCP server:

```bash
# Search ingested documentation
npm run search "your query"

# Check ingestion status
npm run ingestion-status
```

## Customization

To add new documentation pages to batch ingestion:
1. Edit `tools/batch-ingest`
2. Add URLs to the `PAGES` array
3. Consider creating custom prompts in `docs/ingestion/prompts/`

## Troubleshooting

**"Ingestion tracking not available"**
- Run `npm run build` first
- Ensure you're in the project root directory

**"Invalid JSON output"**
- The scripts automatically clean JSON
- For manual cleaning: `./tools/utils/clean-json file.json cleaned.json`

**Rate limiting concerns**
- Keep the 30-second delay in batch processing
- Use single ingestion for testing
- Consider spreading large batches over time