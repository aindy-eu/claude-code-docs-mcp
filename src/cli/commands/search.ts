/**
 * Search Command
 * Search ingested documentation using semantic search
 */

import chalk from 'chalk';
import { QdrantClient } from '@qdrant/js-client-rest';
import { searchDocumentation, formatSearchResults } from '@/mcp-tools/search/search.js';
import { EmbeddingProvider } from '../../utils/embeddings.js';
import { SearchOptions } from './search.types.js';

export class SearchCommand {
  private qdrantClient: QdrantClient;

  constructor() {
    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333'
    });
  }

  /**
   * Execute search
   */
  async run(query: string, options: SearchOptions = {}): Promise<void> {
    const provider = (options.provider || 'ollama') as EmbeddingProvider;
    const limit = options.limit || 3;

    console.info(chalk.bold(`\n🔍 Searching for: "${query}"`));
    console.info(chalk.cyan(`📊 Provider: ${provider}`));
    console.info(chalk.cyan(`📄 Limit: ${limit}\n`));

    try {
      // Perform search
      const results = await searchDocumentation(this.qdrantClient, {
        query,
        provider,
        limit
      });

      if (results.length === 0) {
        console.info(chalk.yellow('No results found.\n'));
        console.info(chalk.gray('Try:'));
        console.info(chalk.gray('  - Different search terms'));
        console.info(chalk.gray('  - Broader query'));
        console.info(chalk.gray('  - Check if documentation is ingested: npm run cli -- list'));
        return;
      }

      // Format and display results
      const formattedResults = formatSearchResults(results);
      console.info(formattedResults);

      // Show metadata
      console.info(chalk.bold('\n📊 Search Metadata:'));
      console.info(
        chalk.green(`✓ Found ${results.length} result${results.length === 1 ? '' : 's'}`)
      );
      console.info(chalk.green(`✓ Extraction method: Claude-driven`));
      console.info();
    } catch (error: any) {
      console.error(chalk.red('\n❌ Search failed:'), error.message);

      // Helpful error messages
      if (error.message.includes('Not Found')) {
        console.warn(chalk.yellow('\nNo collection found. Try:'));
        console.info(chalk.cyan('  npm run setup           ') + chalk.gray('# Create collections'));
        console.info(
          chalk.cyan('  npm run cli -- batch    ') + chalk.gray('# Ingest documentation')
        );
      }

      process.exit(1);
    }
  }
}
