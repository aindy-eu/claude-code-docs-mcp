/**
 * Manifest Service Types
 * Type definitions for manifest tracking and state management
 */

export interface ManifestRecord {
  url: string;
  status: 'fetched' | 'extracted' | 'structured' | 'embedded' | 'failed';

  // Timestamps
  lastFetchedAt?: string;
  lastExtractedAt?: string;
  lastStructuredAt?: string;
  lastEmbeddedAt?: string;
  lastIngestedAt?: string;
  lastFailedAt?: string;
  lastCheckedAt?: string; // Content diff check timestamp

  // File Sizes (bytes)
  htmlCacheSize?: number; // Body-only HTML cache file size
  structuredJsonSize?: number; // Extracted JSON file size

  // Duration Metrics (milliseconds)
  fetchDurationMs?: number; // Time to fetch and save HTML
  extractDurationMs?: number; // Time for Claude extraction
  embedDurationMs?: number; // Time to generate embeddings + upsert
  totalDurationMs?: number; // Sum of all stage durations

  // Metadata
  extractionModel?: string;
  embeddingProvider?: string;
  sectionCount?: number;
  codeExampleCount?: number;
  lastError?: string;

  // Deprecated (kept for backward compatibility - remove in v3.0)
  /** @deprecated Use structuredJsonSize instead */
  rawResponseSize?: number;
  /** @deprecated Use structuredJsonSize instead */
  outputSize?: number;
}

export interface Manifest {
  version: string;
  domain: string;
  createdAt: string;
  lastUpdatedAt: string;
  defaultTTLDays: number;
  records: Record<string, ManifestRecord>;
}

export interface UpdateOptions {
  provider?: string;
  model?: string;
  jsonPath?: string;
  htmlPath?: string;
  error?: string;

  // Duration metrics
  fetchDurationMs?: number;
  extractDurationMs?: number;
  embedDurationMs?: number;
}
