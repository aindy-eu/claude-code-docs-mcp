/**
 * ExtractService Test Fixtures
 * Realistic extracted documentation JSON based on real Claude Code docs
 */

// ============================================================================
// Extracted Documentation Structures (Claude-driven extraction)
// ============================================================================

/**
 * Simple extracted document with minimal structure
 */
export const extractedSimple = {
  source: 'https://docs.example.com/quickstart',
  pageTitle: 'Quick Start Guide',
  summary: 'Get started with the platform quickly',
  sections: [
    {
      title: 'Installation',
      content: 'Install the tool using npm',
      confidence: 'explicit' as const,
      searchKeywords: ['install', 'setup', 'npm'],
      aliases: ['Setup', 'Getting Started'],
      codeExamples: [
        {
          language: 'shellscript',
          code: 'npm install -g example-tool',
          description: 'Install globally',
          demonstrates: ['npm installation'],
          context: 'Requires Node.js',
          variations: [],
          confidence: 'explicit' as const
        }
      ],
      keyConcepts: ['npm', 'global installation'],
      warnings: [],
      bestPractices: ['Use latest Node.js version'],
      antiPatterns: [],
      relatedSections: ['authentication'],
      implementation: {
        filePaths: [],
        precedenceRules: [],
        executionContext: 'Command line',
        errorHandling: 'not documented',
        confidence: 'explicit' as const,
        notes: []
      }
    }
  ],
  prerequisites: ['Node.js', 'npm'],
  useCases: ['First-time installation', 'Quick setup'],
  configuration: {
    allOptions: ['npm install', 'manual install'],
    defaults: ['npm install recommended'],
    constraints: ['Node.js 18+ required'],
    confidence: 'explicit' as const
  },
  troubleshooting: {
    commonIssues: ['Permission errors'],
    solutions: ['Use sudo on Unix systems']
  },
  metadata: {
    extractedAt: '2025-01-01T00:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929',
    completeness: 'high' as const,
    extractionStats: {
      totalSections: 1,
      totalExamples: 1,
      totalConcepts: 2,
      confidenceLevels: {
        explicit: 1,
        stronglyImplied: 0,
        inferred: 0
      }
    }
  }
};

/**
 * Complex extracted document (based on real quickstart.json structure)
 */
export const extractedComplex = {
  source: 'https://docs.example.com/hooks-guide',
  pageTitle: 'Hooks Configuration Guide',
  summary:
    'Comprehensive guide to configuring hooks for custom workflows, covering pre-commit, post-checkout, and other git hooks.',
  sections: [
    {
      title: 'What are Hooks',
      content: 'Hooks allow you to run custom commands when certain events occur.',
      confidence: 'explicit' as const,
      searchKeywords: ['hooks', 'automation', 'events', 'triggers'],
      aliases: ['Event hooks', 'Automation'],
      codeExamples: [],
      keyConcepts: ['automation', 'event-driven', 'custom commands'],
      warnings: [],
      bestPractices: [],
      antiPatterns: [],
      relatedSections: ['configuration', 'git-operations'],
      implementation: {
        filePaths: ['.claude/config.json'],
        precedenceRules: [],
        executionContext: 'Git repository',
        errorHandling: 'not documented',
        confidence: 'explicit' as const,
        notes: []
      }
    },
    {
      title: 'Configuration',
      content: 'Add hooks to your .claude/config.json file with hook name and command pairs.',
      confidence: 'explicit' as const,
      searchKeywords: ['config', 'setup', 'configuration', 'hooks'],
      aliases: ['Setup hooks', 'Hook configuration'],
      codeExamples: [
        {
          language: 'json',
          code: '{\n  "hooks": {\n    "pre-commit": "npm test",\n    "post-checkout": "npm install"\n  }\n}',
          description: 'Example hooks configuration',
          demonstrates: ['JSON configuration', 'multiple hooks'],
          context: 'In .claude/config.json file',
          variations: [],
          confidence: 'explicit' as const
        }
      ],
      keyConcepts: ['config.json', 'hook names', 'commands'],
      warnings: ['Hooks must be executable commands'],
      bestPractices: ['Test hooks locally before committing'],
      antiPatterns: ['Long-running hooks that block workflow'],
      relatedSections: ['available-hooks'],
      implementation: {
        filePaths: ['.claude/config.json'],
        precedenceRules: ['Hooks run in order defined'],
        executionContext: 'Project root directory',
        errorHandling: 'not documented',
        confidence: 'explicit' as const,
        notes: []
      }
    },
    {
      title: 'Available Hooks',
      content:
        'Multiple hook types available: pre-commit runs before commits, post-checkout runs after branch switching, pre-push runs before pushing.',
      confidence: 'explicit' as const,
      searchKeywords: ['hooks list', 'available hooks', 'hook types'],
      aliases: ['Hook types', 'Hook list'],
      codeExamples: [
        {
          language: 'text',
          code: 'pre-commit: Runs before creating a commit',
          description: 'Pre-commit hook description',
          demonstrates: ['hook timing', 'use case'],
          context: 'Git workflow',
          variations: ['post-commit', 'pre-push', 'post-checkout'],
          confidence: 'explicit' as const
        }
      ],
      keyConcepts: ['pre-commit', 'post-checkout', 'pre-push', 'git hooks'],
      warnings: [],
      bestPractices: ['Use pre-commit for linting and tests'],
      antiPatterns: [],
      relatedSections: ['configuration', 'git-operations'],
      implementation: {
        filePaths: [],
        precedenceRules: [],
        executionContext: 'Git operations',
        errorHandling: 'not documented',
        confidence: 'explicit' as const,
        notes: []
      }
    }
  ],
  prerequisites: ['Git repository', 'Claude Code installed'],
  useCases: [
    'Running tests before commits',
    'Installing dependencies after checkout',
    'Validating code before push'
  ],
  configuration: {
    allOptions: ['pre-commit', 'post-checkout', 'pre-push', 'post-commit'],
    defaults: ['No hooks configured by default'],
    constraints: ['Hooks must be shell commands', 'Hooks run in project directory'],
    confidence: 'explicit' as const
  },
  troubleshooting: {
    commonIssues: ['Hook not running', 'Command not found', 'Permission denied'],
    solutions: [
      'Check hook name spelling',
      'Verify command is in PATH',
      'Make scripts executable with chmod +x'
    ]
  },
  metadata: {
    extractedAt: '2025-01-01T12:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929',
    completeness: 'high' as const,
    extractionStats: {
      totalSections: 3,
      totalExamples: 2,
      totalConcepts: 15,
      confidenceLevels: {
        explicit: 3,
        stronglyImplied: 0,
        inferred: 0
      }
    }
  }
};

/**
 * Minimal extracted document
 */
export const extractedMinimal = {
  source: 'https://docs.example.com/minimal',
  pageTitle: 'Minimal Example',
  summary: 'A minimal documentation page',
  sections: [],
  prerequisites: [],
  useCases: [],
  configuration: {
    allOptions: [],
    defaults: [],
    constraints: [],
    confidence: 'explicit' as const
  },
  troubleshooting: {
    commonIssues: [],
    solutions: []
  },
  metadata: {
    extractedAt: '2025-01-01T00:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929',
    completeness: 'low' as const,
    extractionStats: {
      totalSections: 0,
      totalExamples: 0,
      totalConcepts: 0,
      confidenceLevels: {
        explicit: 0,
        stronglyImplied: 0,
        inferred: 0
      }
    }
  }
};

/**
 * Document with many code examples (testing code-heavy docs)
 */
export const extractedCodeHeavy = {
  source: 'https://docs.example.com/api-reference',
  pageTitle: 'API Reference',
  summary: 'Complete API reference with code examples',
  sections: [
    {
      title: 'Authentication',
      content: 'API authentication using tokens',
      confidence: 'explicit' as const,
      searchKeywords: ['auth', 'token', 'api key'],
      aliases: ['Auth'],
      codeExamples: [
        {
          language: 'javascript',
          code: 'const api = new API({ token: "your-token" });',
          description: 'Initialize API client',
          demonstrates: ['authentication'],
          context: 'JavaScript/Node.js',
          variations: [],
          confidence: 'explicit' as const
        },
        {
          language: 'python',
          code: 'api = API(token="your-token")',
          description: 'Initialize API client in Python',
          demonstrates: ['authentication'],
          context: 'Python',
          variations: [],
          confidence: 'explicit' as const
        },
        {
          language: 'bash',
          code: 'curl -H "Authorization: Bearer your-token" https://api.example.com',
          description: 'Authenticate with curl',
          demonstrates: ['authentication', 'curl usage'],
          context: 'Command line',
          variations: [],
          confidence: 'explicit' as const
        }
      ],
      keyConcepts: ['API token', 'authentication', 'authorization'],
      warnings: ['Never commit tokens to version control'],
      bestPractices: ['Store tokens in environment variables'],
      antiPatterns: ['Hardcoding tokens in source code'],
      relatedSections: ['security'],
      implementation: {
        filePaths: [],
        precedenceRules: [],
        executionContext: 'API client initialization',
        errorHandling: 'not documented',
        confidence: 'explicit' as const,
        notes: []
      }
    }
  ],
  prerequisites: ['API token'],
  useCases: ['API authentication', 'Secure API access'],
  configuration: {
    allOptions: ['Token-based auth'],
    defaults: ['Token required'],
    constraints: ['Valid token required'],
    confidence: 'explicit' as const
  },
  troubleshooting: {
    commonIssues: ['Invalid token', '401 Unauthorized'],
    solutions: ['Verify token is correct', 'Check token expiration']
  },
  metadata: {
    extractedAt: '2025-01-01T00:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929',
    completeness: 'high' as const,
    extractionStats: {
      totalSections: 1,
      totalExamples: 3,
      totalConcepts: 3,
      confidenceLevels: {
        explicit: 1,
        stronglyImplied: 0,
        inferred: 0
      }
    }
  }
};

// ============================================================================
// URL → Filename Mapping Test Cases
// ============================================================================

export const urlFilenameMappings = {
  simple: {
    url: 'https://docs.example.com/quickstart',
    expectedFilename: 'quickstart.json'
  },
  nested: {
    url: 'https://docs.example.com/docs/guides/hooks',
    expectedFilename: 'hooks.json' // Last segment
  },
  withTrailingSlash: {
    url: 'https://docs.example.com/quickstart/',
    expectedFilename: 'quickstart.json'
  },
  root: {
    url: 'https://docs.example.com/',
    expectedFilename: 'index.json'
  },
  specialChars: {
    url: 'https://docs.example.com/my-doc@2024!',
    expectedFilename: 'my-doc_2024_.json' // Sanitized
  },
  multipleSpecialChars: {
    url: 'https://docs.example.com/api#v2.0',
    expectedFilename: 'api_v2_0.json'
  },
  numbersAndDashes: {
    url: 'https://docs.example.com/version-2-0',
    expectedFilename: 'version-2-0.json'
  }
};

// ============================================================================
// Edge Cases
// ============================================================================

export const edgeCases = {
  emptyJson: {},

  invalidJson: '{not valid json',

  hugeDocument: {
    source: 'https://docs.example.com/huge',
    pageTitle: 'Huge Documentation',
    summary: 'A very large document',
    sections: Array.from({ length: 100 }, (_, i) => ({
      title: `Section ${i}`,
      content: `Content for section ${i}`.repeat(10),
      confidence: 'explicit' as const,
      searchKeywords: [`keyword${i}`],
      aliases: [],
      codeExamples: [],
      keyConcepts: [],
      warnings: [],
      bestPractices: [],
      antiPatterns: [],
      relatedSections: [],
      implementation: {
        filePaths: [],
        precedenceRules: [],
        executionContext: '',
        errorHandling: 'not documented',
        confidence: 'explicit' as const,
        notes: []
      }
    })),
    prerequisites: [],
    useCases: [],
    configuration: {
      allOptions: [],
      defaults: [],
      constraints: [],
      confidence: 'explicit' as const
    },
    troubleshooting: {
      commonIssues: [],
      solutions: []
    },
    metadata: {
      extractedAt: '2025-01-01T00:00:00Z',
      modelUsed: 'claude-sonnet-4-5-20250929',
      completeness: 'high' as const,
      extractionStats: {
        totalSections: 100,
        totalExamples: 0,
        totalConcepts: 0,
        confidenceLevels: {
          explicit: 100,
          stronglyImplied: 0,
          inferred: 0
        }
      }
    }
  },

  malformedStructure: {
    source: 'https://docs.example.com/malformed',
    // Missing required fields like pageTitle, summary, etc.
    sections: [{ title: 'Test' }]
  },

  unicodeContent: {
    source: 'https://docs.example.com/unicode',
    pageTitle: 'Unicode Test 你好 🎉',
    summary: 'Testing unicode: ñ é å 中文 日本語',
    sections: [
      {
        title: 'Emoji Examples 🚀',
        content: 'Content with emojis ✅ ❌ 💡',
        confidence: 'explicit' as const,
        searchKeywords: ['unicode', 'emoji'],
        aliases: [],
        codeExamples: [
          {
            language: 'text',
            code: 'console.log("Hello 世界");',
            description: 'Unicode in code',
            demonstrates: ['unicode'],
            context: '',
            variations: [],
            confidence: 'explicit' as const
          }
        ],
        keyConcepts: [],
        warnings: [],
        bestPractices: [],
        antiPatterns: [],
        relatedSections: [],
        implementation: {
          filePaths: [],
          precedenceRules: [],
          executionContext: '',
          errorHandling: 'not documented',
          confidence: 'explicit' as const,
          notes: []
        }
      }
    ],
    prerequisites: [],
    useCases: [],
    configuration: {
      allOptions: [],
      defaults: [],
      constraints: [],
      confidence: 'explicit' as const
    },
    troubleshooting: {
      commonIssues: [],
      solutions: []
    },
    metadata: {
      extractedAt: '2025-01-01T00:00:00Z',
      modelUsed: 'claude-sonnet-4-5-20250929',
      completeness: 'high' as const,
      extractionStats: {
        totalSections: 1,
        totalExamples: 1,
        totalConcepts: 0,
        confidenceLevels: {
          explicit: 1,
          stronglyImplied: 0,
          inferred: 0
        }
      }
    }
  }
};

// ============================================================================
// Test Scenarios
// ============================================================================

export const testScenarios = {
  roundtrip: {
    description: 'Save and retrieve should be identical',
    data: extractedSimple
  },

  formatting: {
    description: 'JSON should be formatted with 2-space indentation',
    data: extractedMinimal
  },

  complexStructure: {
    description: 'Should preserve deep nested structures',
    data: extractedComplex
  },

  manyCodeExamples: {
    description: 'Should handle documents with many code examples',
    data: extractedCodeHeavy
  }
};
