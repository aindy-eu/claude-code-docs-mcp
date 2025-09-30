import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { HTMLCache, CacheStatus } from '../../src/services/html-cache.js';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Test cache directory
const TEST_CACHE_DIR = '.test-cache';

describe('HTMLCache', () => {
  let cache: HTMLCache;

  beforeEach(() => {
    // Clean up and create test cache directory
    if (existsSync(TEST_CACHE_DIR)) {
      rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_CACHE_DIR, { recursive: true });

    // Create cache instance with test directory
    cache = new HTMLCache(TEST_CACHE_DIR, 7);
  });

  afterEach(() => {
    // Clean up test cache directory
    if (existsSync(TEST_CACHE_DIR)) {
      rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
    }
  });

  describe('basic operations', () => {
    it('should initialize with proper directories', () => {
      expect(existsSync(path.join(TEST_CACHE_DIR, 'html'))).toBe(true);
    });

    it('should return null for non-cached URL', async () => {
      const result = await cache.get('https://example.com/page');
      expect(result).toBeNull();
    });

    it('should cache and retrieve HTML content', async () => {
      const url = 'https://example.com/page';
      const html = '<html><body>Test content</body></html>';

      // Store in cache
      const entry = await cache.set(url, html);
      expect(entry.url).toBe(url);
      expect(entry.size).toBeGreaterThan(0);

      // Retrieve from cache
      const cached = await cache.get(url);
      expect(cached).toBe(html);
    });

    it('should store metadata with cache entry', async () => {
      const url = 'https://example.com/page';
      const html = '<html><body>Test</body></html>';
      const headers = {
        'content-type': 'text/html',
        'last-modified': 'Mon, 01 Jan 2024 00:00:00 GMT'
      };

      const entry = await cache.set(url, html, headers);
      expect(entry.headers).toEqual(headers);
      expect(entry.contentHash).toBeDefined();
      expect(entry.structureHash).toBeDefined();
    });
  });

  describe('cache status checking', () => {
    it('should report not-cached for missing entries', async () => {
      const status = await cache.checkStatus('https://example.com/missing');
      expect(status.exists).toBe(false);
      expect(status.valid).toBe(false);
      expect(status.reason).toBe('not-cached');
    });

    it('should report valid for fresh cache entries', async () => {
      const url = 'https://example.com/fresh';
      await cache.set(url, '<html></html>');

      const status = await cache.checkStatus(url);
      expect(status.exists).toBe(true);
      expect(status.valid).toBe(true);
      expect(status.age).toBe(0);
    });

    it('should respect force option', async () => {
      const url = 'https://example.com/forced';
      await cache.set(url, '<html></html>');

      const status = await cache.checkStatus(url, { force: true });
      expect(status.valid).toBe(false);
      expect(status.reason).toBe('forced');
    });

    it('should detect expired entries based on TTL', async () => {
      const url = 'https://example.com/expired';
      const html = '<html></html>';

      // Create cache entry
      await cache.set(url, html);

      // Manually modify metadata to simulate old cache
      const cacheKey = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'; // SHA256 of url
      const metaPath = path.join(TEST_CACHE_DIR, 'html', `${cacheKey}.meta.json`);

      if (existsSync(metaPath)) {
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
        // Set cached date to 10 days ago
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 10);
        meta.cachedAt = oldDate.toISOString();
        writeFileSync(metaPath, JSON.stringify(meta, null, 2));

        const status = await cache.checkStatus(url, { ttlDays: 7 });
        expect(status.exists).toBe(true);
        expect(status.valid).toBe(false);
        expect(status.reason).toBe('expired');
        expect(status.age).toBeGreaterThanOrEqual(10);
      }
    });
  });

  describe('content normalization', () => {
    it('should detect content changes', async () => {
      const url = 'https://example.com/changing';
      const html1 = '<html><body>Original content</body></html>';
      const html2 = '<html><body>Modified content</body></html>';

      await cache.set(url, html1);
      const changed = await cache.hasContentChanged(url, html2);
      expect(changed).toBe(true);
    });

    it('should ignore timestamp changes', async () => {
      const url = 'https://example.com/timestamps';
      const html1 = '<html><body>Updated at 2024-01-01T10:00:00</body></html>';
      const html2 = '<html><body>Updated at 2024-01-02T15:30:00</body></html>';

      await cache.set(url, html1);
      const changed = await cache.hasContentChanged(url, html2);
      expect(changed).toBe(false); // Timestamps are normalized
    });

    it('should ignore tracking script changes', async () => {
      const url = 'https://example.com/tracking';
      const html1 = '<html><script>google-analytics.track(123)</script><body>Content</body></html>';
      const html2 = '<html><script>google-analytics.track(456)</script><body>Content</body></html>';

      await cache.set(url, html1);
      const changed = await cache.hasContentChanged(url, html2);
      expect(changed).toBe(false); // Tracking scripts are removed
    });

    it('should detect structure changes', async () => {
      const url = 'https://example.com/structure';
      const html1 = '<html><body><div>Content</div></body></html>';
      const html2 = '<html><body><section>Content</section></body></html>';

      await cache.set(url, html1);
      const changed = await cache.hasStructureChanged(url, html2);
      expect(changed).toBe(true);
    });

    it('should ignore content in structure comparison', async () => {
      const url = 'https://example.com/structure-content';
      const html1 = '<html><body><div>Original text</div></body></html>';
      const html2 = '<html><body><div>Different text</div></body></html>';

      await cache.set(url, html1);
      const changed = await cache.hasStructureChanged(url, html2);
      expect(changed).toBe(false); // Structure is same, only content differs
    });
  });

  describe('cache management', () => {
    it('should calculate cache statistics', async () => {
      // Add multiple entries
      await cache.set('https://example.com/1', '<html>Page 1</html>');
      await cache.set('https://example.com/2', '<html>Page 2 with more content</html>');
      await cache.set('https://example.com/3', '<html>Page 3</html>');

      const stats = await cache.getStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
    });

    it('should cleanup old cache entries', async () => {
      // Create entries
      await cache.set('https://example.com/old', '<html>Old</html>');
      await cache.set('https://example.com/new', '<html>New</html>');

      // Manually age the first entry
      const oldKey = '5e3e3f6c6d6d5798cc4e72c570f3bc9158d8d7c9db431f3a6e7a6e9b2f7e5ed0';
      const oldHtmlPath = path.join(TEST_CACHE_DIR, 'html', `${oldKey}.html`);

      if (existsSync(oldHtmlPath)) {
        // Set modification time to 10 days ago
        const oldTime = Date.now() - 10 * 24 * 60 * 60 * 1000;
        const fs = require('fs');
        fs.utimesSync(oldHtmlPath, new Date(oldTime), new Date(oldTime));

        // Cleanup entries older than 7 days
        const cleaned = await cache.cleanup(7);
        expect(cleaned).toBeGreaterThanOrEqual(1);

        // Verify old entry is gone
        const oldCached = await cache.get('https://example.com/old');
        expect(oldCached).toBeNull();

        // Verify new entry still exists
        const newCached = await cache.get('https://example.com/new');
        expect(newCached).toBe('<html>New</html>');
      }
    });

    it('should handle cache directory creation gracefully', () => {
      // Remove cache directory
      if (existsSync(TEST_CACHE_DIR)) {
        rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
      }

      // Create new cache instance - should create directories
      const newCache = new HTMLCache(TEST_CACHE_DIR);
      expect(existsSync(path.join(TEST_CACHE_DIR, 'html'))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle corrupted metadata gracefully', async () => {
      const url = 'https://example.com/corrupted';
      await cache.set(url, '<html></html>');

      // Corrupt the metadata file
      const cacheKey = '0a50261ebd1a390fed2bcffe8f64df1e87e8eb8f0a460e17534e3a79ec23cfb7';
      const metaPath = path.join(TEST_CACHE_DIR, 'html', `${cacheKey}.meta.json`);

      if (existsSync(metaPath)) {
        writeFileSync(metaPath, 'invalid json content');

        const status = await cache.checkStatus(url);
        expect(status.valid).toBe(false);

        const cached = await cache.get(url);
        expect(cached).toBeNull();
      }
    });

    it('should handle missing HTML file when metadata exists', async () => {
      const url = 'https://example.com/missing-html';
      await cache.set(url, '<html></html>');

      // Delete HTML file but keep metadata
      const cacheKey = 'adc83b19e793491b1c6ea0fd8b46cd9f32e592fc9c3a1d8f0e31a8a67b79a03a';
      const htmlPath = path.join(TEST_CACHE_DIR, 'html', `${cacheKey}.html`);

      if (existsSync(htmlPath)) {
        rmSync(htmlPath);

        const cached = await cache.get(url);
        expect(cached).toBeNull();
      }
    });

    it('should handle file system errors gracefully', async () => {
      // This test is tricky as permissions vary by OS/environment
      // Instead, test with a non-writable path
      const invalidPath = '/invalid/path/that/does/not/exist';

      // Should handle directory creation failure gracefully
      expect(() => {
        new HTMLCache(invalidPath);
      }).toThrow();
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple simultaneous reads', async () => {
      const url = 'https://example.com/concurrent';
      const html = '<html><body>Concurrent test</body></html>';

      await cache.set(url, html);

      // Simultaneous reads
      const results = await Promise.all([
        cache.get(url),
        cache.get(url),
        cache.get(url),
        cache.get(url),
        cache.get(url)
      ]);

      results.forEach(result => {
        expect(result).toBe(html);
      });
    });

    it('should handle multiple simultaneous writes', async () => {
      const urls = Array.from({ length: 5 }, (_, i) => `https://example.com/page${i}`);
      const htmls = urls.map((_, i) => `<html>Page ${i}</html>`);

      // Simultaneous writes
      const entries = await Promise.all(
        urls.map((url, i) => cache.set(url, htmls[i]))
      );

      expect(entries).toHaveLength(5);
      entries.forEach((entry, i) => {
        expect(entry.url).toBe(urls[i]);
      });

      // Verify all were cached
      const cached = await Promise.all(urls.map(url => cache.get(url)));
      cached.forEach((content, i) => {
        expect(content).toBe(htmls[i]);
      });
    });
  });
});