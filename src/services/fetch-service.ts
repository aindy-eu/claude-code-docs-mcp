/**
 * Fetch Service
 * Handles HTML fetching and caching for the fetch pipeline stage
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { FetchResult, CachePaths, ContentComparison } from './fetch-service.types.js';

export class FetchService {
  private domain: string;
  private baseDir: string;
  private dataRoot: string;

  constructor(url: string, baseDir?: string) {
    // Extract domain from URL
    const parsed = new URL(url);
    this.domain = parsed.hostname;

    // Set up paths
    this.dataRoot = baseDir || path.join(process.cwd(), '.data');
    this.baseDir = path.join(this.dataRoot, this.domain);

    // Ensure directory structure exists
    this.ensureDirectoryExists(this.baseDir);
    this.ensureDirectoryExists(path.join(this.baseDir, 'cache'));
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Convert URL to cache path
   */
  private urlToPath(url: string): string {
    try {
      const parsed = new URL(url);
      let cachePath = '';

      // Add path (remove leading slash)
      if (parsed.pathname && parsed.pathname !== '/') {
        cachePath = parsed.pathname.slice(1);
      }

      // Ensure it ends with /
      if (!cachePath.endsWith('/')) {
        cachePath = cachePath + '/';
      }

      // Handle too-long paths
      if (cachePath && cachePath.length > 255) {
        const hash = createHash('md5').update(cachePath).digest('hex').substring(0, 8);
        cachePath = cachePath.substring(0, 245) + '-' + hash + '/';
      }

      return cachePath;
    } catch {
      // Fallback to hash-based path for invalid URLs
      const hash = createHash('sha256').update(url).digest('hex');
      return `_invalid/${hash.substring(0, 16)}/`;
    }
  }

  /**
   * Get cache paths for a URL
   */
  getCachePaths(url: string): CachePaths {
    const relPath = this.urlToPath(url);
    const cacheDir = path.join(this.baseDir, 'cache', relPath);

    return {
      dir: cacheDir,
      htmlPath: path.join(cacheDir, 'content.html'),
      metaPath: path.join(cacheDir, 'meta.json')
    };
  }

  /**
   * Save HTML with metadata
   */
  private async saveHTML(
    url: string,
    html: string,
    headers?: Record<string, string>
  ): Promise<void> {
    const paths = this.getCachePaths(url);

    // Create directory structure
    this.ensureDirectoryExists(paths.dir);

    // Save HTML
    writeFileSync(paths.htmlPath, html);

    // Save metadata
    const meta = {
      url,
      cachedAt: new Date().toISOString(),
      size: Buffer.byteLength(html, 'utf8'),
      contentHash: createHash('sha256').update(html).digest('hex'),
      headers: headers || {}
    };
    writeFileSync(paths.metaPath, JSON.stringify(meta, null, 2));

    logger.info(`Cached ${url} → ${this.urlToPath(url)}`);
  }

  /**
   * Get HTML from cache
   */
  async getHTML(url: string): Promise<string | null> {
    const paths = this.getCachePaths(url);

    if (!existsSync(paths.htmlPath)) {
      return null;
    }

    return readFileSync(paths.htmlPath, 'utf-8');
  }

  /**
   * Normalize HTML content for comparison
   * Removes dynamic elements that change but aren't meaningful
   */
  private normalizeForComparison(html: string): string {
    return html
      .replace(/<!--.*?-->/gs, '') // Remove comments
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove inline styles
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/timestamp="[^"]*"/gi, '') // Remove timestamps
      .replace(/updated="[^"]*"/gi, '') // Remove update dates
      .replace(/lastmod="[^"]*"/gi, '') // Remove last modified
      .trim();
  }

  /**
   * Compare current HTML with cached version
   */
  private compareContent(oldHtml: string, newHtml: string): ContentComparison {
    const oldNormalized = this.normalizeForComparison(oldHtml);
    const newNormalized = this.normalizeForComparison(newHtml);

    const oldHash = createHash('sha256').update(oldNormalized).digest('hex');
    const newHash = createHash('sha256').update(newNormalized).digest('hex');

    if (oldHash === newHash) {
      return {
        hasChanged: false,
        contentHash: newHash,
        previousHash: oldHash,
        comparedAt: new Date().toISOString(),
        changePercentage: 0
      };
    }

    // Simple change percentage based on length difference
    const lengthDiff = Math.abs(newNormalized.length - oldNormalized.length);
    const changePercentage = (lengthDiff / oldNormalized.length) * 100;

    return {
      hasChanged: true,
      contentHash: newHash,
      previousHash: oldHash,
      comparedAt: new Date().toISOString(),
      changePercentage: Math.min(changePercentage, 100)
    };
  }

  /**
   * Fetch HTML from URL and cache it
   */
  async fetch(url: string, force: boolean = false): Promise<FetchResult> {
    const paths = this.getCachePaths(url);

    // Check if already cached (unless force)
    if (!force && existsSync(paths.htmlPath)) {
      logger.info(`Using cached HTML for ${url}`);
      return {
        html: readFileSync(paths.htmlPath, 'utf-8'),
        finalUrl: url // Assume no redirect if cached
      };
    }

    logger.info(`Fetching ${url}...`);

    // Fetch from network (follows redirects by default)
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get final URL after any redirects
    const finalUrl = response.url;

    // Log redirect if it occurred
    if (finalUrl !== url) {
      logger.info(`Redirect detected: ${url} → ${finalUrl}`);
    }

    const html = await response.text();
    const headers: Record<string, string> = {};

    // Convert headers to plain object
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Compare with existing cache if not forced
    let comparison: ContentComparison | undefined;
    let skipPipeline = false;

    if (!force && existsSync(paths.htmlPath)) {
      const existingHtml = readFileSync(paths.htmlPath, 'utf-8');
      comparison = this.compareContent(existingHtml, html);

      if (!comparison.hasChanged) {
        logger.info(`Content unchanged for ${finalUrl} (hash match) - can skip pipeline`);
        skipPipeline = true;
        // Don't save - use existing cache
        return { html: existingHtml, finalUrl, skipPipeline, comparison };
      }

      logger.info(
        `Content changed for ${finalUrl} (${comparison.changePercentage?.toFixed(1)}% difference)`
      );
    }

    // Save to cache using final URL
    await this.saveHTML(finalUrl, html, headers);

    logger.info(`Fetched and cached ${finalUrl} (${Buffer.byteLength(html, 'utf8')} bytes)`);

    return { html, finalUrl, skipPipeline, comparison };
  }
}
