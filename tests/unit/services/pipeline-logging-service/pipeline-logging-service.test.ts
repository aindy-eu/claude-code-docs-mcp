/**
 * Tests for PipelineLogger service
 */

import { PipelineLoggingService } from '@/services/pipeline-logging-service.js';
import { existsSync, readFileSync, rmSync, appendFileSync } from 'fs';
import path from 'path';

// Use unique test domain to avoid conflicts with other tests
const TEST_DOMAIN = 'pipeline-logger-test.local';
const TEST_URL = `https://${TEST_DOMAIN}/test-doc`;
const TEST_LOG_DIR = path.join(process.cwd(), '.data', TEST_DOMAIN, 'logs');

describe('PipelineLoggingService', () => {
  beforeEach(() => {
    // Clean up test log directory
    const dataDir = path.join(process.cwd(), '.data', TEST_DOMAIN);
    if (existsSync(dataDir)) {
      rmSync(dataDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after tests
    const dataDir = path.join(process.cwd(), '.data', TEST_DOMAIN);
    if (existsSync(dataDir)) {
      rmSync(dataDir, { recursive: true, force: true });
    }
  });

  describe('Initialization', () => {
    it('should create log directory on construction', () => {
      const _logger = new PipelineLoggingService(TEST_URL);
      expect(existsSync(TEST_LOG_DIR)).toBe(true);
    });

    it('should write logs to created directory', () => {
      const logger = new PipelineLoggingService(TEST_URL);
      logger.logFetch(TEST_URL, 100);

      expect(existsSync(TEST_LOG_DIR)).toBe(true);
      expect(existsSync(path.join(TEST_LOG_DIR, 'fetch.jsonl'))).toBe(true);
    });

    it('should create stage-specific log files', () => {
      const logger = new PipelineLoggingService(TEST_URL);

      logger.logFetch(TEST_URL, 100);
      expect(existsSync(path.join(TEST_LOG_DIR, 'fetch.jsonl'))).toBe(true);

      logger.logExtract(TEST_URL, 'claude-sonnet-4', 200, 5, 3);
      expect(existsSync(path.join(TEST_LOG_DIR, 'extract.jsonl'))).toBe(true);

      logger.logEmbed(TEST_URL, 'ollama', 300, 10);
      expect(existsSync(path.join(TEST_LOG_DIR, 'embed.jsonl'))).toBe(true);
    });
  });

  describe('logFetch', () => {
    it('should log successful fetch', () => {
      const logger = new PipelineLoggingService(TEST_URL);
      logger.logFetch(TEST_URL, 150);

      const logPath = path.join(TEST_LOG_DIR, 'fetch.jsonl');
      const content = readFileSync(logPath, 'utf-8');
      const entry = JSON.parse(content.trim());

      expect(entry.level).toBe('info');
      expect(entry.stage).toBe('fetch');
      expect(entry.url).toBe(TEST_URL);
      expect(entry.message).toBe('HTML fetched successfully');
      expect(entry.duration_ms).toBe(150);
      expect(entry.timestamp).toBeDefined();
    });
  });

  describe('logFetchError', () => {
    it('should log fetch error', () => {
      const logger = new PipelineLoggingService(TEST_URL);
      logger.logFetchError(TEST_URL, 'Network timeout', 5000);

      const logPath = path.join(TEST_LOG_DIR, 'fetch.jsonl');
      const content = readFileSync(logPath, 'utf-8');
      const entry = JSON.parse(content.trim());

      expect(entry.level).toBe('error');
      expect(entry.stage).toBe('fetch');
      expect(entry.message).toBe('Fetch failed');
      expect(entry.error).toBe('Network timeout');
      expect(entry.duration_ms).toBe(5000);
    });
  });

  describe('logExtract', () => {
    it('should log successful extraction', () => {
      const logger = new PipelineLoggingService(TEST_URL);
      logger.logExtract(TEST_URL, 'claude-sonnet-4-5-20250929', 45000, 12, 8);

      const logPath = path.join(TEST_LOG_DIR, 'extract.jsonl');
      const content = readFileSync(logPath, 'utf-8');
      const entry = JSON.parse(content.trim());

      expect(entry.level).toBe('info');
      expect(entry.stage).toBe('extract');
      expect(entry.message).toBe('Extraction successful');
      expect(entry.model).toBe('claude-sonnet-4-5-20250929');
      expect(entry.duration_ms).toBe(45000);
      expect(entry.section_count).toBe(12);
      expect(entry.code_example_count).toBe(8);
    });
  });

  describe('logExtractError', () => {
    it('should log extraction error with raw response', () => {
      const logger = new PipelineLoggingService(TEST_URL);
      const rawResponse = 'Prompt is too long\n';

      logger.logExtractError(
        TEST_URL,
        'claude-sonnet-4-5-20250929',
        'Claude CLI failed',
        rawResponse,
        4500
      );

      const logPath = path.join(TEST_LOG_DIR, 'extract.jsonl');
      const content = readFileSync(logPath, 'utf-8');
      const entry = JSON.parse(content.trim());

      expect(entry.level).toBe('error');
      expect(entry.stage).toBe('extract');
      expect(entry.message).toBe('Extraction failed');
      expect(entry.error).toBe('Claude CLI failed');
      expect(entry.raw_response).toBe(rawResponse);
      expect(entry.duration_ms).toBe(4500);
    });

    it('should truncate large raw responses', () => {
      const logger = new PipelineLoggingService(TEST_URL);
      const largeResponse = 'x'.repeat(20000); // 20KB response

      logger.logExtractError(TEST_URL, 'claude-sonnet-4', 'Error', largeResponse, 1000);

      const logPath = path.join(TEST_LOG_DIR, 'extract.jsonl');
      const content = readFileSync(logPath, 'utf-8');
      const entry = JSON.parse(content.trim());

      // Should be truncated to 10KB
      expect(entry.raw_response.length).toBe(10000);
    });
  });

  describe('logEmbed', () => {
    it('should log successful embedding', () => {
      const logger = new PipelineLoggingService(TEST_URL);
      logger.logEmbed(TEST_URL, 'ollama', 3000, 15);

      const logPath = path.join(TEST_LOG_DIR, 'embed.jsonl');
      const content = readFileSync(logPath, 'utf-8');
      const entry = JSON.parse(content.trim());

      expect(entry.level).toBe('info');
      expect(entry.stage).toBe('embed');
      expect(entry.message).toBe('Embedding successful');
      expect(entry.provider).toBe('ollama');
      expect(entry.duration_ms).toBe(3000);
      expect(entry.vector_count).toBe(15);
    });
  });

  describe('logEmbedError', () => {
    it('should log embedding error', () => {
      const logger = new PipelineLoggingService(TEST_URL);
      logger.logEmbedError(TEST_URL, 'openai', 'API key not found', 100);

      const logPath = path.join(TEST_LOG_DIR, 'embed.jsonl');
      const content = readFileSync(logPath, 'utf-8');
      const entry = JSON.parse(content.trim());

      expect(entry.level).toBe('error');
      expect(entry.stage).toBe('embed');
      expect(entry.message).toBe('Embedding failed');
      expect(entry.error).toBe('API key not found');
      expect(entry.provider).toBe('openai');
    });
  });

  describe('JSONL format', () => {
    it('should write multiple entries as separate lines', () => {
      const logger = new PipelineLoggingService(TEST_URL);

      logger.logFetch(TEST_URL, 100);
      logger.logFetch(TEST_URL, 200);
      logger.logFetch(TEST_URL, 300);

      const logPath = path.join(TEST_LOG_DIR, 'fetch.jsonl');
      const content = readFileSync(logPath, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(3);

      // Each line should be valid JSON
      lines.forEach(line => {
        expect(() => JSON.parse(line)).not.toThrow();
      });
    });

    it('should maintain chronological order', async () => {
      const logger = new PipelineLoggingService(TEST_URL);

      logger.logFetch(TEST_URL, 100);
      await new Promise(resolve => setTimeout(resolve, 10));
      logger.logFetch(TEST_URL, 200);

      const logPath = path.join(TEST_LOG_DIR, 'fetch.jsonl');
      const content = readFileSync(logPath, 'utf-8');
      const lines = content.trim().split('\n');
      const entries = lines.map(line => JSON.parse(line));

      expect(entries[0].duration_ms).toBe(100);
      expect(entries[1].duration_ms).toBe(200);
      // Timestamps are ISO strings, compare as strings (lexicographic order works for ISO format)
      expect(entries[0].timestamp <= entries[1].timestamp).toBe(true);
    });
  });

  describe('readLogs', () => {
    it('should read all logs for a stage', () => {
      const logger = new PipelineLoggingService(TEST_URL);

      logger.logFetch(TEST_URL, 100);
      logger.logFetch(TEST_URL, 200);
      logger.logFetch(TEST_URL, 300);

      const logs = PipelineLoggingService.readLogs(TEST_DOMAIN, 'fetch');

      expect(logs.length).toBe(3);
      expect(logs[0].duration_ms).toBe(100);
      expect(logs[1].duration_ms).toBe(200);
      expect(logs[2].duration_ms).toBe(300);
    });

    it('should return empty array for non-existent logs', () => {
      const logs = PipelineLoggingService.readLogs('non-existent.com', 'fetch');
      expect(logs).toEqual([]);
    });

    it('should handle corrupt log files gracefully', () => {
      const logger = new PipelineLoggingService(TEST_URL);
      logger.logFetch(TEST_URL, 100);

      // Append corrupt line
      const logPath = path.join(TEST_LOG_DIR, 'fetch.jsonl');
      appendFileSync(logPath, '\nNOT VALID JSON\n');

      // Should not throw, but may return empty array or partial results
      expect(() => {
        PipelineLoggingService.readLogs(TEST_DOMAIN, 'fetch');
      }).not.toThrow();
    });
  });

  describe('Full pipeline logging', () => {
    it('should track complete pipeline execution', () => {
      const logger = new PipelineLoggingService(TEST_URL);

      // Fetch
      logger.logFetch(TEST_URL, 150);

      // Extract
      logger.logExtract(TEST_URL, 'claude-sonnet-4', 45000, 10, 5);

      // Embed
      logger.logEmbed(TEST_URL, 'ollama', 3000, 10);

      // Verify all log files exist
      expect(existsSync(path.join(TEST_LOG_DIR, 'fetch.jsonl'))).toBe(true);
      expect(existsSync(path.join(TEST_LOG_DIR, 'extract.jsonl'))).toBe(true);
      expect(existsSync(path.join(TEST_LOG_DIR, 'embed.jsonl'))).toBe(true);

      // Verify content
      const fetchLogs = PipelineLoggingService.readLogs(TEST_DOMAIN, 'fetch');
      const extractLogs = PipelineLoggingService.readLogs(TEST_DOMAIN, 'extract');
      const embedLogs = PipelineLoggingService.readLogs(TEST_DOMAIN, 'embed');

      expect(fetchLogs.length).toBe(1);
      expect(extractLogs.length).toBe(1);
      expect(embedLogs.length).toBe(1);

      expect(fetchLogs[0].stage).toBe('fetch');
      expect(extractLogs[0].stage).toBe('extract');
      expect(embedLogs[0].stage).toBe('embed');
    });
  });
});
