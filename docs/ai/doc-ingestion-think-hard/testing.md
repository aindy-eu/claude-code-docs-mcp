# Testing Guide - Think Hard Level

## Comprehensive Testing Strategy

### Test Categories

1. **Unit Tests** - Individual component validation
2. **Integration Tests** - Component interaction
3. **End-to-End Tests** - Full pipeline validation
4. **Quality Tests** - Output quality metrics
5. **Performance Tests** - Speed and efficiency
6. **Resilience Tests** - Error handling and recovery

## Unit Tests

### ClaudeDocReader Tests
```javascript
// test/ClaudeDocReader.test.js
const ClaudeDocReader = require('../src/ClaudeDocReader');

describe('ClaudeDocReader', () => {
  test('extracts JSON from Claude output', () => {
    const reader = new ClaudeDocReader();
    const claudeOutput = `
      Here's the JSON structure you requested:
      {"url": "test", "title": "Test Doc", "sections": []}
      That should help!
    `;
    
    const json = reader.extractJSON(claudeOutput);
    expect(json.url).toBe('test');
    expect(json.sections).toEqual([]);
  });

  test('handles malformed JSON with recovery', () => {
    const reader = new ClaudeDocReader();
    const malformed = `{'url': 'test', "title": "Test"}`;
    
    const json = reader.extractJSON(malformed);
    expect(json.url).toBe('test');
  });

  test('retries on failure', async () => {
    // Mock implementation that fails twice then succeeds
    const reader = new ClaudeDocReader({ maxRetries: 3 });
    // ... test retry logic
  });
});
```

### Schema Validator Tests
```javascript
// test/SchemaValidator.test.js
describe('SchemaValidator', () => {
  test('validates correct schema', () => {
    const validator = new SchemaValidator();
    const validData = {
      url: 'https://example.com',
      title: 'Test',
      sections: [{
        id: 'test-1',
        heading: 'Test Section',
        content: 'Some content here',
        codeExamples: [],
        level: 2
      }],
      metadata: {
        extractedAt: new Date().toISOString(),
        wordCount: 3,
        codeBlockCount: 0
      }
    };
    
    expect(() => validator.validate(validData)).not.toThrow();
  });

  test('auto-fixes missing metadata', async () => {
    const validator = new SchemaValidator();
    const incomplete = {
      url: 'https://example.com',
      title: 'Test',
      sections: [{ id: '1', heading: 'Test', content: 'Content' }]
    };
    
    const fixed = await validator.validateWithFallback(incomplete, 'https://example.com');
    expect(fixed.metadata).toBeDefined();
    expect(fixed.metadata.wordCount).toBe(1);
  });
});
```

## Integration Tests

### Batch Processing Test
```javascript
// test/integration/batch-processing.test.js
const BatchProcessor = require('../src/BatchProcessor');
const fs = require('fs').promises;

describe('Batch Processing Integration', () => {
  beforeEach(async () => {
    // Clean checkpoint files
    await fs.rm('./test-checkpoints', { recursive: true, force: true });
  });

  test('processes multiple documents', async () => {
    const config = {
      reader: { maxRetries: 1 },
      embeddingProvider: 'mock',
      checkpointFile: './test-checkpoints/progress.json'
    };
    
    const processor = new BatchProcessor(config);
    const urls = [
      'https://docs.anthropic.com/test1',
      'https://docs.anthropic.com/test2'
    ];
    
    const results = await processor.processBatch(urls);
    expect(results.successful.length).toBe(2);
    expect(results.failed.length).toBe(0);
  });

  test('resumes from checkpoint', async () => {
    // Create checkpoint with one completed URL
    const checkpoint = {
      completed: ['https://docs.anthropic.com/test1'],
      failed: []
    };
    await fs.mkdir('./test-checkpoints', { recursive: true });
    await fs.writeFile(
      './test-checkpoints/progress.json',
      JSON.stringify(checkpoint)
    );
    
    const processor = new BatchProcessor(config);
    const urls = [
      'https://docs.anthropic.com/test1', // Should skip
      'https://docs.anthropic.com/test2'  // Should process
    ];
    
    const results = await processor.processBatch(urls);
    expect(results.skipped.length).toBe(1);
    expect(results.successful.length).toBe(1);
  });
});
```

## End-to-End Tests

### Full Pipeline Test
```bash
#!/bin/bash
# test/e2e/full-pipeline.sh

echo "=== E2E Test: Full Pipeline ==="

# 1. Setup
echo "1. Setting up test environment..."
docker run -d -p 6333:6333 --name test-qdrant qdrant/qdrant
sleep 5

# 2. Create test configuration
cat > test-config.json << EOF
{
  "reader": { "maxRetries": 2 },
  "embeddingProvider": "ollama",
  "qdrant": {
    "host": "localhost",
    "port": 6333,
    "collectionName": "test_claude_docs"
  },
  "delayBetweenDocs": 1000,
  "checkpointFile": "./test-checkpoint.json",
  "urlsFile": "./test-urls.json"
}
EOF

# 3. Create test URLs
cat > test-urls.json << EOF
{
  "urls": [
    "https://docs.anthropic.com/claude-code/overview",
    "https://docs.anthropic.com/claude-code/quickstart"
  ]
}
EOF

# 4. Run ingestion
echo "2. Running batch ingestion..."
node scripts/ingest-batch.js test-config.json

# 5. Verify storage
echo "3. Verifying Qdrant storage..."
curl -X POST 'http://localhost:6333/collections/test_claude_docs/points/scroll' \
  -H 'Content-Type: application/json' \
  -d '{"limit": 10}' | jq '.result.points | length'

# 6. Test search
echo "4. Testing search functionality..."
node scripts/test-search.js "getting started" test_claude_docs

# 7. Cleanup
echo "5. Cleaning up..."
docker stop test-qdrant && docker rm test-qdrant
rm test-config.json test-urls.json test-checkpoint.json

echo "=== E2E Test Complete ==="
```

## Quality Assurance Tests

### Extraction Quality Metrics
```javascript
// test/quality/extraction-quality.js
class ExtractionQualityTester {
  async compareWithBaseline(claudeExtracted, domParsed) {
    const metrics = {
      contentCompleteness: this.calculateCompleteness(claudeExtracted, domParsed),
      codeAccuracy: this.compareCodeBlocks(claudeExtracted, domParsed),
      structureQuality: this.evaluateStructure(claudeExtracted),
      metadataAccuracy: this.checkMetadata(claudeExtracted)
    };
    
    const overallScore = Object.values(metrics).reduce((a, b) => a + b) / 4;
    
    return {
      metrics,
      overallScore,
      grade: this.getGrade(overallScore)
    };
  }

  calculateCompleteness(extracted, baseline) {
    const extractedWords = this.countWords(extracted);
    const baselineWords = this.countWords(baseline);
    return Math.min(extractedWords / baselineWords, 1.0);
  }

  compareCodeBlocks(extracted, baseline) {
    const extractedCode = this.extractAllCode(extracted);
    const baselineCode = this.extractAllCode(baseline);
    
    let matches = 0;
    extractedCode.forEach(code => {
      if (baselineCode.some(b => this.fuzzyMatch(code, b))) {
        matches++;
      }
    });
    
    return baselineCode.length > 0 ? matches / baselineCode.length : 1.0;
  }

  getGrade(score) {
    if (score >= 0.95) return 'EXCELLENT';
    if (score >= 0.85) return 'GOOD';
    if (score >= 0.70) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }
}
```

## Performance Tests

### Speed and Efficiency
```javascript
// test/performance/speed-test.js
async function performanceTest() {
  const urls = [
    'https://docs.anthropic.com/claude-code/overview',
    'https://docs.anthropic.com/claude-code/quickstart',
    'https://docs.anthropic.com/claude-code/slash-commands'
  ];
  
  console.log('=== Performance Test ===');
  
  // Measure different configurations
  const configs = [
    { name: 'Sequential', parallel: false },
    { name: 'Parallel Embeddings', parallelEmbeddings: true },
    { name: 'Cached Embeddings', useCache: true }
  ];
  
  for (const config of configs) {
    const start = Date.now();
    const processor = new BatchProcessor(config);
    await processor.processBatch(urls);
    const duration = Date.now() - start;
    
    console.log(`${config.name}: ${duration}ms (${(duration/urls.length).toFixed(0)}ms per doc)`);
  }
}
```

## Resilience Tests

### Error Recovery Scenarios
```bash
# test/resilience/failure-scenarios.sh

echo "=== Resilience Test Suite ==="

# Test 1: Network failure recovery
echo "Test 1: Network failure simulation"
# Temporarily block network, run ingestion, verify retry behavior

# Test 2: Qdrant unavailable
echo "Test 2: Storage failure handling"
docker stop qdrant-test
node scripts/ingest-batch.js --test-mode
# Verify local caching works

# Test 3: Malformed Claude output
echo "Test 3: Bad output handling"
# Mock Claude to return invalid JSON
export MOCK_CLAUDE_OUTPUT="This is not JSON"
node scripts/ingest-batch.js --test-mode

# Test 4: Resume after crash
echo "Test 4: Crash recovery"
# Start processing, kill after 2 docs, restart
timeout 10s node scripts/ingest-batch.js
node scripts/resume-failed.js
```

## Test Automation

### CI/CD Integration
```yaml
# .github/workflows/test-ingestion.yml
name: Test Documentation Ingestion

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      qdrant:
        image: qdrant/qdrant
        ports:
          - 6333:6333
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run unit tests
      run: npm test
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run quality tests
      run: npm run test:quality
    
    - name: Generate coverage report
      run: npm run coverage
```

## Testing Checklist

### Pre-deployment
- [ ] All unit tests pass
- [ ] Integration tests complete
- [ ] E2E pipeline tested
- [ ] Quality metrics meet thresholds
- [ ] Performance benchmarks acceptable
- [ ] Resilience scenarios handled
- [ ] Documentation updated

### Quality Thresholds
- Content completeness: ≥ 90%
- Code accuracy: ≥ 95%
- Structure quality: ≥ 85%
- Overall score: ≥ 88%

### Performance Targets
- Single document: < 10 seconds
- Batch of 10: < 90 seconds
- Memory usage: < 500MB
- Retry success rate: > 95%