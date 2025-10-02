# TypeScript CLI Usage Guide

## Overview

The TypeScript CLI provides a modern, type-safe interface for managing the documentation ingestion pipeline. It replaces the previous bash script approach with a hybrid TypeScript + Python architecture.

## Architecture

```
┌─────────────────────────────────────┐
│   TypeScript CLI (Commander)        │
│   - Argument parsing                │
│   - Progress indicators (ora)       │
│   - Colored output (chalk)          │
│   - Pipeline orchestration          │
└──────────────┬──────────────────────┘
               │
               ├─→ Bash Scripts (Legacy - Phase 1)
               │   - tools/fetch
               │   - tools/extract
               │   - tools/embed
               │
               └─→ Python (Future - Phase 2+)
                   - tools/extract.py
                   - Clean Claude CLI calls
                   - JSON validation
```

## Installation

Dependencies are already installed:

```bash
npm install commander chalk ora  # Already done
```

## Available Commands

### Help

```bash
# View all commands
npm run cli:help

# Or with --
npm run cli -- --help

# Help for specific command
npm run cli -- ingest --help
```

### List All Documents

```bash
npm run cli:list

# Or
npm run cli -- list
```

**Output:**

```
Ingested Documentation:
────────────────────────────────────────────────────────────────────────────────
fetched /test
embedded /en/docs/claude-code/overview
structured /en/docs/claude-code/quickstart (unknown)
structured /en/docs/claude-code/settings (unknown)
structured /en/docs/claude-code/hooks (claude-sonnet-4-5-20250929)
────────────────────────────────────────────────────────────────────────────────
Total: 5 documents
```

### Check Document Status

```bash
npm run cli -- status <url>

# Example
npm run cli -- status https://docs.claude.com/en/docs/claude-code/hooks
```

**Output:**

```
Manifest Record:
──────────────────────────────────────────────────
URL: https://docs.claude.com/en/docs/claude-code/hooks
Status: structured
Fetched: 2025-09-30T15:16:43Z
Extracted: 2025-09-30T16:08:30Z
Model: claude-sonnet-4-5-20250929
Sections: 30
Examples: 14
──────────────────────────────────────────────────
```

### Fetch HTML Content

Download and cache clean HTML content:

```bash
npm run cli -- fetch <url>

# Example
npm run cli -- fetch https://docs.claude.com/en/docs/claude-code/overview
```

### Extract with Claude

Extract structured data using Claude CLI:

```bash
npm run cli -- extract <url> [options]

# Options:
#   --model <model>  Claude model (default: claude-sonnet-4-5-20250929)
#   --force          Force re-extraction even if cached

# Examples
npm run cli -- extract https://docs.claude.com/en/docs/claude-code/hooks
npm run cli -- extract https://docs.claude.com/test --model opus --force
```

### Generate Embeddings

Create embeddings and store in Qdrant:

```bash
npm run cli -- embed <url> [options]

# Options:
#   --provider <provider>  ollama or openai (default: ollama)

# Examples
npm run cli -- embed https://docs.claude.com/en/docs/claude-code/hooks
npm run cli -- embed https://docs.claude.com/test --provider openai
```

### Full Ingestion Pipeline

Run the complete pipeline (fetch → extract → embed):

```bash
npm run cli -- ingest <url> [options]

# Options:
#   --force              Force re-extraction even if cached
#   --model <model>      Claude model (default: claude-sonnet-4-5-20250929)
#   --provider <provider> ollama or openai (default: ollama)
#   --quiet              Suppress info messages

# Examples
npm run cli -- ingest https://docs.claude.com/en/docs/claude-code/hooks
npm run cli -- ingest https://docs.claude.com/test --force --model opus
npm run cli -- ingest https://docs.claude.com/test --provider openai --quiet
```

## Command Reference

| Command         | Description                  | Options                                       |
| --------------- | ---------------------------- | --------------------------------------------- |
| `list`          | Show all ingested documents  | None                                          |
| `status <url>`  | Show manifest record details | None                                          |
| `fetch <url>`   | Download and cache HTML      | None                                          |
| `extract <url>` | Extract structured data      | `--model`, `--force`                          |
| `embed <url>`   | Generate embeddings          | `--provider`                                  |
| `ingest <url>`  | Full pipeline                | `--force`, `--model`, `--provider`, `--quiet` |

## Common Workflows

### Ingest a New Document

```bash
npm run cli -- ingest https://docs.claude.com/en/docs/new-feature
```

### Re-extract with Different Model

```bash
npm run cli -- extract https://docs.claude.com/test --force --model opus
```

### Check What's Been Ingested

```bash
npm run cli:list
```

### Verify Ingestion Status

```bash
npm run cli -- status https://docs.claude.com/en/docs/claude-code/hooks
```

### Batch Ingestion (Manual)

```bash
# Ingest multiple URLs
npm run cli -- ingest https://docs.claude.com/en/docs/feature-1
npm run cli -- ingest https://docs.claude.com/en/docs/feature-2
npm run cli -- ingest https://docs.claude.com/en/docs/feature-3
```

## Status Colors

The CLI uses colored output for better visibility:

- 🟡 **Yellow** `fetched` - HTML downloaded but not extracted
- 🔵 **Blue** `extracted/structured` - Structured data extracted
- 🟢 **Green** `embedded` - Fully ingested and searchable
- 🔴 **Red** - Errors

## Understanding the Pipeline

### Stage 1: Fetch

- Downloads HTML from the URL
- Cleans and strips unnecessary content
- Caches in `.data/<domain>/cache/`
- Updates manifest status: `fetched`

### Stage 2: Extract

- Calls Claude CLI via Python script
- Extracts structured JSON data (raw output saved to raw-response.txt)
- Validates and cleans JSON (removes markdown wrappers)
- Stores structured data in `.data/<domain>/structured/`
- Updates manifest status: `extracted` → `structured`
- Records extraction model used

### Stage 3: Embed

- Generates embeddings (Ollama or OpenAI)
- Stores vectors in Qdrant
- Updates manifest status: `embedded`
- Records embedding provider used

## Manifest Tracking

Every operation updates the manifest (`.data/docs.claude.com/manifest.json`):

```json
{
  "url": "https://docs.claude.com/en/docs/claude-code/hooks",
  "status": "structured",
  "lastFetchedAt": "2025-09-30T15:16:43Z",
  "lastExtractedAt": "2025-09-30T16:08:30Z",
  "extractionModel": "claude-sonnet-4-5-20250929",
  "outputSize": 43928,
  "sectionCount": 30,
  "codeExampleCount": 14
}
```

## Troubleshooting

### Command Not Found

Make sure you're using `--` to pass arguments:

```bash
# ❌ Wrong
npm run cli --help

# ✅ Right
npm run cli -- --help

# ✅ Or use alias
npm run cli:help
```

### Extraction Fails

If extraction fails, check:

1. Is `claude` CLI installed? (`which claude`)
2. Are you logged in? (`claude` should work in terminal)
3. Is the content cached? (`npm run cli -- fetch <url>` first)

### Python Script Not Found

Make sure the Python script is executable:

```bash
chmod +x tools/extract.py
```

### Empty Response from Claude

This can happen when:

- Running inside Claude Code (CLAUDECODE=1 issue)
- Content is too large
- Network timeout

**Solution:** Run extraction from your terminal, not from within Claude Code.

## Development Tips

### Adding New Commands

Edit `src/cli/index.ts`:

```typescript
program
  .command('mycommand <arg>')
  .description('My new command')
  .option('--flag', 'My flag')
  .action(async (arg, options) => {
    const orchestrator = new PipelineOrchestrator();
    await orchestrator.myMethod(arg, options);
  });
```

### Custom Spinners

Use ora for loading states:

```typescript
const spinner = ora('Processing...').start();
// ... do work
spinner.succeed('Done!');
// or
spinner.fail('Failed!');
```

### Colored Output

Use chalk for emphasis:

```typescript
console.log(chalk.green('✓ Success'));
console.log(chalk.red('✗ Error'));
console.log(chalk.cyan('Info'));
console.log(chalk.yellow('⚠ Warning'));
```

## Migration Status

### Phase 1 ✅ (Complete)

- TypeScript CLI with Commander
- Colored output with Chalk
- Progress indicators with Ora
- Calls existing bash scripts

### Phase 2 (In Progress)

- Migrate manifest management to TypeScript
- Create `ManifestManager` service
- Direct Python extraction calls

### Phase 3 (Future)

- Remove bash script dependencies
- Full TypeScript + Python architecture
- Enhanced error handling
- Batch operations

## Related Documentation

- [Pipeline Stages](./pipeline-stages.md) - Detailed pipeline documentation
- [Pipeline Usage](./pipeline-usage.md) - Original bash script usage
- [Hybrid Architecture Plan](../.claude/plans/hybrid-ts-python-architecture.md) - Migration roadmap

## Contributing

When adding new CLI features:

1. Add the command to `src/cli/index.ts`
2. Implement logic in `src/cli/orchestrator.ts`
3. Update this documentation
4. Add tests if applicable

## Future Enhancements

- [ ] Batch ingestion from file
- [ ] Progress bars for multi-URL operations
- [ ] `--dry-run` flag for preview
- [ ] `--json` flag for machine-readable output
- [ ] Tab completion for commands
- [ ] Configuration file support
