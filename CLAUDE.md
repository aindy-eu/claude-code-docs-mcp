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
Claude reads → JSON output → Clean if needed → Process → Embed → Store in Qdrant → Track ingestion
```
Each step serves a purpose - never skip or combine them.

## Critical Patterns

### Architectural Rules
- **JSON**: Always clean Claude's output before processing (may have markdown wrappers)
- **Errors**: Never let one failure stop batch processing
- **Tracking**: 7-day TTL prevents unnecessary API calls
- **Metadata**: Rich metadata is our competitive advantage - preserve it

## Command Usage Guidelines

### Destructive Operations - Always Ask First
Even though these commands are allowed, **ALWAYS** ask the user before executing:

1. **File Deletion (`rm`)**
   - Explain what will be deleted and why
   - Show the exact command you'll run
   - Wait for explicit confirmation
   - Example: "I need to clean up temporary files: `rm check-single-ingestion-temp.js`. May I proceed?"

2. **Permission Changes (`chmod +x`)**
   - Explain why the file needs to be executable
   - Show which file permissions will change
   - Wait for confirmation
   - Example: "The script needs execute permissions: `chmod +x tools/ingest`. OK to proceed?"

3. **File Overwrites**
   - When using `>` redirection that overwrites files
   - When using `mv` that replaces existing files
   - Always mention what will be overwritten

### Safe by Default
- Prefer non-destructive alternatives when possible
- Use `mv` to backup before deleting
- Show file contents before removing
- Batch similar operations for single approval

## Development Guidelines

### Testing Order
1. Process example first: `npm run process-claude docs/ingestion/claude-output-example.json`
2. Verify search works before real ingestion

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

### Testing (Vitest)
```bash
# Run all tests in watch mode (development)
npm test

# Run tests once and exit (CI/production)
npm run test:ci

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only

# Interactive UI for test debugging
npm run test:ui
```

### Code Quality & Linting
```bash
# IMPORTANT: Always run before committing!
npm run lint         # Check for linting issues (ESLint + Prettier)
npm run lint:fix     # Auto-fix linting issues

# Format code separately
npm run format       # Format all code with Prettier
npm run format:check # Check if formatting is correct

# Build TypeScript
npm run build        # Compile TypeScript and check types
```

## Quality Checklist Before Committing

Always run these commands before marking any task complete:

1. `npm run lint:fix` - Fix all linting/formatting issues
2. `npm run build` - Ensure TypeScript compiles
3. `npm run test:unit` - Run unit tests quickly
4. `npm test` (then press 'q') - Verify all tests pass

If any command fails, fix the issues before proceeding.

**Note**: Tests are now using Vitest (not Jest). Key differences:
- `vi` instead of `jest` for mocking
- Tests run much faster (~1.3s vs ~2s)
- Watch mode is default for `npm test`
- Use `npm run test:ci` for one-time runs in CI

## Future-Proof Decisions

These aspects are intentionally designed to remain stable:
- TypeScript with ES modules (modern standard)
- Qdrant for vector storage (best-in-class for this use case)
- MCP protocol for Claude integration
- JSON as intermediate format (universal, debuggable)

---

**Remember**: This project's innovation is using Claude's intelligence to understand documentation. Every decision should support and enhance this core value proposition.