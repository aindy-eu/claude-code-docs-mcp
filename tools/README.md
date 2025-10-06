# Documentation Tools

Python utilities that support the documentation ingestion pipeline and analysis workflows.

## Extraction Pipeline

### `extract.py` - Documentation Extraction

Entry point the pipeline calls to run a Claude extraction.

**Shared modules in `lib/`:**
- `claude_client.py` cleans the environment and invokes the `claude` CLI.
- `json_utils.py` extracts and validates Claude's JSON response.
- `logger.py` writes JSONL logs to `.data/<domain>/logs/`.

**Note:** HTML cleaning is handled by the TypeScript fetch service (body-only extraction) before files reach the Python extraction script.

## Requirements

- Python 3.9+
- Claude Code CLI available on `PATH`
- Optional: set `DOC_URL` so logs include the source URL

## Usage

### Running `extract.py`

```bash
# From the repository root
DOC_URL="https://docs.example.com/guide" \
python tools/extract.py /tmp/content.html src/prompts/claude-docs.prompt.md claude-sonnet-4
```

**Arguments:**
1. Path to the HTML file to process (body-only content from cache)
2. Path to the extraction prompt file
3. Claude model identifier (e.g. `claude-sonnet-4.1`)

**The script:**
- Ensures the Claude CLI is accessible before running.
- Builds the full prompt (including a pointer to the HTML file) and sends it to
  Claude.
- Parses the response, normalises the JSON, performs structural validation, and
  prints formatted JSON to stdout for the Node pipeline to consume.
- Logs success or failure details under `.data/<domain>/logs/extract.jsonl`.

### Reusing the Helpers

Import from `tools.lib` if you need these utilities elsewhere:

```python
from tools.lib.json_utils import parse_and_validate
```

These utilities behave independently of the Node pipeline, so you can use them in custom Python scripts or experiments.

### Troubleshooting

- **`claude` command not found** – install Claude Code or ensure its CLI is on
  the `PATH` that Python inherits.
- **Empty or invalid JSON** – check Claude's raw output (logged in the
  `.jsonl` file on errors); you may need to tweak the prompt.
- **Permission errors writing logs** – confirm you are running from the
  repository root so the `.data` directory resolves correctly.

---

## Token Counter Utility

### `token_counter.py` - File Token Analysis

Standalone utility to estimate token counts in files and directories.

### Usage

```bash
# Count tokens in a file or directory (read-only)
python3 tools/token_counter.py .claude/scruaim

# Count tokens and add YAML frontmatter to files
python3 tools/token_counter.py .claude/scruaim --add-frontmatter

# Process single directory level (no subdirectories)
python3 tools/token_counter.py docs/ --no-recursive

# Get help
python3 tools/token_counter.py --help
```

### Features

- **Read-only by default** - shows token counts without modifying files
- **Optional frontmatter** - use `--add-frontmatter` to add YAML metadata with token estimates
- **Recursive scanning** - processes subdirectories by default
- **Smart filtering** - skips binary files and common non-text formats

### Output

Without `--add-frontmatter`:
```
- file1.md: 245 tokens
- file2.md: 892 tokens

📊 Summary:
   Processed files: 2
   Total tokens: 1,137
```

With `--add-frontmatter`:
```
✅ file1.md: 245 tokens (frontmatter added)
✅ file2.md: 892 tokens (frontmatter updated)
```

