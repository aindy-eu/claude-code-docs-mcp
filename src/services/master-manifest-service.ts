/**
 * Master Manifest Service
 * Tracks all documentation sources in .data/manifest.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import type { MasterManifest, SourceMetadata } from './master-manifest-service.types.js';

export class MasterManifestService {
  private manifestPath: string;

  constructor() {
    this.manifestPath = path.join(process.cwd(), '.data', 'manifest.json');
  }

  /**
   * Get or initialize master manifest
   */
  private getManifest(): MasterManifest {
    if (!existsSync(this.manifestPath)) {
      return this.initializeManifest();
    }

    try {
      const content = readFileSync(this.manifestPath, 'utf-8');
      const manifest = JSON.parse(content);

      if (!manifest.version || !manifest.sources) {
        logger.warn('Invalid master manifest structure, reinitializing');
        return this.initializeManifest();
      }

      return manifest;
    } catch (error) {
      logger.warn('Failed to read master manifest, reinitializing', { error });
      return this.initializeManifest();
    }
  }

  /**
   * Initialize new master manifest
   */
  private initializeManifest(): MasterManifest {
    const manifest: MasterManifest = {
      version: '1.0',
      sources: {}
    };

    this.saveManifest(manifest);
    logger.info('Initialized master manifest');
    return manifest;
  }

  /**
   * Save master manifest to disk
   */
  private saveManifest(manifest: MasterManifest): void {
    mkdirSync(path.dirname(this.manifestPath), { recursive: true });
    writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Register or update a documentation source
   */
  registerSource(domain: string, type: string, urlCount: number): void {
    const manifest = this.getManifest();
    const existing = manifest.sources[domain];

    manifest.sources[domain] = {
      type,
      addedAt: existing?.addedAt || new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      urlCount,
      status: 'active'
    };

    this.saveManifest(manifest);
    logger.info(`Registered source: ${domain}`, { type, urlCount });
  }

  /**
   * Get all registered sources
   */
  getSources(): Record<string, SourceMetadata> {
    const manifest = this.getManifest();
    return manifest.sources;
  }

  /**
   * Get metadata for a specific source
   */
  getSource(domain: string): SourceMetadata | null {
    const manifest = this.getManifest();
    return manifest.sources[domain] || null;
  }

  /**
   * Get all domains of a specific type
   */
  getSourcesByType(type: string): string[] {
    const manifest = this.getManifest();
    return Object.entries(manifest.sources)
      .filter(([_, meta]) => meta.type === type)
      .map(([domain]) => domain);
  }

  /**
   * Update last sync time for a source
   */
  updateSyncTime(domain: string): void {
    const manifest = this.getManifest();
    if (manifest.sources[domain]) {
      manifest.sources[domain].lastSyncedAt = new Date().toISOString();
      this.saveManifest(manifest);
    }
  }

  /**
   * Mark source as inactive
   */
  deactivateSource(domain: string): void {
    const manifest = this.getManifest();
    if (manifest.sources[domain]) {
      manifest.sources[domain].status = 'inactive';
      this.saveManifest(manifest);
      logger.info(`Deactivated source: ${domain}`);
    }
  }
}
