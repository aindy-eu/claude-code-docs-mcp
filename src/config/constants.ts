/**
 * Application Constants
 * Single source of truth for configuration values
 */

/**
 * Default TTL (Time To Live) for cached/ingested content in days
 * Content older than this is considered stale and will be re-ingested
 */
export const DEFAULT_TTL_DAYS = 7;

/**
 * Default data directory for domain-based storage
 * Structure: .data/{domain}/cache/, .data/{domain}/structured/, etc.
 */
export const DEFAULT_DATA_DIR = '.data';

/**
 * Search score threshold for vector similarity search
 * Results below this score (0.0 - 1.0) are filtered out
 *
 * Threshold Guidelines:
 * - 0.75+: High relevance, precise matches (recommended)
 * - 0.60-0.74: Medium relevance, broader matches
 * - 0.50-0.59: Low relevance, may include tangential results
 *
 * Based on empirical testing:
 * - "MCP scopes project local user" → 83% relevance (good query)
 * - Queries < 75% often indicate query quality issues
 */
export const SEARCH_SCORE_THRESHOLD = 0.75;
