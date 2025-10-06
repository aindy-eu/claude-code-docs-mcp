# 💎 Hidden Gem: scruaim Framework in Action

## What is scruaim?

**scruaim = Scrum + AI**, a lightweight framework for managing development with AI assistance.

This project was built using scruaim. Every feature tracked as a user story, every implementation verified with bash commands, every lesson captured.

## Why It Matters

Traditional development: "Build this feature" → AI writes code → Hope it works.

**scruaim development**: Pre-flight verification → Story with acceptance criteria → Implementation → Quality gates → Lessons learned.

**The difference**: Code is verified before writing. Patterns discovered, not assumed. Progress tracked, not guessed.

## Real Example: Adding React Documentation

**Story**: [US-MULTI-001](../../.claude/scruaim/user-stories/draft/US-MULTI-001-react-docs-integration.md)

### Pre-Flight Verification (Before coding)
```bash
# Does multi-source infrastructure exist?
ls .data/
# Result: docs.claude.com/ manifest.json
# ✅ Multi-domain storage works

# 2+ Rule Check: Do we need framework template?
ls .data/ | grep -v "claude\|anthropic" | wc -l
# Result: 0 framework docs
# ❌ Only 1 instance (React), don't create framework-docs.prompt.md yet
```

**The 2+ Rule prevented premature abstraction** - create React-specific prompt first, extract to generic template when Next.js appears (2nd instance).

### Implementation Checklist
```bash
# Quality gates (from STORY-REVIEW.md)
npm run lint:fix    # Fix all linting
npm run build       # TypeScript compiles
npm run test:ci     # 375 tests pass

# Both providers work
npm run cli:ingest -- --provider ollama https://react.dev/learn
npm run cli:ingest -- --provider openai https://react.dev/learn
```

### Lessons Learned (Captured in story)
- Estimated: 4.5h → Actual: [to be filled]
- Pre-flight verification: Accurate? Missing checks?
- Technical approach: Worked as planned? Pivots needed?

**This becomes institutional knowledge** for the next similar story.

## The Framework in 3 Files

### 1. INSTRUCTIONS.md - Story Creation
- Pre-flight bash verification (no assumptions)
- The 2+ Rule (avoid premature abstraction)
- Story template with acceptance criteria
- Estimation from git history (not guessing)

### 2. README.md - Architecture Context
- 13 MCP-specific categories (INGEST, EMBED, SEARCH, MULTI, etc.)
- Service pipeline patterns (Fetch → Extract → Embed → Store → Track)
- Anti-patterns (don't hardcode domains, don't skip services)
- Stack specifics (TypeScript ES modules, Qdrant, Vitest)

### 3. STORY-REVIEW.md - Completion Checklist
- Acceptance criteria verification
- Code quality gates (lint, build, test)
- Both providers tested (Ollama + OpenAI)
- Lessons learned capture

## Code-Truth Philosophy

**No assumptions. Everything verified with bash.**

```bash
# Don't assume - verify
grep -rn "domain extraction" src/services/
ls src/services/fetch-service.ts
cat .data/manifest.json | jq '.sources | keys'
```

**The result**: Stories based on reality, not documentation claims.

## The Workflow

```
backlog.md → draft/ → INSTRUCTIONS.md → ready/ → implement → STORY-REVIEW.md → done/ → lessons learned
```

**Every story** goes through this pipeline. **Every story** captures what actually happened vs. what was planned.

**Over time**: Institutional knowledge builds. Estimates improve. Patterns emerge from reality, not speculation.

## Try It Yourself

The framework is all there:

1. **See the structure**: [.claude/scruaim/](../../.claude/scruaim/)
2. **Read the guide**: [scruaim/README.md](../../.claude/scruaim/README.md)
3. **See real stories**: [user-stories/draft/](../../.claude/scruaim/user-stories/draft/)
4. **Study the workflow**: [INSTRUCTIONS.md](../../.claude/scruaim/user-stories/INSTRUCTIONS.md)

**Adapt it** for your own projects. The bash verification patterns, the 2+ Rule, the quality gates - they work for any codebase.

## Key Insights

### 1. The 2+ Rule Prevents Waste
Don't create generic solutions for one use case. Wait until the second instance appears, then extract the pattern.

**Example**: React-specific prompt first. When Next.js appears, **then** create framework-docs.prompt.md.

### 2. Bash Verification > Documentation
```bash
# Don't read docs about test count
npm test 2>&1 | grep "test suites"
# Result: 375 tests, 81.57% coverage (ACTUAL)
```

### 3. Lessons Learned = Institutional Knowledge
Every story captures:
- Estimated vs actual time
- What worked, what didn't
- Unexpected discoveries
- Missing verification checks

**This compounds**. Story 10 is informed by lessons from stories 1-9.

### 4. Quality Gates Prevent Incomplete Work
**Before marking done**:
- [ ] All acceptance criteria met
- [ ] Both providers tested
- [ ] Tests pass
- [ ] Lessons learned captured

**No shortcuts**. If it's not done, it stays in review/.

## Why This Matters for MCP Development

MCP servers have dual providers, domain-agnostic design, service pipelines. **Easy to break these patterns accidentally.**

**scruaim prevents this**:
- Pre-flight verification catches single-provider code
- Anti-patterns checklist catches service bypassing
- Quality gates catch hardcoded domains

**The result**: Consistent architecture across all stories.

## The Meta Insight

**This project was built with the framework it demonstrates.**

The scruaim framework wasn't planned upfront - it **evolved through building this MCP server**. Each story improved the process. Each lesson refined the framework.

**That's the point**: Start simple. Let patterns emerge from reality. Capture what works. Iterate.

---

**Want more details?** See [.claude/scruaim/](../../.claude/scruaim/) for the complete framework implementation.
