---
token_estimate: 1027
updated_at: '2025-10-06 08:59:43'
---
# scruaim Framework - Claude Code Documentation MCP

## What is scruaim?

**scruaim** = Scrum + AI, a lightweight framework for managing development work with AI assistance.

This is your project-specific implementation, customized for the Claude Code Documentation MCP server.

## What This Project Does

An MCP (Model Context Protocol) server that uses Claude's natural language understanding to intelligently ingest and search documentation, proving that AI understanding surpasses traditional parsing.

**Key Innovation**: Claude reads documentation naturally (not mechanical scraping), extracting deep insights and relationships that traditional parsers cannot achieve.

## Directory Structure

```
.claude/scruaim/
├── README.md                      # This file - framework overview
│
├── backlog/
│   ├── README.md                  # Backlog workflow guide
│   ├── backlog.md                 # Prioritized story list
│   └── completed.md               # Archive with lessons learned
│
└── user-stories/
    ├── README.md                  # MCP architecture context
    ├── INSTRUCTIONS.md            # Story creation workflow
    ├── STORY-REVIEW.md            # Story completion checklist
    ├── draft/                     # Story exploration (no commitment)
    ├── todo/                      # Committed stories (needs refinement)
    ├── ready/                     # Ready to implement (DoR met)
    ├── in-progress/               # Currently working (max 3)
    ├── review/                    # Implementation complete (needs validation)
    └── done/                      # Completed and accepted
```

## Complete Workflow

### Story Lifecycle

```
backlog.md → draft/ → todo/ → ready/ → in-progress/ → review/ → done/ → completed.md
              ↓                           ↓              ↓
         INSTRUCTIONS.md            (coding)      STORY-REVIEW.md
```

### Step-by-Step Guide

#### 1. Pick a Story (backlog/)
```bash
# View prioritized backlog
cat .claude/scruaim/backlog/backlog.md

# Check current WIP (max 3)
ls .claude/scruaim/user-stories/in-progress/
```

See `backlog/README.md` for backlog management details.

#### 2. Create Story (draft/)
```bash
# Create draft file
touch .claude/scruaim/user-stories/draft/US-CATEGORY-XXX-description.md
```

**Use `user-stories/INSTRUCTIONS.md` for**:
- Pre-flight verification commands
- Story template structure
- The 2+ Rule (avoid premature abstraction)
- Acceptance criteria best practices
- Estimation from git history

See `user-stories/README.md` for MCP architecture context (categories, patterns, anti-patterns).

#### 3. Refine Story (todo/ → ready/)
```bash
# Move when scope is clear
mv user-stories/draft/US-*.md user-stories/todo/

# Move when Definition of Ready met:
# - Pre-flight verification run
# - Acceptance criteria clear
# - Technical approach defined
# - Estimates grounded in reality
mv user-stories/todo/US-*.md user-stories/ready/
```

#### 4. Implement (in-progress/)
```bash
# Start work (max 3 stories)
mv user-stories/ready/US-*.md user-stories/in-progress/

# Code following MCP architecture patterns
# (See user-stories/README.md for patterns)
```

#### 5. Complete & Review (review/)
```bash
# Move when coding done
mv user-stories/in-progress/US-*.md user-stories/review/
```

**Use `user-stories/STORY-REVIEW.md` for**:
- Acceptance criteria verification
- Code quality gates (lint, build, test)
- Both providers tested (Ollama + OpenAI)
- Architecture compliance checks
- Lessons learned capture

#### 6. Done (done/ → completed.md)
```bash
# Move to done
mv user-stories/review/US-*.md user-stories/done/

# Archive with lessons
echo "- US-XXX: [title] (completed $(date +%Y%m%d))" >> backlog/completed.md

# Remove from backlog
# Edit backlog/backlog.md
```

## Story Categories (13 Total)

### Core Pipeline
- **INGEST** - Documentation ingestion
- **EMBED** - Embedding generation (Ollama/OpenAI)
- **SEARCH** - Vector search improvements
- **MCP** - Protocol and tool implementations
- **TRACK** - Manifest tracking and deduplication

### Data & Config
- **CLEAN** - Data cleaning and validation
- **CONFIG** - Configuration management

### Expansion
- **MULTI** - Multi-source documentation
- **VERSION** - Version tracking

### Quality
- **PERF** - Performance optimizations
- **TEST** - Testing infrastructure
- **DEBUG** - Developer debugging tools
- **DOC** - Project documentation

**Format**: `US-CATEGORY-XXX-description.md`

Example: `US-MULTI-002-react-docs-integration.md`

## The 3 Key Files Explained

### 1. `user-stories/INSTRUCTIONS.md`
**When**: Creating stories (draft/ → ready/)

**Use for**:
- Pre-flight verification bash commands
- Story template structure
- The 2+ Rule verification
- External dependency checks
- Estimation from git history

**Purpose**: Ensures stories are well-formed BEFORE implementation.

### 2. `user-stories/README.md`
**When**: Need MCP architecture context

**Use for**:
- Story category guidance (when to use each)
- MCP architecture patterns (service pipeline, dual providers)
- Common anti-patterns to avoid
- File locations (services, tools, config)
- Stack specifics (TypeScript, Qdrant, Vitest)

**Purpose**: Provides project context for writing stories.

### 3. `user-stories/STORY-REVIEW.md`
**When**: Completing stories (review/ → done/)

**Use for**:
- Acceptance criteria checklist
- Code quality verification (lint, build, test)
- Both providers tested (Ollama + OpenAI)
- Multi-source compatibility checks
- Lessons learned capture

**Purpose**: Quality gate AFTER implementation, before marking done.

## Quick Reference Commands

### Story Management
```bash
# View backlog
cat .claude/scruaim/backlog/backlog.md

# Check WIP
ls .claude/scruaim/user-stories/in-progress/

# Find story by ID
find .claude/scruaim -name "US-SEARCH-*.md"

# View completed stories
cat .claude/scruaim/backlog/completed.md
```

### Pre-Implementation (from INSTRUCTIONS.md)
```bash
# Check if feature exists
grep -r "feature_name" src/

# Verify services
ls src/services/{fetch,extract,embed,search,manifest,master-manifest}-service.ts

# Check both providers supported
grep -rn "provider.*ollama\|openai" src/services/
```

### Post-Implementation (from STORY-REVIEW.md)
```bash
# Quality gates
npm run lint:fix
npm run build
npm run test:ci

# Both providers work
npm run cli:ingest -- --provider ollama [url]
npm run cli:ingest -- --provider openai [url]
```

## Critical MCP Patterns

### Service-Oriented Pipeline
```
Fetch → Extract → Clean → Embed → Store → Track
```
**Never bypass services** - each step has dedicated responsibility.

### Dual Provider Support
- **Ollama** (default): Local, privacy-focused, free
- **OpenAI** (fallback): Cloud-based, cost per use
- **Always support both**

### Domain-Agnostic Design
- Auto-extract domain: `new URL(url).hostname`
- Multi-source storage: `.data/{domain}/`
- Two-tier manifests (master + per-domain)

### Metadata-Rich Approach
Rich metadata is our competitive advantage:
```typescript
{ id, content, vector, url, title, sections, codeExamples, timestamp }
```

## Success Metrics (Track in completed.md)

- Time from ready to done
- Estimation accuracy (estimated vs actual)
- Bugs found post-implementation
- Performance impact
- Lessons learned

## Anti-Patterns to Avoid

- ❌ Starting stories without Definition of Ready
- ❌ Exceeding WIP limit of 3 stories
- ❌ Skipping STORY-REVIEW.md before marking done
- ❌ Not capturing lessons learned
- ❌ Hardcoding domains (use domain extraction)
- ❌ Skipping services (always use service layer)
- ❌ Single provider support (always Ollama + OpenAI)
- ❌ Losing metadata (preserve richness)

## Getting Help

1. **Need story template?** → `user-stories/INSTRUCTIONS.md`
2. **Need MCP patterns?** → `user-stories/README.md`
3. **Need completion checklist?** → `user-stories/STORY-REVIEW.md`
4. **Need backlog workflow?** → `backlog/README.md`
5. **Similar story done before?** → `backlog/completed.md`

## The One Rule

**Leave it better than you found it** - This applies to code, documentation, and the scruaim framework itself.
