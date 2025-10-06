---
description: Verify ALL documentation files against codebase individually
allowed-tools: Read, Bash, Glob, Grep, Write, Task, Edit, TodoWrite
---

Verify every documentation file in the project against the actual codebase.

## 🎯 Purpose

Apply code-truth verification to EVERY documentation file, creating individual verification reports for each.

## Process Overview

1. **Find all documentation files** (.md, README, etc.)
2. **For each file**, verify against codebase
3. **Create individual report** for each doc file
4. **Update the docs** with corrections
5. **Generate summary** of all verifications

## Step 1: Discovery

Find all documentation files:

```bash
find . -name "*.md" -o -name "README*" -o -name "CHANGELOG*" -o -name "CONTRIBUTING*"
find ./docs -type f 2>/dev/null
```

## Step 2: Individual Verification

For EACH documentation file found:

### Create Output Structure

```
/analysis/docs/
├── README.md.verification.md
├── docs-setup.md.verification.md
├── docs-api.md.verification.md
├── docs-architecture.md.verification.md
└── VERIFICATION-SUMMARY.md
```

### For Each Document File

1. **Read and analyze the documentation file**
2. **Create todo list** for verification tasks from this file
3. **Use Task agents** for parallel verification when 5+ claims
4. **Check for**:
   - Version numbers (compare with dependency files found in project)
   - Features claimed (find in code)
   - Configuration examples (test if they work)
   - Code examples (verify they exist/compile)
   - Setup instructions (check if commands work)
   - API endpoints (verify in routes/urls)
   - Dependencies (check if actually used)

### Verification Report Template

For each file, create `/analysis/docs/[filename].verification.md`:

```markdown
# Verification Report: [filename]

File: [path/to/file.md]
Last Modified: [date]
Verification Date: [today]
Verifier: Code-truth analysis

## Accuracy Score: X%

## Summary

- Total Claims: X
- Verified: Y (Z%)
- Failed: A (B%)
- Unverifiable: C (D%)

## Detailed Verification

### ✅ VERIFIED (Accurate)

| Line | Claim                | Evidence                | Status |
| ---- | -------------------- | ----------------------- | ------ |
| 45   | "Uses PostgreSQL"    | Found in config file:89 | ✅     |
| 67   | "Uses X for testing" | Found in dependencies   | ✅     |

### ❌ FAILED (Inaccurate)

| Line | Claim                | Reality                 | Action Needed |
| ---- | -------------------- | ----------------------- | ------------- |
| 23   | "Runtime X required" | Actually uses Runtime Y | Remove claim  |
| 89   | "86% coverage"       | Actual: 32%             | Update number |

### ⚠️ OUTDATED

| Line | Claim            | Current State        | Update         |
| ---- | ---------------- | -------------------- | -------------- |
| 12   | "Framework v4.2" | Using Framework v5.1 | Update version |

### 🆕 MISSING (Found in Code, Not in Doc)

| Feature     | Location    | Should Document     |
| ----------- | ----------- | ------------------- |
| Batch API   | /api/batch/ | Yes - Add section   |
| Admin panel | /admin/     | Yes - Security info |

## Corrections Applied

✅ **Updated in file**:

- Line 23: Removed Node.js requirement
- Line 89: Updated coverage to 32%
- Line 12: Updated Django version to 5.1
- Added section for Batch API at line 145

❌ **Could not auto-fix** (manual review needed):

- Complex architecture diagram outdated
- Example code needs rewriting

## Verification Timestamp

Last verified: [date/time]
Next verification recommended: [in 30 days]
```

## Step 3: Apply Updates

For each verification report:

1. **Auto-fix simple issues**:

   - Version numbers
   - Metrics/percentages
   - Boolean claims (exists/doesn't exist)

2. **Flag complex issues** for manual review:
   - Architecture descriptions
   - Code examples
   - Conceptual explanations

### Update Pattern

```
# Original line in doc
"This project uses Framework 4.2"  # Line 45

# After verification
"This project uses Framework 5.1"  # Line 45
# Last verified: 2024-12-20
```

## Step 4: Parallel Processing Strategy

When you have many files (5+), use Task agents:

```yaml
Agent 1: Verify README.md and main docs
Agent 2: Verify all docs/guides/*.md
Agent 3: Verify all docs/api/*.md
Agent 4: Verify setup and installation docs
Agent 5: Verify architecture and design docs
```

Each agent follows the same process:

1. Read assigned doc file
2. Extract claims
3. Verify against code
4. Generate report
5. Update the file

## Step 5: Generate Summary

Create `/analysis/docs/VERIFICATION-SUMMARY.md`:

```markdown
# Documentation Verification Summary

Generated: [date]
Total Files Verified: X
Overall Accuracy: Y%

## Files by Accuracy

### 🟢 High Accuracy (>80%)

| File        | Accuracy | Issues  | Status  |
| ----------- | -------- | ------- | ------- |
| docs/api.md | 92%      | 2 minor | Updated |

### 🟡 Medium Accuracy (50-80%)

| File      | Accuracy | Issues  | Status  |
| --------- | -------- | ------- | ------- |
| README.md | 67%      | 5 major | Updated |

### 🔴 Low Accuracy (<50%)

| File          | Accuracy | Issues   | Status        |
| ------------- | -------- | -------- | ------------- |
| docs/setup.md | 34%      | 15 major | Needs rewrite |

## Common Issues Found

1. **Outdated versions** (found in 8 files)

   - Framework: 4.2 → 5.1
   - Runtime: 3.8 → 3.11

2. **Missing features** (found in 5 files)

   - Batch processing not documented
   - Admin panel not mentioned

3. **Wrong instructions** (found in 3 files)
   - Setup commands incorrect
   - Config examples broken

## Recommendations

### Immediate Actions

1. Review and merge auto-updates
2. Rewrite setup.md (34% accuracy)
3. Add missing feature documentation

### Process Improvements

1. Add CI check for doc accuracy
2. Require doc updates with code changes
3. Monthly verification runs

## Verification Log

| File          | Last Verified | Next Check |
| ------------- | ------------- | ---------- |
| README.md     | 2024-12-20    | 2025-01-20 |
| docs/setup.md | 2024-12-20    | 2024-12-27 |

[... all files ...]
```

## Success Criteria

Your verification succeeds when:

- Every .md file has been verified
- Every claim has been checked against code
- All auto-fixable issues are corrected
- Each file has a verification timestamp
- Summary report shows overall health

## Focus Points

- **Code is truth**: If code says X, doc must say X
- **Be concise**: Don't add verbose explanations
- **Auto-fix when possible**: Simple factual corrections
- **Flag complexity**: Mark what needs human review
- **Maintain readability**: Don't break doc flow with verification notes

## Output

All verification reports in: `/analysis/docs/`

- Individual reports: `[filename].verification.md`
- Summary report: `VERIFICATION-SUMMARY.md`
- Updated docs: In place with verification timestamps

This gives you the complete truth about EVERY documentation file's accuracy.
