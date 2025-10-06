# Manifest System

Complete guide to the two-tier manifest system that tracks documentation ingestion state and enables multi-source synchronization.

## What Are Manifests?

**Manifests are JSON files that track the state of documentation ingestion.**

Think of them as a database for the ingestion pipeline:

- Which URLs have been processed
- What stage each URL reached (fetched, extracted, embedded)
- When each URL was last updated
- Metadata about each document (sections, code examples, etc.)

**Why they exist**:

1. **Resume on failure** - Restart from last successful stage
2. **Avoid duplicate work** - Don't re-process unchanged content
3. **Track freshness** - Know which docs are stale (>7 days old)
4. **Multi-source support** - Manage multiple documentation sites
5. **Audit trail** - See what was ingested and when

## Two-Tier Architecture

The system uses **two levels of manifests** for scalability and organization.

### Overview

```
.data/
├── manifest.json                      # Master Manifest (all sources)
├── docs.claude.com/
│   ├── manifest.json                  # Domain Manifest
│   ├── cache/                         # HTML cache
│   └── structured/                    # Extracted JSON
├── docs.expo.dev/
│   ├── manifest.json                  # Domain Manifest
│   ├── cache/
│   └── structured/
└── react.dev/
    ├── manifest.json                  # Domain Manifest
    ├── cache/
    └── structured/
```

### Master Manifest (`.data/manifest.json`)

```json
{
  "version": "1.0",
  "sources": {
    "docs.claude.com": {
      "type": "claude-code-docs",
      "addedAt": "2025-01-15T10:00:00Z",
      "lastSyncedAt": "2025-01-16T14:00:00Z",
      "urlCount": 10,
      "status": "active"
    },
    "docs.expo.dev": {
      "type": "documentation",
      "addedAt": "2025-10-03T12:00:00Z",
      "lastSyncedAt": "2025-10-03T12:00:00Z",
      "urlCount": 1,
      "status": "active"
    }
  }
}
```

### Domain Manifest (`.data/{domain}/manifest.json`)

```json
{
  "version": "2.0",
  "domain": "docs.claude.com",
  "createdAt": "2025-01-15T10:00:00Z",
  "lastUpdatedAt": "2025-01-16T14:00:00Z",
  "defaultTTLDays": 7,
  "records": {
    "https://docs.claude.com/en/docs/claude-code/hooks": {
      "url": "https://docs.claude.com/en/docs/claude-code/hooks",
      "status": "embedded",

      // Timestamps
      "lastFetchedAt": "2025-01-15T10:30:00Z",
      "lastExtractedAt": "2025-01-15T10:31:45Z",
      "lastEmbeddedAt": "2025-01-15T10:32:30Z",
      "lastIngestedAt": "2025-01-15T10:32:30Z",
      "lastCheckedAt": "2025-01-16T14:00:00Z",

      // File Sizes (bytes)
      "htmlCacheSize": 205012,           // Body-only HTML cache file size
      "structuredJsonSize": 43928,       // Extracted JSON file size

      // Duration Metrics (milliseconds)
      "fetchDurationMs": 254,            // Fetch stage duration
      "extractDurationMs": 85205,        // Claude extraction duration
      "embedDurationMs": 818,            // Embedding generation duration
      "totalDurationMs": 86277,          // Total pipeline duration (sum of above)

      // Metadata
      "extractionModel": "claude-sonnet-4-5-20250929",
      "embeddingProvider": "ollama",
      "sectionCount": 30,
      "codeExampleCount": 14,

      // Deprecated (kept for backward compatibility)
      "outputSize": 43928,               // @deprecated Use structuredJsonSize
      "rawResponseSize": 43928           // @deprecated Use structuredJsonSize
    }
  }
}
```

## Manifest Record Fields

Each URL in the domain manifest tracks comprehensive metadata about its ingestion state.

### Timestamps
- `lastFetchedAt`: When HTML was last downloaded and cached
- `lastExtractedAt`: When Claude last extracted structured data
- `lastEmbeddedAt`: When embeddings were last generated
- `lastIngestedAt`: When the full pipeline last completed
- `lastCheckedAt`: When content was last checked for changes (even if unchanged)

### File Sizes (bytes)
- `htmlCacheSize`: Size of body-only HTML cache file (after removing `<head>`, navigation, sidebars, etc.)
- `structuredJsonSize`: Size of extracted JSON file containing sections and code examples

### Duration Metrics (milliseconds)
- `fetchDurationMs`: Time to fetch HTML and save to cache
- `extractDurationMs`: Time for Claude to extract structured data (typically 60-120s)
- `embedDurationMs`: Time to generate embeddings and upsert to Qdrant (typically <1s)
- `totalDurationMs`: Sum of all stage durations (fetch + extract + embed)

**Performance insights**:
- Fetch: <500ms (network dependent)
- Extract: 60-120s (Claude API call, varies by page complexity)
- Embed: <1s (local Ollama or OpenAI API)

### Metadata
- `extractionModel`: Claude model used for extraction (e.g., `claude-sonnet-4-5-20250929`)
- `embeddingProvider`: Embedding provider (`ollama` or `openai`)
- `sectionCount`: Number of documentation sections extracted
- `codeExampleCount`: Number of code examples found

### Deprecated Fields
- `outputSize`: Alias for `structuredJsonSize` (kept for backward compatibility)
- `rawResponseSize`: Alias for `structuredJsonSize` (kept for backward compatibility)

These fields are maintained for existing manifests but should not be used in new code.

## Status Lifecycle

Documents progress through a **linear status progression** as they move through the pipeline.

### Status Flow

```
[New URL]
    ↓
fetched        (HTML cached)
    ↓
extracted      (Claude extracted JSON)
    ↓
structured     (JSON validated - currently same as extracted)
    ↓
embedded       (Vector embeddings stored in Qdrant) ✅
    ↓
[Searchable]
```

**Status meanings**:

| Status    | Means                    | Next Step                  |
| --------- | ------------------------ | -------------------------- |
| fetched   | HTML cached              | Extract with Claude        |
| extracted | JSON created             | Generate embeddings        |
| embedded  | In Qdrant, searchable ✅ | Done!                      |
| failed    | Error occurred           | Retry from last good state |
| unchanged | Content identical        | Skip (keep current status) |

## Key Concepts

- **TTL**: 7 days (re-sync if older based on `lastIngestedAt`)
- **Auto-registration**: Domains register in master manifest on first successful embed
- **Resume**: Pipeline continues from last successful stage (no re-work)
- **Content Hash**: Skip unchanged content even if TTL expired
- **Discovery**: `sync` automatically finds all domains with manifests

## Commands & Manifests

| Command | Reads | Writes | Purpose              |
| ------- | ----- | ------ | -------------------- |
| seed    | ✓     | ✓      | Bootstrap core docs  |
| sync    | ✓     | ✓      | Update stale content |
| status  | ✓     | -      | Check URL state      |

## Related Documentation

- [Architecture Overview](./architecture.md) - High-level Overview
- [Pipeline Stages](./pipeline.md) - How stages update manifests
- [CLI Guide](./how-to-use-the-cli.md#manifest-system) - Commands that use manifests
