/**
 * HTML Cache Service
 * Provides intelligent caching for fetched HTML content with content-based invalidation
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { logger } from '../utils/logger.js';

export interface CacheOptions {
  ttlDays?: number;
  force?: boolean;
  normalize?: boolean;
}

export interface CacheEntry {
  url: string;
  contentHash: string;
  structureHash: string;
  cachedAt: string;
  size: number;
  headers?: Record<string, string>;
}

export interface CacheStatus {
  exists: boolean;
  valid: boolean;
  reason?: 'not-cached' | 'expired' | 'content-changed' | 'forced';
  age?: number;
  entry?: CacheEntry;
}

/**
 * Simple HTML cache implementation
 * First iteration: Focus on working cache with basic TTL
 */
export class HTMLCache {
  private cacheDir: string;
  private metadataDir: string;
  private defaultTTLDays: number;

  constructor(cacheDir: string = '.cache', defaultTTLDays: number = 7) {
    this.cacheDir = path.join(cacheDir, 'html');
    this.metadataDir = path.join(cacheDir, 'html');
    this.defaultTTLDays = defaultTTLDays;

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Create cache directories if they don't exist
   */
  private ensureDirectories(): void {
    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
        logger.info(`Created cache directory: ${this.cacheDir}`);
      }
    } catch (error) {
      logger.error(`Failed to create cache directory: ${this.cacheDir}`, error);
      throw new Error(`Cannot initialize cache: ${error}`);
    }
  }

  /**
   * Generate cache key from URL
   */
  private getCacheKey(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  /**
   * Get file paths for cache entry
   */
  private getCachePaths(url: string): { htmlPath: string; metaPath: string } {
    const key = this.getCacheKey(url);
    return {
      htmlPath: path.join(this.cacheDir, `${key}.html`),
      metaPath: path.join(this.metadataDir, `${key}.meta.json`)
    };
  }

  /**
   * Normalize HTML content by removing dynamic elements
   */
  private normalizeHTML(html: string): string {
    // Remove common dynamic elements
    let normalized = html;

    // Remove timestamps (various formats)
    normalized = normalized.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP');
    normalized = normalized.replace(/\d{10,13}/g, 'TIMESTAMP'); // Unix timestamps

    // Remove tracking/analytics scripts
    normalized = normalized.replace(
      /<script[^>]*>(.*?google-analytics.*?)<\/script>/gis,
      ''
    );
    normalized = normalized.replace(
      /<script[^>]*>(.*?gtag.*?)<\/script>/gis,
      ''
    );

    // Remove CSRF tokens
    normalized = normalized.replace(/csrf[_-]?token["\s]*[:=]["\s]*["']?[\w-]+["']?/gi, 'CSRF_TOKEN');

    // Remove session IDs
    normalized = normalized.replace(/session[_-]?id["\s]*[:=]["\s]*["']?[\w-]+["']?/gi, 'SESSION_ID');

    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  }

  /**
   * Extract structure hash (tags and classes only, no content)
   */
  private getStructureHash(html: string): string {
    // Extract just the HTML structure (tags and main attributes)
    const structure = html
      .replace(/>([^<]+)</g, '><') // Remove text content
      .replace(/="[^"]*"/g, '=""') // Remove attribute values
      .replace(/\s+/g, ' ')
      .trim();

    return createHash('sha256').update(structure).digest('hex');
  }

  /**
   * Check if cache entry is valid
   */
  async checkStatus(url: string, options: CacheOptions = {}): Promise<CacheStatus> {
    const { force = false, ttlDays = this.defaultTTLDays } = options;

    if (force) {
      return {
        exists: false,
        valid: false,
        reason: 'forced'
      };
    }

    const { htmlPath, metaPath } = this.getCachePaths(url);

    // Check if cache exists
    if (!existsSync(htmlPath) || !existsSync(metaPath)) {
      return {
        exists: false,
        valid: false,
        reason: 'not-cached'
      };
    }

    try {
      // Load metadata
      const metaContent = readFileSync(metaPath, 'utf-8');
      const entry: CacheEntry = JSON.parse(metaContent);

      // Calculate age in days
      const cachedDate = new Date(entry.cachedAt);
      const now = new Date();
      const ageMs = now.getTime() - cachedDate.getTime();
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

      // Check TTL
      if (ageDays > ttlDays) {
        return {
          exists: true,
          valid: false,
          reason: 'expired',
          age: ageDays,
          entry
        };
      }

      return {
        exists: true,
        valid: true,
        age: ageDays,
        entry
      };
    } catch (error) {
      logger.error('Error checking cache status:', error);
      return {
        exists: true,
        valid: false,
        reason: 'not-cached'
      };
    }
  }

  /**
   * Get cached HTML content
   */
  async get(url: string, options: CacheOptions = {}): Promise<string | null> {
    const status = await this.checkStatus(url, options);

    if (!status.valid) {
      logger.info(`Cache miss for ${url}: ${status.reason}`);
      return null;
    }

    const { htmlPath } = this.getCachePaths(url);

    try {
      const html = readFileSync(htmlPath, 'utf-8');
      logger.info(`Cache hit for ${url} (${status.age} days old)`);
      return html;
    } catch (error) {
      logger.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Store HTML content in cache
   */
  async set(
    url: string,
    html: string,
    headers?: Record<string, string>
  ): Promise<CacheEntry> {
    const { htmlPath, metaPath } = this.getCachePaths(url);

    // Normalize if requested
    const normalized = this.normalizeHTML(html);
    const contentHash = createHash('sha256').update(normalized).digest('hex');
    const structureHash = this.getStructureHash(html);

    // Create metadata
    const entry: CacheEntry = {
      url,
      contentHash,
      structureHash,
      cachedAt: new Date().toISOString(),
      size: Buffer.byteLength(html, 'utf8'),
      headers
    };

    try {
      // Write HTML
      writeFileSync(htmlPath, html);

      // Write metadata
      writeFileSync(metaPath, JSON.stringify(entry, null, 2));

      logger.info(`Cached ${url} (${entry.size} bytes)`);
      return entry;
    } catch (error) {
      logger.error('Error writing cache:', error);
      throw error;
    }
  }

  /**
   * Check if content has changed compared to cache
   */
  async hasContentChanged(url: string, newHtml: string): Promise<boolean> {
    const status = await this.checkStatus(url);

    if (!status.exists || !status.entry) {
      return true; // No cache, so consider it changed
    }

    const normalized = this.normalizeHTML(newHtml);
    const newHash = createHash('sha256').update(normalized).digest('hex');

    return newHash !== status.entry.contentHash;
  }

  /**
   * Check if structure has changed compared to cache
   */
  async hasStructureChanged(url: string, newHtml: string): Promise<boolean> {
    const status = await this.checkStatus(url);

    if (!status.exists || !status.entry) {
      return true; // No cache, so consider it changed
    }

    const newStructureHash = this.getStructureHash(newHtml);
    return newStructureHash !== status.entry.structureHash;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }> {
    try {
      const files = readdirSync(this.cacheDir);
      const htmlFiles = files.filter(f => f.endsWith('.html'));

      let totalSize = 0;
      let oldestTime: number | undefined;
      let newestTime: number | undefined;

      for (const file of htmlFiles) {
        const filePath = path.join(this.cacheDir, file);
        const stat = statSync(filePath);
        totalSize += stat.size;

        const mtime = stat.mtime.getTime();
        if (!oldestTime || mtime < oldestTime) oldestTime = mtime;
        if (!newestTime || mtime > newestTime) newestTime = mtime;
      }

      return {
        totalEntries: htmlFiles.length,
        totalSize,
        oldestEntry: oldestTime ? new Date(oldestTime) : undefined,
        newestEntry: newestTime ? new Date(newestTime) : undefined
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Clear cache entries older than specified days
   */
  async cleanup(olderThanDays: number): Promise<number> {
    const now = new Date();
    const cutoffTime = now.getTime() - olderThanDays * 24 * 60 * 60 * 1000;
    let cleaned = 0;

    try {
      const files = readdirSync(this.cacheDir);

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stat = statSync(filePath);

        if (stat.mtime.getTime() < cutoffTime) {
          // Remove both HTML and metadata
          const metaPath = filePath.replace('.html', '.meta.json');
          if (existsSync(filePath)) {
            require('fs').unlinkSync(filePath);
          }
          if (existsSync(metaPath)) {
            require('fs').unlinkSync(metaPath);
          }
          cleaned++;
        }
      }

      logger.info(`Cleaned ${cleaned} cache entries older than ${olderThanDays} days`);
      return cleaned;
    } catch (error) {
      logger.error('Error cleaning cache:', error);
      return 0;
    }
  }
}

// Export singleton instance for convenience
export const htmlCache = new HTMLCache();