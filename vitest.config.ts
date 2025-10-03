import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './tests/setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.{idea,git,cache,output,temp}/**', '**/.local/**', '**/.data/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/build/**',
        '**/dist/**',
        '**/*.types.ts',
        '**/types.ts', // Pure type definition files
        '**/tests/**',
        '**/fixtures/**',
        '**/mocks/**',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/*.config.js',
        // Entry points - just wire up components, not testable logic
        '**/src/index.ts',
        // Manual scripts - not part of production runtime
        '**/utils/integration-test.ts',
        '**/utils/setup-collection.ts',
        '**/.local/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});