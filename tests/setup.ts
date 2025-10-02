import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Suppress console output in tests (keeps test output clean)
/* eslint-disable no-console */
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

global.beforeAll(() => {
  // Suppress logger output during tests
  // You can still see test results, but not [INFO]/[ERROR] spam
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

global.afterAll(() => {
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

// Global test timeout
jest.setTimeout(30000);
