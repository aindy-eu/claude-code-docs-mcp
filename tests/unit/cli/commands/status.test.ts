/**
 * Status Command Smoke Tests
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registerStatusCommand } from '@/cli/commands/status.js';
import type { Command } from 'commander';

vi.mock('@/cli/pipeline/index.js', () => ({
  Pipeline: vi.fn().mockImplementation(() => ({
    status: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('registerStatusCommand', () => {
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

  it('should register the status command', () => {
    registerStatusCommand(mockProgram as unknown as Command);

    expect(mockProgram.command).toHaveBeenCalledWith('status <url>');
    expect(mockProgram.description).toHaveBeenCalledWith('Show manifest record for a URL');
  });

  it('should call pipeline.status with URL', async () => {
    registerStatusCommand(mockProgram as unknown as Command);

    const { Pipeline } = await import('@/cli/pipeline/index.js');
    const mockStatus = vi.fn().mockResolvedValue(undefined);
    (Pipeline as any).mockImplementation(() => ({
      status: mockStatus
    }));

    const testUrl = 'https://docs.claude.com/test';
    await registeredAction(testUrl);

    expect(mockStatus).toHaveBeenCalledWith(testUrl);
  });
});
