# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Claude Code Documentation MCP Server seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Note: This project is not actively maintained.**

For security issues, please open a [GitHub Security Advisory](https://github.com/aindy-eu/claude-code-docs-mcp/security/advisories/new) instead of a public issue.

We'll respond if/when available, but consider forking if you need urgent fixes.

### What to Include

Please include the following information in your report:

- **Description**: Clear description of the vulnerability
- **Impact**: What an attacker could accomplish
- **Reproduction**: Step-by-step instructions to reproduce
- **Affected versions**: Which versions are affected
- **Mitigation**: Any workarounds you've identified (if applicable)

### Response Process

1. **Acknowledgment**: We'll acknowledge receipt within 48 hours
2. **Assessment**: We'll assess the vulnerability and determine severity
3. **Fix Development**: We'll develop a fix (keeping you updated)
4. **Release**: We'll release the fix and credit you (if desired)
5. **Disclosure**: We'll publish a security advisory

### What to Expect

- We'll work with you to understand and resolve the issue quickly
- We'll keep you informed of our progress
- We'll credit you in the security advisory (unless you prefer to remain anonymous)
- We'll not take legal action against security researchers who follow this policy

## Security Considerations

### Current Security Measures

**Code Security**:
- ✅ Uses `spawn()` not `exec()` for subprocess execution (prevents command injection)
- ✅ Environment variables for secrets (no hardcoded API keys)
- ✅ URL validation via native `URL()` constructor
- ✅ Path sanitization for file operations
- ✅ No `eval()` or dynamic code execution
- ✅ File operations scoped to `.data/` directory

**Dependency Security**:
- Regular dependency updates
- Dependencies regularly audited with `npm audit` (currently 0 vulnerabilities)

**Data Security**:
- Local-first architecture (Ollama provider)
- Optional cloud embeddings (OpenAI)
- No data transmission except to chosen embedding provider
- Qdrant database runs locally by default

### Known Limitations

**Not Implemented**:
- Rate limiting on API calls
- Input size validation
- Authentication/authorization (local tool, single user assumed)
- Encrypted storage (data stored in plain text in `.data/`)

### Best Practices for Users

**When Using This Tool**:

1. **API Keys**: Never commit `.env` files or API keys to version control
2. **Local Services**: Run Qdrant and Ollama on localhost (don't expose to internet)
3. **Network Security**: If running remotely, use VPN/SSH tunneling
4. **Data Privacy**:
   - Use Ollama provider for sensitive documentation (stays local)
   - OpenAI provider sends content to OpenAI's servers
5. **File Permissions**: Ensure `.data/` directory has appropriate permissions

**Environment Variables**:
```bash
# Good: Use environment variables
OPENAI_API_KEY=sk-...

# Bad: Hardcode in code
const apiKey = "sk-..."  // Never do this
```

**Qdrant Security**:
```bash
# Good: Localhost only
docker run -p 127.0.0.1:6333:6333 qdrant/qdrant

# Risky: Exposed to network
docker run -p 6333:6333 qdrant/qdrant
```

### Dependencies

We use automated tools to monitor dependencies:

- `npm audit` - Check for known vulnerabilities
- Dependabot (if using GitHub) - Automated dependency updates

Run `npm audit` regularly to check for vulnerabilities:

```bash
npm audit
# If vulnerabilities found:
npm audit fix
```

## Disclosure Policy

- Security issues are disclosed publicly only after a fix is available
- We aim for a 90-day disclosure timeline
- Critical vulnerabilities may have expedited disclosure
- We'll publish security advisories for all confirmed vulnerabilities

## Security Updates

Stay informed about security updates:

- Watch this repository for security advisories
- Check `CHANGELOG.md` for security-related releases (marked with 🔒)
- Subscribe to GitHub security alerts

## Questions?

For security-related questions that aren't vulnerabilities, please open a GitHub Discussion or contact the maintainers.

---

**Thank you for helping keep Claude Code Documentation MCP Server secure!**
