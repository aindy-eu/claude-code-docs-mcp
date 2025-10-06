/**
 * FetchService Test Fixtures
 * Realistic HTML samples for testing fetch, cache, and comparison logic
 */

// ============================================================================
// HTML Samples - Various Types
// ============================================================================

export const htmlSamples = {
  /**
   * Minimal valid HTML
   */
  minimal: '<html><head><title>Test</title></head><body><p>Content</p></body></html>',

  /**
   * Simple documentation page
   */
  simple: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quick Start Guide</title>
</head>
<body>
  <h1>Quick Start</h1>
  <p>Install Claude Code globally using npm.</p>
  <pre><code>npm install -g @anthropic-ai/claude-code</code></pre>
</body>
</html>`,

  /**
   * Body-only content (what gets saved to cache after extraction)
   */
  simpleBody: `<h1>Quick Start</h1>
  <p>Install Claude Code globally using npm.</p>
  <pre><code>npm install -g @anthropic-ai/claude-code</code></pre>`,

  /**
   * HTML with scripts (should be removed during normalization)
   */
  withScript: `<html>
<head>
  <title>Page with Scripts</title>
  <script>
    console.log("Analytics");
    window.dataLayer = window.dataLayer || [];
  </script>
</head>
<body>
  <h1>Documentation</h1>
  <p>Important content here.</p>
  <script src="tracking.js"></script>
  <script>
    // Inline script
    trackPageView();
  </script>
</body>
</html>`,

  /**
   * HTML with comments (should be removed)
   */
  withComments: `<html>
<body>
  <!-- Navigation menu -->
  <nav>
    <!-- TODO: Add breadcrumbs -->
    <a href="/">Home</a>
  </nav>
  <!-- Main content -->
  <main>
    <h1>Title</h1>
    <p>Content</p>
  </main>
  <!-- Footer -->
</body>
</html>`,

  /**
   * HTML with inline styles (should be removed)
   */
  withStyles: `<html>
<head>
  <style>
    body { background: #fff; }
    .container { max-width: 1200px; }
  </style>
</head>
<body>
  <div style="color: blue;">
    <h1>Styled Content</h1>
  </div>
</body>
</html>`,

  /**
   * HTML with timestamp attributes (should be removed)
   */
  withTimestamps: `<html>
<body timestamp="2025-01-01T00:00:00Z" updated="2025-01-15" lastmod="2025-01-20">
  <article timestamp="2025-01-01">
    <h1>Article Title</h1>
    <p>Content that matters.</p>
  </article>
</body>
</html>`,

  /**
   * HTML with varying whitespace (should be normalized)
   */
  withWhitespace: `<html>
  <body>
    <h1>Title</h1>


    <p>Paragraph   with     extra    spaces</p>

    <ul>
      <li>Item 1</li>

      <li>Item 2</li>
    </ul>
  </body>
</html>`,

  /**
   * Real-world documentation HTML with everything
   */
  realWorld: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Code Documentation</title>
  <style>
    .docs { max-width: 800px; margin: 0 auto; }
    .code-block { background: #f5f5f5; padding: 1rem; }
  </style>
  <script>
    // Analytics
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});})(window,document,'script','dataLayer','GTM-XXXXX');
  </script>
</head>
<body timestamp="2025-01-01T12:00:00Z" updated="2025-01-15">
  <!-- Header -->
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/docs">Docs</a>
    </nav>
  </header>

  <!-- Main content -->
  <main class="docs">
    <h1>Getting Started with Claude Code</h1>

    <section>
      <h2>Installation</h2>
      <p>Install Claude Code globally using npm:</p>
      <pre><code>npm install -g @anthropic-ai/claude-code</code></pre>
    </section>

    <section>
      <h2>Basic Usage</h2>
      <p>Navigate to your project directory and run:</p>
      <pre><code>claude</code></pre>
      <p>You'll be prompted to log in on first use.</p>
    </section>

    <!-- TODO: Add troubleshooting section -->
  </main>

  <!-- Footer -->
  <footer timestamp="2025-01-01">
    <p>&copy; 2025 Anthropic</p>
  </footer>

  <script src="https://cdn.example.com/analytics.js"></script>
  <script>
    trackPageView('/docs/quickstart');
  </script>
</body>
</html>`,

  /**
   * Claude Code documentation snippet (realistic)
   */
  claudeCodeDocs: `<html>
<head>
  <title>Hooks - Claude Code</title>
</head>
<body>
  <h1>Hooks</h1>
  <p>Hooks allow you to run custom commands when certain events occur in Claude Code.</p>

  <h2>Configuration</h2>
  <p>Add hooks to your <code>.claude/config.json</code> file:</p>
  <pre><code>{
  "hooks": {
    "pre-commit": "npm test",
    "post-checkout": "npm install"
  }
}</code></pre>

  <h2>Available Hooks</h2>
  <ul>
    <li><strong>pre-commit</strong>: Runs before creating a commit</li>
    <li><strong>post-checkout</strong>: Runs after switching branches</li>
    <li><strong>pre-push</strong>: Runs before pushing to remote</li>
  </ul>
</body>
</html>`
};

// ============================================================================
// Expected Normalized Output (after removing scripts/comments/styles/whitespace)
// ============================================================================

export const expectedNormalized = {
  minimal: 'html head title Test /title /head body p Content /p /body /html',

  simple:
    'html lang="en" head meta charset="UTF-8" title Quick Start Guide /title /head body h1 Quick Start /h1 p Install Claude Code globally using npm. /p pre code npm install -g @anthropic-ai/claude-code /code /pre /body /html',

  withScript:
    'html head title Page with Scripts /title /head body h1 Documentation /h1 p Important content here. /p /body /html',

  withComments:
    'html body nav a href="/" Home /a /nav main h1 Title /h1 p Content /p /main /body /html',

  withTimestamps:
    'html body article h1 Article Title /h1 p Content that matters. /p /article /body /html'
};

// ============================================================================
// Content Comparison Scenarios
// ============================================================================

/**
 * Two HTML documents with identical normalized content
 * (different scripts, timestamps, but same meaningful content)
 */
export const identicalContent = {
  version1: `<html>
<head><script>var x = 1;</script></head>
<body timestamp="2025-01-01">
  <h1>Title</h1>
  <p>Content</p>
</body>
</html>`,

  version2: `<html>
<head><script>var x = 999;</script></head>
<body timestamp="2025-12-31">
  <h1>Title</h1>
  <p>Content</p>
</body>
</html>`,

  // Body-only (after extraction)
  bodyContent: `<h1>Title</h1>
  <p>Content</p>`
};

/**
 * Two HTML documents with different meaningful content
 */
export const differentContent = {
  original: `<html><body>
<h1>Original Title</h1>
<p>Original content here.</p>
</body></html>`,

  updated: `<html><body>
<h1>Updated Title</h1>
<p>Updated content here with more information.</p>
<p>Additional paragraph added.</p>
</body></html>`,

  // Body-only versions
  originalBody: `<h1>Original Title</h1>
<p>Original content here.</p>`,

  updatedBody: `<h1>Updated Title</h1>
<p>Updated content here with more information.</p>
<p>Additional paragraph added.</p>`
};

// ============================================================================
// Cache Metadata Fixtures
// ============================================================================

export const cacheMetadata = {
  basic: {
    url: 'https://docs.claude.ai/quickstart',
    cachedAt: '2025-01-01T12:00:00Z',
    size: 4567,
    contentHash: 'abc123def456',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  },

  withRedirect: {
    url: 'https://docs.claude.ai/en/docs/quickstart',
    cachedAt: '2025-01-01T12:00:00Z',
    size: 8901,
    contentHash: 'def456ghi789',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      location: 'https://docs.claude.ai/en/docs/claude-code/quickstart'
    }
  }
};

// ============================================================================
// URL → Path Mapping Test Cases
// ============================================================================

export const urlPathMappings = {
  simple: {
    url: 'https://docs.claude.ai/quickstart',
    expectedPath: 'quickstart/'
  },

  nested: {
    url: 'https://docs.claude.ai/en/docs/claude-code/quickstart',
    expectedPath: 'en/docs/claude-code/quickstart/'
  },

  rootUrl: {
    url: 'https://docs.claude.ai/',
    expectedPath: '' // Root path
  },

  withQuery: {
    url: 'https://docs.claude.ai/search?q=hooks',
    expectedPath: 'search/' // Query params not included in path
  },

  /**
   * Long path that exceeds 255 chars (should be truncated with hash)
   */
  longPath: {
    url:
      'https://example.com/' +
      'a/'.repeat(130) + // 260 chars
      'page.html',
    expectedPathPattern: /^a\/a\/.*-[a-f0-9]{8}\/$/ // Truncated with hash
  },

  /**
   * Invalid URL (should use fallback hash-based path)
   */
  invalidUrl: {
    url: 'not-a-valid-url',
    expectedPathPattern: /^_invalid\/[a-f0-9]{16}\/$/ // Hash-based fallback
  }
};

// ============================================================================
// Fetch Results
// ============================================================================

export const fetchResults = {
  success: {
    html: htmlSamples.simple,
    finalUrl: 'https://docs.claude.ai/quickstart',
    skipPipeline: false
  },

  successWithRedirect: {
    html: htmlSamples.realWorld,
    finalUrl: 'https://docs.claude.ai/en/docs/quickstart', // After redirect
    skipPipeline: false
  },

  unchangedContent: {
    html: htmlSamples.simple,
    finalUrl: 'https://docs.claude.ai/quickstart',
    skipPipeline: true, // Content hash matched
    comparison: {
      hasChanged: false,
      contentHash: 'abc123',
      previousHash: 'abc123',
      comparedAt: '2025-01-01T12:00:00Z',
      changePercentage: 0
    }
  },

  changedContent: {
    html: differentContent.updated,
    finalUrl: 'https://docs.claude.ai/quickstart',
    skipPipeline: false,
    comparison: {
      hasChanged: true,
      contentHash: 'def456',
      previousHash: 'abc123',
      comparedAt: '2025-01-01T12:00:00Z',
      changePercentage: 25.5
    }
  }
};

// ============================================================================
// Edge Cases
// ============================================================================

export const edgeCases = {
  emptyHtml: '',

  onlyWhitespace: '   \n\n\t\t   \n   ',

  malformedHtml: '<html><body><p>Unclosed paragraph<div>Mixed tags</body>',

  hugeHtml: '<html><body>' + '<p>Content</p>'.repeat(10000) + '</body></html>',

  nonUtf8: Buffer.from([0xff, 0xfe, 0xfd]), // Invalid UTF-8 bytes

  scriptOnly: '<script>alert("XSS")</script>', // Should normalize to empty

  commentsOnly: '<!-- Just comments --><!-- More comments -->' // Should normalize to empty
};
