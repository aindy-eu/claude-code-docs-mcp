import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from 'dotenv';
import { EMBEDDING_CONFIGS, getCollectionName, EmbeddingProvider } from './embeddings.js';

config();

const client = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: parseInt(process.env.QDRANT_PORT || '6333')
});

async function setupCollection(provider: EmbeddingProvider) {
  const config = EMBEDDING_CONFIGS[provider];
  const collectionName = getCollectionName(provider);

  try {
    console.info(`📦 Creating collection "${collectionName}" for ${provider}...`);

    await client.createCollection(collectionName, {
      vectors: {
        size: config.dimensions,
        distance: 'Cosine'
      }
    });

    console.info(`✅ Collection "${collectionName}" created successfully`);
    console.info(`   - Provider: ${provider}`);
    console.info(`   - Model: ${config.model}`);
    console.info(`   - Dimensions: ${config.dimensions}`);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.info(`⚠️  Collection "${collectionName}" already exists`);
    } else {
      console.error(`❌ Error creating collection "${collectionName}":`, error.message);
      throw error;
    }
  }
}

async function setupAllCollections() {
  console.info('🚀 Setting up Qdrant collections for Claude Code documentation...\n');

  try {
    // Test Qdrant connection
    await client.getCollections();
    console.info('✅ Qdrant connection successful\n');

    // Setup collections for both providers
    const providers: EmbeddingProvider[] = ['ollama', 'openai'];

    for (const provider of providers) {
      await setupCollection(provider);
    }

    console.info('\n🎉 All collections setup complete!');
    console.info('\nNext steps:');
    console.info('1. Use Claude-driven ingestion: npm run cli -- batch --core');
    console.info('2. Run "npm start" to start the MCP server');
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    console.info('\n💡 Make sure Qdrant is running:');
    console.info('   docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAllCollections();
}
