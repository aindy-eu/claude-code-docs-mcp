/**
 * Fetch Service Types
 * Type definitions for HTML fetching and caching
 */

export interface FetchResult {
  html: string;
  finalUrl: string;
}

export interface CacheMetadata {
  url: string;
  cachedAt: string;
  size: number;
  contentHash: string;
  headers: Record<string, string>;
}

export interface CachePaths {
  dir: string;
  htmlPath: string;
  metaPath: string;
}
