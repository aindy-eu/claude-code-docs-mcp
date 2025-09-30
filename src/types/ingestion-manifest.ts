/**
 * Types for tracking documentation ingestion state
 */

export interface IngestionRecord {
  /** URL of the documentation page */
  url: string;

  /** When this page was last successfully ingested */
  lastIngestedAt: string; // ISO date string

  /** When Claude last read this page */
  lastReadAt: string;

  /** SHA256 hash of Claude's JSON output */
  contentHash: string;

  /** Status of last ingestion attempt */
  status: 'success' | 'failed' | 'pending';

  /** Error message if failed */
  error?: string;

  /** Size of the JSON output in bytes */
  outputSize: number;

  /** Number of sections extracted */
  sectionCount: number;

  /** Number of embeddings generated */
  embeddingCount: number;

  /** Which provider was used */
  embeddingProvider: 'ollama' | 'openai';
}

export interface IngestionManifest {
  /** Version for future compatibility */
  version: '1.0';

  /** When the manifest was created */
  createdAt: string;

  /** When the manifest was last updated */
  lastUpdatedAt: string;

  /** Default time-to-live in days before re-ingestion */
  defaultTTLDays: number;

  /** Records indexed by URL */
  records: Record<string, IngestionRecord>;

  /** Statistics */
  stats: {
    totalPages: number;
    successfulIngestions: number;
    failedIngestions: number;
    totalEmbeddings: number;
    lastFullBatchAt?: string;
  };

  /** Migration history (optional) */
  migrations?: Array<{
    date: string;
    migratedCount: number;
    totalRecords: number;
  }>;
}

export interface IngestionOptions {
  /** Force re-ingestion even if recent */
  force?: boolean;

  /** Custom TTL in days for this ingestion */
  ttlDays?: number;

  /** Skip pages ingested within this many days */
  skipIfIngestedWithinDays?: number;
}

export interface IngestionStatus {
  url: string;
  needsUpdate: boolean;
  reason?: 'never-ingested' | 'expired' | 'failed-last-time' | 'forced';
  lastIngestedAt?: string;
  daysSinceIngestion?: number;
}
