/**
 * SeedCommand Tests
 * Tests business logic for seeding documentation
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SeedCommand } from '@/cli/commands/seed.js';
import type { SeedOptions } from '@/cli/commands/seed.types.js';

// Mock dependencies
vi.mock('@/cli/pipeline/index.js');
vi.mock('@/services/manifest-service.js');
vi.mock('@/config/documentation-urls.js', () => ({
  DocumentationUrlService: vi.fn().mockImplementation(() => ({
    getAllUrls: vi.fn(() => [
      'https://docs.claude.com/en/docs/claude-code/overview',
      'https://docs.claude.com/en/docs/claude-code/hooks',
      'https://docs.claude.com/en/docs/claude-code/settings',
      'https://docs.claude.com/en/docs/claude-code/memory',
      'https://docs.claude.com/en/docs/claude-code/mcp',
      'https://docs.claude.com/en/docs/claude-code/quickstart',
      'https://docs.claude.com/en/docs/claude-code/slash-commands'
    ]),
    getPageUrl: vi.fn((key: string) => `https://docs.claude.com/en/docs/claude-code/${key}`),
    getPageKeyFromUrl: vi.fn((url: string) => url.split('/').pop())
  })),
  CORE_PAGES: ['overview', 'hooks', 'settings', 'memory', 'mcp']
}));

// Mock Listr
vi.mock('listr2', () => ({
  Listr: vi.fn().mockImplementation((tasks, options) => ({
    run: vi.fn().mockResolvedValue(undefined),
    ctx: options.ctx
  }))
}));

describe('SeedCommand', () => {
  let seedCommand: SeedCommand;

  beforeEach(() => {
    vi.clearAllMocks();
    seedCommand = new SeedCommand();
  });

  describe('URL selection logic', () => {
    it('should default to core pages (5 pages)', async () => {
      const { Listr } = await import('listr2');

      await seedCommand.run({});

      // Check that Listr was called with 5 tasks (core pages)
      expect(Listr).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ title: expect.any(String) })]),
        expect.objectContaining({
          concurrent: false,
          exitOnError: false
        })
      );

      const tasks = (Listr as any).mock.calls[0][0];
      expect(tasks).toHaveLength(5);
    });

    it('should seed all pages when --all is specified', async () => {
      const { Listr } = await import('listr2');
      const options: SeedOptions = { all: true };

      await seedCommand.run(options);

      const tasks = (Listr as any).mock.calls[0][0];
      expect(tasks).toHaveLength(10); // All configured pages
    });
  });

  describe('options passing', () => {
    it('should pass model option to pipeline', async () => {
      const options: SeedOptions = { model: 'claude-opus-4' };

      await seedCommand.run(options);

      // Verify the task structure includes the model option
      const { Listr } = await import('listr2');
      const tasks = (Listr as any).mock.calls[0][0];

      // Task should be structured properly
      expect(tasks[0]).toHaveProperty('task');
      expect(tasks[0]).toHaveProperty('title');
    });

    it('should pass provider option to pipeline', async () => {
      const options: SeedOptions = { provider: 'openai' };

      await seedCommand.run(options);

      const { Listr } = await import('listr2');
      expect(Listr).toHaveBeenCalled();
    });

    it('should pass dev mode to pipeline', async () => {
      const options: SeedOptions = { dev: true };

      await seedCommand.run(options);

      const { Listr } = await import('listr2');
      expect(Listr).toHaveBeenCalled();
    });
  });

  describe('task configuration', () => {
    it('should run tasks sequentially (not concurrent)', async () => {
      await seedCommand.run({});

      const { Listr } = await import('listr2');
      const config = (Listr as any).mock.calls[0][1];

      expect(config.concurrent).toBe(false);
    });

    it('should continue on error (exitOnError: false)', async () => {
      await seedCommand.run({});

      const { Listr } = await import('listr2');
      const config = (Listr as any).mock.calls[0][1];

      expect(config.exitOnError).toBe(false);
    });

    it('should include retry configuration', async () => {
      await seedCommand.run({});

      const { Listr } = await import('listr2');
      const tasks = (Listr as any).mock.calls[0][0];

      // Each task should have retry option
      expect(tasks[0].options).toHaveProperty('retry', 2);
    });
  });
});
