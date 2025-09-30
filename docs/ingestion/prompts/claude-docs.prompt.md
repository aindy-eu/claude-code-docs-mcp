# Claude Documentation Extraction Prompt

## Purpose
Extract comprehensive, structured information from Claude Code documentation with special attention to implementation details, edge cases, and implicit knowledge.

## Instructions

Please read this Claude Code documentation page and extract structured information with special attention to implementation details and edge cases.

### Focus Areas

1. **Core Functionality**
   - Main purpose and capabilities
   - Key concepts and terminology  
   - Prerequisites or requirements
   - Common use cases

2. **Technical Details**
   - Implementation specifics (file paths, precedence rules, execution context)
   - Configuration options (all available fields, not just examples)
   - Error scenarios (what happens when things fail)
   - Important warnings or limitations

3. **Code & Examples**
   - ALL code examples with their purpose
   - Best practices AND anti-patterns
   - Context and variations for each example

### Extraction Requirements

For each major section:
- Extract the main content
- **Generate searchKeywords**: Include the main term, common misspellings, abbreviations, and related terminology (e.g., for "Hooks" → ["hooks", "hook", "event handlers", "PreToolUse", "PostToolUse"])
- **Generate aliases**: Alternative names or ways users might refer to this feature
- Identify ALL code examples with their purpose
- Note best practices AND anti-patterns
- Highlight important warnings and edge cases
- List related features or sections
- Extract implicit knowledge (how things work behind the scenes)
- Note specific file paths, directory structures, and naming conventions
- Identify precedence rules and resolution order

### Output Structure

```json
{
  "source": "URL or identifier",
  "pageTitle": "Main title",
  "summary": "2-3 sentence overview",
  "sections": [{
    "title": "Section heading",
    "content": "Main text content",
    "confidence": "explicit/strongly-implied/inferred",
    "searchKeywords": ["primary-term", "alternate-spelling", "common-abbreviation"],
    "aliases": ["alternative names for this feature"],
    "codeExamples": [{
      "language": "typescript/bash/etc",
      "code": "actual code",
      "description": "what this shows",
      "demonstrates": ["concept1", "concept2"],
      "context": "when/where this applies",
      "variations": ["alternative approaches"],
      "confidence": "explicit/strongly-implied/inferred"
    }],
    "keyConcepts": ["term1", "term2"],
    "warnings": ["important note"],
    "bestPractices": ["practice1"],
    "antiPatterns": ["what to avoid"],
    "relatedSections": ["other-feature"],
    "implementation": {
      "filePaths": ["specific paths mentioned"],
      "precedenceRules": ["order of resolution"],
      "executionContext": "how things run",
      "errorHandling": "what happens on failure",
      "confidence": "explicit/strongly-implied/inferred",
      "notes": ["any uncertainty explanations"]
    }
  }],
  "prerequisites": ["required knowledge"],
  "useCases": ["use case 1"],
  "configuration": {
    "allOptions": ["complete list of config options"],
    "defaults": ["default behaviors"],
    "constraints": ["limitations or restrictions"],
    "confidence": "explicit/strongly-implied/inferred"
  },
  "troubleshooting": {
    "commonIssues": ["frequent problems"],
    "solutions": ["how to resolve them"]
  },
  "metadata": {
    "extractedAt": "ISO timestamp",
    "modelUsed": "claude-3-opus",
    "completeness": "high/medium/low based on detail level",
    "extractionStats": {
      "totalSections": 0,
      "totalExamples": 0,
      "totalConcepts": 0,
      "confidenceLevels": {
        "explicit": 0,
        "stronglyImplied": 0,
        "inferred": 0
      }
    }
  }
}
```

## Extraction Philosophy

- **Extract ALL content** that appears in the documentation, both explicit and reasonably implied
- **Create granular sections** when it improves searchability and understanding
- **Include ALL examples**, even simple ones - they're valuable for search
- **Capture implicit knowledge** that experienced developers would understand
- **Err on the side of completeness** - more content with confidence markers is better than missing content

## Accuracy & Confidence Rules

- Mark each piece of information with a confidence level:
  - `"confidence": "explicit"` - Directly stated in the documentation
  - `"confidence": "strongly-implied"` - Clear from context (e.g., file paths in examples)
  - `"confidence": "inferred"` - Logical conclusion from available information
  - `"confidence": "standard-practice"` - Common patterns in the ecosystem
  
- For unclear information:
  - Include it with `"confidence": "low"` rather than omitting
  - Add a `"note"` field explaining the uncertainty
  - Use `"not documented"` only when completely absent

## Extraction Guidelines

- **Sections**: Create a new section for each distinct topic or feature
- **Code Examples**: Include EVERY example, even partial ones
- **Key Concepts**: Extract all terms that would be useful for search
- **Implementation Details**: Include paths seen in examples, common patterns
- **Best Practices**: Include both stated and implied from examples
- **Related Sections**: Be generous in linking related content

## Important Notes

- Ensure all code examples are complete and runnable
- Extract implicit knowledge and patterns, not just explicit text
- Pay special attention to file system interactions, command resolution, and configuration inheritance
- Note any version-specific behaviors or compatibility requirements
- Include edge cases and error scenarios even if not explicitly documented

**Output only valid JSON with no additional text or formatting.**