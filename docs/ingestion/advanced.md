# 🧠 Advanced Techniques

## 1. Contextual Reading

Ask Claude to focus on specific aspects:

```bash
# Load the prompt template and add specific focus
PROMPT=$(cat docs/ingestion/prompts/claude-docs.prompt.md)
claude "$PROMPT

Additionally, focus especially on:
1. How to register tools
2. Error handling patterns
3. Best practices for tool responses

Please read: https://docs.claude.com/en/docs/claude-code/mcp" > mcp-focused.json

# Process the output
npm run process-claude mcp-focused.json
```

## 2. Relationship Extraction

Claude can identify relationships between concepts:

```bash
claude "Read the Claude Code hooks documentation. Extract:
1. All hook types and their relationships
2. Execution order and dependencies
3. Common patterns across different hooks
Output as structured JSON with a 'relationships' field..." > hooks-relationships.json
```

## 3. Progressive Enhancement

Build your knowledge base incrementally:

```bash
# Day 1: Core concepts (already configured in batch-ingest)
./tools/ingest https://docs.claude.com/en/docs/claude-code/overview
./tools/ingest https://docs.claude.com/en/docs/claude-code/quickstart

# Day 2: Advanced features
./tools/ingest https://docs.claude.com/en/docs/claude-code/hooks
./tools/ingest https://docs.claude.com/en/docs/claude-code/slash-commands

# Or just run batch-ingest to get all 10 pages
./tools/batch-ingest
```

## 4. Quality Validation

Have Claude validate the ingested content:

```bash
# After ingestion, check quality
claude "Here's what I extracted from the Claude Code docs: $(cat overview.json)

Please validate:
1. Are all major concepts captured?
2. Are the code examples complete and correct?
3. What might be missing?

Output a quality score and suggestions."
```