#!/bin/bash
# Utility to clean Claude's JSON output
# Handles various formatting issues like markdown code blocks

INPUT_FILE="$1"
OUTPUT_FILE="$2"

if [ -z "$INPUT_FILE" ] || [ -z "$OUTPUT_FILE" ]; then
  echo "Usage: $0 <input-file> <output-file>"
  exit 1
fi

# Create a temporary file
TEMP_FILE=$(mktemp)

# Copy input to temp file
cp "$INPUT_FILE" "$TEMP_FILE"

# Remove markdown code blocks
# Handle ```json at start and ``` at end
if head -1 "$TEMP_FILE" | grep -q '```json'; then
  # Remove first line if it's ```json
  tail -n +2 "$TEMP_FILE" > "${TEMP_FILE}.tmp"
  mv "${TEMP_FILE}.tmp" "$TEMP_FILE"
fi

if tail -1 "$TEMP_FILE" | grep -q '```'; then
  # Remove last line if it's ```
  head -n -1 "$TEMP_FILE" > "${TEMP_FILE}.tmp"
  mv "${TEMP_FILE}.tmp" "$TEMP_FILE"
fi

# Also handle case where ```json and ``` are on separate lines
sed -i.bak '/^```json$/d; /^```$/d' "$TEMP_FILE"

# Remove any leading/trailing whitespace
sed -i.bak 's/^[[:space:]]*//; s/[[:space:]]*$//' "$TEMP_FILE"

# Copy cleaned content to output
cp "$TEMP_FILE" "$OUTPUT_FILE"

# Clean up
rm -f "$TEMP_FILE" "${TEMP_FILE}.bak" "${TEMP_FILE}.tmp"

# Validate the output
if jq . "$OUTPUT_FILE" > /dev/null 2>&1; then
  exit 0
else
  echo "Warning: Output is not valid JSON after cleaning"
  exit 1
fi