---
description: Verify documentation against actual codebase implementation
allowed-tools: Read, Task, Grep, Glob, Edit, TodoWrite
argument-hint: <doc-file.md> [--report-only]
model: claude-opus-4-1
---

Verify if the documentation file $ARGUMENTS is accurate against the actual codebase:

**CRITICAL: SCOPE BOUNDARIES**
- ONLY verify claims made in the specified documentation file
- DO NOT expand scope to verify entire subsystems unless explicitly claimed in the file
- If the file links to other docs, verify the links exist but DO NOT verify those files' contents
- If the file mentions a feature, verify that specific claim only

**Mode Detection**: If `--report-only` flag is present, only show findings without updating documentation.

1. Read and analyze ONLY the specified documentation file
2. Create a todo list for claims to verify from THIS file only
3. For each claim in the file:
   - Test commands/examples exactly as shown
   - Verify referenced files/links exist
   - Check version numbers and configurations
   - Confirm feature claims against code
4. Check for:
   - Outdated version numbers
   - Missing features that exist in code
   - Documented features that don't exist
   - Incorrect configuration examples
   - Deprecated patterns still documented
   - Broken links or missing referenced files
5. If `--report-only` flag is NOT present:
   - Update the documentation with corrections
   - Add a verification timestamp at the end
6. If `--report-only` flag IS present:
   - Generate detailed findings report
   - DO NOT modify the documentation file
   - Report findings with line numbers and suggested corrections

Focus on:

- Code is truth, documentation is claims
- ONLY verify what THIS file claims, not related systems
- Test actual commands/examples in the file
- Be concise with updates
- Report percentage accuracy at the end
