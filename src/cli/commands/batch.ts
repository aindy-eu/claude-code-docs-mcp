/**
 * Batch Ingestion Command
 * Ingest multiple documentation pages efficiently
 */

import { Listr } from 'listr2';
import chalk from 'chalk';
import { PipelineOrchestrator } from '../orchestrator/index.js';
import { ManifestService } from '../../services/manifest-service.js';
import {
  DocumentationUrlService,
  DOCUMENTATION_SOURCES,
  CORE_PAGES
} from '../../config/documentation-urls.js';
import { DEFAULT_TTL_DAYS } from '../../config/constants.js';
import { BatchOptions, BatchContext } from './batch.types.js';

export class BatchCommand {
  private urlService: DocumentationUrlService;
  private orchestrator: PipelineOrchestrator;

  constructor() {
    this.urlService = new DocumentationUrlService();
    this.orchestrator = new PipelineOrchestrator();
  }

  /**
   * Validate command options
   */
  private validateOptions(options: BatchOptions): void {
    if (options.core && options.pages) {
      throw new Error('Cannot use --core and --pages together. Choose one.');
    }

    if (options.staleOnly && options.force) {
      throw new Error('Cannot use --stale-only and --force together. Choose one.');
    }

    if (options.pages) {
      const allPages = Object.keys(DOCUMENTATION_SOURCES.CLAUDE_CODE.pages);
      const invalidPages = options.pages.filter(p => !allPages.includes(p));
      if (invalidPages.length > 0) {
        throw new Error(
          `Invalid page(s): ${invalidPages.join(', ')}\n` + `Valid pages: ${allPages.join(', ')}`
        );
      }
    }
  }

  /**
   * Get URLs to process based on options
   */
  private getUrlsToProcess(options: BatchOptions): string[] {
    type PageKey = keyof typeof DOCUMENTATION_SOURCES.CLAUDE_CODE.pages;
    let pageKeys: PageKey[];

    if (options.pages) {
      // Custom page selection
      pageKeys = options.pages as PageKey[];
    } else if (options.core) {
      // Core pages only
      pageKeys = CORE_PAGES;
    } else {
      // All pages (default)
      pageKeys = Object.keys(DOCUMENTATION_SOURCES.CLAUDE_CODE.pages) as PageKey[];
    }

    return pageKeys.map(key => this.urlService.getPageUrl(key));
  }

  /**
   * Filter URLs based on manifest state
   */
  private async filterUrlsByFreshness(
    urls: string[],
    options: BatchOptions
  ): Promise<{ toIngest: string[]; toSkip: string[] }> {
    if (options.force || options.dryRun) {
      // Force mode or dry-run: process all URLs
      return { toIngest: urls, toSkip: [] };
    }

    const toIngest: string[] = [];
    const toSkip: string[] = [];
    const ttlDays = DEFAULT_TTL_DAYS;

    for (const url of urls) {
      const manifest = new ManifestService(url);
      const record = manifest.getRecord(url);

      if (!record) {
        // Never ingested
        toIngest.push(url);
        continue;
      }

      if (record.status === 'failed') {
        // Retry failures
        toIngest.push(url);
        continue;
      }

      if (!record.lastIngestedAt) {
        // No ingestion timestamp
        toIngest.push(url);
        continue;
      }

      // Check age
      const lastIngested = new Date(record.lastIngestedAt);
      const daysSince = (Date.now() - lastIngested.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince > ttlDays) {
        toIngest.push(url);
      } else if (options.staleOnly) {
        // Fresh doc, and we only want stale ones
        toSkip.push(url);
      } else {
        // Fresh doc, normal mode: still ingest unless --stale-only
        toIngest.push(url);
      }
    }

    return { toIngest, toSkip };
  }

  /**
   * Format URL for display (just the page name)
   */
  private formatUrl(url: string): string {
    return url.split('/').pop() || url;
  }

  /**
   * Smart ingestion with resume capability
   * Checks manifest status and resumes from appropriate stage
   * Returns 'unchanged' if content diff skipped pipeline, 'success' otherwise
   */
  private async smartIngest(url: string, options: BatchOptions): Promise<'success' | 'unchanged'> {
    // Orchestrator handles content diff and may skip pipeline
    // We capture this by checking if lastCheckedAt was updated without full ingestion

    const manifest = new ManifestService(url);
    const beforeRecord = manifest.getRecord(url);
    const beforeCheckedAt = beforeRecord?.lastCheckedAt;

    if (options.force) {
      // Force mode: always run full pipeline
      await this.orchestrator.ingest(url, {
        force: true,
        model: options.model,
        provider: options.provider,
        dev: options.dev
      });
      return 'success';
    }

    // Check current status
    const record = beforeRecord;

    if (!record || record.status === 'failed') {
      // Never ingested or failed: run full pipeline
      await this.orchestrator.ingest(url, {
        model: options.model,
        provider: options.provider,
        dev: options.dev
      });

      // Check if it was skipped
      const afterRecord = manifest.getRecord(url);
      if (afterRecord?.lastCheckedAt && afterRecord.lastCheckedAt !== beforeCheckedAt) {
        return 'unchanged';
      }
      return 'success';
    }

    // Resume from incomplete stage
    let finalUrl = url;

    if (record.status === 'fetched') {
      // Only HTML fetched, need to extract and embed
      finalUrl = url; // Use existing URL
      await this.orchestrator.extract(
        finalUrl,
        {
          model: options.model,
          dev: options.dev
        },
        true
      );
      await this.orchestrator.embed(
        finalUrl,
        {
          provider: options.provider
        },
        true
      );
      return 'success';
    } else if (record.status === 'extracted' || record.status === 'structured') {
      // Extraction done, only need embedding
      finalUrl = url; // Use existing URL
      await this.orchestrator.embed(
        finalUrl,
        {
          provider: options.provider
        },
        true
      );
      return 'success';
    } else if (record.status === 'embedded') {
      // Already complete, check if we should re-ingest
      await this.orchestrator.ingest(url, {
        model: options.model,
        provider: options.provider,
        dev: options.dev
      });

      // Check if it was skipped
      const afterRecord = manifest.getRecord(url);
      if (afterRecord?.lastCheckedAt && afterRecord.lastCheckedAt !== beforeCheckedAt) {
        return 'unchanged';
      }
      return 'success';
    } else {
      // Unknown status, run full pipeline
      await this.orchestrator.ingest(url, {
        model: options.model,
        provider: options.provider,
        dev: options.dev
      });

      // Check if it was skipped
      const afterRecord = manifest.getRecord(url);
      if (afterRecord?.lastCheckedAt && afterRecord.lastCheckedAt !== beforeCheckedAt) {
        return 'unchanged';
      }
      return 'success';
    }
  }

  /**
   * Run batch ingestion
   */
  async run(options: BatchOptions = {}): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate options
      this.validateOptions(options);

      // Get URLs to process
      const allUrls = this.getUrlsToProcess(options);

      // Filter by freshness
      const { toIngest, toSkip } = await this.filterUrlsByFreshness(allUrls, options);

      // Show preview
      console.info(chalk.bold('\n🔍 Batch Ingestion Plan\n'));
      console.info(chalk.cyan(`Total pages configured: ${allUrls.length}`));
      console.info(chalk.green(`Pages to ingest: ${toIngest.length}`));
      if (toSkip.length > 0) {
        console.info(chalk.yellow(`Pages to skip: ${toSkip.length} (fresh)`));
      }

      if (toIngest.length === 0) {
        console.info(chalk.yellow('\n✨ Nothing to ingest! All pages are fresh.\n'));
        console.info(chalk.gray('Use --force to re-ingest anyway'));
        return;
      }

      if (options.dryRun) {
        console.info(chalk.bold('\n📋 Would ingest:\n'));
        toIngest.forEach(url => console.info(`  ${chalk.cyan('→')} ${this.formatUrl(url)}`));
        console.info(chalk.gray('\nRun without --dry-run to execute'));
        return;
      }

      // Create context
      const ctx: BatchContext = {
        urls: toIngest,
        results: {
          success: [],
          failed: [],
          skipped: toSkip,
          unchanged: []
        },
        startTime
      };

      // Build task list
      const tasks = new Listr<BatchContext>(
        [
          {
            title: 'Batch Ingestion',
            task: (ctx, task) => {
              return task.newListr(
                ctx.urls.map(url => ({
                  title: this.formatUrl(url),
                  task: async () => {
                    try {
                      const result = await this.smartIngest(url, options);

                      // Check if pipeline was skipped due to unchanged content
                      if (result === 'unchanged') {
                        ctx.results.unchanged.push(url);
                      } else {
                        ctx.results.success.push(url);
                      }
                    } catch (error: unknown) {
                      const message = error instanceof Error ? error.message : String(error);
                      ctx.results.failed.push({
                        url,
                        error: message
                      });
                      throw error;
                    }
                  },
                  retry: 2 // Retry failed ingestions twice
                })),
                { concurrent: false, exitOnError: false }
              );
            }
          }
        ],
        {
          exitOnError: false,
          rendererOptions: {
            collapseErrors: false
          }
        }
      );

      // Run ingestion
      await tasks.run(ctx);

      // Show summary
      this.showSummary(ctx);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('\n✗ Batch ingestion failed:'), message);
      process.exit(1);
    }
  }

  /**
   * Show summary after batch completion
   */
  private showSummary(ctx: BatchContext): void {
    const duration = Math.round((Date.now() - ctx.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.info(chalk.bold('\n📊 Batch Ingestion Summary\n'));

    // Time
    if (minutes > 0) {
      console.info(chalk.gray(`⏱️  Duration: ${minutes}m ${seconds}s`));
    } else {
      console.info(chalk.gray(`⏱️  Duration: ${seconds}s`));
    }

    // Results
    console.info(chalk.green(`✓ Success: ${ctx.results.success.length}`));
    if (ctx.results.unchanged.length > 0) {
      console.info(
        chalk.cyan(
          `⚡ Unchanged: ${ctx.results.unchanged.length} (content diff - pipeline skipped)`
        )
      );
    }
    if (ctx.results.failed.length > 0) {
      console.warn(chalk.red(`✗ Failed: ${ctx.results.failed.length}`));
      ctx.results.failed.forEach(({ url, error }) => {
        console.warn(chalk.red(`  → ${this.formatUrl(url)}: ${error}`));
      });
    }
    if (ctx.results.skipped.length > 0) {
      console.info(
        chalk.yellow(`⏭️  Skipped: ${ctx.results.skipped.length} (fresh - not checked)`)
      );
    }

    // Storage info
    if (ctx.results.success.length > 0) {
      console.info(chalk.bold('\n💾 Ready to use!\n'));
      console.info(chalk.gray('Try searching:'));
      console.info(chalk.cyan('  npm run search "your query"'));
    }

    console.info();
  }
}
