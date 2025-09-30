#!/usr/bin/env node
/**
 * Test Search Script
 * Quick command-line search tool for testing the enhanced documentation search
 *
 * Usage:
 *   npm run search "your query"
 *   npm run search "your query" -- --provider openai
 *   npm run search "your query" -- --limit 5
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { search, formatSearchResults } from '../tools/search.js';
import { EmbeddingProvider } from '../services/hybrid-embeddings.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run search "your query" [-- --provider ollama|openai] [--limit N]');
    process.exit(1);
  }

  // Parse query and options
  let query = '';
  let provider: EmbeddingProvider = 'ollama';
  let limit = 3;
  const dashDashIndex = args.indexOf('--');

  if (dashDashIndex === -1) {
    query = args.join(' ');
  } else {
    query = args.slice(0, dashDashIndex).join(' ');
    const options = args.slice(dashDashIndex + 1);

    for (let i = 0; i < options.length; i++) {
      if (options[i] === '--provider' && options[i + 1]) {
        provider = options[i + 1] as EmbeddingProvider;
        i++;
      } else if (options[i] === '--limit' && options[i + 1]) {
        limit = parseInt(options[i + 1]);
        i++;
      }
    }
  }

  console.log(`\n🔍 Searching for: "${query}"`);
  console.log(`📊 Provider: ${provider}`);
  console.log(`📄 Limit: ${limit}\n`);

  try {
    // Initialize Qdrant client
    const qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333'
    });

    // Perform search
    const results = await search(qdrantClient, {
      query,
      provider,
      limit
    });

    // Format and display results
    const formattedResults = formatSearchResults(results);
    console.log(formattedResults);

    // Show enhanced metadata if available
    if (results.length > 0) {
      console.log('\n📊 Search Metadata:');
      console.log(`✓ Found ${results.length} results`);
      const hasClaudeDriven = results.some(r => r.extractionMethod === 'claude-driven');
      console.log(`✓ Extraction method: Claude-driven`);
    }
  } catch (error: any) {
    console.error('\n❌ Search failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
