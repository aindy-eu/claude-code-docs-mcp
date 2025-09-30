import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from 'dotenv';
import {
  generateEmbedding,
  getCollectionName,
  EmbeddingProvider,
  EMBEDDING_CONFIGS
} from '../services/hybrid-embeddings.js';

config();

const qdrant = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: parseInt(process.env.QDRANT_PORT || '6333')
});

async function testQdrantConnection() {
  console.log('🔍 Testing Qdrant connection...');

  try {
    await qdrant.getCollections();
    console.log('✅ Qdrant connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Qdrant connection failed:', error.message);
    console.log('💡 Make sure Qdrant is running: docker run -p 6333:6333 qdrant/qdrant');
    return false;
  }
}

async function testEmbeddingGeneration(provider: EmbeddingProvider) {
  console.log(`\\n🧠 Testing ${provider} embedding generation...`);

  try {
    const testText = 'How do I implement slash commands in Claude Code?';
    const embedding = await generateEmbedding(testText, provider);

    const expectedDimensions = EMBEDDING_CONFIGS[provider].dimensions;
    if (embedding.length === expectedDimensions) {
      console.log(`✅ ${provider} embeddings working (${embedding.length} dimensions)`);
      return true;
    } else {
      console.error(
        `❌ Wrong embedding dimensions: expected ${expectedDimensions}, got ${embedding.length}`
      );
      return false;
    }
  } catch (error: any) {
    console.error(`❌ ${provider} embedding failed:`, error.message);

    if (provider === 'ollama') {
      console.log('💡 Make sure Ollama is running and nomic-embed-text is installed:');
      console.log('   ollama pull nomic-embed-text');
    } else {
      console.log('💡 Make sure OPENAI_API_KEY is set in your .env file');
    }
    return false;
  }
}

async function testCollectionExists(provider: EmbeddingProvider) {
  console.log(`\\n📦 Testing ${provider} collection...`);

  try {
    const collectionName = getCollectionName(provider);
    const info = await qdrant.getCollection(collectionName);

    console.log(`✅ Collection "${collectionName}" exists`);
    console.log(`   - Points: ${info.points_count || 0}`);
    console.log(`   - Vectors: ${info.config?.params?.vectors?.size || 'unknown'} dimensions`);

    return (info.points_count || 0) > 0;
  } catch (error: any) {
    console.error(`❌ Collection test failed:`, error.message);
    console.log(`💡 Run "npm run setup" to create collections`);
    return false;
  }
}

async function testSearch(provider: EmbeddingProvider) {
  console.log(`\\n🔍 Testing search with ${provider}...`);

  try {
    const query = 'slash commands implementation';
    const queryEmbedding = await generateEmbedding(query, provider);
    const collectionName = getCollectionName(provider);

    const results = await qdrant.query(collectionName, {
      query: queryEmbedding,
      limit: 2,
      with_payload: true
    });

    if (results.points.length > 0) {
      console.log(`✅ Search working - found ${results.points.length} results`);
      console.log(
        `   Best match: "${results.points[0].payload?.title}" (score: ${results.points[0].score?.toFixed(3)})`
      );
      return true;
    } else {
      console.log(`⚠️  Search returned no results - collection may be empty`);
      console.log(`💡 Use Claude-driven ingestion: ./tools/batch-ingest`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Search test failed:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Claude Code Docs MCP Server Tests\\n');

  const results = {
    qdrant: false,
    ollama_embedding: false,
    openai_embedding: false,
    ollama_collection: false,
    openai_collection: false,
    ollama_search: false,
    openai_search: false
  };

  // Test Qdrant connection
  results.qdrant = await testQdrantConnection();
  if (!results.qdrant) {
    console.log('\\n❌ Cannot continue without Qdrant connection');
    return;
  }

  // Test Ollama embeddings
  results.ollama_embedding = await testEmbeddingGeneration('ollama');

  // Test OpenAI embeddings (optional)
  if (process.env.OPENAI_API_KEY) {
    results.openai_embedding = await testEmbeddingGeneration('openai');
  } else {
    console.log('\\n⚠️  Skipping OpenAI tests (no API key)');
  }

  // Test collections
  if (results.ollama_embedding) {
    results.ollama_collection = await testCollectionExists('ollama');
    if (results.ollama_collection) {
      results.ollama_search = await testSearch('ollama');
    }
  }

  if (results.openai_embedding) {
    results.openai_collection = await testCollectionExists('openai');
    if (results.openai_collection) {
      results.openai_search = await testSearch('openai');
    }
  }

  // Summary
  console.log('\\n📊 Test Summary:');
  console.log('================');

  const printResult = (name: string, result: boolean) => {
    console.log(`${result ? '✅' : '❌'} ${name}`);
  };

  printResult('Qdrant Connection', results.qdrant);
  printResult('Ollama Embeddings', results.ollama_embedding);
  printResult('OpenAI Embeddings', results.openai_embedding);
  printResult('Ollama Collection', results.ollama_collection);
  printResult('OpenAI Collection', results.openai_collection);
  printResult('Ollama Search', results.ollama_search);
  printResult('OpenAI Search', results.openai_search);

  const hasWorkingSetup = results.ollama_search || results.openai_search;

  if (hasWorkingSetup) {
    console.log('\\n🎉 Setup is working! You can now:');
    console.log('1. Run "npm start" to start the MCP server');
    console.log('2. Use with Claude Code:');
    console.log('   - Add: claude mcp add claude-docs node', process.cwd() + '/build/index.js');
    console.log('   - Use: claude "How do I implement slash commands?"');
  } else {
    console.log('\\n❌ Setup incomplete. Next steps:');
    if (!results.ollama_collection && !results.openai_collection) {
      console.log('1. Run "npm run setup" to create collections');
      console.log('2. Use Claude-driven ingestion: ./tools/batch-ingest');
    } else if (!results.ollama_search && !results.openai_search) {
      console.log('1. Use Claude-driven ingestion: ./tools/batch-ingest');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
