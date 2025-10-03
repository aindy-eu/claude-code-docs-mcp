/**
 * CLI Index Smoke Tests
 * Educational example: Testing CLI entry points
 *
 * Note: This file is the CLI entry point (#!/usr/bin/env node)
 * Testing executable entry points is tricky - we just verify it can be imported
 * without crashing. We mock Commander to prevent actual argv parsing.
 */

import { vi, describe, it, expect } from 'vitest';

// Mock Commander to prevent actual parsing
vi.mock('commander', () => {
  const mockProgram = {
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    command: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    parse: vi.fn() // Don't actually parse argv
  };
  return {
    Command: vi.fn(() => mockProgram)
  };
});

// Mock all command modules to prevent their execution
vi.mock('@/cli/commands/ingest.js');
vi.mock('@/cli/commands/fetch.js');
vi.mock('@/cli/commands/extract.js');
vi.mock('@/cli/commands/embed.js');
vi.mock('@/cli/commands/status.js');
vi.mock('@/cli/commands/list.js');
vi.mock('@/cli/commands/seed.js');
vi.mock('@/cli/commands/sync.js');
vi.mock('@/cli/commands/search.js');

describe('CLI Index', () => {
  it('should import without crashing', async () => {
    // Simply importing the entry point should not throw
    // This verifies the module structure is valid
    await expect(import('@/cli/index.js')).resolves.toBeDefined();
  });
});
