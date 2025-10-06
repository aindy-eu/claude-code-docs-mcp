---
token_estimate: 316
updated_at: '2025-10-06 08:59:43'
---
# Claude Code Documentation MCP Server Backlog

> Last updated: 2025-10-05
> Active stories: 6
> WIP Limit: 3

## 🔴 Critical Priority
*None currently*

## 🟠 High Priority

- [ ] US-MULTI-001 - React documentation integration (6-8h)
  - Dependencies: None
  - Blocked by: Nothing
  - Notes: Foundation for universal docs vision, create framework-docs.prompt.md

- [ ] US-PERF-001 - Parallelize embedding generation (2h)
  - Dependencies: None
  - Blocked by: Nothing
  - Notes: 10× speedup potential with Promise.all(), see code/07-performance-scalability.md:372-391

- [ ] US-VERSION-001 - Add version tracking to manifests (8h)
  - Dependencies: None
  - Blocked by: Nothing
  - Notes: Critical for React 18.x vs 17.x, App Router vs Pages Router

## 🟡 Medium Priority

- [ ] US-MULTI-002 - Per-source seed command (3h)
  - Dependencies: US-MULTI-001
  - Blocked by: Need React config first
  - Notes: Enable npm run seed -- --source react

- [ ] US-PERF-002 - Embedding result caching (4h)
  - Dependencies: None
  - Blocked by: Nothing
  - Notes: Reduce redundant API calls by ~30%, 24-hour TTL

- [ ] US-SEARCH-001 - Relevance scoring for multi-source (6h)
  - Dependencies: US-MULTI-001
  - Blocked by: Need 2+ sources to test
  - Notes: Prioritize React results for React queries, domain-aware scoring

## 🟢 Low Priority
*None currently*

---

## Story Template
When adding stories, use this format:
```
- [ ] US-CATEGORY-XXX - Brief description (X hours/days estimate)
  - Dependencies: Other stories or none
  - Blocked by: Any blockers or nothing
  - Notes: Additional context
```

## Categories
- INGEST - Documentation ingestion pipeline
- EMBED - Embedding generation (Ollama/OpenAI)
- SEARCH - Vector search and relevance
- MCP - MCP protocol, tools, resources
- TRACK - Manifest and state tracking
- MULTI - Multi-source documentation
- VERSION - Version awareness tracking
- PERF - Performance optimizations
- CONFIG - Configuration management
- TEST - Testing infrastructure
- DEBUG - Developer debugging tools
- DOC - Project documentation