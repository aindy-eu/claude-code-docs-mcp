import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

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
