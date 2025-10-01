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
