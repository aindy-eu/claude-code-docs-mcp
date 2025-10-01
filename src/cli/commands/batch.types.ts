/**
 * Batch Command Types
 * Type definitions for batch ingestion operations
 */

export interface BatchOptions {
  core?: boolean;
  pages?: string[];
  staleOnly?: boolean;
  force?: boolean;
  dryRun?: boolean;
  provider?: string;
  model?: string;
  dev?: boolean;
}

export interface BatchContext {
  urls: string[];
  results: {
    success: string[];
    failed: Array<{ url: string; error: string }>;
    skipped: string[]; // Skipped due to freshness check
    unchanged: string[]; // Skipped due to content diff
  };
  startTime: number;
}
