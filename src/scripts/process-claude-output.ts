#!/usr/bin/env node
/**
 * Process Claude Output Script
 * Reads Claude's JSON output from stdin or file and processes it into embeddings
 * 
 * Usage:
 *   npm run process-claude < claude-output.json
 *   npm run process-claude claude-output.json
 *   npm run process-claude --provider openai < claude-output.json
 */

import { readFileSync } from 'fs';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ClaudeOutputProcessor } from '../services/claude-output-processor.js';
import { EmbeddingProvider } from '../services/hybrid-embeddings.js';
import { logger } from '../utils/logger.js';
import { ClaudeDocOutput } from '../types/claude-ingestion.js';

async function main() {
  const args = process.argv.slice(2);
  let provider: EmbeddingProvider = 'ollama';
  let inputFile: string | null = null;
  let source = 'manual-ingestion';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider' && args[i + 1]) {
      provider = args[i + 1] as EmbeddingProvider;
      i++;
    } else if (args[i] === '--source' && args[i + 1]) {
      source = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      inputFile = args[i];
    }
  }

  try {
    // Read input
    let jsonString: string;
    if (inputFile) {
      jsonString = readFileSync(inputFile, 'utf-8');
      logger.info(`Reading from file: ${inputFile}`);
    } else {
      // Read from stdin
      jsonString = '';
      process.stdin.setEncoding('utf-8');
      
      for await (const chunk of process.stdin) {
        jsonString += chunk;
      }
      logger.info('Read input from stdin');
    }

    if (!jsonString.trim()) {
      logger.error('No input provided');
      process.exit(1);
    }

    // Parse and validate
    const output: ClaudeDocOutput = JSON.parse(jsonString);
    
    if (!output.sections || !Array.isArray(output.sections)) {
      throw new Error('Invalid format: missing sections array');
    }

    // Initialize Qdrant client
    const qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333'
    });

    // Process the output
    const processor = new ClaudeOutputProcessor(qdrantClient, provider);
    const result = await processor.processClaudeOutput(output, provider);

    // Report results
    console.log('\n📊 Processing Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📄 Documents processed: ${result.documentsProcessed}`);
    console.log(`🧮 Embeddings generated: ${result.embeddingsGenerated}`);
    console.log(`📑 Total sections: ${result.stats.totalSections}`);
    console.log(`💻 Code examples: ${result.stats.totalCodeExamples}`);
    console.log(`💡 Key concepts: ${result.stats.totalConcepts}`);
    console.log(`⏱️  Processing time: ${result.stats.processingTimeMs}ms`);

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Print example usage
    if (result.success && result.documentsProcessed > 0) {
      console.log('\n🔍 You can now search this content using:');
      console.log(`   npm run search "your query" -- --provider ${provider}`);
      console.log('\n💡 Or use the MCP server with Claude Code:');
      console.log('   claude "search for X in my documentation" --mcp-server ./build/index.js');
    }

    process.exit(result.success ? 0 : 1);

  } catch (error: any) {
    logger.error('Processing failed:', error);
    console.error('\n❌ Error:', error.message);
    console.error('\nUsage:');
    console.error('  npm run process-claude < claude-output.json');
    console.error('  npm run process-claude claude-output.json');
    console.error('  npm run process-claude --provider openai --source "docs-url" < claude-output.json');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}