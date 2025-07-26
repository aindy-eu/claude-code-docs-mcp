# Testing Guide - Think Level

## Test Objectives

1. Verify Claude can read and structure documentation
2. Confirm JSON output is parseable
3. Test basic storage in Qdrant
4. Validate simple retrieval works

## Test 1: Claude Reading Test

```bash
# Test Claude's ability to read and structure
claude "Read https://docs.anthropic.com/claude-code/overview and output just the main headings as a simple list"

# Expected: Claude fetches the page and lists headings
```

## Test 2: JSON Structure Test

```bash
# Full JSON output test
claude "Read https://docs.anthropic.com/claude-code/quickstart and output JSON with:
{
  url: string,
  title: string,
  sections: [{
    id: string,
    heading: string,
    content: string,
    codeExamples: string[]
  }]
}"

# Save and validate
claude "..." > test-quickstart.json
node -e "console.log(JSON.parse(require('fs').readFileSync('test-quickstart.json')))"
```

## Test 3: Processing Pipeline

```bash
# Create test structure
mkdir -p test-output

# Step through pipeline
claude "Read quickstart docs as JSON" > test-output/quickstart.json
node process-claude-output.js test-output/quickstart.json
ls processed/  # Should see quickstart.json
```

## Test 4: Qdrant Storage

```javascript
// test-storage.js
const { QdrantClient } = require('@qdrant/js-client-rest');

async function testStorage() {
  const client = new QdrantClient({ host: 'localhost', port: 6333 });
  
  // Create collection
  await client.createCollection('test_docs', {
    vectors: { size: 384, distance: 'Cosine' }
  });
  
  // Store test document
  await client.upsert('test_docs', {
    points: [{
      id: 'test-1',
      vector: new Array(384).fill(0.1),
      payload: {
        content: 'This is a test document',
        source: 'manual-test'
      }
    }]
  });
  
  // Retrieve
  const result = await client.retrieve('test_docs', {
    ids: ['test-1']
  });
  
  console.log('Storage test:', result[0].payload);
}

testStorage().catch(console.error);
```

## Test 5: End-to-End Workflow

```bash
# Complete workflow test
echo "=== E2E Test ==="

# 1. Claude reads
echo "1. Reading documentation..."
claude "Read https://docs.anthropic.com/claude-code/settings and output JSON format" > e2e-test.json

# 2. Validate JSON
echo "2. Validating JSON..."
node -e "JSON.parse(require('fs').readFileSync('e2e-test.json'))" && echo "JSON valid ✓"

# 3. Process
echo "3. Processing..."
node process-claude-output.js e2e-test.json

# 4. Check output
echo "4. Checking processed file..."
ls -la processed/e2e-test.json

echo "=== Test Complete ==="
```

## Manual Validation Checklist

- [ ] Claude successfully fetches documentation
- [ ] JSON output is properly formatted
- [ ] Sections are logically divided
- [ ] Code examples are captured
- [ ] Processing script runs without errors
- [ ] Qdrant storage works
- [ ] Can retrieve stored documents

## Expected Issues at Think Level

1. **Inconsistent JSON** - Claude might format differently each time
2. **Missing sections** - Some content might be skipped
3. **Large responses** - Some pages might exceed output limits
4. **Manual tedium** - Process is slow and repetitive

## Success Criteria

The "think" level succeeds if:
- We can manually ingest 3-5 documentation pages
- JSON structure is consistent enough to process
- Basic storage and retrieval works
- Process is repeatable (even if manual)

## Sample Test Output

```
=== Testing Claude Documentation Reader ===
Page: Slash Commands
Sections found: 8
Code examples: 12
Processing time: ~30 seconds per page
Success rate: 100% (manual process)
```

## Comparison Baseline

Record metrics for comparison with advanced levels:
- Time per page: ~2-3 minutes (including manual steps)
- Success rate: High (human supervised)
- Quality: Good (Claude understands context)
- Automation: None
- Scalability: Poor (manual process)