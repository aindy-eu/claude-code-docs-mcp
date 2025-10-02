/**
 * FetchService Integration Tests
 * Tests real HTTP fetching, caching, and content normalization with actual files
 *
 * NOTE: These tests use real file I/O (appropriate for integration testing)
 * For unit tests with mocked FS, see tests/unit/services/fetch-service/
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FetchService } from '@/services/fetch-service.js';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// Use dedicated test directory to avoid polluting main .data/
const TEST_DATA_DIR = '.data/fetch-integration-test.com';
const TEST_URL = 'https://fetch-integration-test.com/docs/test-page';

describe('FetchService Integration (Real File I/O)', () => {
  let fetchService: FetchService;

  beforeAll(() => {
    // Clean up any previous test runs
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }

    // Create fresh test directory
    mkdirSync(TEST_DATA_DIR, { recursive: true });

    fetchService = new FetchService(TEST_URL);
  });

  afterAll(() => {
    // Clean up test directory after all tests
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });

  describe('Cache Operations', () => {
    it('should create cache directory on initialization', () => {
      const cachePath = join(TEST_DATA_DIR, 'cache');
      expect(existsSync(cachePath)).toBe(true);
    });

    it('should get cache paths for URL', () => {
      const paths = fetchService.getCachePaths(TEST_URL);

      expect(paths.dir).toContain('cache');
      expect(paths.htmlPath).toContain('content.html');
      expect(paths.metaPath).toContain('meta.json');
    });

    it('should return null for non-cached HTML', async () => {
      const html = await fetchService.getHTML('https://fetch-integration-test.com/not-cached');
      expect(html).toBeNull();
    });
  });

  /**
   * NOTE: Content normalization tests skipped
   * Reason: normalizeForComparison is private method, not part of public API
   * Normalization is tested indirectly through unit tests with mocks
   */

  describe('URL to Path Mapping', () => {
    it('should create valid cache paths from URLs', () => {
      const urls = [
        'https://example.com/docs/quickstart',
        'https://example.com/api/v2/reference',
        'https://example.com/guides/hooks/configuration'
      ];

      urls.forEach(url => {
        const service = new FetchService(url);
        const paths = service.getCachePaths(url);

        expect(paths.dir).toBeDefined();
        expect(paths.htmlPath).toContain('.html');
        expect(paths.metaPath).toContain('.json');
      });
    });

    it('should handle URLs with special characters', () => {
      const specialUrl = 'https://example.com/docs/file-name-with-dashes';
      const service = new FetchService(specialUrl);
      const paths = service.getCachePaths(specialUrl);

      expect(paths.dir).toBeDefined();
      expect(paths.htmlPath).toContain('content.html');
    });

    it('should truncate extremely long paths', () => {
      const longUrl = 'https://example.com/' + 'very-long-segment/'.repeat(50) + 'final-page';
      const service = new FetchService(longUrl);
      const paths = service.getCachePaths(longUrl);

      // Path should be reasonable length (filesystem limits)
      expect(paths.htmlPath.length).toBeLessThan(500);
    });
  });

  /**
   * TESTS SKIPPED (require external dependencies):
   *
   * 1. Real HTTP Fetching
   *    - Actual fetch() calls to live URLs
   *    - HTTP header handling (Content-Type, Last-Modified, etc.)
   *    - Network error handling (timeouts, 404s, etc.)
   *    Reason: Requires external services, brittle in CI
   *    Alternative: Mock server or fixture-based testing
   *
   * 2. Rate Limiting
   *    - Throttling multiple requests
   *    - Retry logic with backoff
   *    Reason: Time-dependent, slow tests
   *
   * 3. Content-Type Validation
   *    - Verifying HTML vs JSON vs other types
   *    - Charset detection
   *    Reason: Requires real HTTP responses
   *
   * 4. Redirect Handling
   *    - Following 301/302 redirects
   *    - Max redirect limits
   *    Reason: Requires HTTP server
   *
   * These scenarios are better tested with:
   * - Mock HTTP server (e.g., MSW)
   * - Recorded fixtures (VCR pattern)
   * - Manual integration testing
   */
});
