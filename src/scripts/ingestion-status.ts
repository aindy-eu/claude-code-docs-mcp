#!/usr/bin/env node
/**
 * Ingestion Status Script
 * Shows the current state of documentation ingestion
 *
 * Usage:
 *   npm run ingestion-status
 *   npm run ingestion-status -- --verbose
 */

import { IngestionTracker } from '../services/ingestion-tracker.js';
import { getAllDocUrls, docUrlService } from '../config/documentation-urls.js';
import { existsSync } from 'fs';

// Get configured URLs instead of hardcoding them
const PAGES = getAllDocUrls();

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');

  // Check if manifest exists
  if (!existsSync('./claude-outputs/ingestion-manifest.json')) {
    console.log('📊 Ingestion Status\n');
    console.log('❌ No ingestion manifest found.');
    console.log('   Run ./tools/batch-ingest to start ingesting documentation.\n');
    return;
  }

  const tracker = new IngestionTracker();
  const stats = tracker.getStats();
  const records = tracker.getAllRecords();

  console.log('📊 Ingestion Status\n');
  console.log('Summary:');
  console.log(`  📄 Total pages tracked: ${stats.totalPages}`);
  console.log(`  ✅ Successful ingestions: ${stats.successfulIngestions}`);
  console.log(`  ❌ Failed ingestions: ${stats.failedIngestions}`);
  console.log(`  🧮 Total embeddings: ${stats.totalEmbeddings}`);
  console.log(`  📅 Default TTL: ${stats.defaultTTLDays} days`);
  console.log(`  🆕 Recent (< 1 day): ${stats.recentCount}`);
  console.log(`  🔄 Stale (needs update): ${stats.staleCount}\n`);

  // Show status for each known page
  console.log('Page Status:');
  for (const url of PAGES) {
    // First try with the configured URL
    let status = tracker.checkIngestionStatus(url);

    // If not found, check if we have a legacy URL in the manifest
    if (status.reason === 'never-ingested' && docUrlService.isValidDocumentationUrl(url)) {
      // Try to find a legacy version
      const allRecords = tracker.getAllRecords();
      const legacyRecord = allRecords.find(r => docUrlService.migrateUrl(r.url) === url);

      if (legacyRecord) {
        console.log(`  ℹ️  Found legacy URL for ${url.split('/').pop()}, migration needed`);
        status = tracker.checkIngestionStatus(legacyRecord.url);
      }
    }

    const pageName = url.split('/').pop();

    if (status.needsUpdate) {
      const icon = status.reason === 'never-ingested' ? '❓' : '🔄';
      console.log(`  ${icon} ${pageName}: ${status.reason}`);
      if (status.daysSinceIngestion !== undefined) {
        console.log(`     Last ingested: ${status.daysSinceIngestion} days ago`);
      }
    } else {
      console.log(`  ✅ ${pageName}: up to date (${status.daysSinceIngestion} days ago)`);
    }
  }

  // Show unknown pages if verbose
  if (verbose && records.length > 0) {
    console.log('\nAll Tracked Pages:');
    for (const record of records) {
      const daysSince = Math.floor(
        (Date.now() - new Date(record.lastIngestedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log(`  - ${record.url}`);
      console.log(`    Status: ${record.status}`);
      console.log(`    Last ingested: ${daysSince} days ago`);
      console.log(`    Sections: ${record.sectionCount}, Embeddings: ${record.embeddingCount}`);
      console.log(`    Provider: ${record.embeddingProvider}`);
      if (record.error) {
        console.log(`    Error: ${record.error}`);
      }
    }
  }

  // Recommendations
  console.log('\nRecommendations:');

  const neverIngested = PAGES.filter(url => {
    const status = tracker.checkIngestionStatus(url);
    return status.reason === 'never-ingested';
  });

  if (neverIngested.length > 0) {
    console.log(`  ⚠️  ${neverIngested.length} pages have never been ingested`);
    console.log('     Run: ./tools/batch-ingest');
  }

  if (stats.staleCount > 0) {
    console.log(
      `  🔄 ${stats.staleCount} pages are stale (older than ${stats.defaultTTLDays} days)`
    );
    console.log('     Run: ./tools/batch-ingest');
  }

  if (stats.failedIngestions > 0) {
    console.log(`  ❌ ${stats.failedIngestions} failed ingestions need attention`);
    console.log('     Check: claude-outputs/ingestion-log.txt');
  }

  if (neverIngested.length === 0 && stats.staleCount === 0 && stats.failedIngestions === 0) {
    console.log('  ✅ All documentation is up to date!');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
