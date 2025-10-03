import { describe, it, expect } from 'vitest';
import {
  docUrlService,
  getDocUrl,
  getAllDocUrls,
  DOCUMENTATION_SOURCES
} from '@/config/claude-code-documentation-urls.js';

describe('URL Configuration Service', () => {
  describe('getDocUrl', () => {
    it('should return correct URL for overview page', () => {
      const url = getDocUrl('overview');
      expect(url).toBe('https://docs.claude.com/en/docs/claude-code/overview');
    });

    it('should return correct URL for slash commands page', () => {
      const url = getDocUrl('slashCommands');
      expect(url).toBe('https://docs.claude.com/en/docs/claude-code/slash-commands');
    });

    it('should return correct URL for MCP page', () => {
      const url = getDocUrl('mcp');
      expect(url).toBe('https://docs.claude.com/en/docs/claude-code/mcp');
    });
  });

  describe('getAllDocUrls', () => {
    it('should return all configured URLs', () => {
      const urls = getAllDocUrls();
      expect(urls).toHaveLength(10); // We have 10 pages configured
      expect(urls).toContain('https://docs.claude.com/en/docs/claude-code/overview');
      expect(urls).toContain('https://docs.claude.com/en/docs/claude-code/quickstart');
      expect(urls).toContain('https://docs.claude.com/en/docs/claude-code/hooks');
    });
  });

  describe('URL Validation', () => {
    it('should validate correct documentation URLs', () => {
      const isValid = docUrlService.isValidDocumentationUrl(
        'https://docs.claude.com/en/docs/claude-code/overview'
      );
      expect(isValid).toBe(true);
    });

    it('should validate legacy documentation URLs', () => {
      const isValid = docUrlService.isValidDocumentationUrl(
        'https://docs.anthropic.com/en/docs/claude-code/settings'
      );
      expect(isValid).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const isValid = docUrlService.isValidDocumentationUrl('https://example.com/some/other/docs');
      expect(isValid).toBe(false);
    });

    it('should reject URLs with wrong path structure', () => {
      const isValid = docUrlService.isValidDocumentationUrl(
        'https://docs.claude.com/wrong/path/structure'
      );
      expect(isValid).toBe(false);
    });
  });

  describe('Page Key Extraction', () => {
    it('should extract page key from URL', () => {
      const key = docUrlService.getPageKeyFromUrl(
        'https://docs.claude.com/en/docs/claude-code/slash-commands'
      );
      expect(key).toBe('slashCommands');
    });

    it('should extract page key from legacy URL', () => {
      const key = docUrlService.getPageKeyFromUrl(
        'https://docs.anthropic.com/en/docs/claude-code/hooks'
      );
      expect(key).toBe('hooks');
    });

    it('should return null for invalid URLs', () => {
      const key = docUrlService.getPageKeyFromUrl('https://example.com/invalid');
      expect(key).toBeNull();
    });
  });

  describe('Configuration Structure', () => {
    it('should have required configuration properties', () => {
      expect(DOCUMENTATION_SOURCES.CLAUDE_CODE.current).toBeDefined();
      expect(DOCUMENTATION_SOURCES.CLAUDE_CODE.legacy).toBeInstanceOf(Array);
      expect(DOCUMENTATION_SOURCES.CLAUDE_CODE.pathPrefix).toBeDefined();
      expect(DOCUMENTATION_SOURCES.CLAUDE_CODE.pages).toBeDefined();
    });

    it('should have all expected pages configured', () => {
      const pages = DOCUMENTATION_SOURCES.CLAUDE_CODE.pages;
      expect(pages.overview).toBe('overview');
      expect(pages.quickstart).toBe('quickstart');
      expect(pages.slashCommands).toBe('slash-commands');
      expect(pages.hooks).toBe('hooks');
      expect(pages.settings).toBe('settings');
      expect(pages.mcp).toBe('mcp');
    });
  });
});
