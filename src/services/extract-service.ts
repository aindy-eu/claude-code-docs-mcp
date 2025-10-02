/**
 * Extract Service
 * Handles Claude extraction and JSON caching for the extract pipeline stage
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

export class ExtractService {
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
    this.ensureDirectoryExists(path.join(this.baseDir, 'structured'));
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
   * Get JSON path for a URL
   */
  getJsonPath(url: string): string {
    const structuredDir = path.join(this.baseDir, 'structured');

    // Extract a clean name for the JSON file
    const urlPath = new URL(url).pathname;
    const segments = urlPath.split('/').filter(Boolean);
    const fileName = segments.length > 0 ? segments[segments.length - 1] : 'index';
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9-]/g, '_');

    return path.join(structuredDir, `${cleanFileName}.json`);
  }

  /**
   * Save extracted JSON
   */
  async save(url: string, json: unknown): Promise<void> {
    const jsonPath = this.getJsonPath(url);

    // Ensure directory exists
    const dir = path.dirname(jsonPath);
    this.ensureDirectoryExists(dir);

    // Save JSON
    writeFileSync(jsonPath, JSON.stringify(json, null, 2));

    logger.info(`Saved extracted JSON for ${url}`);
  }

  /**
   * Get extracted JSON from cache
   */
  async get(url: string): Promise<unknown | null> {
    const jsonPath = this.getJsonPath(url);

    if (!existsSync(jsonPath)) {
      return null;
    }

    return JSON.parse(readFileSync(jsonPath, 'utf-8'));
  }

  /**
   * Check if extraction exists
   */
  exists(url: string): boolean {
    const jsonPath = this.getJsonPath(url);
    return existsSync(jsonPath);
  }
}
