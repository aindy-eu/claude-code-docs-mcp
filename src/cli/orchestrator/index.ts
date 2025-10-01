/**
 * Pipeline Orchestrator
 * Coordinates the documentation ingestion pipeline stages
 */

import chalk from 'chalk';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { IngestOptions, ExtractOptions, EmbedOptions, FetchOptions } from './types.js';
import { fetchStage } from './fetch.js';
import { extractStage } from './extract.js';
import { embedStage } from './embed.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PipelineOrchestrator {
  private projectRoot: string;

  constructor() {
    // Resolve project root (src/cli/orchestrator -> project root)
    this.projectRoot = path.resolve(__dirname, '../../..');
  }

  /**
   * Full ingestion pipeline: fetch → extract → embed
   */
  async ingest(url: string, options: IngestOptions = {}): Promise<void> {
    const spinner = ora(`Ingesting ${chalk.cyan(url)}`).start();

    try {
      spinner.text = 'Fetching HTML...';
      const finalUrl = await this.fetch(url, true);

      spinner.text = `Extracting with Claude (${options.model})...`;
      await this.extract(finalUrl, { model: options.model, force: options.force, dev: options.dev }, true);

      spinner.text = `Generating embeddings (${options.provider})...`;
      await this.embed(finalUrl, { provider: options.provider }, true);

      spinner.succeed(chalk.green(`✓ Successfully ingested ${finalUrl}`));
    } catch (error: any) {
      spinner.fail(chalk.red(`✗ Ingestion failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Fetch and cache clean HTML content
   */
  async fetch(url: string, silent: boolean = false): Promise<string> {
    return await fetchStage(url, this.projectRoot, {}, silent);
  }

  /**
   * Extract structured data using Claude via Python
   */
  async extract(url: string, options: ExtractOptions = {}, silent: boolean = false): Promise<void> {
    await extractStage(url, this.projectRoot, options, silent);
  }

  /**
   * Generate embeddings and store in Qdrant
   */
  async embed(url: string, options: EmbedOptions = {}, silent: boolean = false): Promise<void> {
    await embedStage(url, this.projectRoot, options, silent);
  }

  /**
   * Show manifest record for a URL
   */
  async status(url: string): Promise<void> {
    const spinner = ora('Checking status...').start();

    try {
      // TODO: Implement manifest reading in TypeScript (Phase 2)
      const manifestPath = path.join(this.projectRoot, '.data/docs.claude.com/manifest.json');
      const { readFile } = await import('fs/promises');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

      const record = manifest.records[url];

      if (!record) {
        spinner.info(chalk.yellow(`No record found for ${url}`));
        return;
      }

      spinner.stop();
      console.log(chalk.bold('\nManifest Record:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.cyan('URL:')} ${record.url}`);
      console.log(`${chalk.cyan('Status:')} ${this.colorStatus(record.status)}`);
      if (record.lastFetchedAt) console.log(`${chalk.cyan('Fetched:')} ${record.lastFetchedAt}`);
      if (record.lastExtractedAt) console.log(`${chalk.cyan('Extracted:')} ${record.lastExtractedAt}`);
      if (record.extractionModel) console.log(`${chalk.cyan('Model:')} ${record.extractionModel}`);
      if (record.embeddingProvider) console.log(`${chalk.cyan('Provider:')} ${record.embeddingProvider}`);
      if (record.sectionCount) console.log(`${chalk.cyan('Sections:')} ${record.sectionCount}`);
      if (record.codeExampleCount) console.log(`${chalk.cyan('Examples:')} ${record.codeExampleCount}`);
      console.log(chalk.gray('─'.repeat(50)));
    } catch (error: any) {
      spinner.fail(chalk.red('✗ Status check failed'));
      throw error;
    }
  }

  /**
   * List all ingested documentation
   */
  async list(): Promise<void> {
    const spinner = ora('Loading manifest...').start();

    try {
      const manifestPath = path.join(this.projectRoot, '.data/docs.claude.com/manifest.json');
      const { readFile } = await import('fs/promises');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

      spinner.stop();

      console.log(chalk.bold('\nIngested Documentation:'));
      console.log(chalk.gray('─'.repeat(80)));

      const records = Object.values(manifest.records) as any[];

      if (records.length === 0) {
        console.log(chalk.yellow('No documents ingested yet.'));
        return;
      }

      records.forEach((record: any) => {
        const url = record.url.replace('https://docs.claude.com', '');
        console.log(
          `${this.colorStatus(record.status)} ${chalk.cyan(url)} ${chalk.gray(
            record.lastExtractedAt ? `(${record.extractionModel || 'unknown'})` : ''
          )}`
        );
      });

      console.log(chalk.gray('─'.repeat(80)));
      console.log(chalk.bold(`Total: ${records.length} documents`));
    } catch (error: any) {
      spinner.fail(chalk.red('✗ List failed'));
      throw error;
    }
  }

  private colorStatus(status: string): string {
    const colors: Record<string, any> = {
      fetched: chalk.yellow,
      extracted: chalk.blue,
      structured: chalk.blue,
      embedded: chalk.green,
    };
    return (colors[status] || chalk.white)(status);
  }
}

// Re-export types for convenience
export * from './types.js';
