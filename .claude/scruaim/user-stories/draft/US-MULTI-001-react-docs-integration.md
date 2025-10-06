---
token_estimate: 1122
updated_at: '2025-10-06 08:59:43'
---
# US-MULTI-002: React Documentation Integration

## Story

As a **developer using Claude Code with React**,
I want to **search React documentation through the same MCP server**,
So that **I can find React patterns without leaving my Claude Code workflow**.

## Background

Current state: MCP server only ingests Claude Code documentation. Architecture analysis shows multi-source capability already exists (verified below). React is the ideal first expansion because it's commonly used alongside Claude Code.

## Pre-Flight Verification

```bash
# 1. Does multi-source infrastructure exist?
ls .data/
# Result: docs.claude.com/ docs.anthropic.com/ example.com/ manifest.json
# ✅ Multi-domain storage works

cat .data/manifest.json
# Result: Master manifest tracks multiple sources
# ✅ Cross-source tracking exists

# 2. Does domain extraction work?
grep -rn "hostname\|domain" src/services/fetch*.ts
# Result: src/services/fetch-service.ts:20: this.domain = parsed.hostname
# ✅ Domain extraction exists

# 3. Can we ingest arbitrary URLs?
npm run cli:ingest -- --help 2>/dev/null | grep -i "url"
# Result: Command accepts URL argument
# ✅ URL-based ingestion works

# 4. How many prompt templates exist?
ls src/prompts/*.prompt.md
# Result: claude-docs.prompt.md, claude-docs.dev.prompt.md
# ⚠️ Only 2 templates (both Claude-specific)

# 5. 2+ Rule Check: Do we need framework template?
ls .data/ | grep -v "claude\|anthropic\|example" | wc -l
# Result: 0 framework docs ingested
# ❌ Only 1 instance (React), don't create framework-docs.prompt.md yet

# 6. External URL verification
curl -I https://react.dev/learn/thinking-in-react 2>/dev/null | grep "HTTP"
# Result: HTTP/2 200
# ✅ React docs accessible

curl -s https://react.dev/robots.txt | grep -i "disallow"
# Result: No disallow for /learn
# ✅ Crawling allowed
```

**Verification Summary**:
- ✅ Infrastructure ready (multi-domain works)
- ✅ External URLs valid
- ❌ No framework template (but per 2+ Rule, create React-specific first)
- ✅ No blockers

## Acceptance Criteria

- [ ] Single React page successfully ingested (https://react.dev/learn/thinking-in-react)
- [ ] Stored in `.data/react.dev/` directory structure
- [ ] Master manifest updated with react.dev source
- [ ] Cross-source search returns results from BOTH Claude and React
- [ ] Works with BOTH Ollama and OpenAI providers
- [ ] Extraction quality verified (manual comparison ≥90% match)

## Technical Approach

### 1. Create React-Specific Prompt

**Decision**: Create `react-docs.prompt.md` (NOT framework-docs.prompt.md)

**Rationale (2+ Rule)**:
```bash
# How many framework docs will we have after this story?
echo "1"  # Only React
# Verdict: Keep React-specific, extract to framework-docs when Next.js appears
```

**File**: `src/prompts/react-docs.prompt.md`

**Method**: Adapt existing Claude prompt
```bash
# Copy structure from existing
cp src/prompts/claude-docs.prompt.md src/prompts/react-docs.prompt.md

# Changes needed (based on React vs Claude Code differences):
# - Remove: MCP tools, slash commands, agent workflows
# - Keep: Section structure, code examples, output format
# - Add: JSX syntax, hooks, component patterns, state management
```

**Estimated effort**: 2h (based on prompt being ~300 lines)

### 2. Test Single Page Ingestion

**Command**:
```bash
npm run cli:ingest -- https://react.dev/learn/thinking-in-react
```

**Expected outcome**:
- Creates `.data/react.dev/` directory
- Generates `structured/thinking-in-react.json`
- Updates `.data/react.dev/manifest.json`
- Updates `.data/manifest.json` with react.dev source

**Validation**:
```bash
# Check extraction
cat .data/react.dev/structured/thinking-in-react.json | jq '.sections | length'
# Should have 5-10 sections

# Check metadata
cat .data/react.dev/manifest.json | jq '.records | length'
# Should be 1

# Check master manifest
cat .data/manifest.json | jq '.sources["react.dev"]'
# Should show active source
```

**Estimated effort**: 30min

### 3. Quality Verification

**Method**: Manual comparison

```bash
# 1. Open source in browser
open https://react.dev/learn/thinking-in-react

# 2. Compare sections
cat .data/react.dev/structured/thinking-in-react.json | jq '.sections[].title'

# 3. Check code examples
cat .data/react.dev/structured/thinking-in-react.json | jq '.sections[].codeExamples | length'
```

**Criteria**:
- All major sections present (≥90%)
- Code examples preserved
- No hallucinated content
- Links maintained

**If <90% accuracy**: Refine react-docs.prompt.md and re-extract

**Estimated effort**: 1h

### 4. Test Cross-Source Search

```bash
# Search for React-specific terms
npm run search "useState"
npm run search "components"

# Search for Claude-specific terms
npm run search "MCP tools"
npm run search "slash commands"

# Search for generic terms (should return both)
npm run search "functions"
```

**Success**: Results include both sources, relevance maintained

**Estimated effort**: 15min

### 5. Test Both Providers

```bash
# Test with Ollama (default)
rm -rf .data/react.dev  # Clean slate
npm run cli:ingest -- --provider ollama https://react.dev/learn/thinking-in-react

# Test with OpenAI
rm -rf .data/react.dev  # Clean slate
npm run cli:ingest -- --provider openai https://react.dev/learn/thinking-in-react

# Compare outputs
diff .data/react.dev/structured/thinking-in-react.json.ollama \
     .data/react.dev/structured/thinking-in-react.json.openai
```

**Success**: Both providers work, outputs similar quality

**Estimated effort**: 30min

## Implementation Checklist

- [ ] Create `src/prompts/react-docs.prompt.md` (2h)
- [ ] Test single page extraction (30min)
- [ ] Verify quality ≥90% (1h)
- [ ] Test cross-source search (15min)
- [ ] Test Ollama provider (15min)
- [ ] Test OpenAI provider (15min)
- [ ] Run test suite (5min)
- [ ] Update documentation if needed (15min)

**Total estimated**: 4.5h

## Test Requirements

### Automated
```bash
# Existing tests must pass
npm run test
# Expected: 375 tests pass

# No new tests needed (using existing services)
```

### Manual
```bash
# 1. Extraction test
npm run cli:ingest -- https://react.dev/learn/thinking-in-react

# 2. Verification
ls .data/react.dev/structured/
cat .data/react.dev/manifest.json

# 3. Search test
npm run search "React hooks"
npm run search "useState"

# 4. Provider test
npm run cli:ingest -- --provider ollama https://react.dev/learn/hooks
npm run cli:ingest -- --provider openai https://react.dev/learn/hooks
```

## Dependencies

### Existing (Verified)
- ✅ `FetchService` - domain extraction
- ✅ `ExtractService` - Claude-based extraction
- ✅ `EmbedService` - dual provider support
- ✅ `ManifestService` - per-domain tracking
- ✅ `MasterManifestService` - cross-domain tracking
- ✅ `SearchService` - multi-collection search

### New
- ⚠️ `src/prompts/react-docs.prompt.md` - CREATE

### Modified
- None (all existing services work as-is)

## Performance Considerations

- **Single page**: ~2min ingestion (based on Claude Code page timing)
- **Storage**: ~500KB per page (estimate)
- **Embeddings**: ~2000 tokens per page
- **Cost**: OpenAI ~$0.02 per page, Ollama free

## Security Considerations

- Public React documentation (no sensitive data)
- Rate limiting: None needed (single page test)
- Validation: Ensure react.dev domain (not malicious redirect)

## Questions/Blockers

None identified.

## Definition of Done

- [ ] `react-docs.prompt.md` created
- [ ] Single React page ingested successfully
- [ ] Quality verified ≥90% match
- [ ] Cross-source search works (returns both Claude + React)
- [ ] Both providers work (Ollama + OpenAI)
- [ ] Existing test suite passes (375 tests)
- [ ] No breaking changes to existing functionality

## Priority & Size

- **Priority**: High (foundation for universal docs vision)
- **Size**: S-M (4.5 hours)
- **Sprint**: Current

## Notes on 2+ Rule

**Why not `framework-docs.prompt.md`?**

```bash
# Instance count check
ls .data/ | grep -v "claude\|anthropic\|example" | wc -l
# Result: 0 (will be 1 after this story)
```

**Decision**: Create React-specific prompt. When Next.js story appears (2nd instance), THEN extract common patterns to `framework-docs.prompt.md`.

**This prevents**: Premature abstraction based on speculation.

## Lessons Learned
*To be filled after implementation*
