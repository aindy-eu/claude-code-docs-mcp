import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from 'dotenv';
import {
  generateEmbedding,
  getCollectionName,
  EmbeddingProvider,
  EMBEDDING_CONFIGS
} from './embeddings.js';

config();

const qdrant = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: parseInt(process.env.QDRANT_PORT || '6333')
});

async function testQdrantConnection() {
  console.info('🔍 Testing Qdrant connection...');

  try {
    await qdrant.getCollections();
    console.info('✅ Qdrant connection successful');
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Qdrant connection failed:', message);
    console.info('💡 Make sure Qdrant is running: docker run -p 6333:6333 qdrant/qdrant');
    return false;
  }
}

async function testEmbeddingGeneration(provider: EmbeddingProvider) {
  console.info(`\\n🧠 Testing ${provider} embedding generation...`);

  try {
    const testText = 'How do I implement slash commands in Claude Code?';
    const embedding = await generateEmbedding(testText, provider);

    const expectedDimensions = EMBEDDING_CONFIGS[provider].dimensions;
    if (embedding.length === expectedDimensions) {
      console.info(`✅ ${provider} embeddings working (${embedding.length} dimensions)`);
      return true;
    } else {
      console.error(
        `❌ Wrong embedding dimensions: expected ${expectedDimensions}, got ${embedding.length}`
      );
      return false;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${provider} embedding failed:`, message);

    if (provider === 'ollama') {
      console.info('💡 Make sure Ollama is running and nomic-embed-text is installed:');
      console.info('   ollama pull nomic-embed-text');
    } else {
      console.info('💡 Make sure OPENAI_API_KEY is set in your .env file');
    }
    return false;
  }
}

async function testCollectionExists(provider: EmbeddingProvider) {
  console.info(`\\n📦 Testing ${provider} collection...`);

  try {
    const collectionName = getCollectionName(provider);
    const info = await qdrant.getCollection(collectionName);

    console.info(`✅ Collection "${collectionName}" exists`);
    console.info(`   - Points: ${info.points_count || 0}`);
    console.info(`   - Vectors: ${info.config?.params?.vectors?.size || 'unknown'} dimensions`);

    return (info.points_count || 0) > 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Collection test failed:`, message);
    console.info(`💡 Run "npm run setup" to create collections`);
    return false;
  }
}

async function testSearch(provider: EmbeddingProvider) {
  console.info(`\\n🔍 Testing search with ${provider}...`);

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
      console.info(`✅ Search working - found ${results.points.length} results`);
      console.info(
        `   Best match: "${results.points[0].payload?.title}" (score: ${results.points[0].score?.toFixed(3)})`
      );
      return true;
    } else {
      console.info(`⚠️  Search returned no results - collection may be empty`);
      console.info(`💡 Use Claude-driven ingestion: npm run cli -- batch --core`);
      return false;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Search test failed:`, message);
    return false;
  }
}

async function runTests() {
  console.info('🧪 Claude Code Docs MCP Server Tests\\n');

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
    console.info('\\n❌ Cannot continue without Qdrant connection');
    return;
  }

  // Test Ollama embeddings
  results.ollama_embedding = await testEmbeddingGeneration('ollama');

  // Test OpenAI embeddings (optional)
  if (process.env.OPENAI_API_KEY) {
    results.openai_embedding = await testEmbeddingGeneration('openai');
  } else {
    console.info('\\n⚠️  Skipping OpenAI tests (no API key)');
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
  console.info('\\n📊 Test Summary:');
  console.info('================');

  const printResult = (name: string, result: boolean) => {
    console.info(`${result ? '✅' : '❌'} ${name}`);
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
    console.info('\\n🎉 Setup is working! You can now:');
    console.info('1. Run "npm start" to start the MCP server');
    console.info('2. Use with Claude Code:');
    console.info('   - Add: claude mcp add claude-docs node', process.cwd() + '/build/index.js');
    console.info('   - Use: claude "How do I implement slash commands?"');
  } else {
    console.info('\\n❌ Setup incomplete. Next steps:');
    if (!results.ollama_collection && !results.openai_collection) {
      console.info('1. Run "npm run setup" to create collections');
      console.info('2. Use Claude-driven ingestion: npm run cli -- batch --core');
    } else if (!results.ollama_search && !results.openai_search) {
      console.info('1. Use Claude-driven ingestion: npm run cli -- batch --core');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
