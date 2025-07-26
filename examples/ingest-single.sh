#!/bin/bash
# Single Page Documentation Ingestion Example
# Shows best practices for ingesting individual documentation pages

set -e

# Configuration
OUTPUT_DIR="./claude-outputs"
mkdir -p "$OUTPUT_DIR"

# Check if URL is provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 <documentation-url> [output-name]"
  echo "Example: $0 https://docs.anthropic.com/en/docs/claude-code/overview overview"
  exit 1
fi

URL="$1"
OUTPUT_NAME="${2:-$(echo "$URL" | sed 's|.*/||' | sed 's|[^a-zA-Z0-9-]|_|g')}"
OUTPUT_FILE="$OUTPUT_DIR/${OUTPUT_NAME}.json"

echo "📚 Claude-Driven Documentation Ingestion"
echo "========================================"
echo "📍 URL: $URL"
echo "📁 Output: $OUTPUT_FILE"
echo ""

# Step 1: Use Claude to read the documentation
echo "1️⃣ Reading documentation with Claude..."
if [ -f "examples/prompts/overview-prompt.txt" ]; then
  PROMPT=$(cat examples/prompts/overview-prompt.txt)
else
  # Fallback prompt if template not found
  PROMPT="Please read this documentation page and extract structured information as JSON. Include sections, code examples, key concepts, and best practices. Output only valid JSON."
fi

claude "$PROMPT

Please read: $URL" > "$OUTPUT_FILE"

# Step 2: Validate the JSON output
echo "2️⃣ Validating JSON output..."
if jq . "$OUTPUT_FILE" > /dev/null 2>&1; then
  echo "   ✅ Valid JSON"
  
  # Show a preview of what was extracted
  echo ""
  echo "   📋 Extracted content preview:"
  echo "   - Title: $(jq -r '.pageTitle' "$OUTPUT_FILE")"
  echo "   - Sections: $(jq '.sections | length' "$OUTPUT_FILE")"
  echo "   - Code examples: $(jq '[.sections[].codeExamples | length] | add' "$OUTPUT_FILE")"
  echo "   - Key concepts: $(jq '[.sections[].keyConcepts | length] | add' "$OUTPUT_FILE")"
else
  echo "   ❌ Invalid JSON output"
  echo "   Check the file: $OUTPUT_FILE"
  exit 1
fi

# Step 3: Process the output into embeddings
echo ""
echo "3️⃣ Processing into embeddings..."
npm run process-claude "$OUTPUT_FILE"

echo ""
echo "✅ Documentation successfully ingested!"
echo ""
echo "🔍 Try searching:"
echo "   npm run search \"$(jq -r '.sections[0].keyConcepts[0] // "your query"' "$OUTPUT_FILE" 2>/dev/null)\""