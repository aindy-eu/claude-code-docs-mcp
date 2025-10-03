/**
 * Shared types for pipeline orchestration
 */

export interface IngestOptions {
  force?: boolean;
  model?: string;
  provider?: string;
  quiet?: boolean;
  dev?: boolean; // Use minimal dev prompt for testing
}

export interface ExtractOptions {
  model?: string;
  force?: boolean;
  dev?: boolean; // Use minimal dev prompt for testing
}

export interface EmbedOptions {
  provider?: string;
}

export interface FetchOptions {
  force?: boolean;
}
