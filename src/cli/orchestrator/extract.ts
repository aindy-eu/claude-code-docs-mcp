/**
 * Extract Stage
 * Extracts structured data from HTML using Claude via Python
 */

import chalk from 'chalk';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { FetchService } from '../../services/fetch-service.js';
import { ExtractService } from '../../services/extract-service.js';
import { ManifestService } from '../../services/manifest-service.js';
import { ExtractOptions } from './types.js';

const execAsync = promisify(exec);

export async function extractStage(
  url: string,
  projectRoot: string,
  options: ExtractOptions = {},
  silent: boolean = false
): Promise<void> {
  const spinner = silent ? null : ora('Extracting with Claude...').start();

  try {
    const fetchService = new FetchService(url);
    const extractService = new ExtractService(url);
    const model = options.model || 'claude-sonnet-4-5-20250929';

    // Check if HTML exists
    const html = await fetchService.getHTML(url);
    if (!html) {
      throw new Error('HTML not cached. Run fetch first.');
    }

    // Get HTML file path for Python script
    const paths = fetchService.getCachePaths(url);
    const htmlPath = paths.htmlPath;

    try {
      // Call Python extraction script
      const pythonScript = path.join(projectRoot, 'tools/extract.py');
      const promptFile = options.dev
        ? 'claude-docs.dev.prompt.md'
        : 'claude-docs.prompt.md';
      const promptPath = path.join(
        projectRoot,
        'docs/ingestion/prompts',
        promptFile
      );

      const { stdout, stderr } = await execAsync(
        `DOC_URL="${url}" python3 "${pythonScript}" "${htmlPath}" "${promptPath}" "${model}"`,
        {
          cwd: projectRoot,
          timeout: 300000, // 5 minutes
          maxBuffer: 10 * 1024 * 1024
        }
      );

      // Parse and save JSON
      const extracted = JSON.parse(stdout);
      await extractService.save(url, extracted);

      // Update manifest
      const manifest = new ManifestService(url);
      const jsonPath = extractService.getJsonPath(url);
      manifest.updateExtracted(url, {
        model,
        jsonPath
      });

      if (!silent && stderr) {
        console.log(stderr);
      }

      spinner?.succeed(chalk.green('✓ Extraction complete'));
    } catch (error: any) {
      throw error;
    }
  } catch (error: any) {
    spinner?.fail(chalk.red('✗ Extraction failed'));
    throw error;
  }
}
