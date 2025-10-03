/**
 * Fetch Command
 * Download and cache HTML content
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Pipeline } from '../pipeline/index.js';

export function registerFetchCommand(program: Command): void {
  program
    .command('fetch <url>')
    .description('Fetch and cache clean HTML content')
    .action(async (url: string) => {
      try {
        const pipeline = new Pipeline();
        await pipeline.fetch(url);
      } catch (error: unknown) {
        console.error(chalk.red('✗ Fetch failed:'), getErrorMessage(error));
        process.exit(1);
      }
    });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
