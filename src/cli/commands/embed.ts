/**
 * Embed Command
 * Generate embeddings and store in Qdrant
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Pipeline } from '../pipeline/index.js';

export function registerEmbedCommand(program: Command): void {
  program
    .command('embed <url>')
    .description('Generate embeddings and store in Qdrant')
    .option('--provider <provider>', 'Embedding provider (ollama/openai)', 'ollama')
    .action(async (url: string, options) => {
      try {
        const pipeline = new Pipeline();
        await pipeline.embed(url, options);
      } catch (error: unknown) {
        console.error(chalk.red('✗ Embedding failed:'), getErrorMessage(error));
        process.exit(1);
      }
    });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}