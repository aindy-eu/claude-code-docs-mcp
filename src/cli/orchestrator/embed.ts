/**
 * Embed Stage
 * Generates embeddings and stores in Qdrant
 */

import chalk from 'chalk';
import ora from 'ora';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ExtractService } from '../../services/extract-service.js';
import { ManifestService } from '../../services/manifest-service.js';
import { PipelineLoggingService } from '../../services/pipeline-logging-service.js';
import { EmbedService } from '../../services/embed-service.js';
import { EmbeddingProvider } from '../../utils/embeddings.js';
import { ClaudeDocOutput } from '../../services/embed-service.types.js';
import { EmbedOptions } from './types.js';

export async function embedStage(
  url: string,
  projectRoot: string,
  options: EmbedOptions = {},
  silent: boolean = false
): Promise<void> {
  const spinner = silent ? null : ora('Generating embeddings...').start();
  const startTime = Date.now();
  const provider = (options.provider || 'ollama') as EmbeddingProvider;

  try {
    const extractService = new ExtractService(url);
    const logger = new PipelineLoggingService(url);

    // Get extracted JSON
    const extracted = await extractService.get(url);
    if (!extracted) {
      throw new Error('JSON not extracted. Run extract first.');
    }

    // Initialize Qdrant client and embed service
    const qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333'
    });
    const embedService = new EmbedService(qdrantClient, provider);

    // Process and embed
    const result = await embedService.embed(extracted as ClaudeDocOutput, provider);

    if (!result.success) {
      const errorMsg =
        result.errors && result.errors.length > 0 ? result.errors.join(', ') : 'Unknown error';
      throw new Error('Embedding failed: ' + errorMsg);
    }

    // Update manifest
    const manifest = new ManifestService(url);
    const jsonPath = extractService.getJsonPath(url);
    manifest.updateEmbedded(url, {
      provider,
      jsonPath
    });

    // Log success
    const duration = Date.now() - startTime;
    logger.logEmbed(url, provider, duration, result.embeddingsGenerated);

    spinner?.succeed(chalk.green(`✓ Embedding complete (${result.embeddingsGenerated} vectors)`));
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    const logger = new PipelineLoggingService(url);
    logger.logEmbedError(url, provider, message, duration);

    spinner?.fail(chalk.red('✗ Embedding failed'));
    throw error;
  }
}
