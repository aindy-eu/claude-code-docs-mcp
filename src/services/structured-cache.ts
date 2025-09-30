/**
 * Structured Cache Manager
 * Provides human-readable, browseable cache organization
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { logger } from '../utils/logger.js';

export interface StructuredCacheOptions {
  baseDir?: string;
  preserveQuery?: boolean;
  maxPathLength?: number;
}

/**
 * Domain-based cache organization
 * Examples:
 *   https://docs.claude.com/overview → .data/docs.claude.com/
 *   https://react.dev/learn → .data/react.dev/
 *   https://api.rubyonrails.org/classes → .data/api.rubyonrails.org/
 */
export class StructuredCache {
  private domain: string;
  private baseDir: string;
  private dataRoot: string;
  private preserveQuery: boolean;
  private maxPathLength: number;

  constructor(url: string, options: StructuredCacheOptions = {}) {
    // Extract domain from URL
    const parsed = new URL(url);
    this.domain = parsed.hostname;

    // Set up paths
    this.dataRoot = options.baseDir || path.join(process.cwd(), '.data');
    this.baseDir = path.join(this.dataRoot, this.domain);
    this.preserveQuery = options.preserveQuery || false;
    this.maxPathLength = options.maxPathLength || 255;

    // Ensure directory structure exists
    this.ensureDirectoryExists(this.baseDir);
    this.ensureDirectoryExists(path.join(this.baseDir, 'cache'));
    this.ensureDirectoryExists(path.join(this.baseDir, 'extracted'));
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
   * Convert URL to cache path (relative to domain directory)
   */
  urlToPath(url: string): string {
    try {
      const parsed = new URL(url);

      // Use only the pathname (domain is already in baseDir)
      let cachePath = '';

      // Add path (remove leading slash)
      if (parsed.pathname && parsed.pathname !== '/') {
        cachePath = parsed.pathname.slice(1);
      }

      // Handle query parameters if needed
      if (this.preserveQuery && parsed.search) {
        // Convert query to safe filename
        const queryHash = createHash('md5')
          .update(parsed.search)
          .digest('hex')
          .substring(0, 8);
        cachePath = `${cachePath}-q${queryHash}`;
      }

      // Ensure it doesn't end with extension that might confuse
      if (!cachePath.endsWith('/')) {
        cachePath = cachePath + '/';
      }

      // Handle too-long paths
      if (cachePath && cachePath.length > this.maxPathLength) {
        // Truncate and add hash to ensure uniqueness
        const hash = createHash('md5').update(cachePath).digest('hex').substring(0, 8);
        cachePath = cachePath.substring(0, this.maxPathLength - 10) + '-' + hash + '/';
      }

      return cachePath;
    } catch (error) {
      // Fallback to hash-based path for invalid URLs
      const hash = createHash('sha256').update(url).digest('hex');
      return `_invalid/${hash.substring(0, 16)}/`;
    }
  }

  /**
   * Get full paths for cache files
   */
  getCachePaths(url: string): {
    dir: string;
    htmlPath: string;
    metaPath: string;
    jsonPath: string;
  } {
    const relPath = this.urlToPath(url);

    // Separate cache and extracted directories
    const cacheDir = path.join(this.baseDir, 'cache', relPath);
    const extractedDir = path.join(this.baseDir, 'extracted');

    // Extract a clean name for the JSON file
    const urlPath = new URL(url).pathname;
    const segments = urlPath.split('/').filter(Boolean);
    const fileName = segments.length > 0 ? segments[segments.length - 1] : 'index';
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9-]/g, '_');

    return {
      dir: cacheDir,
      htmlPath: path.join(cacheDir, 'content.html'),
      metaPath: path.join(cacheDir, 'meta.json'),
      jsonPath: path.join(extractedDir, `${cleanFileName}.json`)
    };
  }

  /**
   * Save HTML with metadata
   */
  async saveHTML(url: string, html: string, headers?: Record<string, string>): Promise<void> {
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
   * Save extracted JSON
   */
  async saveExtracted(url: string, json: any): Promise<void> {
    const paths = this.getCachePaths(url);

    // Ensure extracted directory exists
    const extractedDir = path.dirname(paths.jsonPath);
    this.ensureDirectoryExists(extractedDir);

    // Save JSON
    writeFileSync(paths.jsonPath, JSON.stringify(json, null, 2));

    // Update metadata
    if (existsSync(paths.metaPath)) {
      const meta = JSON.parse(readFileSync(paths.metaPath, 'utf-8'));
      meta.extractedAt = new Date().toISOString();
      meta.hasExtraction = true;
      writeFileSync(paths.metaPath, JSON.stringify(meta, null, 2));
    }
  }

  /**
   * Get extracted JSON from cache
   */
  async getExtracted(url: string): Promise<any | null> {
    const paths = this.getCachePaths(url);

    if (!existsSync(paths.jsonPath)) {
      return null;
    }

    return JSON.parse(readFileSync(paths.jsonPath, 'utf-8'));
  }

  /**
   * List all cached domains
   */
  listDomains(): string[] {
    if (!existsSync(this.baseDir)) {
      return [];
    }

    return readdirSync(this.baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => !name.startsWith('_')); // Skip special dirs
  }

  /**
   * List cached URLs for a domain
   */
  listURLs(domain?: string): string[] {
    const urls: string[] = [];

    const searchDirs = domain
      ? [path.join(this.baseDir, domain)]
      : [this.baseDir];

    // Recursive search for meta.json files
    const findMetaFiles = (dir: string): void => {
      if (!existsSync(dir)) return;

      const items = readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          // Check if this directory has a meta.json
          const metaPath = path.join(fullPath, 'meta.json');
          if (existsSync(metaPath)) {
            try {
              const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
              if (meta.url) {
                urls.push(meta.url);
              }
            } catch (error) {
              // Skip invalid meta files
            }
          }
          // Recurse into subdirectories
          findMetaFiles(fullPath);
        }
      }
    };

    searchDirs.forEach(findMetaFiles);
    return urls;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    domains: number;
    urls: number;
    totalSize: number;
    breakdown: Record<string, { urls: number; size: number }>;
  }> {
    const domains = this.listDomains();
    const breakdown: Record<string, { urls: number; size: number }> = {};

    let totalUrls = 0;
    let totalSize = 0;

    for (const domain of domains) {
      const urls = this.listURLs(domain);
      let domainSize = 0;

      for (const url of urls) {
        const paths = this.getCachePaths(url);
        if (existsSync(paths.metaPath)) {
          const meta = JSON.parse(readFileSync(paths.metaPath, 'utf-8'));
          domainSize += meta.size || 0;
        }
      }

      breakdown[domain] = {
        urls: urls.length,
        size: domainSize
      };

      totalUrls += urls.length;
      totalSize += domainSize;
    }

    return {
      domains: domains.length,
      urls: totalUrls,
      totalSize,
      breakdown
    };
  }

  /**
   * Migrate from hash-based to structured cache
   */
  async migrateFromHashCache(oldCacheDir: string): Promise<void> {
    logger.info('Migrating from hash-based cache to structured cache...');

    const metaFiles = readdirSync(oldCacheDir)
      .filter(f => f.endsWith('.meta.json'));

    for (const metaFile of metaFiles) {
      try {
        const metaPath = path.join(oldCacheDir, metaFile);
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));

        if (meta.url) {
          const htmlFile = metaFile.replace('.meta.json', '.html');
          const htmlPath = path.join(oldCacheDir, htmlFile);

          if (existsSync(htmlPath)) {
            const html = readFileSync(htmlPath, 'utf-8');
            await this.saveHTML(meta.url, html, meta.headers);
            logger.info(`Migrated: ${meta.url}`);
          }
        }
      } catch (error) {
        logger.error(`Failed to migrate ${metaFile}:`, error);
      }
    }

    logger.info('Migration complete!');
  }
}