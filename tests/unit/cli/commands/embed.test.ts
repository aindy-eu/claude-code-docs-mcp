/**
 * Embed Command Smoke Tests
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registerEmbedCommand } from '@/cli/commands/embed.js';
import type { Command } from 'commander';

vi.mock('@/cli/pipeline/index.js', () => ({
  Pipeline: vi.fn().mockImplementation(() => ({
    embed: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('registerEmbedCommand', () => {
  let mockProgram: any;
  let registeredAction: (url: string, options: any) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();

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

  it('should register the embed command with provider option', () => {
    registerEmbedCommand(mockProgram as unknown as Command);

    expect(mockProgram.command).toHaveBeenCalledWith('embed <url>');
    expect(mockProgram.description).toHaveBeenCalledWith('Generate embeddings and store in Qdrant');
    expect(mockProgram.option).toHaveBeenCalledWith(
      '--provider <provider>',
      'Embedding provider (ollama/openai)',
      'ollama'
    );
  });

  it('should call pipeline.embed with URL and options', async () => {
    registerEmbedCommand(mockProgram as unknown as Command);

    const { Pipeline } = await import('@/cli/pipeline/index.js');
    const mockEmbed = vi.fn().mockResolvedValue(undefined);
    (Pipeline as any).mockImplementation(() => ({
      embed: mockEmbed
    }));

    const testUrl = 'https://docs.claude.com/test';
    const testOptions = { provider: 'openai' };

    await registeredAction(testUrl, testOptions);

    expect(mockEmbed).toHaveBeenCalledWith(testUrl, testOptions);
  });
});
