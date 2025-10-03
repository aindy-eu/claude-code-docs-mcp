/**
 * Master Manifest Types
 * Tracks all documentation sources across domains
 */

export interface SourceMetadata {
  type: string;
  addedAt: string;
  lastSyncedAt?: string;
  urlCount: number;
  status: 'active' | 'inactive';
}

export interface MasterManifest {
  version: string;
  sources: Record<string, SourceMetadata>;
}
