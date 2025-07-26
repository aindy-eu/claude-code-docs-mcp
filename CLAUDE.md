# Claude Context - Claude Code Documentation MCP Server

## Project Philosophy
This project uses Claude Code to read and understand documentation naturally, extracting deep insights and relationships that traditional parsing cannot achieve. This is the core value proposition.

## Historical Context
- **Origin**: Started as a traditional web scraper with JSDOM
- **Evolution**: Realized Claude could read docs better than any parser
- **Current**: Fully Claude-driven ingestion, scraping code removed
- **Why it matters**: Shows the power of AI understanding vs mechanical extraction

## Architectural Decisions (Stable)

### 1. Claude-Driven Ingestion
- **Always** use Claude Code to read docs naturally
- The human-like understanding extracts implicit knowledge
- Respect rate limits through natural interaction delays

### 2. Hybrid Embedding Architecture
- Support both Ollama (local) and OpenAI embeddings
- Ollama is the default for privacy and cost
- Always maintain fallback capability between providers

### 3. Processing Pipeline
```
Claude reads → JSON output → Clean if needed → Process → Embed → Store in Qdrant
```
Don't skip steps or combine them - each serves a purpose.

## Critical Patterns

### JSON Handling
- Claude often wraps output in ```json``` blocks
- Always clean before processing
- Use the clean-claude-json.sh utility when possible

### Error Handling
- Never let one failed document stop batch processing
- Log errors but continue with remaining documents
- Provide clear feedback about what failed and why

### Search Enhancement
- Always preserve Claude's extracted metadata (key concepts, relationships)
- Display extraction method in results (claude-driven vs traditional)
- Rich metadata improves search quality significantly

## Development Guidelines

### Testing Changes
Before modifying core functionality:
1. Process the example: `npm run process-claude examples/claude-output-example.json`
2. Verify search works: `npm run search "slash commands"`
3. Only then test with real Claude ingestion

### Adding Features
- New features should enhance, not replace, Claude-driven approach
- Maintain backward compatibility with existing stored documents
- Consider both Ollama and OpenAI providers in changes

## Common Pitfalls to Avoid

1. **Don't reintroduce scraping** - We removed it for good reasons
2. **Don't assume JSON is clean** - Always validate and clean Claude's output
3. **Don't hardcode provider choice** - Respect user's embedding provider preference
4. **Don't lose metadata** - Enhanced metadata is what makes this approach superior

## Project-Specific Commands

```bash
# Quick health check
npm test

# Process with specific provider
npm run process-claude file.json -- --provider openai

# Reprocess existing Claude outputs
for f in claude-outputs/*.json; do npm run process-claude "$f"; done
```

## Future-Proof Decisions

These aspects are intentionally designed to remain stable:
- TypeScript with ES modules (modern standard)
- Qdrant for vector storage (best-in-class for this use case)
- MCP protocol for Claude integration
- JSON as intermediate format (universal, debuggable)

---

**Remember**: This project's innovation is using Claude's intelligence to understand documentation. Every decision should support and enhance this core value proposition.