/**
 * Sync Command Types
 */

export interface SyncOptions {
  check?: boolean; // Dry run - show what would be updated
  ttl?: number; // Custom TTL in days
  model?: string;
  provider?: string;
  dev?: boolean;
  source?: string; // Filter by specific domain (e.g., 'docs.claude.com')
  all?: boolean; // Explicit flag for all sources
  type?: string; // Filter by source type (e.g., 'documentation')
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
