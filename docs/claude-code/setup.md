# Claude Code Setup & Configuration

Complete guide to integrating MCP servers with Claude Code, covering settings, permissions, and development workflows.

## 🎯 Overview

Claude Code uses a hierarchical settings system with powerful permission controls. Understanding this system is crucial for productive development and secure deployment.

## 📁 Settings File Hierarchy

Claude Code uses multiple settings files with a clear precedence order:

```
Priority (highest to lowest):
1. Enterprise policies
2. Command line arguments  
3. Local project settings (.claude/settings.local.json)
4. Shared project settings (.claude/settings.json)
5. User settings (~/.claude/settings.json)
```

### Settings File Locations

```
# User-level (applies to all projects)
~/.claude/settings.json

# Project-level (shared with team)
project/.claude/settings.json

# Project-level (personal, git-ignored)  
project/.claude/settings.local.json
```

## ⚙️ Settings Configuration

### Project Structure

```
your-project/
├── .claude/
│   ├── settings.json        # Shared team settings
│   └── settings.local.json  # Personal settings (git-ignored)
├── .gitignore               # Include Claude Code ignores
└── package.json
```

### Shared Settings (.claude/settings.json)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(npm install:*)",
      "Bash(npm test:*)",
      "Bash(git status:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git diff:*)",
      "WebFetch(domain:docs.anthropic.com)",
      "WebFetch(domain:github.com)"
    ],
    "deny": [
      "Bash(sudo:*)",
      "Bash(su:*)",
      "Bash(rm:*)"
    ]
  },
  "hooks": {
    "pre-commit": "npm test"
  }
}
```

### Personal Settings (.claude/settings.local.json)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run build:*)",
      "Bash(npx tsc:*)",
      "Bash(chmod:*)",
      "Bash(mkdir:*)",
      "Bash(mv:*)",
      "Bash(cp:*)",
      "WebFetch(domain:localhost:*)",
      "WebFetch(domain:127.0.0.1:*)"
    ]
  },
  "memory": {
    "enabled": true,
    "path": ".claude/memory"
  }
}
```

## 🔐 Permission Management

### Permission Syntax

```json
{
  "permissions": {
    "allow": [
      "Bash(command:*)",           // Allow all variations of command
      "Bash(npm run test:unit)",   // Specific command only
      "WebFetch(domain:api.com)",  // Allow specific domain
      "Read(path:/safe/path/*)",   // Allow reading from safe path
      "Write(path:/app/logs/*)"    // Allow writing to logs
    ],
    "deny": [
      "Bash(rm:*)",               // Block all rm commands
      "Bash(sudo:*)",             // Block all sudo commands
      "WebFetch(*)"               // Block all web requests (overridden by allow)
    ]
  }
}
```

### Common Permission Patterns

#### Development Environment

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(npm install:*)",
      "Bash(npm test:*)",
      "Bash(npx:*)",
      "Bash(node:*)",
      "Bash(git status:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git branch:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(mkdir:*)",
      "Bash(mv:*)",
      "Bash(cp:*)",
      "WebFetch(domain:docs.anthropic.com)",
      "WebFetch(domain:github.com)",
      "WebFetch(domain:npmjs.com)"
    ],
    "deny": [
      "Bash(sudo:*)",
      "Bash(su:*)",
      "Bash(chmod +x:*)",
      "Bash(rm:*)",
      "Bash(format:*)",
      "Bash(fdisk:*)"
    ]
  }
}
```

#### Production Environment

```json
{
  "permissions": {
    "allow": [
      "Bash(docker:*)",
      "Bash(kubectl:*)",
      "Bash(git status:*)",
      "Bash(git log:*)",
      "Read(path:/app/logs/*)",
      "WebFetch(domain:monitoring.internal)"
    ],
    "deny": [
      "Bash(sudo:*)",
      "Bash(rm:*)",
      "Write(path:/etc/*)",
      "Write(path:/root/*)"
    ]
  }
}
```

### Interactive Permission Requests

When Claude Code encounters a blocked command, it will prompt for permission:

```
⚠️  Command requires permission: rm file.txt

This command is currently blocked by your permissions.
Would you like to:
1. Allow this command once
2. Add to allowed permissions  
3. Cancel command

Choice: 1
```

## 🔧 Git Integration

### Essential .gitignore Patterns

```gitignore
# Claude Code - Personal Settings
.claude/settings.local.json
.claude/memory/
.claude/cache/
.claude/*.log
CLAUDE.local.md
.claude/**/local.md

# Claude Code - Optional (team preference)
.claude/settings.json     # Only if you want to share settings
```

### Recommended Git Setup

```bash
# Add Claude Code patterns to global gitignore
echo ".claude/settings.local.json" >> ~/.gitignore_global
echo ".claude/memory/" >> ~/.gitignore_global
echo ".claude/cache/" >> ~/.gitignore_global

# Configure global gitignore
git config --global core.excludesfile ~/.gitignore_global
```

## 🪝 Hooks Configuration

### Common Hook Patterns

```json
{
  "hooks": {
    "pre-commit": "npm run lint && npm test",
    "post-commit": "echo 'Commit successful!'",
    "file-change": "npm run build",
    "directory-enter": "npm install"
  }
}
```

### Hook Best Practices

1. **Keep hooks fast** - Avoid long-running operations
2. **Make hooks idempotent** - Safe to run multiple times  
3. **Handle failures gracefully** - Don't break user workflow
4. **Use conditional logic** - Check if actions are needed

Example conditional hook:

```json
{
  "hooks": {
    "pre-commit": "if [ -f package-lock.json ]; then npm ci; fi && npm test"
  }
}
```

## 🐛 Debugging & Development

### MCP Inspector Integration

```json
{
  "tools": {
    "mcp-inspector": {
      "command": "npx @modelcontextprotocol/inspector",
      "args": ["node", "build/index.js"]
    }
  }
}
```

### Debug Commands

```bash
# Debug MCP server
npm run debug

# Check Claude Code settings
claude settings

# Validate permissions
claude permissions check

# Test MCP connection
claude --mcp-server ./build/index.js "test command"
```

### Logging Configuration

```json
{
  "logging": {
    "level": "debug",
    "file": ".claude/debug.log",
    "console": true
  },
  "mcp": {
    "timeout": 30000,
    "retries": 3
  }
}
```

## 🔍 Common Configuration Issues

### Issue: Permission Denied
```
Error: Command 'npm test' requires permission
```

**Solution**: Add to allowed permissions:
```json
{
  "permissions": {
    "allow": ["Bash(npm test:*)"]
  }
}
```

### Issue: Settings Not Loading
```
Warning: No settings file found
```

**Solution**: Create settings file:
```bash
mkdir -p .claude
echo '{"permissions": {"allow": []}}' > .claude/settings.local.json
```

### Issue: Hook Failures
```
Error: Hook 'pre-commit' failed with exit code 1
```

**Solution**: Check hook command and add error handling:
```json
{
  "hooks": {
    "pre-commit": "npm test || echo 'Tests failed but continuing'"
  }
}
```

## 📖 Advanced Configuration

### Environment-Specific Settings

```json
{
  "environments": {
    "development": {
      "permissions": {
        "allow": ["Bash(*)", "WebFetch(*)"]
      }
    },
    "production": {
      "permissions": {
        "allow": ["Bash(docker:*)", "Read(path:/app/*)"]
      }
    }
  }
}
```

### Conditional Permissions

```json
{
  "permissions": {
    "allow": [
      {
        "pattern": "Bash(git:*)",
        "condition": "file_exists('.git')"
      },
      {
        "pattern": "Bash(npm:*)", 
        "condition": "file_exists('package.json')"
      }
    ]
  }
}
```

## 🚀 Best Practices

### 1. Security First
- Start with minimal permissions
- Use deny lists for dangerous commands
- Regularly audit permission changes
- Never commit API keys or secrets to settings

### 2. Team Collaboration
- Share basic permissions in `.claude/settings.json`
- Keep personal preferences in `.claude/settings.local.json`
- Document permission changes in commit messages
- Use consistent permission patterns across projects

### 3. Development Workflow
- Set up hooks for common tasks (testing, linting)
- Use descriptive hook names and commands
- Test hooks before committing them
- Provide fallback commands for hook failures

### 4. Performance
- Avoid expensive operations in hooks
- Cache permission checks when possible
- Use specific permission patterns vs wildcards
- Monitor hook execution times

## 📚 Related Documentation

- [MCP Integration Patterns](./mcp-integration.md)
- [Debugging Guide](./debugging.md)
- [Security Best Practices](../deployment/security.md)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)

---

## ✅ Quick Checklist

- [ ] Create `.claude/` directory structure
- [ ] Configure appropriate permissions for your project
- [ ] Add Claude Code patterns to `.gitignore`
- [ ] Set up useful hooks for your workflow  
- [ ] Test MCP server integration
- [ ] Document team-specific permission requirements
- [ ] Set up debugging and logging

*This configuration provides a solid foundation for productive Claude Code development while maintaining security and team collaboration.*