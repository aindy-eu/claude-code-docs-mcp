# CLI Command Reference

Complete guide to all CLI commands for managing documentation ingestion and search.

## Primary Commands

### `seed` - Bootstrap Knowledge Base

**Purpose**: First-time setup, ingest core or all documentation pages.

```bash
npm run seed                              # Core pages (5 docs, ~2 min)
npm run seed:all                          # All configured pages (~10 min)
npm run seed:dev                          # Dev mode (minimal prompts, faster)
npm run seed -- --provider openai --dev   # Custom: OpenAI + dev mode
```

**Options**:

- `--all` - Seed all configured pages (not just core)
- `--model <model>` - Claude model, default: `claude-sonnet-4-5-20250929`
- `--provider <provider>` - `ollama` or `openai`, default: `ollama`
- `--dev` - Use minimal dev prompt for faster testing

**What it does**:

- Checks if database is already seeded
- If seeded: skips or prompts to re-seed
- If not seeded: ingests core pages by default
- Core pages: overview, quick start, slash commands, hooks, settings

---

### `sync` - Update Stale Documentation

**Purpose**: Update documentation older than 7 days (TTL-based).

```bash
npm run sync                                      # Update all stale docs (>7 days)
npm run sync:check                                # Preview what would update
npm run cli -- sync --source docs.claude.com      # Sync specific domain
npm run cli -- sync --type documentation          # Sync by type
```

**Options**:

- `--check` - Preview mode (shows what would update, no changes)
- `--source <domain>` - Sync specific domain (e.g., `docs.claude.com`)
- `--all` - Explicitly sync all sources (default behavior)
- `--type <type>` - Sync sources of specific type (e.g., `documentation`)
- `--model <model>` - Claude model, default: `claude-sonnet-4-5-20250929`
- `--provider <provider>` - `ollama` or `openai`, default: `ollama`
- `--dev` - Use minimal dev prompt

**Multi-Source Support**:

- Automatically discovers ALL domains from `.data/` directory
- Syncs across Claude docs, Expo, React, any ingested sources
- Filter by domain or type for targeted updates
- Content change detection skips unchanged docs (even if stale)

---

### `search` - Query Knowledge Base

**Purpose**: Semantic search across ALL ingested documentation.

```bash
npm run search "your query"
npm run search "slash commands" -- --limit 5   # More results
npm run search "mcp" -- --provider openai      # Different embeddings
```

**Options**:

- `--provider <provider>` - `ollama`, `openai`, or `both`, default: `ollama`
- `--limit <number>` - Number of results (1-10), default: `3`

**Cross-Source Search**:

- Searches ALL ingested documentation sources simultaneously
- Returns relevant content from Claude docs, Expo, React, etc.
- Semantic understanding across different frameworks

---

### `sources` - List Documentation Sources

**Purpose**: View all registered documentation sources and their status.

```bash
npm run sources  # Show all registered sources
```

**Output Example**:

```
📚 Documentation Sources

claude-code-docs:
  ✓ docs.claude.com (10 pages, last sync: 1/16/2025)

documentation:
  ✓ docs.expo.dev (1 pages, last sync: 10/3/2025)
  ✓ react.dev (45 pages, last sync: 10/2/2025)

Total: 3 sources
```

**What it shows**:

- Source type (claude-code-docs, documentation, etc.)
- Domain name
- Page count
- Last sync timestamp
- Status (active/inactive)

---

## Pipeline Commands

### `ingest` - Full Pipeline for Single URL

**Purpose**: Process any documentation URL through full pipeline.

```bash
npm run cli:ingest -- <url>
```

**Options**:

- `--force` - Force re-extraction even if cached
- `--model <model>` - Claude model, default: `claude-sonnet-4-5-20250929`
- `--provider <provider>` - `ollama` or `openai`, default: `ollama`
- `--quiet` - Suppress info messages
- `--dev` - Use minimal dev prompt for faster testing

**Example**:

```bash
# Basic ingestion
npm run cli:ingest -- https://docs.expo.dev/router/introduction/

# With options
npm run cli:ingest -- https://react.dev/learn --provider openai --dev

# Force re-process
npm run cli:ingest -- https://docs.claude.com/hooks --force
```

**Pipeline Flow**:

1. Fetch HTML
2. Extract with Claude
3. Generate embeddings
4. Store in Qdrant

**Auto-Registration**: URL's domain automatically registered in master manifest (see [Manifest System](./manifest-system.md)).

---

### Pipeline Stages (Advanced)

Run individual pipeline stages for debugging. See [Pipeline Documentation](./pipeline.md) for architecture details.

```bash
# Stage 1: Fetch HTML
npm run cli:fetch -- <url>
npm run cli:fetch -- <url> --force  # Force re-fetch

# Stage 2: Extract with Claude
npm run cli:extract -- <url>
npm run cli:extract -- <url> --model claude-sonnet-4-5-20250929
npm run cli:extract -- <url> --dev  # Minimal prompt

# Stage 3: Generate Embeddings
npm run cli:embed -- <url>
npm run cli:embed -- <url> --provider openai
```

**Common Options**:
- `--force` - Skip cache, force re-processing
- `--model <model>` - Claude model for extraction
- `--provider <provider>` - Embedding provider (`ollama`/`openai`)
- `--dev` - Use minimal dev prompt for testing

---

### Check Document Status

**Purpose**: View ingestion status for a specific URL.

```bash
npm run cli:status -- <url>
```

**Output Example**:

```
Manifest Record:
──────────────────────────────────────────────────
URL: https://docs.claude.com/en/docs/claude-code/hooks
Status: embedded
Fetched: 2025-09-30T15:16:43Z
Extracted: 2025-09-30T16:08:30Z
Embedded: 2025-09-30T16:10:15Z
Model: claude-sonnet-4-5-20250929
Provider: ollama
Sections: 30
Examples: 14
──────────────────────────────────────────────────
```

---

### List All Documents

**Purpose**: Show all ingested documents and their status.

```bash
npm run cli:list
```

**Output Example**:

```
Ingested Documentation:
────────────────────────────────────────────────────────────────────────────────
embedded /en/docs/claude-code/overview (claude-sonnet-4-5-20250929)
embedded /en/docs/claude-code/quickstart (claude-sonnet-4-5-20250929)
structured /en/docs/claude-code/settings (claude-sonnet-4-5-20250929)
embedded /en/docs/claude-code/hooks (claude-sonnet-4-5-20250929)
fetched /test
────────────────────────────────────────────────────────────────────────────────
Total: 5 documents
```

**Status Colors**:

- `fetched` - Yellow (HTML cached)
- `extracted`/`structured` - Blue (JSON extracted)
- `embedded` - Green (Ready for search)
- `failed` - Red (Error occurred)

---

## Command Reference Table

| Command   | Description                | Required Args | Options                                                           |
| --------- | -------------------------- | ------------- | ----------------------------------------------------------------- |
| `seed`    | Bootstrap knowledge base   | None          | `--all`, `--model`, `--provider`, `--dev`                         |
| `sync`    | Update stale docs          | None          | `--check`, `--source`, `--type`, `--model`, `--provider`, `--dev` |
| `search`  | Query documentation        | `<query>`     | `--provider`, `--limit`                                           |
| `sources` | List documentation sources | None          | None                                                              |
| `ingest`  | Full pipeline for URL      | `<url>`       | `--force`, `--model`, `--provider`, `--quiet`, `--dev`            |
| `fetch`   | Download HTML              | `<url>`       | `--force`                                                         |
| `extract` | Extract with Claude        | `<url>`       | `--model`, `--force`, `--dev`                                     |
| `embed`   | Generate embeddings        | `<url>`       | `--provider`                                                      |
| `status`  | Show manifest record       | `<url>`       | None                                                              |
| `list`    | Show all documents         | None          | None                                                              |

---

## Command Structure

```
Primary (everyday use):
├── seed     → Bootstrap with core/all pages
├── sync     → Update stale docs (multi-source)
├── search   → Query all sources
└── sources  → List registered sources

Pipeline (advanced/debugging):
└── cli:
    ├── ingest  → Process single URL (any documentation)
    ├── fetch   → Stage 1: Download HTML
    ├── extract → Stage 2: Claude extraction
    ├── embed   → Stage 3: Generate embeddings
    ├── status  → Check URL state
    └── list    → Show all documents
```

---

## Common Workflows

### Initial Setup

```bash
# 1. Start external services
docker run -p 6333:6333 qdrant/qdrant  # Qdrant
ollama serve                           # Ollama

# 2. Bootstrap knowledge base
npm run seed

# 3. Verify it works
npm run search "slash commands"
```

### Add New Documentation Source

```bash
# Ingest any documentation URL
npm run cli:ingest -- https://docs.expo.dev/router/introduction/

# Verify auto-registration
npm run sources

# Search across all sources
npm run search "expo router navigation"
```

**What happens**:

1. URL ingested through full pipeline
2. Domain auto-registered in master manifest (`.data/manifest.json`)
3. Tracked for future sync operations
4. Immediately searchable

See [Manifest System](./manifest-system.md) for auto-registration details.

### Weekly Maintenance

```bash
# Check all sources
npm run sources

# Preview what's stale (>7 days)
npm run sync:check

# Update all stale docs
npm run sync
```

**Target specific sources**:

```bash
npm run sync -- --source docs.expo.dev     # Just Expo docs
npm run sync -- --type documentation       # All documentation type
```

### Debug Failed Ingestion

```bash
# Check where it failed
npm run cli:status -- <url>

# Retry with force
npm run cli:ingest -- <url> --force

# Try different model
npm run cli:ingest -- <url> --model claude-opus
```

---

## Options Reference

### Model Selection

```
--model <name>
```

**Default**: `claude-sonnet-4-5-20250929`

**Example models**:

- `claude-sonnet-4-5-20250929` (default)
- `claude-opus` (higher quality, slower)

Used in: `seed`, `sync`, `ingest`, `extract`

### Embedding Provider

```
--provider <name>
```

**Options**: `ollama`, `openai`, `both`
**Default**: `ollama`

**Ollama** (local):

- Free, 768 dimensions
- Model: `nomic-embed-text`
- Endpoint: `localhost:11434`

**OpenAI** (cloud):

- Paid, 1536 dimensions
- Model: `text-embedding-ada-002`
- Requires: `OPENAI_API_KEY`

Used in: `seed`, `sync`, `search`, `ingest`, `embed`

### Other Flags

- `--force` - Re-process even if cached
- `--dev` - Use minimal prompts (faster testing)
- `--all` - Process all pages (seed) or all sources (sync)
- `--check` - Preview mode (sync only)
- `--quiet` - Suppress info messages (ingest only)
- `--limit <n>` - Result count (search only, 1-10)
- `--source <domain>` - Filter by domain (sync only)
- `--type <type>` - Filter by source type (sync only)

## Related Documentation

- [Pipeline Stages](./pipeline.md) - How the ingestion pipeline works
- [Manifest System](./manifest-system.md) - How state tracking and TTL works
- [Architecture Overview](./architecture.md) - System design
- [MCP Server Guide](./mcp-server.md) - MCP integration

