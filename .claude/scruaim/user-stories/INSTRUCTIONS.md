---
token_estimate: 2914
updated_at: '2025-10-06 08:59:43'
---
# Claude Code Documentation MCP - Development Instructions

## Your Role

You are implementing features for an **MCP (Model Context Protocol) server** that uses Claude's AI to intelligently understand and search documentation. This project proves that AI understanding surpasses traditional parsing for documentation extraction.

**Core innovation**: Claude reads docs naturally (not mechanical parsing) → extracts rich metadata → enables semantic search across ANY documentation source.

---

## Core Competencies

### Tech Stack Discovery (Run These First)

```bash
# What config/dependency files exist?
find . -maxdepth 2 -type f \( -name "package*.json" -o -name "tsconfig*.json" -o -name "*.config.*" \) 2>/dev/null

# What's the actual project structure?
ls -la src/
find src -type d -maxdepth 2 | head -20

# What testing setup exists?
ls -la *.config.* | grep -i test
npm run | grep test

# What's actually imported?
grep -h "^import" src/**/*.ts | head -30
```

**Key principle**: ONLY analyze what actually exists. Don't assume structure - verify with bash commands.

### Current Architecture (Verify Before Assuming)

```bash
# Service-oriented architecture?
ls src/services/ 2>/dev/null

# CLI commands?
ls src/cli/ 2>/dev/null

# MCP tools?
ls src/mcp-tools/ 2>/dev/null

# Manifest system?
find .data -name "manifest.json" 2>/dev/null

# What embedding providers?
grep -r "ollama\|openai" src --include="*.ts" | head -5
```

**Stack patterns** (verify these exist):
- TypeScript with ES modules (`.js` imports)
- Node.js MCP server (@modelcontextprotocol/sdk)
- Qdrant vector database
- Ollama (local) + OpenAI (cloud) embeddings
- Service-oriented pipeline architecture

---

## Acceptance Criteria Best Practices

### Format: Measurable Outcomes

```markdown
## Acceptance Criteria

- [ ] [Specific action] produces [measurable result]
- [ ] Works with [constraint 1] AND [constraint 2]
- [ ] [Metric] ≥ [threshold] (e.g., extraction accuracy ≥90%)
- [ ] No regression in [existing functionality]
```

**Good examples**:
- ✅ "Cross-source search returns results from BOTH Claude and React"
- ✅ "Works with BOTH Ollama and OpenAI providers"
- ✅ "Extraction quality verified ≥90% match to source"

**Bad examples**:
- ❌ "Search works well"
- ❌ "Improves performance"
- ❌ "User can search"

### Tiered Success (When Scope is Flexible)

Use tiers when story can ship incrementally:

```markdown
**Minimal (MVP)**:
- [ ] Core functionality works
- [ ] Unblocks dependent stories
- [ ] No breaking changes

**Full Success**:
- [ ] All edge cases handled
- [ ] Batch/automation tooling added
- [ ] Documentation updated
- [ ] Performance optimized
```

**When to use tiers**:
```bash
# Is full scope uncertain?
grep -r "optional\|nice-to-have\|future" backlog/backlog.md

# Can we ship in phases?
echo "MVP = unblock next story, Full = polish"
```

**When NOT to use**:
- Critical bugs (no "minimal" for broken functionality)
- Simple features (tiers add unnecessary complexity)

### Questions/Blockers Section

```markdown
## Questions/Blockers

- **Q**: [Unknown about implementation]
  - **A**: [Decision made] OR [Defer to US-XXX-future-story]

- **Blocker**: [Dependency not ready]
  - **Resolution**: [How to unblock] OR [Wait for US-XXX]

- **Decision**: [Choice made during planning]
  - **Rationale**: [Why this approach over alternatives]
```

**Purpose**:
- Documents decision rationale (prevents "why did we do this?" later)
- Prevents scope creep (explicit "defer" decisions)
- Tracks blockers for visibility

**Example**:
```markdown
## Questions/Blockers

- **Q**: Should we version-track React docs (18.x vs 17.x)?
  - **A**: Defer to US-VERSION-001 (future story)

- **Decision**: Create react-docs.prompt.md (not framework-docs)
  - **Rationale**: 2+ Rule - only 1 framework doc exists (avoid premature abstraction)
```

---

## Pre-Flight Checklist (MANDATORY)

Before implementing ANY user story:

```bash
# 1. Does this feature already exist?
grep -r "feature_keyword" src/ --include="*.ts"
find src -name "*similar*" -type f

# 2. Is there a service for this domain?
ls src/services/ | grep -i "related"
ls src/cli/commands/ | grep -i "command"

# 3. What's the actual file structure?
ls src/services/
ls src/mcp-tools/
ls src/utils/

# 4. What patterns exist?
grep -n "export class" src/services/*.ts
grep -n "export async function" src/mcp-tools/*.ts
grep -n "export interface" src/types/*.ts

# 5. What's in the manifest?
cat .data/manifest.json 2>/dev/null | head -20
find .data -type d -maxdepth 2
```

**Ask yourself**:
- [ ] Would an MCP server project already have this?
- [ ] Am I reinventing services/utils that exist?
- [ ] Does this work with BOTH Ollama and OpenAI?
- [ ] Does this respect the manifest tracking system?
- [ ] Would a senior TypeScript/MCP developer approve this?

---

## Devil's Advocate Mindset

Review every story as if you've maintained this MCP server for years:

- **"What if this already exists under a different name?"**
  ```bash
  grep -r "ingest\|fetch\|extract" src/
  find src -name "*similar*" -type f
  ```

- **"What if there's an MCP SDK feature I'm not aware of?"**
  ```bash
  ls node_modules/@modelcontextprotocol/sdk/
  cat node_modules/@modelcontextprotocol/sdk/README.md
  ```

- **"What if the pipeline already handles this?"**
  ```bash
  # Review pipeline stages
  ls src/services/fetch* src/services/extract* src/services/embed*
  grep -rn "pipeline\|stage" src/
  ```

- **"What if this is premature abstraction?"** (See: The 2+ Rule below)
  ```bash
  # How many instances exist NOW?
  grep -r "similar_pattern" src/ | wc -l
  # If answer is 1, don't extract yet
  ```

- **"What if the external URL doesn't work as assumed?"**
  ```bash
  # Verify URL before coding
  curl -I https://example.com/path 2>/dev/null | head -5
  curl -s https://site.com/robots.txt | grep -i "disallow"
  ```

**The mindset**: Assume sophistication, not simplicity. This is a production-ready MCP server with 81% test coverage and 375 tests.

---

## Critical Architecture Patterns

### 1. Service-Oriented Pipeline

```bash
# Verify pipeline services exist:
ls src/services/fetch* src/services/extract* src/services/embed* 2>/dev/null
```

**Pattern**: Each pipeline stage is a service
- `FetchService`: Downloads documentation
- `ExtractService`: Claude reads & extracts
- `EmbedService`: Generates embeddings
- `QdrantService`: Stores vectors
- `ManifestService`: Tracks ingestion state

**Rule**: Don't bypass services - they contain the business logic.

### 2. Domain-Agnostic Design

```bash
# Check if domain extraction exists:
grep -n "domain" src/services/fetch* src/services/manifest*
```

**Pattern**: URL → extract domain → namespace isolation
- No hardcoded domains (works with docs.claude.com, react.dev, etc.)
- Each domain gets `.data/{domain}/` directory
- Master manifest tracks all sources

**Rule**: Never hardcode `docs.claude.com` - design for ANY documentation.

### 3. Dual Embedding Providers

```bash
# Verify provider support:
grep -r "EMBEDDING_PROVIDER\|ollama\|openai" src --include="*.ts"
```

**Pattern**: Hybrid embedding system
- Ollama (default): Local, privacy-first
- OpenAI: Cloud, when specified
- Separate Qdrant collections per provider

**Rule**: EVERY feature must work with BOTH providers.

### 4. Manifest Tracking System

```bash
# Check manifest structure:
cat .data/manifest.json
ls .data/*/manifest.json
```

**Pattern**: Two-tier manifest
- Master manifest: `.data/manifest.json` (all sources)
- Domain manifests: `.data/{domain}/manifest.json` (per-source URLs)
- TTL-based updates (7-day default)
- Content-hash optimization (skip unchanged)

**Rule**: Never re-process without checking manifest first.

### 5. TypeScript ES Module Pattern

```bash
# Verify import pattern:
grep "from.*\.js" src/**/*.ts | head -10
```

**Pattern**: Always use `.js` extension in imports
```typescript
import { logger } from '../utils/logger.js';  // ✅
import { logger } from '../utils/logger';     // ❌
```

**Rule**: TypeScript compiles to JS, imports must use `.js` even in `.ts` files.

---

## Red Flags to Catch

### Architecture Violations
- ❌ Bypassing services (direct DB access, manual file writes)
- ❌ Hardcoding domains (not `docs.claude.com`, use domain extraction)
- ❌ Single provider support (must work with Ollama AND OpenAI)
- ❌ Skipping manifest tracking (re-processing unchanged content)
- ❌ Mechanical parsing (not "Claude reads naturally" philosophy)

### Code Patterns
- ❌ Missing `.js` extension in imports
- ❌ Creating new parsers (Claude should extract, not regex)
- ❌ Synchronous heavy operations (use async/await)
- ❌ No error handling (use try-catch, log with logger)
- ❌ Missing tests (every service needs tests)

### Multi-Source Violations
- ❌ Assuming single documentation source
- ❌ No domain isolation in storage
- ❌ Hardcoded prompt templates
- ❌ Missing source metadata

### Premature Abstraction (Critical!)
- ❌ Creating templates/helpers for "future use" (only 1 instance)
- ❌ "We might need this later" (YAGNI - You Aren't Gonna Need It)
- ❌ Extracting patterns before 2nd use case appears
- ❌ Building flexibility without concrete requirements

---

## The 2+ Rule (Premature Abstraction Check)

**Principle**: Don't extract patterns until you have 2+ instances that need them.

### When to Create Abstraction

✅ **Extract pattern when**:
```bash
# Check: How many instances exist NOW?
grep -r "pattern_usage" src/ | wc -l
# If ≥2, extract to shared utility/template
```

✅ **Criteria**:
- 2nd use case **exists** (not "might exist")
- Pattern is **identical** across instances
- Duplication is **actual pain** (not theoretical)

❌ **Don't extract when**:
```bash
# Check: How many instances exist?
grep -r "pattern_usage" src/ | wc -l
# If 1, keep inline. Extract when 2nd appears.
```

❌ **Anti-patterns**:
- "We'll need this for Next.js later" (future speculation)
- "For flexibility" (no concrete requirement)
- "To make it reusable" (reused by whom? when?)

### Example: Template Creation

**Story proposes**: "Create `framework-docs.prompt.md` for React, Next.js, Vue"

**Reality check**:
```bash
# How many framework docs exist NOW?
ls .data/ | grep -v "claude\|anthropic" | wc -l
# Answer: 0 (only have Claude docs)

# Is Next.js/Vue confirmed in backlog?
grep -r "nextjs\|vue" .claude/scruaim/backlog/backlog.md
# Answer: No committed work
```

**Verdict**:
- ✅ Create `react-docs.prompt.md` (1st instance, inline)
- ❌ Don't create `framework-docs.prompt.md` (no 2nd instance yet)
- ⏳ When Next.js appears, **then** extract common pattern

**Why**: Code speaks truth. If only 1 instance exists, abstraction is speculation.

---

## Implementation Workflow

### Pre-Implementation (5-10 min)

```bash
# 1. Verify feature doesn't exist
grep -r "feature_name" src/ --include="*.ts"

# 2. Find similar implementations (for estimation)
git log --all --grep="similar_feature" --oneline
git diff <commit>^ <commit> --stat  # How big was similar work?

# 3. Check existing patterns
ls src/services/ src/cli/ src/mcp-tools/
grep -n "export class\|export function" src/services/*.ts

# 4. Verify dependencies
cat package.json | grep "dependency_name"

# 5. External URL verification (if applicable)
curl -I https://external-url.com/path 2>/dev/null | head -5
curl -s https://site.com/robots.txt | grep -i "disallow"

# 6. Abstraction check (2+ Rule)
grep -r "pattern_to_extract" src/ | wc -l  # Must be ≥2 to extract

# 7. Check test patterns
find src -name "*.test.ts" | head -5
cat src/services/example.test.ts  # Review test structure
```

### During Implementation
- [ ] Follow existing service patterns (check similar services)
- [ ] Use logger for all errors/info (not console.log)
- [ ] Support both Ollama and OpenAI
- [ ] Add manifest tracking if processing documents
- [ ] Write tests alongside implementation
- [ ] Use `.js` extension in all imports

### Batch/Future Planning Consideration

**When to plan for batch operations**:
```bash
# Will this be repeated?
grep -r "seed\|batch" src/cli/commands/
echo "How many times will we run this manually?"

# Is there a pattern here?
ls .data/ | wc -l  # How many sources will we have?
```

**Include batch tooling when**:
- Feature will be repeated 3+ times
- Documentation source has 5+ pages
- Manual repetition is error-prone or time-consuming

**Defer batch tooling when**:
- Testing single instance first (MVP approach)
- Unsure if pattern will repeat
- Premature optimization (wait for pain point)

**Example**:
```markdown
## Future: Batch Ingestion (defer to next story)

Once React MVP proven, create seed function:
- npm run cli -- seed --source react
- Ingests 5-7 core React pages automatically
- Tracked in US-MULTI-003
```

**Why defer**: Validate single-page extraction first, then automate.

### Post-Implementation

```bash
# 1. Quality checks (MANDATORY - must pass before marking done)
npm run lint          # ESLint + Prettier
npm run build         # TypeScript compilation
npm run test          # Full test suite (375 tests)

# 2. Test impact analysis
npm run test -- --coverage  # Check coverage delta
grep -r "changed_file" src/**/*.test.ts  # What tests reference this?

# 3. Manual testing
npm run cli:command -- --args    # Test CLI
npm run search "query"            # Test search

# 4. Verify multi-provider (if applicable)
npm run command -- --provider ollama   # Default
npm run command -- --provider openai   # Alternative

# 5. Integration verification
npm run sync         # Does sync still work?
npm run search "test"  # Does search still work?
```

---

## Common Patterns (Verify These Exist)

### Service Class Pattern
```bash
# Find actual examples:
grep -A 10 "export class.*Service" src/services/*.ts | head -30
```

Expected pattern (verify in code):
```typescript
export class FeatureService {
  constructor(private config: Config) {}

  async execute(params: Params): Promise<Result> {
    try {
      // Implementation
    } catch (error) {
      logger.error('Feature failed:', error);
      throw error;
    }
  }
}
```

### CLI Command Pattern
```bash
# Find actual examples:
ls src/cli/commands/
cat src/cli/commands/example.ts | head -50
```

### MCP Tool Pattern
```bash
# Find actual examples:
ls src/mcp-tools/
cat src/mcp-tools/search.ts | head -50
```

---

## Testing Reality Check

```bash
# What test setup actually exists?
ls *.config.* | grep -i test
cat package.json | grep -A 5 "test"

# How many tests?
find src -name "*.test.ts" | wc -l
grep -r "describe\|test\|it(" src --include="*.test.ts" | wc -l

# Coverage?
npm run test:coverage 2>/dev/null || echo "Check package.json for coverage command"
```

**Current reality** (verify these numbers):
- Test framework: Check actual config (Vitest? Jest?)
- Coverage target: Check CI/CD config
- Test patterns: Read existing `.test.ts` files

**Don't assume** - run the commands above first.

---

## User Story Verification Protocol

### 1. Quick Reality Check (30 seconds)
```bash
# Story mentions files/components - do they exist?
ls src/services/mentioned-service.ts 2>/dev/null || echo "MISSING"
grep -r "MentionedClass" src/

# Story mentions patterns - are they real?
grep -n "pattern_keyword" src/**/*.ts
```

### 2. Pattern Alignment Check (2 min)
```bash
# Does the approach match existing code?
find src -name "*similar-feature*"
grep -r "similar_pattern" src/ | head -10

# Are dependencies available?
cat package.json | grep "mentioned_package"
```

### 3. Estimation Reality Check
```bash
# Find similar completed work
git log --all --grep="similar_story" --oneline | head -5

# How big was that change?
git show <commit> --stat

# How long ago? (proxy for effort)
git log --all --grep="similar" --format="%ar" | head -1
```

**Estimation rules**:
- Base on **actual similar work**, not optimism
- If no similar work exists, double your estimate
- Add 30% buffer for unknowns
- Don't estimate <1h (underestimates never happen)

### 4. External Dependency Check (if applicable)
```bash
# If story uses external URLs
curl -I https://mentioned-url.com/path 2>/dev/null | grep "HTTP"

# Check robots.txt
curl -s https://site.com/robots.txt | grep -i "disallow\|crawl-delay"

# Verify URL structure matches assumptions
curl -s https://site.com/path | grep -o "<title>.*</title>"
```

### 5. The 2+ Rule Check
```bash
# If story proposes abstraction/template
grep -r "proposed_pattern" src/ | wc -l

# Result interpretation:
# 0 instances: ❌ Pure speculation, reject abstraction
# 1 instance:  ⚠️ Keep inline, extract when 2nd appears
# 2+ instances: ✅ Extract to shared pattern
```

### 6. Verification Questions
- Are file paths correct? (verified with `ls`)
- Do services exist? (verified with `grep`)
- Do patterns match codebase? (compared with existing)
- Are dependencies installed? (checked `package.json`)
- Is complexity appropriate? (compared to similar features)
- Is estimation realistic? (based on git history)
- Is abstraction premature? (checked 2+ Rule)
- Do external URLs work? (verified with curl)

### 7. The Senior Dev Test

**"Would a senior MCP/TypeScript developer who's maintained this project for years approve this story?"**

Consider:
- Does every file path exist?
- Are patterns verified from real code?
- Would implementation fit naturally?
- Is it aligned with the "Claude reads naturally" philosophy?
- Is estimation based on actual history (not guessing)?
- Does it avoid premature abstraction?

**If uncertain** → Research more with grep/find
**If conflicts with code** → Code is truth, update story
**If aligned** → Proceed with confidence

---

## The Ultimate Test

Before marking ANY task complete:

**"Would this PR be approved by someone who designed the MCP specification and understands vector search architecture?"**

Consider:
- Does it follow service-oriented patterns?
- Does it work with multiple documentation sources?
- Does it support both embedding providers?
- Does it use manifest tracking properly?
- Are there comprehensive tests?
- Does it preserve the "AI understanding" philosophy?

---

## Remember

1. **Code is truth** - Verify everything with bash commands, don't assume
2. **Patterns over reinvention** - Copy existing patterns, don't create new ones
3. **The 2+ Rule** - Don't extract until 2nd instance exists (YAGNI)
4. **Multi-source by design** - Never hardcode single domain
5. **Test alongside code** - Not after, alongside
6. **Claude reads naturally** - Don't build parsers, let Claude understand
7. **Both providers always** - Ollama AND OpenAI, no exceptions
8. **Estimation from history** - Base on actual similar work, not optimism
9. **External URLs verified** - curl first, code second

---

## Quick Reference Card

### Before Writing ANY Story
```bash
# Does it exist?
grep -r "feature" src/

# Similar work?
git log --grep="similar"

# Abstraction needed?
grep -r "pattern" src/ | wc -l  # Must be ≥2

# External URL valid?
curl -I https://url.com/path
```

### Red Flags Checklist
- [ ] Premature abstraction (only 1 instance)
- [ ] Unverified external URLs
- [ ] Estimates not based on git history
- [ ] Missing test impact analysis
- [ ] Skipping 2+ Rule check
- [ ] Assuming file paths exist
- [ ] Bypassing service layer
- [ ] Single provider support

### Green Flags Checklist
- [x] bash commands verify assumptions
- [x] Patterns copied from existing code
- [x] 2+ instances justify extraction
- [x] External URLs tested with curl
- [x] Estimates based on git log
- [x] Test suite runs clean
- [x] Works with both providers
- [x] Follows "Claude reads naturally" philosophy

---

*Last principle: If you're unsure, grep the codebase. The answer is already there.*
