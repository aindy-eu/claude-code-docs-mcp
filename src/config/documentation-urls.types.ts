/**
 * Documentation URLs Configuration Types
 * Type definitions for URL management and migrations
 */

export interface DocumentationSource {
  /** Current base URL for the documentation */
  current: string;
  /** Legacy URLs that should redirect to current */
  legacy: string[];
  /** Common path prefix for all pages */
  pathPrefix: string;
  /** Available documentation pages */
  pages: Record<string, string>;
}

export interface UrlMigration {
  from: string;
  to: string;
  migratedAt?: string;
}
