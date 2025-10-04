/**
 * Extract Stage
 * Extracts structured data from HTML using Claude via Python
 */

import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import path from 'path';
import { FetchService } from '../../services/fetch-service.js';
import { ExtractService } from '../../services/extract-service.js';
import { ManifestService } from '../../services/manifest-service.js';
import { ExtractOptions } from './types.js';

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

    // Call Python extraction script
    const pythonScript = path.join(projectRoot, 'tools/extract.py');
    const promptFile = options.dev ? 'claude-docs.dev.prompt.md' : 'claude-docs.prompt.md';
    const promptPath = path.join(projectRoot, 'src/prompts', promptFile);

    // Safe subprocess execution with spawn (prevents command injection)
    const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>(
      (resolve, reject) => {
        const child = spawn('python3', [pythonScript, htmlPath, promptPath, model], {
          cwd: projectRoot,
          env: { ...process.env, DOC_URL: url },
          timeout: 300000 // 5 minutes
        });

        let stdoutData = '';
        let stderrData = '';

        child.stdout.on('data', data => {
          stdoutData += data.toString();
        });

        child.stderr.on('data', data => {
          stderrData += data.toString();
        });

        child.on('error', error => {
          reject(error);
        });

        child.on('close', code => {
          if (code === 0) {
            resolve({ stdout: stdoutData, stderr: stderrData });
          } else {
            reject(new Error(`Python script exited with code ${code}: ${stderrData}`));
          }
        });
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
      console.info(stderr);
    }

    spinner?.succeed(chalk.green('✓ Extraction complete'));
  } catch (error: unknown) {
    spinner?.fail(chalk.red('✗ Extraction failed'));
    throw error;
  }
}
