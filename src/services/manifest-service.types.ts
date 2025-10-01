/**
 * Manifest Service Types
 * Type definitions for manifest tracking and state management
 */

export interface ManifestRecord {
  url: string;
  status: 'fetched' | 'extracted' | 'structured' | 'embedded' | 'failed';
  lastFetchedAt?: string;
  lastExtractedAt?: string;
  lastStructuredAt?: string;
  lastEmbeddedAt?: string;
  lastIngestedAt?: string;
  lastFailedAt?: string;
  extractionModel?: string;
  embeddingProvider?: string;
  rawResponseSize?: number;
  outputSize?: number;
  sectionCount?: number;
  codeExampleCount?: number;
  lastError?: string;
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
  error?: string;
}
