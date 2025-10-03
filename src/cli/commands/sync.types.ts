/**
 * Sync Command Types
 */

export interface SyncOptions {
  check?: boolean; // Dry run - show what would be updated
  ttl?: number; // Custom TTL in days
  model?: string;
  provider?: string;
  dev?: boolean;
}

export interface SyncContext {
  results: Array<{
    url: string;
    status: 'success' | 'unchanged' | 'failed';
    error?: string;
  }>;
  startTime: number;
}

export interface UrlStatus {
  url: string;
  needsUpdate: boolean;
  reason: string;
  lastIngested?: Date;
  daysSinceIngestion?: number;
}
