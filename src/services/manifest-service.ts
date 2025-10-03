/**
 * Manifest Service
 * Handles manifest tracking for documentation ingestion pipeline
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { DEFAULT_TTL_DAYS } from '../config/constants.js';
import { ManifestRecord, Manifest, UpdateOptions } from './manifest-service.types.js';
import { MasterManifestService } from './master-manifest-service.js';

export class ManifestService {
  private domain: string;
  private manifestPath: string;

  constructor(url: string) {
    // Extract domain from URL
    this.domain = new URL(url).hostname;
    this.manifestPath = path.join(process.cwd(), '.data', this.domain, 'manifest.json');
  }

  /**
   * Discover all domains with manifests in .data/
   * Static method - doesn't require instance
   */
  static getAllDomains(): string[] {
    const dataDir = path.join(process.cwd(), '.data');

    if (!existsSync(dataDir)) {
      return [];
    }

    try {
      // Get all directories in .data/
      const entries = readdirSync(dataDir, { withFileTypes: true });

      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(domain => {
          // Only include directories with a manifest.json
          const manifestPath = path.join(dataDir, domain, 'manifest.json');
          return existsSync(manifestPath);
        });
    } catch (error) {
      logger.warn('Failed to discover domains', { error });
      return [];
    }
  }

  /**
   * Get or initialize manifest
   */
  private getManifest(): Manifest {
    if (!existsSync(this.manifestPath)) {
      return this.initializeManifest();
    }

    try {
      const content = readFileSync(this.manifestPath, 'utf-8');
      const manifest = JSON.parse(content);

      // Validate basic structure
      if (!manifest.version || !manifest.records) {
        logger.warn('Invalid manifest structure, reinitializing');
        return this.initializeManifest();
      }

      return manifest;
    } catch (error) {
      logger.warn('Failed to read manifest, reinitializing', { error });
      return this.initializeManifest();
    }
  }

  /**
   * Initialize new manifest
   */
  private initializeManifest(): Manifest {
    const manifest: Manifest = {
      version: '2.0',
      domain: this.domain,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      defaultTTLDays: DEFAULT_TTL_DAYS,
      records: {}
    };

    this.saveManifest(manifest);
    logger.info(`Initialized manifest for ${this.domain}`);
    return manifest;
  }

  /**
   * Save manifest to disk
   */
  private saveManifest(manifest: Manifest): void {
    // Ensure directory exists
    mkdirSync(path.dirname(this.manifestPath), { recursive: true });

    // Update timestamp
    manifest.lastUpdatedAt = new Date().toISOString();

    // Write to disk
    writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Get record for a URL
   */
  getRecord(url: string): ManifestRecord | null {
    const manifest = this.getManifest();
    return manifest.records[url] || null;
  }

  /**
   * Get all records
   */
  getAllRecords(): ManifestRecord[] {
    const manifest = this.getManifest();
    return Object.values(manifest.records);
  }

  /**
   * Get all ingested URLs
   * Returns URLs that have been ingested (useful for sync operations)
   */
  getAllIngestedUrls(): string[] {
    const manifest = this.getManifest();
    return Object.keys(manifest.records);
  }

  /**
   * Update record - fetched status
   */
  updateFetched(url: string): void {
    const manifest = this.getManifest();
    const existing = manifest.records[url] || {};

    manifest.records[url] = {
      ...existing,
      url,
      status: 'fetched',
      lastFetchedAt: new Date().toISOString()
    };

    this.saveManifest(manifest);
    logger.info(`[MANIFEST] Updated: ${url} -> fetched`);
  }

  /**
   * Update record - extracted status
   */
  updateExtracted(url: string, options: UpdateOptions = {}): void {
    const manifest = this.getManifest();
    const existing = manifest.records[url] || {};

    const record: ManifestRecord = {
      ...existing,
      url,
      status: 'extracted',
      lastExtractedAt: new Date().toISOString()
    };

    // Add model if provided
    if (options.model) {
      record.extractionModel = options.model;
    }

    // Add raw size if JSON path provided
    if (options.jsonPath && existsSync(options.jsonPath)) {
      const stats = statSync(options.jsonPath);
      record.rawResponseSize = stats.size;
    }

    manifest.records[url] = record;
    this.saveManifest(manifest);

    const modelInfo = options.model ? ` (model: ${options.model})` : '';
    logger.info(`[MANIFEST] Updated: ${url} -> extracted${modelInfo}`);
  }

  /**
   * Update record - structured status (JSON validated and ready)
   */
  updateStructured(url: string, options: UpdateOptions = {}): void {
    const manifest = this.getManifest();
    const existing = manifest.records[url] || {};

    const record: ManifestRecord = {
      ...existing,
      url,
      status: 'structured',
      lastStructuredAt: new Date().toISOString()
    };

    // Parse JSON to get counts if path provided
    if (options.jsonPath && existsSync(options.jsonPath)) {
      try {
        const data = JSON.parse(readFileSync(options.jsonPath, 'utf-8'));
        const stats = statSync(options.jsonPath);

        record.outputSize = stats.size;
        record.sectionCount = data.sections?.length || 0;

        // Count code examples across all sections
        let codeCount = 0;
        if (data.sections) {
          for (const section of data.sections) {
            codeCount += section.codeExamples?.length || 0;
          }
        }
        record.codeExampleCount = codeCount;
      } catch (error) {
        logger.warn('Failed to parse JSON for counts', { error });
      }
    }

    manifest.records[url] = record;
    this.saveManifest(manifest);
    logger.info(`[MANIFEST] Updated: ${url} -> structured`);
  }

  /**
   * Update record - embedded status
   */
  updateEmbedded(url: string, options: UpdateOptions = {}): void {
    const manifest = this.getManifest();
    const existing = manifest.records[url] || {};

    const record: ManifestRecord = {
      ...existing,
      url,
      status: 'embedded',
      lastEmbeddedAt: new Date().toISOString(),
      lastIngestedAt: new Date().toISOString()
    };

    // Add provider if provided
    if (options.provider) {
      record.embeddingProvider = options.provider;
    }

    // Parse JSON to get counts if path provided
    if (options.jsonPath && existsSync(options.jsonPath)) {
      try {
        const data = JSON.parse(readFileSync(options.jsonPath, 'utf-8'));
        const stats = statSync(options.jsonPath);

        record.outputSize = stats.size;
        record.sectionCount = data.sections?.length || 0;

        // Count code examples across all sections
        let codeCount = 0;
        if (data.sections) {
          for (const section of data.sections) {
            codeCount += section.codeExamples?.length || 0;
          }
        }
        record.codeExampleCount = codeCount;
      } catch (error) {
        logger.warn('Failed to parse JSON for counts', { error });
      }
    }

    manifest.records[url] = record;
    this.saveManifest(manifest);

    // Register source in master manifest
    this.registerInMasterManifest();

    const providerInfo = options.provider ? ` (${options.provider})` : '';
    logger.info(`[MANIFEST] Updated: ${url} -> embedded${providerInfo}`);
  }

  /**
   * Register this domain in master manifest
   * Called when a URL completes ingestion
   */
  private registerInMasterManifest(): void {
    try {
      const masterManifest = new MasterManifestService();
      const manifest = this.getManifest();
      const urlCount = Object.keys(manifest.records).length;

      // Infer type from domain
      let type = 'documentation';
      if (this.domain.includes('claude')) {
        type = 'claude-code-docs';
      }

      masterManifest.registerSource(this.domain, type, urlCount);
    } catch (error) {
      logger.warn('Failed to register in master manifest', { error });
    }
  }

  /**
   * Update record - failed status
   */
  updateFailed(url: string, error: string): void {
    const manifest = this.getManifest();
    const existing = manifest.records[url] || {};

    manifest.records[url] = {
      ...existing,
      url,
      status: 'failed',
      lastFailedAt: new Date().toISOString(),
      lastError: error
    };

    this.saveManifest(manifest);
    logger.info(`[MANIFEST] Updated: ${url} -> failed`);
  }

  /**
   * Update record - content unchanged (skip pipeline)
   */
  updateUnchanged(url: string): void {
    const manifest = this.getManifest();
    const existing = manifest.records[url] || {};

    // Update last checked timestamp but preserve existing status
    manifest.records[url] = {
      ...existing,
      url,
      lastCheckedAt: new Date().toISOString()
    };

    this.saveManifest(manifest);
    logger.info(`[MANIFEST] Content unchanged: ${url} (skipped pipeline)`);
  }
}
