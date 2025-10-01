/**
 * Fetch Stage
 * Downloads and caches HTML content
 */

import chalk from 'chalk';
import ora from 'ora';
import { FetchService } from '../../services/fetch-service.js';
import { ManifestService } from '../../services/manifest-service.js';
import { PipelineLoggingService } from '../../services/pipeline-logging-service.js';
import { FetchOptions } from './types.js';

export async function fetchStage(
  url: string,
  _projectRoot: string,
  options: FetchOptions = {},
  silent: boolean = false
): Promise<string> {
  const spinner = silent ? null : ora('Fetching HTML...').start();
  const startTime = Date.now();

  try {
    const fetchService = new FetchService(url);

    // Fetch and cache (may detect redirect)
    const { html, finalUrl } = await fetchService.fetch(url, options.force || false);

    // Use finalUrl for all subsequent operations
    const manifest = new ManifestService(finalUrl);
    const logger = new PipelineLoggingService(finalUrl);

    // Update manifest with final URL
    manifest.updateFetched(finalUrl);

    // Log success
    const duration = Date.now() - startTime;
    logger.logFetch(finalUrl, duration);

    // Notify user if redirect occurred
    if (finalUrl !== url) {
      spinner?.succeed(chalk.green(`✓ Fetch complete (redirected to ${new URL(finalUrl).hostname})`));
    } else {
      spinner?.succeed(chalk.green('✓ Fetch complete'));
    }

    return finalUrl; // Return final URL for downstream stages
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const logger = new PipelineLoggingService(url);
    logger.logFetchError(url, error.message, duration);

    spinner?.fail(chalk.red('✗ Fetch failed'));
    throw error;
  }
}
