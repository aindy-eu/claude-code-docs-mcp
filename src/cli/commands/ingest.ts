/**
 * Ingest Command
 * Full pipeline for single URL
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Pipeline } from '../pipeline/index.js';

export function registerIngestCommand(program: Command): void {
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
        const pipeline = new Pipeline();
        await pipeline.ingest(url, options);
      } catch (error: unknown) {
        console.error(chalk.red('✗ Ingestion failed:'), getErrorMessage(error));
        process.exit(1);
      }
    });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
