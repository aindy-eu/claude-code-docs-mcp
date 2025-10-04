# Dev Test Prompt - Minimal Documentation Extraction

**Purpose:** Lightweight test extraction for development and testing embedding pipeline without full documentation processing.

## Task
Read the HTML file provided (use your file reading tools) and extract a **minimal but valid** JSON structure for testing the embedding pipeline.

## Output Format (JSON only, no markdown wrapper)

```json
{
  "source": "{DOC_URL}",
  "pageTitle": "Page title here",
  "summary": "Brief description (1-2 sentences)",
  "sections": [
    {
      "title": "Section Title",
      "content": "Section content (keep brief for testing)",
      "type": "concept",
      "codeExamples": [
        {
          "language": "typescript",
          "code": "console.log('test');",
          "description": "What this code does"
        }
      ]
    }
  ],
  "metadata": {
    "extractedAt": "{TIMESTAMP}",
    "extractionMethod": "claude-driven",
    "model": "{MODEL}",
    "dev_mode": true
  }
}
```

## Guidelines for Dev Mode

1. **Keep it minimal**: Extract only 2-3 sections maximum
2. **Focus on structure**: Verify JSON schema, not completeness
3. **Include 1-2 code examples**: Test code embedding
4. **Fast extraction**: Prioritize speed over comprehensiveness

## Section Types (pick 1-2)
- `concept` - Core concepts or features
- `example` - Usage examples
- `reference` - API/configuration reference

## Output
Return ONLY valid JSON matching the schema above. No explanations, no markdown wrappers.
