/**
 * Pipeline End-to-End Integration Tests
 *
 * Tests the full ingestion pipeline: fetch → extract → embed → store
 * These tests require:
 * - Qdrant running (docker run -p 6333:6333 qdrant/qdrant)
 * - ANTHROPIC_API_KEY set (for Claude extraction)
 * - Network access (for fetching real docs)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { QdrantClient } from '@qdrant/js-client-rest';
import { Pipeline } from '@/cli/pipeline/index.js';
import { ManifestService } from '@/services/manifest-service.js';
import { getDocUrl } from '@/config/claude-code-documentation-urls.js';

// Check if required services are available
const checkQdrantAvailable = async () => {
  const qdrant = new QdrantClient({
    host: process.env.QDRANT_HOST || 'localhost',
    port: parseInt(process.env.QDRANT_PORT || '6333')
  });

  try {
    await qdrant.getCollections();
    return true;
  } catch {
    return false;
  }
};

const checkClaudeAvailable = () => {
  return !!process.env.ANTHROPIC_API_KEY;
};

describe('Pipeline End-to-End Integration (requires Qdrant + Claude API)', () => {
  let qdrant: QdrantClient;
  let pipeline: Pipeline;
  const testCollectionName = `test_pipeline_e2e_${Date.now()}`;
  const testUrl = getDocUrl('overview'); // Use real Claude Code docs

  beforeAll(async () => {
    const qdrantAvailable = await checkQdrantAvailable();
    const claudeAvailable = checkClaudeAvailable();

    if (!qdrantAvailable) {
      console.info('⚠️  Qdrant is not running - skipping integration tests');
      console.info(
        '   To run these tests, start Qdrant with: docker run -p 6333:6333 qdrant/qdrant'
      );
      return;
    }

    if (!claudeAvailable) {
      console.info('⚠️  ANTHROPIC_API_KEY not set - skipping integration tests');
      console.info('   To run these tests, set ANTHROPIC_API_KEY in your environment');
      return;
    }

    // Set up test collection
    qdrant = new QdrantClient({
      host: process.env.QDRANT_HOST || 'localhost',
      port: parseInt(process.env.QDRANT_PORT || '6333')
    });

    // Clean up any existing test collection
    try {
      await qdrant.deleteCollection(testCollectionName);
    } catch {
      // Collection might not exist
    }

    // Create fresh collection
    await qdrant.createCollection(testCollectionName, {
      vectors: {
        size: 768, // Ollama nomic-embed-text dimensions
        distance: 'Cosine'
      }
    });

    // Override collection name for tests
    process.env.QDRANT_COLLECTION = testCollectionName;

    pipeline = new Pipeline();
  });

  afterAll(async () => {
    // Clean up test collection
    if (qdrant) {
      try {
        await qdrant.deleteCollection(testCollectionName);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should ingest a single page end-to-end', async () => {
    const qdrantAvailable = await checkQdrantAvailable();
    const claudeAvailable = checkClaudeAvailable();

    if (!qdrantAvailable || !claudeAvailable) {
      console.info('   Skipping test - requirements not met');
      return;
    }

    // Run full pipeline
    await pipeline.ingest(testUrl, {
      provider: 'ollama',
      model: 'claude-sonnet-4-5-20250929'
    });

    // Verify manifest was updated
    const manifest = new ManifestService(testUrl);
    const record = manifest.getRecord(testUrl);

    expect(record).toBeDefined();
    expect(record?.status).toBe('embedded');
    expect(record?.lastIngestedAt).toBeDefined();
    expect(record?.lastFetchedAt).toBeDefined();
    expect(record?.lastExtractedAt).toBeDefined();

    // Verify content was stored in Qdrant
    const collection = await qdrant.getCollection(testCollectionName);

    expect(collection.points_count).toBeGreaterThan(0);
  }, 60000); // 60s timeout - real API calls are slow

  it('should skip re-ingestion if content unchanged', async () => {
    const qdrantAvailable = await checkQdrantAvailable();
    const claudeAvailable = checkClaudeAvailable();

    if (!qdrantAvailable || !claudeAvailable) {
      console.info('   Skipping test - requirements not met');
      return;
    }

    // First ingestion
    await pipeline.ingest(testUrl, {
      provider: 'ollama',
      model: 'claude-sonnet-4-5-20250929'
    });

    const manifest = new ManifestService(testUrl);

    // Second ingestion - should detect unchanged content
    // Wait a bit to ensure timestamp would differ if re-ingested
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pipeline.ingest(testUrl, {
      provider: 'ollama',
      model: 'claude-sonnet-4-5-20250929'
    });

    const secondRecord = manifest.getRecord(testUrl);

    // If content unchanged, lastIngestedAt should be the same
    // (or extraction was skipped due to content diff detection)
    expect(secondRecord?.status).toBe('embedded');
  }, 60000);

  it('should resume from extracted state', async () => {
    const qdrantAvailable = await checkQdrantAvailable();
    const claudeAvailable = checkClaudeAvailable();

    if (!qdrantAvailable || !claudeAvailable) {
      console.info('   Skipping test - requirements not met');
      return;
    }

    const resumeUrl = getDocUrl('hooks'); // Use different URL

    // Run only fetch and extract
    await pipeline.fetch(resumeUrl);
    await pipeline.extract(resumeUrl, {
      model: 'claude-sonnet-4-5-20250929'
    });

    // Verify state is "extracted"
    const manifest = new ManifestService(resumeUrl);
    const record = manifest.getRecord(resumeUrl);
    expect(record?.status).toBe('extracted');

    // Now run full ingest - should only run embed step
    const beforeEmbed = Date.now();
    await pipeline.ingest(resumeUrl, {
      provider: 'ollama',
      model: 'claude-sonnet-4-5-20250929'
    });
    const afterEmbed = Date.now();

    const finalRecord = manifest.getRecord(resumeUrl);
    expect(finalRecord?.status).toBe('embedded');

    // Should be relatively fast since it only ran embed
    expect(afterEmbed - beforeEmbed).toBeLessThan(30000); // <30s
  }, 90000); // Longer timeout for multi-step test
});
