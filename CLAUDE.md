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
