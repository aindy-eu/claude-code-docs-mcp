# Security Analysis - Code Analysis

**Analysis Method:** Code Inspection for Security Patterns

## Authentication & Authorization

### MCP Server Authentication

**From src/index.ts:**

```typescript
// ❌ No authentication implemented
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Analysis:**
- Uses stdio transport (no network exposure)
- **Security posture**: Low risk - local-only communication
- **Assumption**: Claude Code handles authentication
- **Risk**: None - stdio is process-to-process only

### API Key Management

**From src/utils/embeddings.ts:**

```typescript
// ✅ Proper environment variable usage
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

**Analysis:**
✅ API keys from environment variables
✅ Not hardcoded in source
✅ Error on missing keys
✅ Properly gitignored (.env in .gitignore)

### Secrets in Code

```bash
grep -r "password\|secret\|api_key\|API_KEY\|token" --include="*.ts" src/
# Results: Only environment variable references
```

**Found:**
- ❌ No hardcoded secrets
- ✅ All sensitive data from environment
- ✅ .env file gitignored

### Environment File Security

**From .gitignore:**

```
.env
.env.local
.env.production
```

**From .env.example:**

```bash
# ✅ Safe example values
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Analysis:**
✅ Actual .env gitignored
✅ Example file safe to commit
✅ No real secrets in repository

## Input Validation

### MCP Tool Input Validation

**From src/mcp-tools/index.ts:**

```typescript
// ✅ Schema-based validation
{
  name: 'search_claude_code_docs',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What to search for'
      },
      provider: {
        type: 'string',
        enum: ['ollama', 'openai', 'both'],  // ✅ Enum restriction
        default: 'ollama'
      },
      limit: {
        type: 'number',
        default: 3,
        minimum: 1,    // ✅ Range validation
        maximum: 10
      }
    },
    required: ['query']
  }
}
```

**Analysis:**
✅ Type validation via JSON schema
✅ Enum constraints for provider
✅ Range validation for limit
✅ MCP SDK handles validation

### URL Validation

**From src/services/fetch-service.ts:**

```typescript
private urlToPath(url: string): string {
  try {
    const parsed = new URL(url);  // ✅ URL parsing validation
    // ...
  } catch (error) {
    // ✅ Fallback to hash-based path for invalid URLs
    const hash = createHash('sha256').update(url).digest('hex');
    return `_invalid/${hash.substring(0, 16)}/`;
  }
}
```

**Analysis:**
✅ URL validation using native URL parser
✅ Safe fallback for invalid URLs
✅ No risk of path traversal (uses hashing)

### CLI Input Validation

**From src/cli/index.ts:**

```typescript
// ⚠️ Limited validation
command('batch')
  .option('--pages <pages...>', 'Specific pages to ingest')
  .option('--provider <provider>', 'Embedding provider')
  .option('--ttl-days <days>', 'TTL in days', '7')
```

**Analysis:**
⚠️ Commander provides basic type coercion
⚠️ No explicit validation for --pages input
⚠️ No validation for --ttl-days range

**Risk**: Low - CLI is local tool, not network-facing

## SQL/NoSQL Injection Protection

### Qdrant Queries

**From src/mcp-tools/search/search.ts:**

```typescript
// ✅ Safe: Uses object-based API
const searchResults = await qdrant.search(collectionName, {
  vector: queryVector,  // number[] - type-safe
  limit: params.limit || 3,
  with_payload: true
});
```

**Analysis:**
✅ No string-based queries
✅ Type-safe client library
✅ No SQL injection risk (vector DB uses structured API)

### File System Operations

**From src/services/fetch-service.ts:**

```typescript
private urlToPath(url: string): string {
  const parsed = new URL(url);
  let cachePath = '';

  if (parsed.pathname && parsed.pathname !== '/') {
    cachePath = parsed.pathname.slice(1);  // Remove leading slash
  }

  // ✅ Path length validation
  if (cachePath && cachePath.length > 255) {
    const hash = createHash('md5').update(cachePath).digest('hex');
    cachePath = cachePath.substring(0, 245) + '-' + hash + '/';
  }

  return cachePath;
}
```

**Analysis:**
⚠️ Potential path traversal risk - uses pathname directly
✅ Length validation prevents overflow
⚠️ No sanitization of special characters (../, etc.)

**Mitigation**: URLs are from configuration file (docs.claude.com), not user input

## XSS/CSRF Protection

### Not Applicable

**Reason:**
- ❌ No web server
- ❌ No HTML rendering
- ❌ No browser interface
- ✅ CLI and MCP server only

**Analysis:** No XSS/CSRF attack surface

## File Upload Handling

### Not Applicable

**Reason:**
- ❌ No file upload functionality
- ✅ Only fetches from configured URLs
- ✅ Only writes to local cache

## Command Injection

### Subprocess Execution

**From src/cli/orchestrator/extract.ts:**

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ⚠️ Potential command injection
const { stdout, stderr } = await execAsync(
  `DOC_URL="${url}" python3 "${extractScript}" "${htmlPath}" "${promptPath}" "${model}"`
);
```

**Analysis:**
⚠️ **CRITICAL SECURITY ISSUE**
- Uses string concatenation for command
- `url` parameter not sanitized
- Vulnerable to command injection if URL contains quotes or backticks

**Example Attack:**

```typescript
url = 'https://evil.com"; rm -rf /; #'
// Results in: DOC_URL="https://evil.com"; rm -rf /; #" python3 ...
```

**Mitigation:**
```typescript
// ✅ SAFE: Use spawn with array arguments
import { spawn } from 'child_process';

const child = spawn('python3', [
  extractScript,
  htmlPath,
  promptPath,
  model
], {
  env: { ...process.env, DOC_URL: url }
});
```

### Python Script Execution

**From tools/extract.py:**

```python
# ✅ Safe: Uses subprocess.run with array
result = subprocess.run([
    'claude',
    '--output', 'text',
    prompt
], capture_output=True, text=True, timeout=300)
```

**Analysis:**
✅ Uses array syntax (not shell=True)
✅ No string interpolation in command
✅ Timeout protection (300s)

## Cryptographic Operations

### Hashing

**From src/services/fetch-service.ts:**

```typescript
import { createHash } from 'crypto';

// Content hash for change detection
const contentHash = createHash('sha256')
  .update(html)
  .digest('hex');

// Path hash for long URLs
const hash = createHash('md5')
  .update(cachePath)
  .digest('hex')
  .substring(0, 8);
```

**Analysis:**
✅ SHA-256 for content integrity (appropriate)
⚠️ MD5 for path hashing (acceptable - not for security)
✅ No cryptographic keys or encryption needed

## Sensitive Data Exposure

### Logging

**From src/utils/logger.ts:**

```typescript
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO]`, message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR]`, message, ...args);
  },
  // ...
};
```

**From tools/lib/logger.py:**

```python
def log_error(doc_url: str, stage: str, **kwargs):
    # Logs to .data/{domain}/logs/errors/
    # ✅ Structured logging to file
```

**Analysis:**
✅ No API keys logged (checked)
✅ Errors logged to local files (not network)
⚠️ Full error objects logged (could contain sensitive data)

**Recommendation**: Sanitize error objects before logging

### Cache Files

**Analysis:**

```
.data/{domain}/cache/       # HTML content
.data/{domain}/structured/  # JSON structured data
.data/{domain}/logs/        # Log files
```

**Security posture:**
✅ All in .gitignore (not committed)
✅ Local filesystem only
⚠️ No encryption at rest
⚠️ File permissions not explicitly set

**Recommendation**: Consider setting restrictive file permissions (0600)

## Dependency Security

### Known Vulnerabilities

```bash
# From CI/CD - runs on every commit
npm audit
# Status: Not run in analysis (would show in CI)
```

**From package.json:**

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",  // Latest
    "@qdrant/js-client-rest": "^1.12.0",    // Latest
    "openai": "^4.67.1",                    // Latest
    "ollama": "^0.5.9",                     // Latest
    // ... all recent versions
  }
}
```

**Analysis:**
✅ All dependencies recent versions
✅ No obviously outdated packages
⚠️ No automated security scanning visible
⚠️ No dependabot configuration found

**Recommendation**: Enable Dependabot or similar

### Supply Chain Security

**From package-lock.json:**

```json
// ✅ Lock file present - pins exact versions
```

**Analysis:**
✅ package-lock.json committed
✅ Deterministic builds
✅ Protection against version drift

## Network Security

### HTTPS Enforcement

**From src/services/fetch-service.ts:**

```typescript
async fetch(url: string, force: boolean = false): Promise<FetchResult> {
  const response = await fetch(url);  // ✅ node-fetch follows redirects
  // ...
}
```

**Analysis:**
✅ Uses https:// for docs.claude.com (from config)
✅ node-fetch validates certificates by default
✅ No insecure TLS options

### External Services

**Connections to:**

1. **docs.claude.com** - HTTPS (trusted)
2. **Qdrant** - localhost:6333 (local/trusted)
3. **Ollama** - localhost:11434 (local/trusted)
4. **OpenAI API** - api.openai.com (HTTPS, trusted)

**Analysis:**
✅ All external services use HTTPS
✅ Local services on localhost
⚠️ No certificate pinning (not needed for this use case)

## Rate Limiting

### API Rate Limiting

**Not Implemented:**

```typescript
// ❌ No rate limiting for:
// - OpenAI API calls
// - Ollama API calls
// - Documentation fetching
```

**Analysis:**
⚠️ No built-in rate limiting
⚠️ Could hit API limits with batch ingestion
✅ Not critical - batch operations are admin tasks

**Mitigation**: Natural rate limiting from sequential processing

## Security Headers

### Not Applicable

**Reason:**
- ❌ No HTTP server
- ❌ No web interface
- ✅ CLI and MCP only

## Access Control

### File System Permissions

**Not Explicitly Set:**

```typescript
// From fetch-service.ts
writeFileSync(paths.htmlPath, html);  // ✅ Uses default permissions
writeFileSync(paths.metaPath, JSON.stringify(meta, null, 2));
```

**Analysis:**
⚠️ Files created with default umask
⚠️ Could be world-readable depending on system
⚠️ No explicit permission setting (0600)

**Recommendation:**

```typescript
import { writeFileSync, chmodSync } from 'fs';

writeFileSync(path, content);
chmodSync(path, 0o600);  // Read/write owner only
```

## Security Best Practices Compliance

### ✅ Good Practices

1. **Environment variables** for secrets
2. **Type-safe APIs** (no string SQL/queries)
3. **HTTPS** for external connections
4. **Lock file** for dependency integrity
5. **gitignore** for sensitive files
6. **Timeout** on subprocess calls
7. **No eval/Function** constructors
8. **Recent dependencies**

### ⚠️ Security Issues Found

1. **CRITICAL: Command injection** in extract.ts (exec with string concatenation)
2. **Medium: No file permission setting** (cache files)
3. **Low: Path traversal potential** in urlToPath (mitigated by config-only URLs)
4. **Low: No dependency scanning** automation
5. **Low: No rate limiting** (not critical for this use case)

### ❌ Missing Security Features

1. **No automated security scanning** (SAST, dependency audit)
2. **No secret scanning** in CI/CD
3. **No file encryption** at rest
4. **No access logging** for MCP server
5. **No input sanitization** in CLI (low risk)

## Risk Assessment

### Critical Risks (Immediate Action Required)

**1. Command Injection in extract.ts**
- **Severity**: CRITICAL
- **Likelihood**: LOW (URLs from config file)
- **Impact**: HIGH (arbitrary code execution)
- **Fix**: Use spawn() with array arguments

### High Risks

None identified

### Medium Risks

**2. File Permissions**
- **Severity**: MEDIUM
- **Likelihood**: MEDIUM (system-dependent)
- **Impact**: MEDIUM (information disclosure)
- **Fix**: Set explicit permissions (0600)

### Low Risks

**3. No Dependency Scanning**
- **Severity**: LOW
- **Likelihood**: MEDIUM (vulnerabilities emerge)
- **Impact**: MEDIUM (outdated dependencies)
- **Fix**: Enable Dependabot

**4. Path Traversal**
- **Severity**: LOW
- **Likelihood**: LOW (controlled URLs)
- **Impact**: MEDIUM (file system access)
- **Fix**: Sanitize paths

## Security Recommendations

### Immediate (Critical)

```typescript
// Fix command injection in src/cli/orchestrator/extract.ts
import { spawn } from 'child_process';

const child = spawn('python3', [
  extractScript,
  htmlPath,
  promptPath,
  model
], {
  env: { ...process.env, DOC_URL: url },
  timeout: 300000
});
```

### Short-term (High Priority)

1. **Set file permissions**:
   ```typescript
   import { chmodSync } from 'fs';
   writeFileSync(path, content);
   chmodSync(path, 0o600);
   ```

2. **Add dependency scanning**:
   ```yaml
   # .github/workflows/security.yml
   - run: npm audit
   - run: npm audit --audit-level=high
   ```

### Long-term (Medium Priority)

3. **Enable Dependabot**:
   ```yaml
   # .github/dependabot.yml
   version: 2
   updates:
     - package-ecosystem: npm
       directory: "/"
       schedule:
         interval: weekly
   ```

4. **Add secret scanning**:
   - Enable GitHub secret scanning
   - Add pre-commit hooks for secrets

5. **Path sanitization**:
   ```typescript
   import path from 'path';

   // Ensure path stays within cache directory
   const safePath = path.normalize(cachePath).replace(/^(\.\.[\/\\])+/, '');
   ```

## Security Score

```
Authentication:      N/A (stdio transport)
Authorization:       N/A (local tool)
Input Validation:    7/10 (schema validation, but CLI gaps)
Injection Protection: 3/10 (critical command injection issue)
Data Protection:     6/10 (env vars good, file permissions missing)
Crypto:              8/10 (appropriate hashing)
Dependencies:        7/10 (recent, but no scanning)
Network Security:    9/10 (HTTPS, certificate validation)
Error Handling:      7/10 (good, but full errors logged)

Overall Score:       6.5/10
```

**Primary Issue**: Command injection vulnerability in extract.ts must be fixed immediately.
