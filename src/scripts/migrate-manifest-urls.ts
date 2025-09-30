#!/usr/bin/env node
/**
 * Manifest URL Migration Script
 *
 * Migrates legacy documentation URLs in the ingestion manifest to current URLs.
 * Preserves all data while updating URL references.
 *
 * Usage:
 *   npm run migrate-urls
 *   npm run migrate-urls -- --dry-run
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import path from 'path';
import { DocumentationUrlService } from '../config/documentation-urls.js';
import type { IngestionManifest, IngestionRecord } from '../types/ingestion-manifest.js';

const MANIFEST_PATH = './claude-outputs/ingestion-manifest.json';
const BACKUP_PATH = './claude-outputs/ingestion-manifest.backup.json';

interface MigrationResult {
  migratedCount: number;
  migrations: Array<{ from: string; to: string }>;
  errors: Array<{ url: string; error: string }>;
}

class ManifestUrlMigrator {
  private urlService: DocumentationUrlService;
  private dryRun: boolean;

  constructor(dryRun = false) {
    this.urlService = new DocumentationUrlService();
    this.dryRun = dryRun;
  }

  /**
   * Run the migration
   */
  async migrate(): Promise<MigrationResult> {
    const result: MigrationResult = {
      migratedCount: 0,
      migrations: [],
      errors: []
    };

    // Check if manifest exists
    if (!existsSync(MANIFEST_PATH)) {
      console.log('❌ No ingestion manifest found at:', MANIFEST_PATH);
      console.log('   Nothing to migrate.');
      return result;
    }

    console.log('📋 Loading ingestion manifest...');
    let manifest: IngestionManifest;

    try {
      const data = readFileSync(MANIFEST_PATH, 'utf-8');
      manifest = JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load manifest:', error);
      throw error;
    }

    // Create backup
    if (!this.dryRun) {
      console.log('💾 Creating backup at:', BACKUP_PATH);
      copyFileSync(MANIFEST_PATH, BACKUP_PATH);
    }

    console.log(`🔍 Checking ${Object.keys(manifest.records).length} URLs for migration...`);
    console.log('');

    // New records object with migrated URLs
    const newRecords: Record<string, IngestionRecord> = {};

    // Process each record
    for (const [url, record] of Object.entries(manifest.records)) {
      try {
        // Check if URL needs migration
        if (this.urlService.isLegacyUrl(url)) {
          const newUrl = this.urlService.migrateUrl(url);

          console.log(`  🔄 Migrating:`);
          console.log(`     From: ${url}`);
          console.log(`     To:   ${newUrl}`);

          // Update record with new URL
          const updatedRecord = {
            ...record,
            url: newUrl,
            migratedFrom: url,
            migratedAt: new Date().toISOString()
          } as IngestionRecord & { migratedFrom?: string; migratedAt?: string };

          // Check for conflicts
          if (newRecords[newUrl]) {
            console.log(`  ⚠️  Warning: URL already exists in manifest, keeping newer record`);
            const existing = newRecords[newUrl];
            if (record.lastIngestedAt > existing.lastIngestedAt) {
              newRecords[newUrl] = updatedRecord;
            }
          } else {
            newRecords[newUrl] = updatedRecord;
          }

          result.migrations.push({ from: url, to: newUrl });
          result.migratedCount++;
        } else {
          // Keep as-is
          newRecords[url] = record;
        }
      } catch (error) {
        console.error(`  ❌ Error migrating ${url}:`, error);
        result.errors.push({
          url,
          error: error instanceof Error ? error.message : String(error)
        });
        // Keep original on error
        newRecords[url] = record;
      }
    }

    // Update manifest
    manifest.records = newRecords;
    manifest.lastUpdatedAt = new Date().toISOString();

    // Add migration metadata
    if (!manifest.migrations) {
      manifest.migrations = [];
    }
    manifest.migrations.push({
      date: new Date().toISOString(),
      migratedCount: result.migratedCount,
      totalRecords: Object.keys(newRecords).length
    });

    // Save updated manifest
    if (!this.dryRun) {
      console.log('');
      console.log('💾 Saving updated manifest...');
      writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
      console.log('✅ Manifest updated successfully');
    } else {
      console.log('');
      console.log('🔍 DRY RUN - No changes were saved');
    }

    return result;
  }

  /**
   * Print migration summary
   */
  printSummary(result: MigrationResult): void {
    console.log('');
    console.log('📊 Migration Summary');
    console.log('═'.repeat(40));
    console.log(`  Total URLs migrated: ${result.migratedCount}`);

    if (result.errors.length > 0) {
      console.log(`  Errors encountered: ${result.errors.length}`);
      console.log('');
      console.log('  Error details:');
      for (const error of result.errors) {
        console.log(`    - ${error.url}: ${error.error}`);
      }
    }

    if (result.migratedCount > 0) {
      console.log('');
      console.log('  Migrations performed:');
      for (const migration of result.migrations) {
        const from = migration.from.replace('https://', '');
        const to = migration.to.replace('https://', '');
        console.log(`    ${from} → ${to}`);
      }
    }

    console.log('═'.repeat(40));

    if (this.dryRun) {
      console.log('');
      console.log('ℹ️  This was a dry run. To apply changes, run without --dry-run');
    } else if (result.migratedCount > 0) {
      console.log('');
      console.log('✅ Migration completed successfully!');
      console.log(`   Backup saved at: ${BACKUP_PATH}`);
      console.log('');
      console.log('Next steps:');
      console.log('  1. Run: npm run ingestion-status');
      console.log('  2. Verify all URLs are correct');
      console.log('  3. If issues, restore from backup');
    }
  }

  /**
   * Verify migrations by checking if new URLs are accessible
   */
  async verifyMigrations(result: MigrationResult): Promise<void> {
    if (result.migratedCount === 0) return;

    console.log('');
    console.log('🔍 Verifying migrated URLs...');

    for (const migration of result.migrations.slice(0, 3)) {
      // Check first 3
      try {
        const response = await fetch(migration.to, { method: 'HEAD' });
        if (response.ok) {
          console.log(`  ✅ ${migration.to.split('/').pop()} - Accessible`);
        } else {
          console.log(`  ⚠️  ${migration.to.split('/').pop()} - Status ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${migration.to.split('/').pop()} - Failed to verify`);
      }
    }

    if (result.migrations.length > 3) {
      console.log(`  ... and ${result.migrations.length - 3} more`);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🚀 Documentation URL Migration Tool');
  console.log('════════════════════════════════════');

  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be saved');
  }
  console.log('');

  const migrator = new ManifestUrlMigrator(dryRun);

  try {
    const result = await migrator.migrate();
    await migrator.verifyMigrations(result);
    migrator.printSummary(result);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ManifestUrlMigrator };
