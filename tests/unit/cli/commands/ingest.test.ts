/**
 * Ingest Command Smoke Tests
 * Educational example: Testing command registration and option handling
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registerIngestCommand } from '@/cli/commands/ingest.js';
import type { Command } from 'commander';

// Mock the Pipeline to avoid actual execution
vi.mock('@/cli/pipeline/index.js', () => ({
  Pipeline: vi.fn().mockImplementation(() => ({
    ingest: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('registerIngestCommand', () => {
  let mockProgram: any;
  let registeredAction: (url: string, options: any) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock Commander program
    mockProgram = {
      command: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      action: vi.fn(fn => {
        registeredAction = fn;
        return mockProgram;
      })
    };
  });

  describe('command registration', () => {
    it('should register the ingest command', () => {
      registerIngestCommand(mockProgram as unknown as Command);

      expect(mockProgram.command).toHaveBeenCalledWith('ingest <url>');
    });

    it('should set description', () => {
      registerIngestCommand(mockProgram as unknown as Command);

      expect(mockProgram.description).toHaveBeenCalledWith(
        'Full ingestion pipeline: fetch → extract → embed → store'
      );
    });

    it('should register --force option', () => {
      registerIngestCommand(mockProgram as unknown as Command);

      expect(mockProgram.option).toHaveBeenCalledWith(
        '--force',
        'Force re-extraction even if cached'
      );
    });

    it('should register --model option with default', () => {
      registerIngestCommand(mockProgram as unknown as Command);

      expect(mockProgram.option).toHaveBeenCalledWith(
        '--model <model>',
        'Claude model for extraction',
        'claude-sonnet-4-5-20250929'
      );
    });

    it('should register --provider option with default', () => {
      registerIngestCommand(mockProgram as unknown as Command);

      expect(mockProgram.option).toHaveBeenCalledWith(
        '--provider <provider>',
        'Embedding provider (ollama/openai)',
        'ollama'
      );
    });

    it('should register action handler', () => {
      registerIngestCommand(mockProgram as unknown as Command);

      expect(mockProgram.action).toHaveBeenCalled();
    });
  });

  describe('action handler', () => {
    it('should call pipeline.ingest with URL and options', async () => {
      registerIngestCommand(mockProgram as unknown as Command);

      const { Pipeline } = await import('@/cli/pipeline/index.js');
      const mockIngest = vi.fn().mockResolvedValue(undefined);
      (Pipeline as any).mockImplementation(() => ({
        ingest: mockIngest
      }));

      const testUrl = 'https://docs.claude.com/test';
      const testOptions = { force: true, model: 'claude-opus-4' };

      await registeredAction(testUrl, testOptions);

      expect(mockIngest).toHaveBeenCalledWith(testUrl, testOptions);
    });
  });
});
