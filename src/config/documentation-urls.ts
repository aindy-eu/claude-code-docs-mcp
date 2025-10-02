/**
 * Documentation URL Configuration Service
 *
 * Single source of truth for all documentation URLs.
 * Handles URL migrations, redirects, and provides backward compatibility.
 *
 * @module config/documentation-urls
 */

import { DocumentationSource, UrlMigration } from './documentation-urls.types.js';

/**
 * Main documentation sources configuration
 */
export const DOCUMENTATION_SOURCES = {
  CLAUDE_CODE: {
    current: process.env.DOCS_BASE_URL || 'https://docs.claude.com',
    legacy: ['https://docs.anthropic.com'] as string[],
    pathPrefix: '/en/docs/claude-code',
    pages: {
      overview: 'overview',
      quickstart: 'quickstart',
      slashCommands: 'slash-commands',
      hooks: 'hooks',
      settings: 'settings',
      mcp: 'mcp',
      memory: 'memory',
      commonWorkflows: 'common-workflows',
      interactiveMode: 'interactive-mode',
      cliReference: 'cli-reference'
    }
  }
} as const;

/**
 * Core documentation pages - essential subset for quick seeding
 * These 5 pages provide the most value for new users/forks
 */
export const CORE_PAGES: Array<keyof typeof DOCUMENTATION_SOURCES.CLAUDE_CODE.pages> = [
  'overview', // What is Claude Code?
  'quickstart', // Get started fast
  'hooks', // Most powerful feature
  'slashCommands', // Core CLI usage
  'mcp' // MCP integration (why they're using this!)
];

/**
 * Documentation URL service for managing and resolving documentation URLs
 */
export class DocumentationUrlService {
  private source: DocumentationSource;
  private urlCache = new Map<string, string>();

  constructor(source: DocumentationSource = DOCUMENTATION_SOURCES.CLAUDE_CODE) {
    this.source = source;
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.source.current;
  }

  /**
   * Get URL for a specific documentation page
   */
  getPageUrl(pageKey: keyof typeof DOCUMENTATION_SOURCES.CLAUDE_CODE.pages): string {
    const cached = this.urlCache.get(pageKey);
    if (cached) return cached;

    const page = this.source.pages[pageKey];
    if (!page) {
      throw new Error(`Unknown documentation page: ${pageKey}`);
    }

    const url = `${this.source.current}${this.source.pathPrefix}/${page}`;
    this.urlCache.set(pageKey, url);
    return url;
  }

  /**
   * Get all documentation URLs as an array
   */
  getAllUrls(): string[] {
    return Object.keys(this.source.pages).map(key =>
      this.getPageUrl(key as keyof typeof DOCUMENTATION_SOURCES.CLAUDE_CODE.pages)
    );
  }

  /**
   * Check if a URL is a legacy URL that needs migration
   */
  isLegacyUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.source.legacy.some(legacy => {
        const legacyObj = new URL(legacy);
        return urlObj.hostname === legacyObj.hostname;
      });
    } catch {
      return false;
    }
  }

  /**
   * Migrate a legacy URL to the current format
   */
  migrateUrl(legacyUrl: string): string {
    if (!this.isLegacyUrl(legacyUrl)) {
      return legacyUrl;
    }

    try {
      const urlObj = new URL(legacyUrl);

      // Find which legacy domain this is
      for (const legacyBase of this.source.legacy) {
        const legacyObj = new URL(legacyBase);
        if (urlObj.hostname === legacyObj.hostname) {
          // Replace the base URL while keeping the path
          const newUrl = legacyUrl.replace(
            `${urlObj.protocol}//${urlObj.hostname}`,
            this.source.current
          );
          return newUrl;
        }
      }
    } catch (error) {
      console.error(`Failed to migrate URL ${legacyUrl}:`, error);
    }

    return legacyUrl;
  }

  /**
   * Batch migrate multiple URLs
   */
  migrateUrls(urls: string[]): UrlMigration[] {
    const migrations: UrlMigration[] = [];

    for (const url of urls) {
      const migratedUrl = this.migrateUrl(url);
      if (migratedUrl !== url) {
        migrations.push({
          from: url,
          to: migratedUrl,
          migratedAt: new Date().toISOString()
        });
      }
    }

    return migrations;
  }

  /**
   * Extract page key from a URL
   */
  getPageKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Remove the path prefix and get the page name
      const pagePattern = new RegExp(`${this.source.pathPrefix}/([^/]+)$`);
      const match = path.match(pagePattern);

      if (match) {
        const pageName = match[1];
        // Find the key that matches this page name
        for (const [key, value] of Object.entries(this.source.pages)) {
          if (value === pageName) {
            return key;
          }
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Validate if a URL matches our expected documentation structure
   */
  isValidDocumentationUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check if it's current or legacy base
      const validBases = [this.source.current, ...this.source.legacy];
      const hasValidBase = validBases.some(base => {
        const baseObj = new URL(base);
        return urlObj.hostname === baseObj.hostname;
      });

      if (!hasValidBase) return false;

      // Check if path matches expected pattern
      return urlObj.pathname.startsWith(this.source.pathPrefix);
    } catch {
      return false;
    }
  }

  /**
   * Get configuration for shell scripts
   * Returns environment variable format for easy consumption
   */
  getShellConfig(): string {
    const lines = [
      `# Documentation URL Configuration`,
      `DOCS_BASE_URL="${this.source.current}"`,
      `DOCS_PATH_PREFIX="${this.source.pathPrefix}"`,
      ``,
      `# Page paths`
    ];

    for (const [key, value] of Object.entries(this.source.pages)) {
      const envKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
      lines.push(`DOCS_PAGE_${envKey}="${value}"`);
    }

    lines.push('', '# Full URLs');
    for (const [key] of Object.entries(this.source.pages)) {
      const envKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
      const url = this.getPageUrl(key as any);
      lines.push(`DOCS_URL_${envKey}="${url}"`);
    }

    return lines.join('\n');
  }
}

// Default singleton instance
export const docUrlService = new DocumentationUrlService();

// Export convenience functions
export const getDocUrl = (page: keyof typeof DOCUMENTATION_SOURCES.CLAUDE_CODE.pages) =>
  docUrlService.getPageUrl(page);

export const getAllDocUrls = () => docUrlService.getAllUrls();

export const migrateDocUrl = (url: string) => docUrlService.migrateUrl(url);
