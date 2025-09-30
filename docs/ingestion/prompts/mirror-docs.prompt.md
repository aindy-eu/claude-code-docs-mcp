# Complete Documentation Mirror Prompt

## Purpose
Create a complete, structured mirror of documentation pages that preserves ALL information, ensuring AI has identical knowledge to reading the original page.

## Core Principle
**Mirror, don't summarize.** The goal is 100% information preservation in a structured, searchable format.

## Instructions

Please read this documentation page and create a COMPLETE structured mirror that captures EVERY piece of information.

### Requirements

1. **Preserve ALL Content**
   - Every paragraph of text
   - Every code example (no matter how small)
   - Every command and its description
   - Every warning, note, or tip
   - Every link or reference

2. **Maintain Structure**
   - Keep original section hierarchy
   - Preserve the flow of information
   - Maintain relationships between concepts

3. **Capture Everything**
   - If it's on the page, it goes in the JSON
   - Don't group or summarize - preserve granularity
   - Include repetitive information if it appears multiple times

### Output Structure

```json
{
  "source": "URL",
  "pageTitle": "Exact page title",
  "pageDescription": "Full page introduction/overview text",
  "lastUpdated": "Date if shown on page",
  "tableOfContents": ["Section names in order"],
  "sections": [{
    "title": "Exact section title",
    "level": 1, // h1=1, h2=2, etc
    "content": "Complete text content of this section",
    "subsections": [{
      "title": "Subsection title",
      "level": 2,
      "content": "Complete subsection content",
      "elements": [{
        "type": "paragraph|code|list|table|note|warning",
        "content": "Exact content",
        "metadata": {} // Any additional context
      }]
    }],
    "codeExamples": [{
      "language": "bash/javascript/etc",
      "code": "Exact code as shown",
      "caption": "Any caption or title",
      "description": "Surrounding explanatory text",
      "output": "Example output if shown",
      "position": "before-text|after-text|inline"
    }],
    "commands": [{
      "name": "/command-name",
      "description": "Exact description as written",
      "syntax": "Full syntax if shown",
      "examples": ["Usage examples"],
      "options": [{
        "name": "option",
        "description": "What it does"
      }]
    }],
    "lists": [{
      "type": "bullet|numbered|definition",
      "title": "List heading if any",
      "items": [{
        "term": "For definition lists",
        "content": "Exact item content",
        "subitems": []
      }]
    }],
    "tables": [{
      "caption": "Table title if any",
      "headers": ["Column 1", "Column 2"],
      "rows": [["Cell 1", "Cell 2"]]
    }],
    "notes": [{
      "type": "note|warning|tip|important",
      "content": "Exact note content"
    }],
    "links": [{
      "text": "Link text",
      "url": "Target URL",
      "type": "internal|external"
    }]
  }],
  "footerContent": "Any footer information",
  "metadata": {
    "extractedAt": "ISO timestamp",
    "modelUsed": "claude-3-opus",
    "pageStats": {
      "totalSections": 0,
      "totalCodeExamples": 0,
      "totalCommands": 0,
      "totalWords": 0
    }
  }
}
```

## Extraction Rules

1. **Text Content**
   - Include EVERY sentence
   - Preserve formatting (bold, italic, code inline)
   - Keep line breaks where meaningful
   
2. **Code Examples**
   - Copy EXACTLY as shown
   - Include file names if mentioned
   - Preserve comments
   - Include terminal prompts ($ or >)
   
3. **Commands/APIs**
   - List EVERY command/endpoint
   - Include ALL parameters
   - Copy exact descriptions
   - Include all examples shown

4. **Lists and Tables**
   - Preserve complete structure
   - Include all items
   - Maintain hierarchical relationships

5. **Special Elements**
   - Capture all callout boxes
   - Include all warnings/notes
   - Preserve tips and best practices

## Quality Checks

Before finalizing:
1. Would an AI reading only this JSON know everything that's on the page?
2. Could someone reconstruct the documentation from this JSON?
3. Is any information from the page missing?

## Important

- Don't summarize or condense
- Don't group similar items
- Don't skip "obvious" things
- Don't improve or clean up examples
- Include everything, even if it seems redundant

**Output only valid JSON with no additional text or formatting.**