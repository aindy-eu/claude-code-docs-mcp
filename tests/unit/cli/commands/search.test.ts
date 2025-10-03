/**
 * Search Command Tests
 * Tests the CLI search command wrapper
 *
 * The command is a thin wrapper around searchDocumentation() which is already
 * tested in unit and integration tests. We test the command orchestration here.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SearchCommand } from '@/cli/commands/search.js';

// Mock the search functions (already tested elsewhere)
vi.mock('@/mcp-tools/search/search.js', () => ({
  searchDocumentation: vi.fn(),
  formatSearchResults: vi.fn()
}));

// Mock QdrantClient
vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: vi.fn(() => ({}))
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    bold: (str: string) => str,
    cyan: (str: string) => str,
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str,
    gray: (str: string) => str
  }
}));

import { searchDocumentation, formatSearchResults } from '@/mcp-tools/search/search.js';

describe('SearchCommand', () => {
  let command: SearchCommand;
  let consoleInfoSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    command = new SearchCommand();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('Successful Search', () => {
    it('should call searchDocumentation with correct parameters', async () => {
      const mockResults = [
        {
          title: 'Test Result',
          content: 'Test content',
          section: 'Test Section',
          url: 'https://test.com',
          score: 0.9,
          codeExamples: [],
          provider: 'ollama'
        }
      ];

      vi.mocked(searchDocumentation).mockResolvedValue(mockResults);
      vi.mocked(formatSearchResults).mockReturnValue('Formatted results');

      await command.run('test query', { provider: 'ollama', limit: 5 });

      expect(searchDocumentation).toHaveBeenCalledWith(expect.any(Object), {
        query: 'test query',
        provider: 'ollama',
        limit: 5
      });
    });

    it('should use default provider (ollama) and limit (3)', async () => {
      const mockResults = [
        {
          title: 'Test',
          content: 'Content',
          section: 'Section',
          url: 'https://test.com',
          score: 0.8,
          codeExamples: [],
          provider: 'ollama'
        }
      ];

      vi.mocked(searchDocumentation).mockResolvedValue(mockResults);
      vi.mocked(formatSearchResults).mockReturnValue('Formatted');

      await command.run('test query');

      expect(searchDocumentation).toHaveBeenCalledWith(expect.any(Object), {
        query: 'test query',
        provider: 'ollama',
        limit: 3
      });
    });

    it('should display formatted results', async () => {
      const mockResults = [
        {
          title: 'Test',
          content: 'Content',
          section: 'Section',
          url: 'https://test.com',
          score: 0.9,
          codeExamples: [],
          provider: 'ollama'
        }
      ];
      const formattedOutput = '## Search Results\nTest Result';

      vi.mocked(searchDocumentation).mockResolvedValue(mockResults);
      vi.mocked(formatSearchResults).mockReturnValue(formattedOutput);

      await command.run('test query');

      expect(formatSearchResults).toHaveBeenCalledWith(mockResults);
      expect(consoleInfoSpy).toHaveBeenCalledWith(formattedOutput);
    });

    it('should display search metadata', async () => {
      const mockResults = [
        {
          title: 'Result 1',
          content: 'Content 1',
          section: 'Section',
          url: 'https://test.com',
          score: 0.9,
          codeExamples: [],
          provider: 'ollama'
        },
        {
          title: 'Result 2',
          content: 'Content 2',
          section: 'Section',
          url: 'https://test.com',
          score: 0.8,
          codeExamples: [],
          provider: 'ollama'
        }
      ];

      vi.mocked(searchDocumentation).mockResolvedValue(mockResults);
      vi.mocked(formatSearchResults).mockReturnValue('Results');

      await command.run('test query');

      // Check metadata display
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Search Metadata'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 results'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Extraction method: Claude-driven')
      );
    });

    it('should handle singular result count correctly', async () => {
      const mockResults = [
        {
          title: 'Single Result',
          content: 'Content',
          section: 'Section',
          url: 'https://test.com',
          score: 0.9,
          codeExamples: [],
          provider: 'ollama'
        }
      ];

      vi.mocked(searchDocumentation).mockResolvedValue(mockResults);
      vi.mocked(formatSearchResults).mockReturnValue('Result');

      await command.run('test query');

      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 result'));
      expect(consoleInfoSpy).not.toHaveBeenCalledWith(expect.stringContaining('results')); // No 's'
    });

    it('should use openai provider when specified', async () => {
      const mockResults = [
        {
          title: 'Test',
          content: 'Content',
          section: 'Section',
          url: 'https://test.com',
          score: 0.9,
          codeExamples: [],
          provider: 'openai'
        }
      ];

      vi.mocked(searchDocumentation).mockResolvedValue(mockResults);
      vi.mocked(formatSearchResults).mockReturnValue('Results');

      await command.run('test query', { provider: 'openai' });

      expect(searchDocumentation).toHaveBeenCalledWith(expect.any(Object), {
        query: 'test query',
        provider: 'openai',
        limit: 3
      });
    });
  });

  describe('Empty Results', () => {
    it('should show helpful message when no results found', async () => {
      vi.mocked(searchDocumentation).mockResolvedValue([]);

      await command.run('test query');

      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('No results found'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Different search terms')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Broader query'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('npm run cli -- list'));
    });

    it('should not display search metadata when no results', async () => {
      vi.mocked(searchDocumentation).mockResolvedValue([]);

      await command.run('test query');

      expect(consoleInfoSpy).not.toHaveBeenCalledWith(expect.stringContaining('Search Metadata'));
    });

    it('should not call formatSearchResults when no results', async () => {
      vi.mocked(searchDocumentation).mockResolvedValue([]);

      await command.run('test query');

      expect(formatSearchResults).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle search errors and exit with code 1', async () => {
      const error = new Error('Qdrant connection failed');

      vi.mocked(searchDocumentation).mockRejectedValue(error);

      await command.run('test query');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Search failed'),
        'Qdrant connection failed'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should show helpful message for "Not Found" errors', async () => {
      const error = new Error('Collection not found: Not Found');

      vi.mocked(searchDocumentation).mockRejectedValue(error);

      await command.run('test query');

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No collection found'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('npm run setup'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('npm run cli -- batch'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error exceptions', async () => {
      const errorString = 'Unknown error';

      vi.mocked(searchDocumentation).mockRejectedValue(errorString);

      await command.run('test query');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Search failed'),
        errorString
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Display Output', () => {
    it('should display search query and parameters', async () => {
      vi.mocked(searchDocumentation).mockResolvedValue([]);

      await command.run('how to use hooks', { provider: 'openai', limit: 10 });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Searching for: "how to use hooks"')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Provider: openai'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Limit: 10'));
    });
  });
});
