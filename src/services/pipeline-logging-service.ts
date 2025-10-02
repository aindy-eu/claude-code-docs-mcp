/**
 * Pipeline Logging Service
 * Structured logging for documentation ingestion pipeline
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { LogEntry, LogLevel, PipelineStage } from './pipeline-logging-service.types.js';

export class PipelineLoggingService {
  private domain: string;
  private logDir: string;

  constructor(url: string) {
    this.domain = new URL(url).hostname;
    this.logDir = path.join(process.cwd(), '.data', this.domain, 'logs');

    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log an entry to the appropriate log file
   */
  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const fullEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Determine log file based on stage
    const logFile = path.join(this.logDir, `${entry.stage}.jsonl`);

    // Write as JSONL (one JSON object per line)
    try {
      appendFileSync(logFile, JSON.stringify(fullEntry) + '\n');
    } catch (error) {
      // Fallback to console if file write fails
      console.error('[LOGGER] Failed to write log:', error);
      console.error('[LOGGER] Entry:', fullEntry);
    }
  }

  /**
   * Log successful fetch
   */
  logFetch(url: string, duration_ms: number): void {
    this.log({
      level: 'info',
      stage: 'fetch',
      url,
      message: 'HTML fetched successfully',
      duration_ms
    });
  }

  /**
   * Log failed fetch
   */
  logFetchError(url: string, error: string, duration_ms: number): void {
    this.log({
      level: 'error',
      stage: 'fetch',
      url,
      message: 'Fetch failed',
      error,
      duration_ms
    });
  }

  /**
   * Log successful extraction
   */
  logExtract(
    url: string,
    model: string,
    duration_ms: number,
    section_count: number,
    code_example_count: number
  ): void {
    this.log({
      level: 'info',
      stage: 'extract',
      url,
      message: 'Extraction successful',
      model,
      duration_ms,
      section_count,
      code_example_count
    });
  }

  /**
   * Log failed extraction with raw response
   */
  logExtractError(
    url: string,
    model: string,
    error: string,
    raw_response: string,
    duration_ms: number
  ): void {
    this.log({
      level: 'error',
      stage: 'extract',
      url,
      message: 'Extraction failed',
      model,
      error,
      raw_response: raw_response.substring(0, 10000), // Limit to 10KB
      duration_ms
    });
  }

  /**
   * Log successful embedding
   */
  logEmbed(url: string, provider: string, duration_ms: number, vector_count: number): void {
    this.log({
      level: 'info',
      stage: 'embed',
      url,
      message: 'Embedding successful',
      provider,
      duration_ms,
      vector_count
    });
  }

  /**
   * Log failed embedding
   */
  logEmbedError(url: string, provider: string, error: string, duration_ms: number): void {
    this.log({
      level: 'error',
      stage: 'embed',
      url,
      message: 'Embedding failed',
      provider,
      error,
      duration_ms
    });
  }

  /**
   * Read logs for a specific stage (for debugging/analysis)
   */
  static readLogs(domain: string, stage: PipelineStage): LogEntry[] {
    const logFile = path.join(process.cwd(), '.data', domain, 'logs', `${stage}.jsonl`);

    if (!existsSync(logFile)) {
      return [];
    }

    try {
      const { readFileSync } = require('fs');
      const content = readFileSync(logFile, 'utf-8');
      return content
        .trim()
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => JSON.parse(line));
    } catch (error) {
      console.error('[LOGGER] Failed to read logs:', error);
      return [];
    }
  }
}
