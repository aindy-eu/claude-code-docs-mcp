/**
 * Fetch Stage
 * Downloads and caches HTML content
 */

import chalk from 'chalk';
import ora from 'ora';
import { FetchService } from '../../services/fetch-service.js';
import { FetchResult } from '../../services/fetch-service.types.js';
import { ManifestService } from '../../services/manifest-service.js';
import { PipelineLoggingService } from '../../services/pipeline-logging-service.js';
import { FetchOptions } from './types.js';

export async function fetchStage(
  url: string,
  _projectRoot: string,
  options: FetchOptions = {},
  silent: boolean = false
): Promise<FetchResult> {
  const spinner = silent ? null : ora('Fetching HTML...').start();
  const startTime = Date.now();

  try {
    const fetchService = new FetchService(url);

    // Fetch and cache (may detect redirect and compare content)
    const result = await fetchService.fetch(url, options.force || false);
    const { finalUrl, skipPipeline, comparison } = result;

    // Use finalUrl for all subsequent operations
    const manifest = new ManifestService(finalUrl);
    const logger = new PipelineLoggingService(finalUrl);

    // Update manifest with final URL (only if not skipping)
    if (!skipPipeline) {
      manifest.updateFetched(finalUrl);
    }

    // Log success
    const duration = Date.now() - startTime;
    logger.logFetch(finalUrl, duration);

    // Notify user
    if (skipPipeline) {
      spinner?.succeed(chalk.yellow('✓ Fetch complete (content unchanged)'));
    } else if (finalUrl !== url) {
      const changeMsgMsg = comparison?.hasChanged
        ? ` (${comparison.changePercentage?.toFixed(1)}% changed)`
        : '';
      spinner?.succeed(chalk.green(`✓ Fetch complete (redirected)${changeMsgMsg}`));
    } else {
      const changeMsg = comparison?.hasChanged
        ? ` (${comparison.changePercentage?.toFixed(1)}% changed)`
        : '';
      spinner?.succeed(chalk.green(`✓ Fetch complete${changeMsg}`));
    }

    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    const logger = new PipelineLoggingService(url);
    logger.logFetchError(url, message, duration);

    spinner?.fail(chalk.red('✗ Fetch failed'));
    throw error;
  }
}
