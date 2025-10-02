# URL Configuration & Migration System

**Problem**: Documentation URLs change. Previously required updating 44 files manually.
**Solution**: Centralized URL configuration with automatic migration.

## Configuration

```typescript
// src/config/documentation-urls.ts
export const DOCUMENTATION_SOURCES = {
  CLAUDE_CODE: {
    current: "https://docs.claude.com",
    legacy: ["https://docs.anthropic.com"],
    pathPrefix: "/en/docs/claude-code",
    pages: {
      overview: "overview",
      quickstart: "quickstart",
      slashCommands: "slash-commands",
      // ... more pages
    }
  }
}
```

## Usage

### In TypeScript (Primary Method)
```typescript
// Instead of hardcoding URLs
import { getDocUrl, getAllDocUrls, CORE_PAGES } from '../config/documentation-urls.js';

const overviewUrl = getDocUrl('overview');
const allUrls = getAllDocUrls();

// For batch ingestion
const corePages = CORE_PAGES; // ['overview', 'quickstart', 'hooks', 'slashCommands', 'mcp']
```

### CLI Commands
```bash
# Use the TypeScript CLI (recommended)
npm run cli -- batch --core           # Ingest 5 core pages
npm run cli -- batch --pages overview,hooks  # Specific pages
npm run cli -- ingest <url>            # Single page
```

### Legacy Shell Scripts (Archived)
Shell script generation has been replaced by TypeScript CLI. See `legacy/` for archived bash tools.

## Migration

When URLs change:

```bash
# 1. Update src/config/documentation-urls.ts
# 2. Run migration
npm run migrate-urls

# Done. All 44 files updated automatically.
```

## Commands

```bash
# Migration
npm run migrate-urls [-- --dry-run]  # Migrate manifest URLs

# Status & Monitoring
npm run ingestion-status              # Check ingestion state
npm run cli -- list                   # List all ingested docs
npm run cli -- status <url>           # Check specific doc

# Batch Ingestion
npm run cli -- batch --core           # 5 essential pages
npm run cli -- batch                  # All 10 pages
npm run cli -- batch --stale-only     # Only outdated pages
```

## Available Pages

### Core Pages (--core)
These 5 essential pages are recommended for quick seeding (~2.5 minutes):
- `overview` - Claude Code overview
- `quickstart` - Getting started guide
- `hooks` - Hooks documentation
- `slashCommands` - Slash command reference
- `mcp` - MCP integration guide

### Full Page Set (default)
All 10 pages (~5 minutes):
- Core pages above, plus:
- `settings` - Settings configuration
- `memory` - Memory system docs
- `commonWorkflows` - Common workflow examples
- `interactiveMode` - Interactive mode guide
- `cliReference` - CLI reference

## Files

- `src/config/documentation-urls.ts` - Configuration service
- `src/scripts/migrate-manifest-urls.ts` - Migration script
- `tests/unit/url-configuration.test.ts` - 19 tests

## Next Migration

```typescript
// Change this
current: "https://new-docs-domain.com",
legacy: ["https://docs.claude.com", "https://docs.anthropic.com"]

// Run this
npm run migrate-urls
```

That's it. No manual search-replace. No missed files.

## Tips

- **Override base URL**: `DOCS_BASE_URL=https://custom-docs.com npm run build`
- **Restore from backup**: `cp claude-outputs/ingestion-manifest.backup.json claude-outputs/ingestion-manifest.json`