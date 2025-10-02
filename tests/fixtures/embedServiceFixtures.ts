/**
 * EmbedService Test Fixtures
 * Simplified fixtures matching actual types in embed-service.types.ts
 */

import type { ClaudeDocOutput } from '@/services/embed-service.types.js';

// ============================================================================
// Claude Extraction Outputs (Input to EmbedService)
// Note: These match the ACTUAL types, not the full extraction format
// ============================================================================

/**
 * Simple extraction with minimal structure
 */
export const simpleExtraction: ClaudeDocOutput = {
  source: 'https://docs.example.com/quickstart',
  pageTitle: 'Quick Start',
  summary: 'Get started quickly with our platform',
  sections: [
    {
      title: 'Installation',
      content: 'Install the tool using npm: npm install -g example-tool',
      searchKeywords: ['install', 'setup', 'npm'],
      aliases: ['Setup', 'Getting Started'],
      codeExamples: [
        {
          language: 'bash',
          code: 'npm install -g example-tool',
          description: 'Install globally',
          demonstrates: ['npm installation']
        }
      ],
      keyConcepts: ['npm', 'global installation'],
      warnings: [],
      bestPractices: [],
      relatedSections: []
    }
  ],
  prerequisites: ['Node.js'],
  useCases: ['First-time setup'],
  metadata: {
    extractedAt: '2025-01-01T00:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929'
  }
};

/**
 * Complex extraction with multiple sections and code examples
 */
export const complexExtraction: ClaudeDocOutput = {
  source: 'https://docs.example.com/hooks',
  pageTitle: 'Hooks Configuration Guide',
  summary: 'Configure hooks to run custom commands during development workflows',
  sections: [
    {
      title: 'Overview',
      content: 'Hooks allow you to run custom shell commands when certain events occur.',
      searchKeywords: ['hooks', 'automation', 'workflow'],
      aliases: ['Event Hooks'],
      codeExamples: [],
      keyConcepts: ['automation', 'event-driven'],
      warnings: ['Hooks run synchronously'],
      bestPractices: ['Keep hooks fast'],
      relatedSections: ['configuration']
    },
    {
      title: 'Configuration',
      content: 'Add hooks to your configuration file using JSON format',
      searchKeywords: ['config', 'setup'],
      aliases: ['Setup'],
      codeExamples: [
        {
          language: 'json',
          code: '{\n  "hooks": {\n    "pre-commit": "npm test"\n  }\n}',
          description: 'Example hook configuration',
          demonstrates: ['hook syntax']
        }
      ],
      keyConcepts: ['config.json'],
      warnings: [],
      bestPractices: [],
      relatedSections: []
    },
    {
      title: 'Available Hooks',
      content: 'Multiple hook types are available for different workflow stages',
      searchKeywords: ['hook types'],
      codeExamples: [
        {
          language: 'bash',
          code: '# Pre-commit hook\nnpm run lint && npm test',
          description: 'Run linting and tests',
          demonstrates: ['pre-commit usage']
        }
      ],
      keyConcepts: ['pre-commit', 'post-checkout'],
      relatedSections: ['configuration']
    }
  ],
  prerequisites: ['Git repository'],
  useCases: ['Running tests before commits'],
  metadata: {
    extractedAt: '2025-01-01T00:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929'
  }
};

/**
 * Minimal extraction (edge case: no summary, short content)
 */
export const minimalExtraction: ClaudeDocOutput = {
  source: 'https://docs.example.com/minimal',
  pageTitle: 'Minimal Page',
  summary: '', // Empty summary
  sections: [
    {
      title: 'Short',
      content: 'Too short', // < 100 chars - will be filtered
      codeExamples: []
    }
  ],
  metadata: {
    extractedAt: '2025-01-01T00:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929'
  }
};

/**
 * Extraction with short code examples (should filter < 50 chars)
 */
export const shortCodeExtraction: ClaudeDocOutput = {
  source: 'https://docs.example.com/short-code',
  pageTitle: 'Short Code Examples',
  summary: 'Examples with very brief code snippets',
  sections: [
    {
      title: 'Brief Examples',
      content:
        'This section contains very short code examples that should be filtered out based on length',
      codeExamples: [
        {
          language: 'bash',
          code: 'ls', // Too short - will be filtered
          description: 'List files'
        },
        {
          language: 'bash',
          code: 'npm install && npm test && npm run build && npm run deploy', // Long enough
          description: 'Full workflow',
          demonstrates: ['ci/cd pipeline']
        }
      ],
      keyConcepts: ['commands']
    }
  ],
  metadata: {
    extractedAt: '2025-01-01T00:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929'
  }
};

/**
 * Empty extraction (no sections, no summary)
 */
export const emptyExtraction: ClaudeDocOutput = {
  source: 'https://docs.example.com/empty',
  pageTitle: 'Empty Page',
  summary: '',
  sections: [],
  metadata: {
    extractedAt: '2025-01-01T00:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929'
  }
};

// ============================================================================
// Mock Qdrant Responses
// ============================================================================

export const mockQdrantCollection = {
  status: 'ok',
  result: {
    name: 'claude_code_docs_ollama',
    vectors: {
      size: 768,
      distance: 'Cosine'
    }
  }
};

export const mockQdrantUpsertResponse = {
  status: 'ok',
  result: {
    operation_id: 123,
    status: 'completed'
  }
};

// ============================================================================
// Mock Embeddings
// ============================================================================

/**
 * Generate mock embedding vector
 */
export function createMockEmbedding(dimensions: number = 768): number[] {
  return Array.from({ length: dimensions }, () => Math.random());
}

/**
 * Mock Ollama embedding (768D)
 */
export const mockOllamaEmbedding = createMockEmbedding(768);

/**
 * Mock OpenAI embedding (1536D)
 */
export const mockOpenAIEmbedding = createMockEmbedding(1536);
