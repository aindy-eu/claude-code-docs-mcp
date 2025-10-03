/**
 * Extract Command Smoke Tests
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registerExtractCommand } from '@/cli/commands/extract.js';
import type { Command } from 'commander';

vi.mock('@/cli/pipeline/index.js', () => ({
  Pipeline: vi.fn().mockImplementation(() => ({
    extract: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('registerExtractCommand', () => {
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

  it('should register the extract command with options', () => {
    registerExtractCommand(mockProgram as unknown as Command);

    expect(mockProgram.command).toHaveBeenCalledWith('extract <url>');
    expect(mockProgram.description).toHaveBeenCalledWith('Extract structured data using Claude');
    expect(mockProgram.option).toHaveBeenCalledWith(
      '--model <model>',
      'Claude model for extraction',
      'claude-sonnet-4-5-20250929'
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      '--force',
      'Force re-extraction even if cached'
    );
  });

  it('should call pipeline.extract with URL and options', async () => {
    registerExtractCommand(mockProgram as unknown as Command);

    const { Pipeline } = await import('@/cli/pipeline/index.js');
    const mockExtract = vi.fn().mockResolvedValue(undefined);
    (Pipeline as any).mockImplementation(() => ({
      extract: mockExtract
    }));

    const testUrl = 'https://docs.claude.com/test';
    const testOptions = { force: true, model: 'claude-opus-4' };

    await registeredAction(testUrl, testOptions);

    expect(mockExtract).toHaveBeenCalledWith(testUrl, testOptions);
  });
});
