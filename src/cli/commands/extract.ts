/**
 * Extract Command
 * Extract structured data using Claude
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Pipeline } from '../pipeline/index.js';

export function registerExtractCommand(program: Command): void {
  program
    .command('extract <url>')
    .description('Extract structured data using Claude')
    .option('--model <model>', 'Claude model for extraction', 'claude-sonnet-4-5-20250929')
    .option('--force', 'Force re-extraction even if cached')
    .option('--dev', 'Use minimal dev prompt for faster testing')
    .action(async (url: string, options) => {
      try {
        const pipeline = new Pipeline();
        await pipeline.extract(url, options);
      } catch (error: unknown) {
        console.error(chalk.red('✗ Extraction failed:'), getErrorMessage(error));
        process.exit(1);
      }
    });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
