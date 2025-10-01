/**
 * Search Command
 * Search ingested documentation using semantic search
 */

import chalk from 'chalk';
import { QdrantClient } from '@qdrant/js-client-rest';
import { search, formatSearchResults } from '../../tools/search.js';
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

    console.log(chalk.bold(`\n🔍 Searching for: "${query}"`));
    console.log(chalk.cyan(`📊 Provider: ${provider}`));
    console.log(chalk.cyan(`📄 Limit: ${limit}\n`));

    try {
      // Perform search
      const results = await search(this.qdrantClient, {
        query,
        provider,
        limit
      });

      if (results.length === 0) {
        console.log(chalk.yellow('No results found.\n'));
        console.log(chalk.gray('Try:'));
        console.log(chalk.gray('  - Different search terms'));
        console.log(chalk.gray('  - Broader query'));
        console.log(chalk.gray('  - Check if documentation is ingested: npm run cli -- list'));
        return;
      }

      // Format and display results
      const formattedResults = formatSearchResults(results);
      console.log(formattedResults);

      // Show metadata
      console.log(chalk.bold('\n📊 Search Metadata:'));
      console.log(chalk.green(`✓ Found ${results.length} result${results.length === 1 ? '' : 's'}`));
      console.log(chalk.green(`✓ Extraction method: Claude-driven`));
      console.log();
    } catch (error: any) {
      console.error(chalk.red('\n❌ Search failed:'), error.message);

      // Helpful error messages
      if (error.message.includes('Not Found')) {
        console.log(chalk.yellow('\nNo collection found. Try:'));
        console.log(chalk.cyan('  npm run setup           ') + chalk.gray('# Create collections'));
        console.log(chalk.cyan('  npm run cli -- batch    ') + chalk.gray('# Ingest documentation'));
      }

      process.exit(1);
    }
  }
}
