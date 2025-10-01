/**
 * Manifest State Tracking Tests
 * Tests how manifest tracks pipeline progression through stages
 */

import { ManifestService } from '@/services/manifest-service.js';

const TEST_URL = 'https://test.com/docs/manifest-tracking-test';

describe('Manifest State Tracking', () => {
  let manifestService: ManifestService;

  beforeEach(() => {
    manifestService = new ManifestService(TEST_URL);
  });

  it('should track pipeline progression through stages', async () => {
    // Stage 1: Fetch
    manifestService.updateFetched(TEST_URL);
    let record = manifestService.getRecord(TEST_URL);

    expect(record?.status).toBe('fetched');
    expect(record?.lastFetchedAt).toBeDefined();
    expect(record?.url).toBe(TEST_URL);

    const fetchTime = record?.lastFetchedAt;

    // Stage 2: Extract
    await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamp
    manifestService.updateExtracted(TEST_URL, {
      model: 'claude-sonnet-4-5-20250929'
    });
    record = manifestService.getRecord(TEST_URL);

    expect(record?.status).toBe('extracted');
    expect(record?.lastExtractedAt).toBeDefined();
    expect(record?.extractionModel).toBe('claude-sonnet-4-5-20250929');
    expect(record?.lastFetchedAt).toBe(fetchTime); // Preserved

    // Stage 3: Embed
    await new Promise(resolve => setTimeout(resolve, 10));
    manifestService.updateEmbedded(TEST_URL, {
      provider: 'ollama'
    });
    record = manifestService.getRecord(TEST_URL);

    expect(record?.status).toBe('embedded');
    expect(record?.lastEmbeddedAt).toBeDefined();
    expect(record?.lastIngestedAt).toBeDefined();
    expect(record?.embeddingProvider).toBe('ollama');
    expect(record?.lastFetchedAt).toBe(fetchTime); // Still preserved
    expect(record?.extractionModel).toBe('claude-sonnet-4-5-20250929'); // Preserved
  });

  it('should handle failed pipeline stage', async () => {
    manifestService.updateFetched(TEST_URL);

    // Simulate extraction failure
    manifestService.updateFailed(TEST_URL, 'Claude API timeout');

    const record = manifestService.getRecord(TEST_URL);
    expect(record?.status).toBe('failed');
    expect(record?.lastError).toBe('Claude API timeout');
    expect(record?.lastFailedAt).toBeDefined();
    expect(record?.lastFetchedAt).toBeDefined(); // Previous stage preserved
  });

  it('should preserve all metadata through complete pipeline', async () => {
    // Complete pipeline progression
    manifestService.updateFetched(TEST_URL);
    await new Promise(resolve => setTimeout(resolve, 5));

    manifestService.updateExtracted(TEST_URL, {
      model: 'claude-sonnet-4-5-20250929'
    });
    await new Promise(resolve => setTimeout(resolve, 5));

    manifestService.updateEmbedded(TEST_URL, {
      provider: 'openai'
    });

    const record = manifestService.getRecord(TEST_URL);

    // All timestamps should exist
    expect(record?.lastFetchedAt).toBeDefined();
    expect(record?.lastExtractedAt).toBeDefined();
    expect(record?.lastEmbeddedAt).toBeDefined();
    expect(record?.lastIngestedAt).toBeDefined();

    // All metadata preserved
    expect(record?.extractionModel).toBe('claude-sonnet-4-5-20250929');
    expect(record?.embeddingProvider).toBe('openai');
    expect(record?.status).toBe('embedded');

    // Timestamps should be chronological
    expect(record?.lastExtractedAt).toBeDefined();
    expect(record?.lastFetchedAt).toBeDefined();
    expect(record?.lastEmbeddedAt).toBeDefined();

    if (record && record.lastExtractedAt && record.lastFetchedAt && record.lastEmbeddedAt) {
      expect(record.lastExtractedAt >= record.lastFetchedAt).toBe(true);
      expect(record.lastEmbeddedAt >= record.lastExtractedAt).toBe(true);
    }
  });

  it('should track content check without full ingestion', async () => {
    // Simulate content diff finding no changes
    manifestService.updateUnchanged(TEST_URL);

    const record = manifestService.getRecord(TEST_URL);
    expect(record?.lastCheckedAt).toBeDefined();
    expect(record?.url).toBe(TEST_URL);
  });
});
