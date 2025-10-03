/**
 * Status Command
 * Show manifest record for a URL
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Pipeline } from '../pipeline/index.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status <url>')
    .description('Show manifest record for a URL')
    .action(async (url: string) => {
      try {
        const pipeline = new Pipeline();
        await pipeline.status(url);
      } catch (error: unknown) {
        console.error(chalk.red('✗ Status check failed:'), getErrorMessage(error));
        process.exit(1);
      }
    });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}