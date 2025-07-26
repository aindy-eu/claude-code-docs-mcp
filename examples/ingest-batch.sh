#!/bin/bash
# Claude-Driven Batch Documentation Ingestion
# This script processes multiple documentation pages using Claude Code

set -e

# Configuration
OUTPUT_DIR="./claude-outputs"
LOG_FILE="$OUTPUT_DIR/ingestion-log.txt"
DELAY_SECONDS=30

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Initialize log
echo "Claude Documentation Ingestion - $(date)" > "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Documentation pages to ingest
PAGES=(
  "https://docs.anthropic.com/en/docs/claude-code/overview"
  "https://docs.anthropic.com/en/docs/claude-code/quickstart"
  "https://docs.anthropic.com/en/docs/claude-code/slash-commands"
  "https://docs.anthropic.com/en/docs/claude-code/hooks"
  "https://docs.anthropic.com/en/docs/claude-code/settings"
  "https://docs.anthropic.com/en/docs/claude-code/mcp"
)

echo "🚀 Starting batch documentation ingestion"
echo "📁 Output directory: $OUTPUT_DIR"
echo "📝 Processing ${#PAGES[@]} documentation pages"
echo ""

# Load prompt template
PROMPT_TEMPLATE=$(cat examples/prompts/overview-prompt.txt)

# Process each page
for i in "${!PAGES[@]}"; do
  page="${PAGES[$i]}"
  page_name=$(echo "$page" | sed 's|.*/||' | sed 's|[^a-zA-Z0-9-]|_|g')
  output_file="$OUTPUT_DIR/${page_name}.json"
  
  echo "[$((i+1))/${#PAGES[@]}] Processing: $page"
  echo "  → Output: $output_file"
  
  # Log the operation
  echo "" >> "$LOG_FILE"
  echo "Processing: $page at $(date)" >> "$LOG_FILE"
  
  # Use Claude to read the documentation
  echo "  → Reading with Claude..."
  echo "  → This may take 10-30 seconds..."
  if claude "$PROMPT_TEMPLATE

Please read: $page" > "${output_file}.raw" 2>> "$LOG_FILE"; then
    echo "  ✓ Claude read successful"
    
    # Clean up Claude's output (remove markdown code blocks if present)
    echo "  → Cleaning output..."
    if grep -q '```json' "${output_file}.raw"; then
      sed '1d;$d' "${output_file}.raw" | sed 's/^```json$//' | sed 's/^```$//' > "$output_file"
    else
      cp "${output_file}.raw" "$output_file"
    fi
    rm -f "${output_file}.raw"
    
    # Validate JSON
    if jq . "$output_file" > /dev/null 2>&1; then
      echo "  ✓ Valid JSON output"
      
      # Process the output
      echo "  → Processing embeddings..."
      if npm run process-claude "$output_file" >> "$LOG_FILE" 2>&1; then
        echo "  ✓ Embeddings generated successfully"
        echo "Success: $page" >> "$LOG_FILE"
      else
        echo "  ❌ Failed to generate embeddings"
        echo "Failed embeddings: $page" >> "$LOG_FILE"
      fi
    else
      echo "  ❌ Invalid JSON output from Claude"
      echo "Invalid JSON: $page" >> "$LOG_FILE"
      # Save the invalid output for debugging
      mv "$output_file" "${output_file}.invalid"
    fi
  else
    echo "  ❌ Claude read failed"
    echo "Failed read: $page" >> "$LOG_FILE"
  fi
  
  # Add delay between requests (except for last item)
  if [ $i -lt $((${#PAGES[@]} - 1)) ]; then
    echo "  ⏳ Waiting ${DELAY_SECONDS}s before next request..."
    sleep $DELAY_SECONDS
  fi
  
  echo ""
done

echo "✅ Batch ingestion complete!"
echo ""
echo "📊 Summary:"
echo "  - Output files: $OUTPUT_DIR/"
echo "  - Log file: $LOG_FILE"
echo "  - Valid JSON files: $(find "$OUTPUT_DIR" -name "*.json" -type f | wc -l)"
echo ""
echo "🔍 You can now search the ingested documentation:"
echo "  npm run search \"your query\""
echo ""
echo "💡 To re-run failed pages, check the log file:"
echo "  grep 'Failed' $LOG_FILE"