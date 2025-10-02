#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { PipelineOrchestrator } from './orchestrator/index.js';
import { BatchCommand } from './commands/batch.js';
import { SearchCommand } from './commands/search.js';
import { DEFAULT_TTL_DAYS } from '../config/constants.js';

const program = new Command();

// Helper to extract error message
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

program
  .name('doc-mcp-cli')
  .description('Universal documentation intelligence CLI')
  .version('1.0.0');

// Batch command - ingest multiple pages
program
  .command('batch')
  .description('Batch ingest configured documentation pages')
  .option('--core', 'Only ingest 5 core pages (faster)')
  .option('--pages <pages>', 'Comma-separated list of pages to ingest')
  .option('--stale-only', `Only ingest pages older than ${DEFAULT_TTL_DAYS} days`)
  .option('--force', 'Force re-ingestion of all pages')
  .option('--dry-run', 'Preview what would be ingested')
  .option('--model <model>', 'Claude model for extraction', 'claude-sonnet-4-5-20250929')
  .option('--provider <provider>', 'Embedding provider (ollama/openai)', 'ollama')
  .option('--dev', 'Use minimal dev prompt for faster testing')
  .action(async options => {
    try {
      const batchCmd = new BatchCommand();

      // Parse --pages if provided
      if (options.pages) {
        options.pages = options.pages.split(',').map((p: string) => p.trim());
      }

      await batchCmd.run(options);
    } catch (error: unknown) {
      console.error(chalk.red('✗ Batch ingestion failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Ingest command - full pipeline
program
  .command('ingest <url>')
  .description('Full ingestion pipeline: fetch → extract → embed → store')
  .option('--force', 'Force re-extraction even if cached')
  .option('--model <model>', 'Claude model for extraction', 'claude-sonnet-4-5-20250929')
  .option('--provider <provider>', 'Embedding provider (ollama/openai)', 'ollama')
  .option('--quiet', 'Suppress info messages')
  .option('--dev', 'Use minimal dev prompt for faster testing')
  .action(async (url: string, options) => {
    try {
      const orchestrator = new PipelineOrchestrator();
      await orchestrator.ingest(url, options);
    } catch (error: unknown) {
      console.error(chalk.red('✗ Ingestion failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Fetch command - download and cache HTML
program
  .command('fetch <url>')
  .description('Fetch and cache clean HTML content')
  .action(async (url: string) => {
    try {
      const orchestrator = new PipelineOrchestrator();
      await orchestrator.fetch(url);
    } catch (error: unknown) {
      console.error(chalk.red('✗ Fetch failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Extract command - extract structured data with Claude
program
  .command('extract <url>')
  .description('Extract structured data using Claude')
  .option('--model <model>', 'Claude model for extraction', 'claude-sonnet-4-5-20250929')
  .option('--force', 'Force re-extraction even if cached')
  .option('--dev', 'Use minimal dev prompt for faster testing')
  .action(async (url: string, options) => {
    try {
      const orchestrator = new PipelineOrchestrator();
      await orchestrator.extract(url, options);
    } catch (error: unknown) {
      console.error(chalk.red('✗ Extraction failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Embed command - generate embeddings
program
  .command('embed <url>')
  .description('Generate embeddings and store in Qdrant')
  .option('--provider <provider>', 'Embedding provider (ollama/openai)', 'ollama')
  .action(async (url: string, options) => {
    try {
      const orchestrator = new PipelineOrchestrator();
      await orchestrator.embed(url, options);
    } catch (error: unknown) {
      console.error(chalk.red('✗ Embedding failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// Status command - show manifest record
program
  .command('status <url>')
  .description('Show manifest record for a URL')
  .action(async (url: string) => {
    try {
      const orchestrator = new PipelineOrchestrator();
      await orchestrator.status(url);
    } catch (error: unknown) {
      console.error(chalk.red('✗ Status check failed:'), getErrorMessage(error));
      process.exit(1);
    }
  });

// List command - list all ingested docs
program
  .command('list')
  .description('List all ingested documentation')
  .action(async () => {
    try {
      const orchestrator = new PipelineOrchestrator();
      await orchestrator.list();
    } catch (error: unknown) {
      console.error(chalk.red('✗ List failed:'), getErrorMessage(error));
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

program.parse();
