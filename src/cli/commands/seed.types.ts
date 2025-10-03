/**
 * Seed Command Types
 */

export interface SeedOptions {
  all?: boolean;
  model?: string;
  provider?: string;
  dev?: boolean;
}

export interface SeedContext {
  results: Array<{
    url: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  startTime: number;
}
