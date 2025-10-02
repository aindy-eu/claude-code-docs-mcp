# Documentation Updates Needed

This file tracks code that needs updating to reflect the current architecture.

## Status: 2025-10-01

### Files Moved to Legacy (Needs Rewrite)

#### `ingestion-status.ts`
**Location:** `legacy/ingestion-status.ts`

**Issues:**
- Uses old `IngestionTracker` → Should use `ManifestManager`
- Looks for `./claude-outputs/ingestion-manifest.json` → Should scan `.data/*/manifest.json`
- References `./tools/batch-ingest` → Should be `npm run cli -- batch`
- References `claude-outputs/ingestion-log.txt` → Should be `.data/{domain}/logs/`

**Current Replacements:**
- `npm run cli -- list` - List all ingested docs
- `npm run cli -- status <url>` - Check specific doc

**Rewrite Goal:**
Create a comprehensive status dashboard that:
- Scans all domains in `.data/`
- Shows aggregate stats across all domains
- Identifies stale docs across all sources
- Suggests batch ingestion commands

**Priority:** Medium (CLI commands work, but nice to have dashboard)

#### `process-claude-output.ts`
**Location:** `legacy/process-claude-output.ts`

**Issues:**
- Uses old `IngestionTracker` → Should use `ManifestManager`
- Designed for manual stdin workflow (old bash system)
- Uses `ClaudeOutputProcessor` service (also legacy)

**Current Replacement:**
- `npm run cli -- ingest <url>` - Handles entire pipeline automatically

**Note:** This was for the old manual workflow where you'd pipe Claude's raw JSON output. The new pipeline handles extraction automatically through `tools/extract.py`.

**Priority:** Low (fully replaced by CLI)

#### `claude-output-processor.ts`
**Location:** `legacy/claude-output-processor.ts`

**Status:** Service only used by `process-claude-output.ts`, no longer needed.

**Priority:** Low (fully replaced)

---

## How to Use This File

1. When finding outdated code during audit, add it here
2. Mark priority: High/Medium/Low
3. Note what it should do instead
4. When fixed, move entry to "Completed" section below

---

## Completed Updates

_(none yet)_
