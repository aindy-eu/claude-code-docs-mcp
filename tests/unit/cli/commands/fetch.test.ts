/**
 * Fetch Command Smoke Tests
 * Educational example: Testing simple pipeline proxy commands
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registerFetchCommand } from '@/cli/commands/fetch.js';
import type { Command } from 'commander';

vi.mock('@/cli/pipeline/index.js', () => ({
  Pipeline: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('registerFetchCommand', () => {
  let mockProgram: any;
  let registeredAction: (url: string) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProgram = {
      command: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      action: vi.fn(fn => {
        registeredAction = fn;
        return mockProgram;
      })
    };
  });

  it('should register the fetch command', () => {
    registerFetchCommand(mockProgram as unknown as Command);

    expect(mockProgram.command).toHaveBeenCalledWith('fetch <url>');
    expect(mockProgram.description).toHaveBeenCalledWith('Fetch and cache clean HTML content');
  });

  it('should call pipeline.fetch with URL', async () => {
    registerFetchCommand(mockProgram as unknown as Command);

    const { Pipeline } = await import('@/cli/pipeline/index.js');
    const mockFetch = vi.fn().mockResolvedValue(undefined);
    (Pipeline as any).mockImplementation(() => ({
      fetch: mockFetch
    }));

    const testUrl = 'https://docs.claude.com/test';
    await registeredAction(testUrl);

    expect(mockFetch).toHaveBeenCalledWith(testUrl);
  });
});
