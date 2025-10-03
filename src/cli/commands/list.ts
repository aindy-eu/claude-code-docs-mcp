/**
 * List Command
 * Show all ingested documentation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Pipeline } from '../pipeline/index.js';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all ingested documentation')
    .action(async () => {
      try {
        const pipeline = new Pipeline();
        await pipeline.list();
      } catch (error: unknown) {
        console.error(chalk.red('✗ List failed:'), getErrorMessage(error));
        process.exit(1);
      }
    });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
