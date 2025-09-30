# Prompt Engineering for Documentation Extraction

## Core Philosophy

We're asking Claude to **read and understand** documentation, not parse HTML. This fundamental shift enables extraction of implicit knowledge, relationships, and context that mechanical parsers miss.

## Available Prompt Templates

Templates for different documentation types (besides the main template - the others remain to be tested;):

- [`prompts/claude-docs.prompt.md`](prompts/claude-docs.prompt.md) - **Main template** for comprehensive documentation extraction
- [`prompts/api-reference.prompt.md`](prompts/api-reference.prompt.md) - Optimized for API reference documentation
- [`prompts/tutorial.prompt.md`](prompts/tutorial.prompt.md) - Step-by-step tutorial extraction
- [`prompts/mirror-docs.prompt.md`](prompts/mirror-docs.prompt.md) - Complete mirroring of documentation structure

The main template (`claude-docs.prompt.md`) is used by default in `tools/ingest` and `tools/batch-ingest`.

## Key Principles

### 1. Request Understanding, Not Parsing

**Good:**

```
"Please read this documentation page and understand its content, including implicit patterns and relationships"
```

**Bad:**

```
"Extract all text from this webpage"
```

### 2. Define Clear JSON Structure

Always provide the exact structure you expect:

```json
{
  "source": "URL",
  "pageTitle": "string",
  "sections": [
    {
      "title": "string",
      "content": "string",
      "codeExamples": [],
      "keyConcepts": [],
      "confidence": "explicit|strongly-implied|inferred"
    }
  ]
}
```

### 3. Request Confidence Levels

Ask Claude to indicate certainty about extracted information:

- `"explicit"` - Directly stated in documentation
- `"strongly-implied"` - Clear from context (e.g., file paths in examples)
- `"inferred"` - Logical conclusion from available information
- `"standard-practice"` - Common patterns in the ecosystem

## Understanding the Templates

### Main Template Features

The production template [`prompts/claude-docs.prompt.md`](prompts/claude-docs.prompt.md) includes:

- Extracts both explicit and implicit knowledge
- Captures ALL code examples with context
- Identifies relationships between concepts
- Notes implementation details (paths, precedence rules)
- Includes confidence levels throughout

### Specialized Templates

- **Mirror** ([`mirror-docs.prompt.md`](prompts/mirror-docs.prompt.md)): Preserves exact documentation structure

## Customizing for Documentation Types

### API Reference

See [`api-reference.prompt.md`](prompts/api-reference.prompt.md)
Focus on:

```
- All parameters with types and defaults
- Return values and types
- Error conditions and codes
- Request/response examples
- Authentication requirements
```

### Tutorials

See [`tutorial.prompt.md`](prompts/tutorial.prompt.md)

Extract:

```
- Step-by-step instructions in order
- Prerequisites and setup requirements
- Expected outcomes at each step
- Common mistakes and how to avoid them
- Complete code examples that build on each other
```

### Conceptual Documentation

Emphasize:

```
- Core concepts and their relationships
- Mental models and analogies
- Architecture diagrams described in text
- Design decisions and trade-offs
- Best practices vs anti-patterns
```

### Troubleshooting Guides

Structure as:

```
- Problem descriptions with symptoms
- Root causes
- Solution steps
- Verification methods
- Prevention strategies
```

## Effective Prompt Patterns

### 1. Comprehensive Extraction

```
"Extract ALL content including code examples, warnings, notes, and sidebars.
Include information that experienced developers would infer from the context."
```

### 2. Relationship Mapping

```
"Identify how concepts relate to each other. Note dependencies, prerequisites,
and which features build upon others."
```

### 3. Implementation Details

```
"Extract specific implementation details such as:
- File paths and directory structures
- Configuration file locations
- Environment variable names
- Command-line arguments
- Default values and behaviors"
```

### 4. Edge Cases and Warnings

```
"Pay special attention to:
- Warning boxes and cautions
- Edge cases and limitations
- Version-specific behaviors
- Platform-specific differences
- Security considerations"
```

## Best Practices

### DO:

- ✅ End prompts with "Output only valid JSON with no additional text"
- ✅ Request extraction of implicit knowledge
- ✅ Ask for relationships and patterns
- ✅ Include confidence levels in the schema
- ✅ Request ALL content, not summaries
- ✅ Ask for code examples WITH their context

### DON'T:

- ❌ Use words like "scrape" or "parse"
- ❌ Limit extraction with "just the main content"
- ❌ Ignore navigation, sidebars, or footnotes
- ❌ Request HTML or raw text
- ❌ Summarize or condense information

## Using Different Templates

To use a specific template instead of the default:

```bash
# Use the API reference template
PROMPT=$(cat docs/ingestion/prompts/api-reference.prompt.md)
claude "$PROMPT
Please read: https://docs.example.com/api" > api-output.json

# Or modify tools/ingest to use a different template
# Edit line 77 to point to your preferred template
```

## Testing Your Prompts

1. **Test with known documentation**

   ```bash
   claude "$(cat docs/ingestion/prompts/your-prompt.md)
   Please read: [URL]" > test-output.json
   ```

2. **Validate structure**

   ```bash
   jq . test-output.json > /dev/null && echo "Valid JSON"
   ```

3. **Check completeness**

   ```bash
   jq '.sections | length' test-output.json  # Should have all sections
   jq '[.sections[].codeExamples | length] | add' test-output.json  # Should have examples
   ```

4. **Verify quality**
   - Are confidence levels present?
   - Are code examples complete and runnable?
   - Are relationships identified?
   - Is implicit knowledge captured?

## Common Issues and Solutions

### Issue: Missing implicit knowledge

**Solution**: Add explicit instruction: "Include information that experienced developers would understand from context"

### Issue: Incomplete code examples

**Solution**: Request: "Include complete, runnable code examples with all imports and context"

### Issue: Lost relationships

**Solution**: Add field: `"relatedConcepts": []` and ask Claude to populate it

### Issue: No confidence markers

**Solution**: Make confidence required in schema and remind Claude to use them

## Advanced Techniques

### 1. Focused Extraction

When you need specific aspects:

```
"Focus especially on [specific topic] while still extracting all other content"
```

### 2. Cross-Reference Detection

```
"Note when this documentation references other pages or external resources"
```

### 3. Version Awareness

```
"Identify any version-specific information or compatibility notes"
```

### 4. Example Classification

```
"Categorize code examples by their purpose: 'basic-usage', 'advanced', 'error-handling', etc."
```

## The Tools Handle the Rest

Once you have a good prompt:

1. **Single page**: `./tools/ingest [URL]` uses your prompt automatically
2. **Batch**: `./tools/batch-ingest` processes all configured pages
3. **Auto-cleaning**: Tools remove markdown wrappers if Claude adds them
4. **Processing**: `npm run process-claude` handles the pipeline

## Remember

The goal is to leverage Claude's **understanding**, not just its ability to extract text. Good prompts result in documentation that's searchable by meaning, not just keywords.
