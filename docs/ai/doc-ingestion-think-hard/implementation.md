# Think Hard Implementation Guide

## Project Structure

```
doc-ingestion-think-hard/
├── src/
│   ├── ClaudeDocReader.js      # Manages Claude interactions
│   ├── SchemaValidator.js      # Validates JSON output
│   ├── EmbeddingService.js     # Real embedding generation
│   ├── QdrantService.js        # Storage with retry logic
│   ├── BatchProcessor.js       # Orchestrates batch runs
│   └── ProgressTracker.js      # Checkpoint management
├── schemas/
│   └── doc-schema.json         # JSON validation schema
├── config/
│   ├── default.json            # Default settings
│   └── urls.json               # Documentation URLs
├── checkpoints/                # Progress saves
├── logs/                       # Detailed logging
└── scripts/
    ├── ingest-batch.js         # Main entry point
    ├── validate-quality.js     # Quality checker
    └── resume-failed.js        # Recovery script
```

## Core Components

### 1. Claude Document Reader
```javascript
// src/ClaudeDocReader.js
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ClaudeDocReader {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 60000;
    this.promptTemplate = options.promptTemplate || this.getDefaultPrompt();
  }

  async readDocument(url) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📖 Reading ${url} (attempt ${attempt}/${this.maxRetries})`);
        
        const prompt = this.promptTemplate.replace(/{url}/g, url);
        const tempFile = path.join('temp', `claude-output-${Date.now()}.json`);
        
        // Execute Claude command and save output
        const command = `claude "${prompt}" > ${tempFile}`;
        execSync(command, { 
          timeout: this.timeout,
          stdio: 'inherit' 
        });
        
        // Read and parse output
        const content = await fs.readFile(tempFile, 'utf-8');
        const json = this.extractJSON(content);
        
        // Clean up
        await fs.unlink(tempFile);
        
        return json;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          await this.delay(2000 * attempt); // Exponential backoff
        }
      }
    }
    
    throw new Error(`Failed to read ${url} after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  extractJSON(content) {
    // Handle various Claude output formats
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude output');
    }
    
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Try to fix common JSON issues
      const fixed = jsonMatch[0]
        .replace(/'/g, '"')
        .replace(/\n/g, '\\n')
        .replace(/,\s*}/g, '}');
      
      return JSON.parse(fixed);
    }
  }

  getDefaultPrompt() {
    return `Read the documentation at {url} and output ONLY a JSON structure (no other text) with this schema:
{
  "url": "{url}",
  "title": "extracted page title",
  "sections": [
    {
      "id": "unique-id-based-on-heading",
      "heading": "section heading text",
      "content": "complete section content",
      "codeExamples": ["array", "of", "code", "examples"],
      "level": 1-4 (heading level)
    }
  ],
  "metadata": {
    "extractedAt": "ISO timestamp",
    "wordCount": total word count,
    "codeBlockCount": number of code examples
  }
}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ClaudeDocReader;
```

### 2. Schema Validator
```javascript
// src/SchemaValidator.js
const Joi = require('joi');

class SchemaValidator {
  constructor() {
    this.schema = Joi.object({
      url: Joi.string().uri().required(),
      title: Joi.string().required(),
      sections: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          heading: Joi.string().required(),
          content: Joi.string().min(10).required(),
          codeExamples: Joi.array().items(Joi.string()).default([]),
          level: Joi.number().integer().min(1).max(4).default(2)
        })
      ).min(1).required(),
      metadata: Joi.object({
        extractedAt: Joi.string().isoDate().required(),
        wordCount: Joi.number().integer().min(0).required(),
        codeBlockCount: Joi.number().integer().min(0).required()
      }).required()
    });
  }

  validate(data) {
    const { error, value } = this.schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const details = error.details.map(d => `- ${d.message}`).join('\n');
      throw new Error(`Validation failed:\n${details}`);
    }
    
    return value;
  }

  async validateWithFallback(data, url) {
    try {
      return this.validate(data);
    } catch (error) {
      console.warn('⚠️  Validation failed, attempting to fix...');
      
      // Try to fix common issues
      const fixed = {
        ...data,
        url: data.url || url,
        metadata: {
          extractedAt: new Date().toISOString(),
          wordCount: this.countWords(data),
          codeBlockCount: this.countCodeBlocks(data),
          ...data.metadata
        }
      };
      
      return this.validate(fixed);
    }
  }

  countWords(data) {
    const text = data.sections?.map(s => s.content).join(' ') || '';
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  countCodeBlocks(data) {
    return data.sections?.reduce((sum, s) => sum + (s.codeExamples?.length || 0), 0) || 0;
  }
}

module.exports = SchemaValidator;
```

### 3. Embedding Service
```javascript
// src/EmbeddingService.js
const fetch = require('node-fetch');

class EmbeddingService {
  constructor(provider = 'ollama', config = {}) {
    this.provider = provider;
    this.config = {
      ollama: {
        url: 'http://localhost:11434/api/embeddings',
        model: 'nomic-embed-text',
        ...config.ollama
      },
      openai: {
        url: 'https://api.openai.com/v1/embeddings',
        model: 'text-embedding-3-small',
        apiKey: process.env.OPENAI_API_KEY,
        ...config.openai
      }
    };
  }

  async generateEmbedding(text) {
    const method = this.provider === 'ollama' 
      ? this.generateOllamaEmbedding 
      : this.generateOpenAIEmbedding;
    
    return method.call(this, text);
  }

  async generateOllamaEmbedding(text) {
    const response = await fetch(this.config.ollama.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.ollama.model,
        prompt: text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  async generateOpenAIEmbedding(text) {
    const response = await fetch(this.config.openai.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openai.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.openai.model,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async generateBatchEmbeddings(sections) {
    const embeddings = [];
    
    for (const section of sections) {
      try {
        const text = `${section.heading}\n\n${section.content}`;
        const embedding = await this.generateEmbedding(text);
        
        embeddings.push({
          ...section,
          embedding
        });
        
        // Rate limiting
        await this.delay(100);
        
      } catch (error) {
        console.error(`Failed to embed section ${section.id}: ${error.message}`);
        embeddings.push({
          ...section,
          embedding: null,
          embeddingError: error.message
        });
      }
    }
    
    return embeddings;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = EmbeddingService;
```

### 4. Batch Processor
```javascript
// src/BatchProcessor.js
const ClaudeDocReader = require('./ClaudeDocReader');
const SchemaValidator = require('./SchemaValidator');
const EmbeddingService = require('./EmbeddingService');
const QdrantService = require('./QdrantService');
const ProgressTracker = require('./ProgressTracker');

class BatchProcessor {
  constructor(config) {
    this.config = config;
    this.reader = new ClaudeDocReader(config.reader);
    this.validator = new SchemaValidator();
    this.embedder = new EmbeddingService(config.embeddingProvider);
    this.storage = new QdrantService(config.qdrant);
    this.progress = new ProgressTracker(config.checkpointFile);
  }

  async processBatch(urls) {
    console.log(`🚀 Starting batch processing of ${urls.length} documents\n`);
    
    const startTime = Date.now();
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    // Load previous progress
    const checkpoint = await this.progress.load();
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      // Skip if already processed
      if (checkpoint.completed.includes(url)) {
        console.log(`⏭️  Skipping ${url} (already completed)`);
        results.skipped.push(url);
        continue;
      }
      
      try {
        await this.processDocument(url, i + 1, urls.length);
        results.successful.push(url);
        await this.progress.markCompleted(url);
        
      } catch (error) {
        console.error(`❌ Failed to process ${url}: ${error.message}`);
        results.failed.push({ url, error: error.message });
        await this.progress.markFailed(url, error.message);
      }
      
      // Delay between documents
      if (i < urls.length - 1) {
        await this.delay(this.config.delayBetweenDocs || 5000);
      }
    }
    
    const duration = (Date.now() - startTime) / 1000;
    this.printSummary(results, duration);
    
    return results;
  }

  async processDocument(url, current, total) {
    console.log(`\n📄 Processing ${current}/${total}: ${url}`);
    
    // Step 1: Read with Claude
    console.log('  1️⃣  Reading document...');
    const rawData = await this.reader.readDocument(url);
    
    // Step 2: Validate
    console.log('  2️⃣  Validating structure...');
    const validated = await this.validator.validateWithFallback(rawData, url);
    
    // Step 3: Generate embeddings
    console.log('  3️⃣  Generating embeddings...');
    const embedded = await this.embedder.generateBatchEmbeddings(validated.sections);
    
    // Step 4: Store in Qdrant
    console.log('  4️⃣  Storing in Qdrant...');
    await this.storage.storeDocument(validated, embedded);
    
    console.log(`  ✅ Successfully processed ${url}`);
  }

  printSummary(results, duration) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Batch Processing Summary');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${results.successful.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    console.log(`⏱️  Duration: ${duration.toFixed(1)}s`);
    
    if (results.failed.length > 0) {
      console.log('\nFailed documents:');
      results.failed.forEach(f => {
        console.log(`  - ${f.url}: ${f.error}`);
      });
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BatchProcessor;
```

### 5. Main Script
```javascript
// scripts/ingest-batch.js
const fs = require('fs').promises;
const path = require('path');
const BatchProcessor = require('../src/BatchProcessor');

async function main() {
  // Load configuration
  const configPath = process.argv[2] || './config/default.json';
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
  
  // Load URLs
  const urlsPath = config.urlsFile || './config/urls.json';
  const { urls } = JSON.parse(await fs.readFile(urlsPath, 'utf-8'));
  
  // Create necessary directories
  await fs.mkdir('temp', { recursive: true });
  await fs.mkdir('checkpoints', { recursive: true });
  await fs.mkdir('logs', { recursive: true });
  
  // Process batch
  const processor = new BatchProcessor(config);
  await processor.processBatch(urls);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

## Configuration

### config/default.json
```json
{
  "reader": {
    "maxRetries": 3,
    "timeout": 60000
  },
  "embeddingProvider": "ollama",
  "qdrant": {
    "host": "localhost",
    "port": 6333,
    "collectionName": "claude_docs_think_hard"
  },
  "delayBetweenDocs": 5000,
  "checkpointFile": "./checkpoints/progress.json",
  "urlsFile": "./config/urls.json"
}
```

### config/urls.json
```json
{
  "urls": [
    "https://docs.anthropic.com/claude-code/overview",
    "https://docs.anthropic.com/claude-code/quickstart",
    "https://docs.anthropic.com/claude-code/slash-commands",
    "https://docs.anthropic.com/claude-code/settings",
    "https://docs.anthropic.com/claude-code/hooks",
    "https://docs.anthropic.com/claude-code/mcp"
  ]
}
```

## Usage Examples

```bash
# Basic batch processing
node scripts/ingest-batch.js

# With custom config
node scripts/ingest-batch.js ./config/production.json

# Resume from failure
node scripts/resume-failed.js

# Validate quality
node scripts/validate-quality.js
```

## Key Improvements

1. **Modular Architecture** - Separated concerns for maintainability
2. **Robust Error Handling** - Retries, fallbacks, and detailed logging
3. **Progress Tracking** - Resume capability with checkpoints
4. **Real Embeddings** - Actual vector generation
5. **Validation** - Schema enforcement with auto-fixing
6. **Professional Structure** - Configuration-driven, testable