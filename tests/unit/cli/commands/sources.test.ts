/**
 * SourcesCommand Tests
 * Tests business logic for listing documentation sources
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SourcesCommand } from '@/cli/commands/sources.js';

// Mock MasterManifestService
const mockGetSources = vi.fn(() => ({}));

vi.mock('@/services/master-manifest-service.js', () => ({
  MasterManifestService: vi.fn().mockImplementation(() => ({
    getSources: mockGetSources
  }))
}));

describe('SourcesCommand', () => {
  let sourcesCommand: SourcesCommand;
  let mockConsoleInfo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    sourcesCommand = new SourcesCommand();
  });

  describe('empty state', () => {
    it('should show empty state message when no sources', async () => {
      mockGetSources.mockReturnValue({});

      await sourcesCommand.run();

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('No documentation sources found')
      );
    });

    it('should suggest seeding when empty', async () => {
      mockGetSources.mockReturnValue({});

      await sourcesCommand.run();

      expect(mockConsoleInfo).toHaveBeenCalledWith(expect.stringContaining('npm run seed'));
    });
  });

  describe('with sources', () => {
    it('should display single source', async () => {
      mockGetSources.mockReturnValue({
        'docs.claude.com': {
          type: 'claude-code-docs',
          addedAt: '2025-01-15T10:00:00Z',
          lastSyncedAt: '2025-01-16T14:00:00Z',
          urlCount: 10,
          status: 'active'
        }
      });

      await sourcesCommand.run();

      // Check that domain was mentioned
      const calls = mockConsoleInfo.mock.calls.flat().join(' ');
      expect(calls).toContain('docs.claude.com');
      expect(calls).toContain('10 pages');
    });

    it('should group sources by type', async () => {
      mockGetSources.mockReturnValue({
        'docs.claude.com': {
          type: 'claude-code-docs',
          addedAt: '2025-01-15T10:00:00Z',
          lastSyncedAt: '2025-01-16T14:00:00Z',
          urlCount: 10,
          status: 'active'
        },
        'react.dev': {
          type: 'documentation',
          addedAt: '2025-01-16T09:00:00Z',
          lastSyncedAt: '2025-01-16T14:00:00Z',
          urlCount: 20,
          status: 'active'
        },
        'nextjs.org': {
          type: 'documentation',
          addedAt: '2025-01-16T09:00:00Z',
          lastSyncedAt: '2025-01-16T14:00:00Z',
          urlCount: 30,
          status: 'active'
        }
      });

      await sourcesCommand.run();

      const calls = mockConsoleInfo.mock.calls.flat().join(' ');
      expect(calls).toContain('claude-code-docs');
      expect(calls).toContain('documentation');
      expect(calls).toContain('docs.claude.com');
      expect(calls).toContain('react.dev');
      expect(calls).toContain('nextjs.org');
    });

    it('should show total count', async () => {
      mockGetSources.mockReturnValue({
        'docs.claude.com': {
          type: 'claude-code-docs',
          addedAt: '2025-01-15T10:00:00Z',
          lastSyncedAt: '2025-01-16T14:00:00Z',
          urlCount: 10,
          status: 'active'
        },
        'react.dev': {
          type: 'documentation',
          addedAt: '2025-01-16T09:00:00Z',
          lastSyncedAt: '2025-01-16T14:00:00Z',
          urlCount: 20,
          status: 'active'
        }
      });

      await sourcesCommand.run();

      expect(mockConsoleInfo).toHaveBeenCalledWith(expect.stringContaining('Total: 2 sources'));
    });

    it('should handle never-synced sources', async () => {
      mockGetSources.mockReturnValue({
        'docs.claude.com': {
          type: 'claude-code-docs',
          addedAt: '2025-01-15T10:00:00Z',
          urlCount: 10,
          status: 'active'
        }
      });

      await sourcesCommand.run();

      const calls = mockConsoleInfo.mock.calls.flat().join(' ');
      expect(calls).toContain('Never');
    });

    it('should show inactive sources differently', async () => {
      mockGetSources.mockReturnValue({
        'old-docs.com': {
          type: 'documentation',
          addedAt: '2025-01-01T10:00:00Z',
          lastSyncedAt: '2025-01-02T10:00:00Z',
          urlCount: 5,
          status: 'inactive'
        }
      });

      await sourcesCommand.run();

      const calls = mockConsoleInfo.mock.calls.flat().join(' ');
      expect(calls).toContain('old-docs.com');
    });
  });

  describe('singular vs plural', () => {
    it('should use singular for one source', async () => {
      mockGetSources.mockReturnValue({
        'docs.claude.com': {
          type: 'claude-code-docs',
          addedAt: '2025-01-15T10:00:00Z',
          urlCount: 10,
          status: 'active'
        }
      });

      await sourcesCommand.run();

      expect(mockConsoleInfo).toHaveBeenCalledWith(expect.stringContaining('1 source'));
    });

    it('should use plural for multiple sources', async () => {
      mockGetSources.mockReturnValue({
        'docs.claude.com': {
          type: 'claude-code-docs',
          addedAt: '2025-01-15T10:00:00Z',
          urlCount: 10,
          status: 'active'
        },
        'react.dev': {
          type: 'documentation',
          addedAt: '2025-01-16T09:00:00Z',
          urlCount: 20,
          status: 'active'
        }
      });

      await sourcesCommand.run();

      expect(mockConsoleInfo).toHaveBeenCalledWith(expect.stringContaining('2 sources'));
    });
  });
});
