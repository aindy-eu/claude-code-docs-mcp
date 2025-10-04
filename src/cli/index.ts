#!/usr/bin/env node

/**
 * Command Architecture:
 * All commands live in src/cli/commands/
 * - Simple commands: Function that registers a command (fetch, extract, etc)
 * - Complex commands: Class with business logic (seed, sync, search)
 *
 * Rule: Use a class when business logic > 20 lines, otherwise use a function
 */

import { Command } from 'commander';
import chalk from 'chalk';
// Pipeline commands (simple)
import { registerIngestCommand } from './commands/ingest.js';
import { registerFetchCommand } from './commands/fetch.js';
import { registerExtractCommand } from './commands/extract.js';
import { registerEmbedCommand } from './commands/embed.js';
import { registerStatusCommand } from './commands/status.js';
import { registerListCommand } from './commands/list.js';
// Complex commands (classes)
import { SeedCommand } from './commands/seed.js';
import { SyncCommand } from './commands/sync.js';
import { SearchCommand } from './commands/search.js';
import { SourcesCommand } from './commands/sources.js';
import { DEFAULT_TTL_DAYS } from '../config/constants.js';

const program = new Command();

// Helper to extract error message
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

program
  .name('doc-mcp-cli')
  .description('Universal documentation intelligence CLI')
  .version('1.0.0');

// Register pipeline commands (simple proxies)
registerIngestCommand(program);
registerFetchCommand(program);
registerExtractCommand(program);
registerEmbedCommand(program);
registerStatusCommand(program);
registerListCommand(program);

// Seed command - bootstrap with core or all documentation
program
  .command('seed')
  .description('Bootstrap documentation database with core pages (fast)')
  .option('--all', 'Seed all configured pages instead of just core')
  .option('--model <model>', 'Claude model for extraction', 'claude-sonnet-4-5-20250929')
  .option('--provider <provider>', 'Embedding provider (ollama/openai)', 'ollama')
  .option('--dev', 'Use minimal dev prompt for faster testing')
  .action(async options => {
    try {
      const seedCmd = new SeedCommand();
      await seedCmd.run(options);
    } catch (error: unknown) {
      console.error(chalk.red('✗ Seed failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Sync command - update stale documentation
program
  .command('sync')
  .description(`Update documentation older than ${DEFAULT_TTL_DAYS} days`)
  .option('--check', 'Preview what would be updated without making changes')
  .option('--source <domain>', 'Sync specific domain (e.g., docs.claude.com)')
  .option('--all', 'Explicitly sync all sources (default behavior)')
  .option('--type <type>', 'Sync sources of specific type (e.g., documentation)')
  .option('--model <model>', 'Claude model for extraction', 'claude-sonnet-4-5-20250929')
  .option('--provider <provider>', 'Embedding provider (ollama/openai)', 'ollama')
  .option('--dev', 'Use minimal dev prompt for faster testing')
  .action(async options => {
    try {
      const syncCmd = new SyncCommand();
      await syncCmd.run(options);
    } catch (error: unknown) {
      console.error(chalk.red('✗ Sync failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Search command - search documentation
program
  .command('search <query>')
  .description('Search ingested documentation')
  .option('--provider <provider>', 'Embedding provider (ollama/openai)', 'ollama')
  .option('--limit <number>', 'Number of results to return', '3')
  .action(async (query: string, options) => {
    try {
      const searchCmd = new SearchCommand();
      await searchCmd.run(query, {
        provider: options.provider,
        limit: parseInt(options.limit)
      });
    } catch (error: unknown) {
      console.error(chalk.red('✗ Search failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Sources command - list all documentation sources
program
  .command('sources')
  .description('List all registered documentation sources')
  .action(async () => {
    try {
      const sourcesCmd = new SourcesCommand();
      await sourcesCmd.run();
    } catch (error: unknown) {
      console.error(chalk.red('✗ Sources command failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

program.parse();
