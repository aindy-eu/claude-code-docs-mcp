/**
 * List Command Smoke Tests
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registerListCommand } from '@/cli/commands/list.js';
import type { Command } from 'commander';

vi.mock('@/cli/pipeline/index.js', () => ({
  Pipeline: vi.fn().mockImplementation(() => ({
    list: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('registerListCommand', () => {
  let mockProgram: any;
  let registeredAction: () => Promise<void>;

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

  it('should register the list command', () => {
    registerListCommand(mockProgram as unknown as Command);

    expect(mockProgram.command).toHaveBeenCalledWith('list');
    expect(mockProgram.description).toHaveBeenCalledWith('List all ingested documentation');
  });

  it('should call pipeline.list', async () => {
    registerListCommand(mockProgram as unknown as Command);

    const { Pipeline } = await import('@/cli/pipeline/index.js');
    const mockList = vi.fn().mockResolvedValue(undefined);
    (Pipeline as any).mockImplementation(() => ({
      list: mockList
    }));

    await registeredAction();

    expect(mockList).toHaveBeenCalled();
  });
});
