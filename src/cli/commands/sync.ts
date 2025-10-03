/**
 * Sync Command
 * Update stale documentation based on TTL
 */

import { Listr } from 'listr2';
import chalk from 'chalk';
import { Pipeline } from '../pipeline/index.js';
import { ManifestService } from '../../services/manifest-service.js';
import { DocumentationUrlService } from '../../config/documentation-urls.js';
import { DEFAULT_TTL_DAYS } from '../../config/constants.js';
import type { SyncOptions, SyncContext, UrlStatus } from './sync.types.js';

export class SyncCommand {
  private urlService: DocumentationUrlService;
  private pipeline: Pipeline;

  constructor() {
    this.urlService = new DocumentationUrlService();
    this.pipeline = new Pipeline();
  }

  /**
   * Check if URL needs update based on TTL and status
   */
  private async checkUrlFreshness(url: string, ttlDays: number): Promise<UrlStatus> {
    const manifestService = new ManifestService(url);
    const record = manifestService.getRecord(url);

    // No record - needs ingestion
    if (!record) {
      return {
        url,
        needsUpdate: true,
        reason: 'Not yet ingested'
      };
    }

    // Failed status - needs retry
    if (record.status === 'failed') {
      return {
        url,
        needsUpdate: true,
        reason: 'Previous attempt failed'
      };
    }

    // No ingestion date - needs ingestion
    if (!record.lastIngestedAt) {
      return {
        url,
        needsUpdate: true,
        reason: 'No ingestion date recorded'
      };
    }

    // Check age
    const lastIngestedDate = new Date(record.lastIngestedAt);
    const ageInMs = Date.now() - lastIngestedDate.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

    if (ageInDays > ttlDays) {
      return {
        url,
        needsUpdate: true,
        reason: `Stale (${Math.floor(ageInDays)} days old)`,
        lastIngested: lastIngestedDate,
        daysSinceIngestion: Math.floor(ageInDays)
      };
    }

    return {
      url,
      needsUpdate: false,
      reason: `Fresh (${Math.floor(ageInDays)} days old)`,
      lastIngested: lastIngestedDate,
      daysSinceIngestion: Math.floor(ageInDays)
    };
  }

  /**
   * Get all URLs and their freshness status
   */
  private async analyzeAllUrls(ttlDays: number): Promise<{
    stale: UrlStatus[];
    fresh: UrlStatus[];
  }> {
    const allUrls = this.urlService.getAllUrls();
    const statuses = await Promise.all(allUrls.map(url => this.checkUrlFreshness(url, ttlDays)));

    return {
      stale: statuses.filter(s => s.needsUpdate),
      fresh: statuses.filter(s => !s.needsUpdate)
    };
  }

  /**
   * Smart ingest with resume capability
   */
  private async smartIngest(url: string, options: SyncOptions): Promise<'success' | 'unchanged'> {
    const manifestService = new ManifestService(url);
    const record = manifestService.getRecord(url);
    const status = record?.status;

    // Determine what pipeline stages to run based on current status
    switch (status) {
      case 'fetched':
        // HTML is cached, run extract and embed
        await this.pipeline.extract(url, {
          model: options.model,
          dev: options.dev
        });
        await this.pipeline.embed(url, {
          provider: options.provider
        });
        return 'success';

      case 'extracted':
      case 'structured':
        // JSON exists, just embed
        await this.pipeline.embed(url, {
          provider: options.provider
        });
        return 'success';

      case 'embedded': {
        // Already complete, but stale - run full pipeline
        // This will check for content changes and may skip if unchanged
        await this.pipeline.ingest(url, {
          model: options.model,
          provider: options.provider,
          dev: options.dev,
          quiet: true
        });

        // Check if content was unchanged (diff detection skipped processing)
        if (
          record &&
          record.lastCheckedAt &&
          record.lastIngestedAt &&
          new Date(record.lastCheckedAt) > new Date(record.lastIngestedAt)
        ) {
          return 'unchanged';
        }
        return 'success';
      }

      case 'failed':
      case undefined:
        // Failed or new - run full pipeline
        await this.pipeline.ingest(url, {
          model: options.model,
          provider: options.provider,
          dev: options.dev,
          quiet: true
        });
        return 'success';

      default:
        // Unknown status - run full pipeline
        await this.pipeline.ingest(url, {
          model: options.model,
          provider: options.provider,
          dev: options.dev,
          quiet: true
        });
        return 'success';
    }
  }

  /**
   * Run sync command
   */
  async run(options: SyncOptions = {}): Promise<void> {
    const startTime = Date.now();
    const ttlDays = options.ttl || DEFAULT_TTL_DAYS;

    console.info(chalk.bold('\n🔄 Syncing Documentation\n'));
    console.info(chalk.cyan(`TTL: ${ttlDays} days`));

    // Analyze all URLs
    const { stale, fresh } = await this.analyzeAllUrls(ttlDays);

    // Show preview
    console.info(chalk.yellow(`\n📊 Status:`));
    console.info(`  • ${stale.length} pages need update`);
    console.info(`  • ${fresh.length} pages are fresh`);

    if (stale.length === 0) {
      console.info(chalk.green('\n✨ All documentation is up to date!\n'));
      return;
    }

    // Show stale pages
    console.info(chalk.yellow('\nPages to update:'));
    stale.forEach(s => {
      const pageKey = this.urlService.getPageKeyFromUrl(s.url) || s.url;
      console.info(`  • ${pageKey} - ${s.reason}`);
    });

    // Check mode - exit if dry run
    if (options.check) {
      console.info(chalk.dim('\n(Dry run - no changes made)'));
      console.info(chalk.dim('Run "npm run sync" to update these pages.\n'));
      return;
    }

    console.info(); // Empty line before progress

    // Create Listr tasks for stale URLs only
    const tasks = new Listr<SyncContext>(
      stale.map(({ url }) => ({
        title: this.urlService.getPageKeyFromUrl(url) || url,
        task: async (ctx, task) => {
          try {
            // Smart ingest with resume capability
            const result = await this.smartIngest(url, options);

            // Track result
            ctx.results.push({
              url,
              status: result
            });

            if (result === 'unchanged') {
              task.title = `${task.title} ⚡ (unchanged)`;
            } else {
              task.title = `${task.title} ✓`;
            }
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
      console.error(chalk.red('\n✗ Sync failed:'), error);
    }

    // Show summary
    await this.showSummary(tasks.ctx, fresh.length);
  }

  /**
   * Show summary of sync results
   */
  private async showSummary(ctx: SyncContext, freshCount: number): Promise<void> {
    const duration = Date.now() - ctx.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    const successful = ctx.results.filter(r => r.status === 'success').length;
    const unchanged = ctx.results.filter(r => r.status === 'unchanged').length;
    const failed = ctx.results.filter(r => r.status === 'failed').length;

    console.info(chalk.bold('\n📊 Sync Summary\n'));
    console.info(`Duration: ${minutes}m ${seconds}s`);
    console.info(chalk.green(`✓ Updated: ${successful}`));
    console.info(chalk.cyan(`⚡ Unchanged: ${unchanged}`));
    console.info(chalk.dim(`⏭️  Already fresh: ${freshCount}`));

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

    if (successful > 0 || unchanged > 0) {
      console.info(chalk.green('\n✨ Documentation synced successfully!'));
    }
  }
}
