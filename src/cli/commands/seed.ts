/**
 * Seed Command
 * Bootstrap documentation with core or all pages
 */

import { Listr } from 'listr2';
import chalk from 'chalk';
import { Pipeline } from '../pipeline/index.js';
import { ManifestService } from '../../services/manifest-service.js';
import { DocumentationUrlService, CORE_PAGES } from '../../config/documentation-urls.js';

export interface SeedOptions {
  all?: boolean;
  model?: string;
  provider?: string;
  dev?: boolean;
}

interface SeedContext {
  results: Array<{
    url: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  startTime: number;
}

export class SeedCommand {
  private urlService: DocumentationUrlService;
  private pipeline: Pipeline;

  constructor() {
    this.urlService = new DocumentationUrlService();
    this.pipeline = new Pipeline();
  }

  /**
   * Get URLs to seed
   * Defaults to core pages for fast bootstrap
   */
  private getUrlsToSeed(options: SeedOptions): string[] {
    if (options.all) {
      // Get all configured pages
      return this.urlService.getAllUrls();
    }

    // Default: Use core pages only (5 pages for fast bootstrap)
    return CORE_PAGES.map(pageKey => this.urlService.getPageUrl(pageKey));
  }

  /**
   * Check if database is already seeded
   */
  private async isDatabaseSeeded(): Promise<boolean> {
    // Check if any of the core pages have been ingested
    const coreUrls = CORE_PAGES.map(pageKey => this.urlService.getPageUrl(pageKey));
    for (const url of coreUrls) {
      const manifest = new ManifestService(url);
      const record = manifest.getRecord(url);
      if (record && record.status === 'embedded') {
        return true;
      }
    }
    return false;
  }

  /**
   * Run seed command
   */
  async run(options: SeedOptions = {}): Promise<void> {
    const startTime = Date.now();

    // Check if already seeded
    const isSeeded = await this.isDatabaseSeeded();
    if (isSeeded && !options.all) {
      console.info(chalk.yellow('\n⚠️  Database already contains documents.'));
      console.info(chalk.dim('Use "npm run sync" to update stale documents.'));
      console.info(chalk.dim('Use "npm run seed --all" to force seed all pages.\n'));
      return;
    }

    // Get URLs to seed
    const urls = this.getUrlsToSeed(options);

    // Show what we're about to do
    console.info(chalk.bold('\n🌱 Seeding Documentation Database\n'));
    console.info(chalk.cyan(`Mode: ${options.all ? 'All pages' : 'Core pages only (fast)'}`));
    console.info(chalk.cyan(`Pages to seed: ${urls.length}`));
    if (!options.all) {
      console.info(chalk.dim(`Core pages: ${CORE_PAGES.join(', ')}`));
    }
    console.info();

    // Create Listr tasks
    const tasks = new Listr<SeedContext>(
      urls.map(url => ({
        title: this.urlService.getPageKeyFromUrl(url) || url,
        task: async (ctx, task) => {
          try {
            // Run full pipeline for this URL
            await this.pipeline.ingest(url, {
              model: options.model,
              provider: options.provider,
              dev: options.dev,
              quiet: true // Suppress info messages in task context
            });

            // Track result
            ctx.results.push({
              url,
              status: 'success'
            });

            task.title = `${task.title} ✓`;
          } catch (error) {
            // Track failure
            ctx.results.push({
              url,
              status: 'failed',
              error: error instanceof Error ? error.message : String(error)
            });

            task.title = `${task.title} ✗`;
            throw error; // Let Listr handle retry
          }
        },
        options: {
          retry: 2 // Retry failed tasks twice
        }
      })),
      {
        concurrent: false, // Process sequentially to respect rate limits
        exitOnError: false, // Continue even if some fail
        ctx: {
          results: [],
          startTime
        }
      }
    );

    // Execute tasks
    try {
      await tasks.run();
    } catch (error) {
      // Errors are handled per-task, this catches catastrophic failures
      console.error(chalk.red('\n✗ Seed failed:'), error);
    }

    // Show summary
    await this.showSummary(tasks.ctx);
  }

  /**
   * Show summary of seed results
   */
  private async showSummary(ctx: SeedContext): Promise<void> {
    const duration = Date.now() - ctx.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    const successful = ctx.results.filter(r => r.status === 'success').length;
    const failed = ctx.results.filter(r => r.status === 'failed').length;

    console.info(chalk.bold('\n📊 Seed Summary\n'));
    console.info(`Duration: ${minutes}m ${seconds}s`);
    console.info(chalk.green(`✓ Success: ${successful}`));

    if (failed > 0) {
      console.info(chalk.red(`✗ Failed: ${failed}`));

      // Show failed URLs
      const failedResults = ctx.results.filter(r => r.status === 'failed');
      if (failedResults.length > 0) {
        console.info(chalk.red('\nFailed URLs:'));
        failedResults.forEach(r => {
          const pageKey = this.urlService.getPageKeyFromUrl(r.url) || r.url;
          console.info(chalk.red(`  - ${pageKey}: ${r.error}`));
        });
      }
    }

    if (successful > 0) {
      console.info(chalk.green('\n✨ Database seeded successfully!'));
      console.info(chalk.dim('Try searching with: npm run search "your query"'));
    }
  }
}
