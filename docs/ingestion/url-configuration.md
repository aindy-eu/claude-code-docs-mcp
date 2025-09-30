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

### In TypeScript
```typescript
// Instead of hardcoding URLs
import { getDocUrl, getAllDocUrls } from '../config/documentation-urls.js';

const overviewUrl = getDocUrl('overview');
const allUrls = getAllDocUrls();
```

### In Shell Scripts
```bash
# Generate and source configuration
npm run generate-url-config > tools/url-config.sh
source tools/url-config.sh

# Use the URLs
echo "Overview URL: $DOCS_URL_OVERVIEW"
echo "Base URL: $DOCS_BASE_URL"
```

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
npm run migrate-urls [-- --dry-run]  # Migrate manifest URLs
npm run generate-url-config           # Generate shell config
npm run ingestion-status              # Uses config automatically
```

## Available Pages

The system tracks these documentation pages:
- `overview` - Claude Code overview
- `quickstart` - Getting started guide
- `slashCommands` - Slash command reference
- `hooks` - Hooks documentation
- `settings` - Settings configuration
- `mcp` - MCP integration guide
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