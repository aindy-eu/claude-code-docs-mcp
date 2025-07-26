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
echo "   📋 Loading prompt template..."
if [ -f "examples/prompts/overview-prompt.txt" ]; then
  PROMPT=$(cat examples/prompts/overview-prompt.txt)
  echo "   ✓ Using overview prompt template"
else
  # Fallback prompt if template not found
  PROMPT="Please read this documentation page and extract structured information as JSON. Include sections, code examples, key concepts, and best practices. Output only valid JSON."
  echo "   ⚠️  Using fallback prompt (template not found)"
fi

echo "   🤖 Asking Claude to read: $URL"
echo "   ⏳ This may take 10-30 seconds..."
claude "$PROMPT

Please read: $URL" > "$OUTPUT_FILE.raw"

# Clean up Claude's output (remove markdown code blocks if present)
echo "   🧹 Cleaning Claude's output..."
if [ -f "examples/clean-claude-json.sh" ]; then
  if bash examples/clean-claude-json.sh "$OUTPUT_FILE.raw" "$OUTPUT_FILE"; then
    echo "   ✓ Output cleaned successfully"
  else
    echo "   ⚠️  Cleaning completed with warnings"
  fi
else
  # Fallback if cleaner script not found
  if grep -q '```json' "$OUTPUT_FILE.raw"; then
    echo "   📝 Removing markdown code block wrapper..."
    sed '1d;$d' "$OUTPUT_FILE.raw" | sed 's/^```json$//' | sed 's/^```$//' > "$OUTPUT_FILE"
  else
    cp "$OUTPUT_FILE.raw" "$OUTPUT_FILE"
  fi
fi
rm -f "$OUTPUT_FILE.raw"

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
echo "   🔄 Generating embeddings with ${EMBEDDING_PROVIDER:-ollama}..."
echo "   📊 This may take a few seconds..."
npm run process-claude "$OUTPUT_FILE"

echo ""
echo "✅ Documentation successfully ingested!"
echo ""
echo "🔍 Try searching:"
echo "   npm run search \"$(jq -r '.sections[0].keyConcepts[0] // "your query"' "$OUTPUT_FILE" 2>/dev/null)\""