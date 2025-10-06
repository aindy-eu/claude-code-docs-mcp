# AI Handover System - Claude Code Documentation MCP

## Purpose

This system preserves **institutional knowledge** across AI context resets and team transitions for the Claude Code Documentation MCP server project. When context windows fill or work pauses, handovers capture the reasoning and discoveries that would otherwise be lost.

## Project Context

**Project Type**: Node.js/TypeScript MCP Server
**Core Innovation**: Using Claude's natural language understanding to read documentation instead of traditional parsing
**Key Technologies**:
- Model Context Protocol (MCP) SDK
- Qdrant vector database
- Hybrid embeddings (Ollama/OpenAI)
- TypeScript with ES modules

## When to Create Handovers

### Create a handover when:
- **Context is scarce** (< 15% remaining) but work continues
- **Significant discoveries** about MCP protocol or embedding strategies
- **Complex decisions** about ingestion pipeline or vector storage
- **Work will pause** on documentation source integration
- **Dead ends explored** in parsing approaches or embedding providers

### Skip handovers when:
- Simple bug fixes in existing code
- Routine documentation updates
- Straightforward test additions

## Handover Template

Create handovers as: `YYYYMMDD-descriptive-topic.md`

```markdown
# Handover: [Topic/Feature] - [Date]

## Context & Goals
- **What we were working on**: [Main objective]
- **Why this matters**: [Business/technical reason]
- **Key constraints**: [Limitations, requirements]
- **Success criteria**: [How we know it's done]

## Key Decisions Made
- **[Decision]**: [What was chosen] because [reasoning]. Rejected [alternative] due to [reason].

## Discoveries & Insights
- **Pattern found**: [What you discovered and why it matters]
- **Performance insight**: [Metric before] → [after] via [approach]
- **Gotcha encountered**: [Trap that wasn't obvious]

## Current State
- **Completed**:
  - [What's fully done]
- **In Progress**:
  - [Current work and its state]
- **Not Started**:
  - [Planned but not begun]

## Next Steps (Priority Order)
1. **Immediate**: [Most urgent/important]
2. **Next**: [Following priority]
3. **Future**: [Nice to have/consider later]

## What Files Don't Show
- **Why approaches were chosen**: [Reasoning not in code]
- **Business context**: [User feedback, requirements]
- **Failed attempts**: [What didn't work and why]

## MCP Server Specific Context
- **Ingestion Pipeline State**: [Current flow and modifications]
- **Embedding Provider Insights**: [Ollama vs OpenAI discoveries]
- **Vector Storage Patterns**: [Qdrant optimization findings]
- **Claude Integration**: [Prompt engineering insights]

## For Next AI/Human
- **Start here**: [Specific file or entry point]
- **Key context**: [Essential knowledge for continuation]
- **Watch out for**: [Traps or gotchas to avoid]
```

## MCP Server Specific Sections

### Ingestion Pipeline Decisions
- Claude prompt optimization discoveries
- JSON cleaning requirements (markdown wrappers)
- Batch processing error handling patterns
- Rate limiting strategies

### Embedding System Insights
- Ollama vs OpenAI performance comparisons
- Dimension differences (1536 vs 4096)
- Provider failover strategies
- Cost/performance tradeoffs

### Vector Storage Optimizations
- Qdrant collection configuration
- Metadata schema evolution
- Search relevance tuning
- Index optimization findings

### MCP Protocol Patterns
- Tool registration approaches
- StdioServerTransport gotchas
- Response format requirements
- Error handling in tool implementations

## Quality Guidelines

### Good Handovers for This Project Include:
- **Ingestion strategy reasoning** - Why Claude over parsing
- **Embedding provider comparisons** - Performance/cost data
- **Search accuracy improvements** - What queries improved
- **MCP protocol discoveries** - Non-obvious requirements

### Good Handovers Exclude:
- **TypeScript syntax issues** - Code review handles this
- **Obvious dependency updates** - Package.json shows this
- **Personal preferences** - Stick to measurable impacts
- **Chat transcripts** - Focus on knowledge extracted

## Examples from This Project

### Ingestion Decision
```markdown
## Key Decisions Made
- **Removed JSDOM for Claude-driven approach**: Claude understands context and relationships that mechanical parsing misses. 3x performance improvement with richer metadata.
```

### Embedding Discovery
```markdown
## Discoveries & Insights
- **Ollama nomic-embed-text optimal for privacy**: Local processing, 4096 dimensions captures more nuance. OpenAI faster but requires API calls.
```

### Failed Attempt Documentation
```markdown
## What Files Don't Show
- **Attempted cheerio for HTML parsing**: Too brittle with documentation site variations. Claude handles format changes gracefully.
```

## Recovery Integration

When starting fresh with a handover:

1. **Read handover first** - Understand the journey
2. **Check CLAUDE.md** - Project-specific rules
3. **Review .scruaim/backlog/** - Current priorities
4. **Note ingestion tracker** - Avoid reprocessing

## Privacy & Storage

Handovers are:
- **Stored in**: `.claude/handovers/`
- **Gitignored**: `*.md` files kept local, only README tracked
- **Honest**: Private storage enables frank documentation
- **Project-specific**: Focus on MCP server challenges

## Recent Handovers

| Date | File | Key Achievement |
|------|------|-----------------|
| 2025-10-02 | [20251002-security-code-quality-fixes.md](20251002-security-code-quality-fixes.md) | Fixed critical command injection + eliminated 198 console warnings |
| 2025-09-30 | [cache-pipeline-implementation.md](cache-pipeline-implementation.md) | 10x performance with three-stage pipeline |
| 2025-09-30 | [20250930-cache-pipeline-domain-refactor.md](20250930-cache-pipeline-domain-refactor.md) | Domain-based namespacing for universal docs |

## Maintenance

- **Archive old handovers** to `archive/` after 3 months
- **Extract patterns** to CLAUDE.md when proven
- **Update sections** based on project evolution

## Critical Project Knowledge

### Always Remember:
1. **Claude-driven philosophy** - AI understanding > mechanical parsing
2. **Hybrid embeddings** - Support both Ollama AND OpenAI
3. **Processing pipeline** - Claude → JSON → Clean → Process → Embed → Store → Track
4. **Ingestion tracking** - 7-day TTL prevents reprocessing
5. **Rich metadata** - Our competitive advantage

### Common Pitfalls:
- Don't reintroduce web scraping
- Always clean Claude's JSON output
- Never hardcode embedding provider
- Preserve metadata throughout pipeline

## Getting Started with Handovers

1. **Check date**: `date +%Y%m%d`
2. **Create handover**: `YYYYMMDD-topic.md` in `.ai/handovers/`
3. **Use template above** customized for your work
4. **Focus on insights** not covered by code or docs

---

*The goal: Preserve the "why" behind the Claude Code Documentation MCP server's evolution.*