/**
 * Sources Command
 * List all registered documentation sources
 */

import chalk from 'chalk';
import { MasterManifestService } from '../../services/master-manifest-service.js';

export class SourcesCommand {
  private masterManifest: MasterManifestService;

  constructor() {
    this.masterManifest = new MasterManifestService();
  }

  async run(): Promise<void> {
    const sources = this.masterManifest.getSources();
    const domains = Object.keys(sources);

    if (domains.length === 0) {
      console.info(chalk.yellow('\nNo documentation sources found.'));
      console.info(chalk.dim('Run "npm run seed" to bootstrap the database.\n'));
      return;
    }

    console.info(chalk.bold('\n📚 Documentation Sources\n'));

    // Group by type
    const byType: Record<string, string[]> = {};
    for (const [domain, meta] of Object.entries(sources)) {
      if (!byType[meta.type]) {
        byType[meta.type] = [];
      }
      byType[meta.type].push(domain);
    }

    // Display by type
    for (const [type, domainsInType] of Object.entries(byType)) {
      console.info(chalk.cyan(`\n${type}:`));

      for (const domain of domainsInType) {
        const meta = sources[domain];
        const lastSync = meta.lastSyncedAt
          ? new Date(meta.lastSyncedAt).toLocaleDateString()
          : 'Never';

        const statusIcon = meta.status === 'active' ? '✓' : '✗';
        const statusColor = meta.status === 'active' ? chalk.green : chalk.red;

        console.info(
          `  ${statusColor(statusIcon)} ${domain}`,
          chalk.dim(`(${meta.urlCount} pages, last sync: ${lastSync})`)
        );
      }
    }

    console.info(
      chalk.dim(`\nTotal: ${domains.length} source${domains.length === 1 ? '' : 's'}\n`)
    );
  }
}
