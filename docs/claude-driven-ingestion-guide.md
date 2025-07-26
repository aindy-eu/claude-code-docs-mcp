# Claude-Driven Documentation Ingestion Guide

This guide explains how to use Claude Code itself to read and ingest documentation into your MCP server's knowledge base, replacing traditional web scraping with intelligent, context-aware processing.

## 🌟 Overview

Instead of automated web scraping, we use Claude Code to:
1. Read documentation naturally (its intended purpose)
2. Extract structured information with full context understanding
3. Generate high-quality embeddings for semantic search
4. Respect rate limits and infrastructure naturally

## 🚀 Quick Start

### Step 1: Ask Claude to Read Documentation

Use Claude Code to read a documentation page and output structured JSON:

```bash
claude "Please read the Claude Code overview documentation at https://docs.anthropic.com/en/docs/claude-code/overview and extract structured information. Focus on main concepts, code examples, and best practices. Output as JSON matching this structure:

{
  \"source\": \"URL\",
  \"pageTitle\": \"Main title\",
  \"summary\": \"Brief overview\",
  \"sections\": [{
    \"title\": \"Section name\",
    \"content\": \"Main content\",
    \"codeExamples\": [{
      \"language\": \"typescript\",
      \"code\": \"actual code\",
      \"description\": \"what it shows\"
    }],
    \"keyConcepts\": [\"concept1\", \"concept2\"]
  }]
}

Output only the JSON, no other text." > claude-output.json
```

### Step 2: Process Claude's Output

Feed the JSON output into your processing pipeline:

```bash
npm run process-claude claude-output.json
```

Or pipe it directly:

```bash
claude "Read docs..." | npm run process-claude
```

### Step 3: Search Your Knowledge Base

```bash
npm run search "how do slash commands work"
```

Or use the MCP server:

```bash
claude "search my docs for slash command examples" --mcp-server ./build/index.js
```

## 📋 Detailed Usage

### Using Different Documentation Types

The system includes specialized prompts for different documentation types:

#### Overview/Getting Started Pages
```bash
claude "$(cat src/prompts/overview-prompt.txt) 

Please read: https://docs.anthropic.com/en/docs/claude-code/overview" > overview.json

npm run process-claude overview.json
```

#### Tutorial Pages
```bash
claude "$(cat src/prompts/tutorial-prompt.txt)

Please read: https://docs.anthropic.com/en/docs/claude-code/quickstart" > tutorial.json

npm run process-claude tutorial.json
```

#### API Reference
```bash
claude "$(cat src/prompts/reference-prompt.txt)

Please read: https://docs.anthropic.com/en/docs/claude-code/cli-reference" > reference.json

npm run process-claude reference.json
```

### Batch Processing Multiple Pages

Create a shell script to process multiple documentation pages:

```bash
#!/bin/bash
# ingest-docs.sh

PAGES=(
  "https://docs.anthropic.com/en/docs/claude-code/overview"
  "https://docs.anthropic.com/en/docs/claude-code/quickstart"
  "https://docs.anthropic.com/en/docs/claude-code/slash-commands"
)

for page in "${PAGES[@]}"; do
  echo "Processing $page..."
  
  claude "Please read the documentation at $page and extract structured information..." > temp.json
  
  npm run process-claude temp.json --source "$page"
  
  # Be respectful - add a delay between requests
  sleep 30
done
```

### Using Different Embedding Providers

```bash
# Default (Ollama)
npm run process-claude claude-output.json

# Using OpenAI
npm run process-claude claude-output.json --provider openai

# Process and search with specific provider
npm run search "your query" -- --provider openai
```

## 🧠 Advanced Techniques

### 1. Contextual Reading

Ask Claude to focus on specific aspects:

```bash
claude "Read the Claude Code MCP integration docs. Focus especially on:
1. How to register tools
2. Error handling patterns
3. Best practices for tool responses
Extract as structured JSON..." > mcp-focused.json
```

### 2. Relationship Extraction

Claude can identify relationships between concepts:

```bash
claude "Read the Claude Code hooks documentation. Extract:
1. All hook types and their relationships
2. Execution order and dependencies
3. Common patterns across different hooks
Output as structured JSON with a 'relationships' field..." > hooks-relationships.json
```

### 3. Progressive Enhancement

Build your knowledge base incrementally:

```bash
# Day 1: Core concepts
claude "Read overview and quickstart docs..." | npm run process-claude

# Day 2: Advanced features
claude "Read about hooks and slash commands..." | npm run process-claude

# Day 3: Troubleshooting
claude "Read troubleshooting and FAQ sections..." | npm run process-claude
```

### 4. Quality Validation

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

## 🎯 Best Practices

### 1. **Use Natural Language**
Let Claude read documentation as intended, don't try to hack it:
```bash
# Good ✅
claude "Please read the Claude Code documentation about hooks and help me understand how they work"

# Bad ❌
claude "Scrape all text from URL and output raw HTML"
```

### 2. **Be Specific About Output**
Always request structured JSON output:
```bash
claude "Read [URL] and extract information. Output as JSON only, no other text."
```

### 3. **Respect Rate Limits**
Add delays between requests when processing multiple pages:
```bash
sleep 30  # 30 seconds between pages
```

### 4. **Validate Output**
Always check Claude's JSON output before processing:
```bash
# Validate JSON
jq . claude-output.json > /dev/null || echo "Invalid JSON!"

# Check structure
jq '.sections | length' claude-output.json
```

### 5. **Use Appropriate Prompts**
Match the prompt to the documentation type:
- Overview → Focus on concepts and capabilities
- Tutorial → Extract step-by-step instructions
- Reference → Capture API details and parameters
- Troubleshooting → Extract problem-solution pairs

## 🔧 Troubleshooting

### Common Issues

1. **Invalid JSON Output**
   - Ensure prompt explicitly requests "JSON only"
   - Check for truncated output
   - Validate with `jq` before processing

2. **Missing Embeddings**
   - Verify Ollama is running: `curl http://localhost:11434/api/tags`
   - Check collection exists in Qdrant
   - Ensure embedding dimensions match

3. **Poor Search Results**
   - Check if content was properly chunked
   - Verify embedding provider consistency
   - Adjust score threshold if needed

## 📊 Monitoring & Maintenance

### Check Ingestion Status
```bash
# See what's in your knowledge base
npm run search "*" -- --limit 10

# Check collection stats
curl http://localhost:6333/collections/claude_code_docs_ollama
```

### Update Documentation
```bash
# Re-ingest specific pages that have changed
claude "Read the updated Claude Code hooks documentation..." | npm run process-claude
```

### Clean Up Old Data
```bash
# Remove and rebuild collection if needed
curl -X DELETE http://localhost:6333/collections/claude_code_docs_ollama
npm run setup
```

## 🚀 Next Steps

1. **Create Custom Prompts**: Tailor prompts for your specific documentation
2. **Build Automation**: Create scripts for regular updates
3. **Enhance Search**: Add filters and advanced query options
4. **Monitor Quality**: Track search effectiveness and improve prompts

## 💡 Pro Tips

- **Combine Providers**: Use Claude for complex sections, traditional parsing for simple ones
- **Version Control**: Save Claude's JSON outputs for comparison
- **Incremental Updates**: Only re-process changed sections
- **Cross-Reference**: Have Claude identify related documentation
- **Feedback Loop**: Use search analytics to improve ingestion prompts

---

Remember: This approach transforms documentation ingestion from a technical scraping task to a natural development workflow, using Claude Code exactly as intended - to help developers understand and work with documentation.