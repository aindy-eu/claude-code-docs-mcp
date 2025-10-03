/**
 * Manifest Test Fixtures
 * Realistic test data for ManifestService tests
 */

import { Manifest, ManifestRecord } from '@/services/manifest-service.types.js';

// ============================================================================
// Valid Manifest Structures
// ============================================================================

export const emptyManifest: Manifest = {
  version: '2.0',
  domain: 'example.com',
  createdAt: '2025-01-01T00:00:00Z',
  lastUpdatedAt: '2025-01-01T00:00:00Z',
  defaultTTLDays: 7,
  records: {}
};

export const manifestWithFetchedRecord: Manifest = {
  version: '2.0',
  domain: 'example.com',
  createdAt: '2025-01-01T00:00:00Z',
  lastUpdatedAt: '2025-01-01T00:01:00Z',
  defaultTTLDays: 7,
  records: {
    'https://example.com/docs/quickstart': {
      url: 'https://example.com/docs/quickstart',
      status: 'fetched',
      lastFetchedAt: '2025-01-01T00:01:00Z'
    }
  }
};

export const manifestWithExtractedRecord: Manifest = {
  version: '2.0',
  domain: 'example.com',
  createdAt: '2025-01-01T00:00:00Z',
  lastUpdatedAt: '2025-01-01T00:02:00Z',
  defaultTTLDays: 7,
  records: {
    'https://example.com/docs/quickstart': {
      url: 'https://example.com/docs/quickstart',
      status: 'extracted',
      lastFetchedAt: '2025-01-01T00:01:00Z',
      lastExtractedAt: '2025-01-01T00:02:00Z',
      extractionModel: 'claude-sonnet-4-5-20250929',
      rawResponseSize: 125000
    }
  }
};

export const manifestWithStructuredRecord: Manifest = {
  version: '2.0',
  domain: 'example.com',
  createdAt: '2025-01-01T00:00:00Z',
  lastUpdatedAt: '2025-01-01T00:03:00Z',
  defaultTTLDays: 7,
  records: {
    'https://example.com/docs/quickstart': {
      url: 'https://example.com/docs/quickstart',
      status: 'structured',
      lastFetchedAt: '2025-01-01T00:01:00Z',
      lastExtractedAt: '2025-01-01T00:02:00Z',
      lastStructuredAt: '2025-01-01T00:03:00Z',
      extractionModel: 'claude-sonnet-4-5-20250929',
      rawResponseSize: 125000,
      outputSize: 45678,
      sectionCount: 5,
      codeExampleCount: 12
    }
  }
};

export const manifestWithEmbeddedRecord: Manifest = {
  version: '2.0',
  domain: 'example.com',
  createdAt: '2025-01-01T00:00:00Z',
  lastUpdatedAt: '2025-01-01T00:04:00Z',
  defaultTTLDays: 7,
  records: {
    'https://example.com/docs/quickstart': {
      url: 'https://example.com/docs/quickstart',
      status: 'embedded',
      lastFetchedAt: '2025-01-01T00:01:00Z',
      lastExtractedAt: '2025-01-01T00:02:00Z',
      lastStructuredAt: '2025-01-01T00:03:00Z',
      lastEmbeddedAt: '2025-01-01T00:04:00Z',
      lastIngestedAt: '2025-01-01T00:04:00Z',
      extractionModel: 'claude-sonnet-4-5-20250929',
      embeddingProvider: 'ollama',
      rawResponseSize: 125000,
      outputSize: 45678,
      sectionCount: 5,
      codeExampleCount: 12
    }
  }
};

export const manifestWithFailedRecord: Manifest = {
  version: '2.0',
  domain: 'example.com',
  createdAt: '2025-01-01T00:00:00Z',
  lastUpdatedAt: '2025-01-01T00:05:00Z',
  defaultTTLDays: 7,
  records: {
    'https://example.com/docs/broken': {
      url: 'https://example.com/docs/broken',
      status: 'failed',
      lastFetchedAt: '2025-01-01T00:01:00Z',
      lastFailedAt: '2025-01-01T00:05:00Z',
      lastError: 'Claude API timeout'
    }
  }
};

export const manifestWithUnchangedRecord: Manifest = {
  version: '2.0',
  domain: 'example.com',
  createdAt: '2025-01-01T00:00:00Z',
  lastUpdatedAt: '2025-01-08T00:00:00Z',
  defaultTTLDays: 7,
  records: {
    'https://example.com/docs/unchanged': {
      url: 'https://example.com/docs/unchanged',
      status: 'embedded',
      lastFetchedAt: '2025-01-01T00:01:00Z',
      lastExtractedAt: '2025-01-01T00:02:00Z',
      lastEmbeddedAt: '2025-01-01T00:04:00Z',
      lastIngestedAt: '2025-01-01T00:04:00Z',
      lastCheckedAt: '2025-01-08T00:00:00Z', // Checked again, no changes
      extractionModel: 'claude-sonnet-4-5-20250929',
      embeddingProvider: 'ollama'
    }
  }
};

export const manifestWithMultipleRecords: Manifest = {
  version: '2.0',
  domain: 'example.com',
  createdAt: '2025-01-01T00:00:00Z',
  lastUpdatedAt: '2025-01-01T00:10:00Z',
  defaultTTLDays: 7,
  records: {
    'https://example.com/docs/quickstart': {
      url: 'https://example.com/docs/quickstart',
      status: 'embedded',
      lastFetchedAt: '2025-01-01T00:01:00Z',
      lastExtractedAt: '2025-01-01T00:02:00Z',
      lastEmbeddedAt: '2025-01-01T00:04:00Z',
      lastIngestedAt: '2025-01-01T00:04:00Z',
      extractionModel: 'claude-sonnet-4-5-20250929',
      embeddingProvider: 'ollama',
      sectionCount: 3,
      codeExampleCount: 8
    },
    'https://example.com/docs/setup': {
      url: 'https://example.com/docs/setup',
      status: 'embedded',
      lastFetchedAt: '2025-01-01T00:05:00Z',
      lastExtractedAt: '2025-01-01T00:06:00Z',
      lastEmbeddedAt: '2025-01-01T00:08:00Z',
      lastIngestedAt: '2025-01-01T00:08:00Z',
      extractionModel: 'claude-sonnet-4-5-20250929',
      embeddingProvider: 'openai',
      sectionCount: 7,
      codeExampleCount: 15
    },
    'https://example.com/docs/troubleshooting': {
      url: 'https://example.com/docs/troubleshooting',
      status: 'fetched',
      lastFetchedAt: '2025-01-01T00:10:00Z'
    }
  }
};

// ============================================================================
// Invalid/Corrupted Manifests (for error handling tests)
// ============================================================================

export const manifestMissingVersion = {
  domain: 'example.com',
  records: {}
};

export const manifestMissingRecords = {
  version: '2.0',
  domain: 'example.com'
};

export const corruptManifestJson = '{"version": "2.0", "domain": "example.com", "records": {'; // Invalid JSON

// ============================================================================
// Structured Document Data (for JSON parsing tests)
// ============================================================================

export const structuredDocWithSections = {
  url: 'https://example.com/docs/quickstart',
  title: 'Quick Start Guide',
  sections: [
    {
      heading: 'Installation',
      level: 2,
      content: 'Install Claude Code globally using npm.',
      codeExamples: [
        'npm install -g @anthropic-ai/claude-code',
        'yarn global add @anthropic-ai/claude-code'
      ]
    },
    {
      heading: 'Getting Started',
      level: 2,
      content: 'Navigate to your project and run claude.',
      codeExamples: ['cd your-project', 'claude']
    },
    {
      heading: 'Basic Commands',
      level: 2,
      content: 'Common commands you will use.',
      codeExamples: ['/help', '/settings', '/memory clear', 'claude -p "analyze this code"']
    },
    {
      heading: 'Configuration',
      level: 2,
      content: 'Configure Claude Code for your project.',
      codeExamples: [
        '// .claude/config.json\n{\n  "model": "claude-sonnet-4-5"\n}',
        'claude --model claude-opus-4-5'
      ]
    },
    {
      heading: 'Next Steps',
      level: 2,
      content: 'Learn more advanced features.',
      codeExamples: []
    }
  ]
};

export const structuredDocEmpty = {
  url: 'https://example.com/docs/empty',
  title: 'Empty Document',
  sections: []
};

export const structuredDocNoCodeExamples = {
  url: 'https://example.com/docs/overview',
  title: 'Overview',
  sections: [
    {
      heading: 'Introduction',
      level: 1,
      content: 'This is an introduction.',
      codeExamples: []
    },
    {
      heading: 'Conclusion',
      level: 1,
      content: 'This is a conclusion.',
      codeExamples: []
    }
  ]
};

export const structuredDocMissingSectionsField = {
  url: 'https://example.com/docs/malformed',
  title: 'Malformed Document'
  // sections field is missing
};

// ============================================================================
// Individual Records (for specific test scenarios)
// ============================================================================

export const fetchedRecord: ManifestRecord = {
  url: 'https://example.com/docs/test',
  status: 'fetched',
  lastFetchedAt: '2025-01-01T00:00:00Z'
};

export const extractedRecord: ManifestRecord = {
  url: 'https://example.com/docs/test',
  status: 'extracted',
  lastFetchedAt: '2025-01-01T00:00:00Z',
  lastExtractedAt: '2025-01-01T00:01:00Z',
  extractionModel: 'claude-sonnet-4-5-20250929',
  rawResponseSize: 125000
};

export const embeddedRecord: ManifestRecord = {
  url: 'https://example.com/docs/test',
  status: 'embedded',
  lastFetchedAt: '2025-01-01T00:00:00Z',
  lastExtractedAt: '2025-01-01T00:01:00Z',
  lastStructuredAt: '2025-01-01T00:02:00Z',
  lastEmbeddedAt: '2025-01-01T00:03:00Z',
  lastIngestedAt: '2025-01-01T00:03:00Z',
  extractionModel: 'claude-sonnet-4-5-20250929',
  embeddingProvider: 'ollama',
  outputSize: 45678,
  sectionCount: 5,
  codeExampleCount: 12
};

export const failedRecord: ManifestRecord = {
  url: 'https://example.com/docs/test',
  status: 'failed',
  lastFetchedAt: '2025-01-01T00:00:00Z',
  lastFailedAt: '2025-01-01T00:01:00Z',
  lastError: 'Network timeout'
};

// ============================================================================
// Master Manifest Fixtures
// ============================================================================

import type { MasterManifest, SourceMetadata } from '@/services/master-manifest-service.types.js';

export const emptyMasterManifest: MasterManifest = {
  version: '1.0',
  sources: {}
};

export const singleSourceMasterManifest: MasterManifest = {
  version: '1.0',
  sources: {
    'docs.claude.com': {
      type: 'claude-code-docs',
      addedAt: '2025-01-15T10:00:00Z',
      lastSyncedAt: '2025-01-16T14:00:00Z',
      urlCount: 10,
      status: 'active'
    }
  }
};

export const multiSourceMasterManifest: MasterManifest = {
  version: '1.0',
  sources: {
    'docs.claude.com': {
      type: 'claude-code-docs',
      addedAt: '2025-01-15T10:00:00Z',
      lastSyncedAt: '2025-01-16T14:00:00Z',
      urlCount: 10,
      status: 'active'
    },
    'react.dev': {
      type: 'documentation',
      addedAt: '2025-01-16T09:00:00Z',
      lastSyncedAt: '2025-01-16T14:00:00Z',
      urlCount: 20,
      status: 'active'
    },
    'nextjs.org': {
      type: 'documentation',
      addedAt: '2025-01-16T09:00:00Z',
      lastSyncedAt: '2025-01-16T14:00:00Z',
      urlCount: 30,
      status: 'active'
    }
  }
};

export const activeSource: SourceMetadata = {
  type: 'documentation',
  addedAt: '2025-01-15T10:00:00Z',
  lastSyncedAt: '2025-01-16T14:00:00Z',
  urlCount: 25,
  status: 'active'
};

export const inactiveSource: SourceMetadata = {
  type: 'documentation',
  addedAt: '2025-01-01T10:00:00Z',
  lastSyncedAt: '2025-01-02T10:00:00Z',
  urlCount: 5,
  status: 'inactive'
};

export const neverSyncedSource: SourceMetadata = {
  type: 'claude-code-docs',
  addedAt: '2025-01-15T10:00:00Z',
  urlCount: 10,
  status: 'active'
};
