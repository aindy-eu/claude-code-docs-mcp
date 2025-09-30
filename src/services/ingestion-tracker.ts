/**
 * Service for tracking documentation ingestion state
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import {
  IngestionManifest,
  IngestionRecord,
  IngestionOptions,
  IngestionStatus
} from '../types/ingestion-manifest.js';

const MANIFEST_PATH = './claude-outputs/ingestion-manifest.json';
const DEFAULT_TTL_DAYS = 7;

export class IngestionTracker {
  private manifest: IngestionManifest;
  private manifestPath: string;

  constructor(manifestPath: string = MANIFEST_PATH) {
    this.manifestPath = manifestPath;
    this.manifest = this.loadManifest();
  }

  /**
   * Load manifest from disk or create new one
   */
  private loadManifest(): IngestionManifest {
    if (existsSync(this.manifestPath)) {
      try {
        const data = readFileSync(this.manifestPath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.warn('Failed to load manifest, creating new one:', error);
      }
    }

    // Create new manifest
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      defaultTTLDays: DEFAULT_TTL_DAYS,
      records: {},
      stats: {
        totalPages: 0,
        successfulIngestions: 0,
        failedIngestions: 0,
        totalEmbeddings: 0
      }
    };
  }

  /**
   * Save manifest to disk
   */
  private saveManifest(): void {
    // Ensure directory exists
    const dir = path.dirname(this.manifestPath);
    if (!existsSync(dir)) {
      throw new Error(`Directory ${dir} does not exist`);
    }

    this.manifest.lastUpdatedAt = new Date().toISOString();
    writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  /**
   * Check if a URL needs to be ingested
   */
  checkIngestionStatus(url: string, options: IngestionOptions = {}): IngestionStatus {
    const record = this.manifest.records[url];

    // Never ingested
    if (!record) {
      return {
        url,
        needsUpdate: true,
        reason: 'never-ingested'
      };
    }

    // Force refresh requested
    if (options.force) {
      return {
        url,
        needsUpdate: true,
        reason: 'forced',
        lastIngestedAt: record.lastIngestedAt,
        daysSinceIngestion: this.getDaysSince(record.lastIngestedAt)
      };
    }

    // Failed last time
    if (record.status === 'failed') {
      return {
        url,
        needsUpdate: true,
        reason: 'failed-last-time',
        lastIngestedAt: record.lastIngestedAt,
        daysSinceIngestion: this.getDaysSince(record.lastIngestedAt)
      };
    }

    // Check TTL
    const ttlDays = options.ttlDays || this.manifest.defaultTTLDays;
    const daysSince = this.getDaysSince(record.lastIngestedAt);

    if (daysSince >= ttlDays) {
      return {
        url,
        needsUpdate: true,
        reason: 'expired',
        lastIngestedAt: record.lastIngestedAt,
        daysSinceIngestion: daysSince
      };
    }

    // Skip if requested
    const skipDays = options.skipIfIngestedWithinDays || ttlDays;
    if (daysSince < skipDays) {
      return {
        url,
        needsUpdate: false,
        lastIngestedAt: record.lastIngestedAt,
        daysSinceIngestion: daysSince
      };
    }

    return {
      url,
      needsUpdate: true,
      reason: 'expired',
      lastIngestedAt: record.lastIngestedAt,
      daysSinceIngestion: daysSince
    };
  }

  /**
   * Record a successful ingestion
   */
  recordSuccess(
    url: string,
    jsonContent: string,
    sectionCount: number,
    embeddingCount: number,
    provider: 'ollama' | 'openai' = 'ollama'
  ): void {
    const contentHash = this.hashContent(jsonContent);

    const record: IngestionRecord = {
      url,
      lastIngestedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      contentHash,
      status: 'success',
      outputSize: Buffer.byteLength(jsonContent, 'utf8'),
      sectionCount,
      embeddingCount,
      embeddingProvider: provider
    };

    // Update stats
    if (!this.manifest.records[url]) {
      this.manifest.stats.totalPages++;
    }
    this.manifest.stats.successfulIngestions++;
    this.manifest.stats.totalEmbeddings += embeddingCount;

    this.manifest.records[url] = record;
    this.saveManifest();
  }

  /**
   * Record a failed ingestion
   */
  recordFailure(url: string, error: string): void {
    const existing = this.manifest.records[url];

    const record: IngestionRecord = {
      url,
      lastIngestedAt: existing?.lastIngestedAt || '',
      lastReadAt: new Date().toISOString(),
      contentHash: existing?.contentHash || '',
      status: 'failed',
      error,
      outputSize: existing?.outputSize || 0,
      sectionCount: existing?.sectionCount || 0,
      embeddingCount: existing?.embeddingCount || 0,
      embeddingProvider: existing?.embeddingProvider || 'ollama'
    };

    if (!this.manifest.records[url]) {
      this.manifest.stats.totalPages++;
    }
    this.manifest.stats.failedIngestions++;

    this.manifest.records[url] = record;
    this.saveManifest();
  }

  /**
   * Get all ingestion records
   */
  getAllRecords(): IngestionRecord[] {
    return Object.values(this.manifest.records);
  }

  /**
   * Get summary statistics
   */
  getStats() {
    const records = this.getAllRecords();
    const now = new Date();

    const staleRecords = records.filter(r => {
      if (r.status !== 'success') return false;
      const daysSince = this.getDaysSince(r.lastIngestedAt);
      return daysSince >= this.manifest.defaultTTLDays;
    });

    const recentRecords = records.filter(r => {
      if (r.status !== 'success') return false;
      const daysSince = this.getDaysSince(r.lastIngestedAt);
      return daysSince < 1;
    });

    return {
      ...this.manifest.stats,
      staleCount: staleRecords.length,
      recentCount: recentRecords.length,
      defaultTTLDays: this.manifest.defaultTTLDays
    };
  }

  /**
   * Check if content has changed by comparing hashes
   */
  hasContentChanged(url: string, newContent: string): boolean {
    const record = this.manifest.records[url];
    if (!record) return true;

    const newHash = this.hashContent(newContent);
    return newHash !== record.contentHash;
  }

  /**
   * Set default TTL for all ingestions
   */
  setDefaultTTL(days: number): void {
    this.manifest.defaultTTLDays = days;
    this.saveManifest();
  }

  /**
   * Calculate days since a date
   */
  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Hash content for comparison
   */
  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Clear all records (for testing)
   */
  clearAll(): void {
    this.manifest.records = {};
    this.manifest.stats = {
      totalPages: 0,
      successfulIngestions: 0,
      failedIngestions: 0,
      totalEmbeddings: 0
    };
    this.saveManifest();
  }
}
