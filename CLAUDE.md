# Claude Context - Claude Code Documentation MCP Server

## Core Philosophy
This project uses Claude Code to read and understand documentation naturally, extracting deep insights and relationships that traditional parsing cannot achieve.

## Destructive Operations - Always Ask First

1. **File Deletion (`rm`)** - Explain what and why, wait for confirmation
2. **Permission Changes (`chmod +x`)** - Show which file, wait for approval

## Quality Workflow

Before marking tasks complete:

```bash
npm run lint:fix  # Auto-fix all issues
npm test          # All tests must pass
npm run build     # TypeScript must compile
```

## Documentation Search 

### Shortcuts
- "Use mcp docs [query]" → Use search_claude_code_docs tool

### MCP Search Best Practices

**Query Quality Matters**: Use specific technical terms, not generic phrases

**Good queries** (high relevance):
- ✅ "MCP scopes project local user" → 83% relevance
- ✅ "slash commands arguments" → Precise, technical
- ✅ "hooks PreToolUse matchers" → Domain-specific terms

**Poor queries** (low relevance):
- ❌ "manual configuration" → Too vague, generic
- ❌ "how to set up" → Matches everything
- ❌ "Claude Desktop config" → Wrong client (use "Claude Code" for CLI)

**Iteration Strategy**:
1. If results < 75% relevance, refine query with technical terms
2. Use official terminology from docs (e.g., "scopes" not "levels")
3. Try multiple search angles before concluding knowledge gap

**Domain-specific keywords**:
- MCP: `scopes`, `.mcp.json`, `stdio`, `SSE`, `HTTP`, `transport`
- Slash commands: `subagent_type`, `prompt`, `description`
- Hooks: `PreToolUse`, `PostToolUse`, `matchers`, `exit codes`
- Settings: `permissions`, `allow`, `deny`, `precedence`