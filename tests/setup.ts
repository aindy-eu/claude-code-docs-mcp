import { config } from 'dotenv';
import { vi, beforeAll, afterAll } from 'vitest';

// Load test environment variables
config({ path: '.env.test' });

// Suppress console output in tests (keeps test output clean)
/* eslint-disable no-console */
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

beforeAll(() => {
  // Suppress logger output during tests
  // You can still see test results, but not [INFO]/[ERROR] spam
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
  console.info = vi.fn();
});

afterAll(() => {
  // Restore console after all tests
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
});
/* eslint-enable no-console */

// Global test setup
beforeAll(async () => {
  // Set default test environment variables if not provided
  if (!process.env.QDRANT_HOST) {
    process.env.QDRANT_HOST = 'localhost';
  }
  if (!process.env.QDRANT_PORT) {
    process.env.QDRANT_PORT = '6333';
  }
  if (!process.env.DEFAULT_EMBEDDING_PROVIDER) {
    process.env.DEFAULT_EMBEDDING_PROVIDER = 'ollama';
  }
});
