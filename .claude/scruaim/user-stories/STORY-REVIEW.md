---
token_estimate: 532
updated_at: '2025-10-06 08:59:43'
---
# Story Implementation Review Checklist

Use this **before moving a story from `review/` → `done/`**.

This ensures implementation matches the story and captures lessons learned.

## 1. Acceptance Criteria Verification

```bash
# Open the story file and verify each criterion
cat .claude/scruaim/user-stories/review/US-*.md
```

- [ ] All acceptance criteria met
- [ ] Edge cases handled (if specified in story)
- [ ] Breaking changes documented (or none exist)

## 2. Technical Quality Gates

### Code Quality
```bash
npm run lint:fix    # Fix all linting/formatting
npm run build       # TypeScript compiles without errors
npm run test:ci     # All tests pass
```

- [ ] Linting passes
- [ ] TypeScript compiles
- [ ] All tests pass
- [ ] Coverage maintained/improved

### Both Providers Verified
```bash
# Test with Ollama (default)
npm run cli:ingest -- --provider ollama [url]

# Test with OpenAI
npm run cli:ingest -- --provider openai [url]

# Verify both work
npm run test:integration | grep -E "ollama|openai"
```

- [ ] Ollama provider tested
- [ ] OpenAI provider tested
- [ ] Provider switching works

### Architecture Compliance
- [ ] Services used (not bypassed - check imports)
- [ ] Metadata preserved (verify payload structure)
- [ ] Domain-agnostic (no hardcoded domains)
- [ ] Error handling follows pattern (try-catch with logger)

## 3. Multi-Source Compatibility

```bash
# Verify existing sources still work
cat .data/manifest.json | jq '.sources | keys'

# Test cross-source search (if applicable)
npm run search "query" | grep -E "docs.claude.com|react.dev"
```

- [ ] Works with existing sources
- [ ] Manifest tracking updated correctly
- [ ] Cross-source search unaffected

## 4. Performance & Dependencies

```bash
# Check for external URLs (if applicable)
curl -I https://external-url.com 2>/dev/null | head -5

# Verify no rate limit issues
cat logs/ingestion.log 2>/dev/null | grep -i "rate\|429\|limit"
```

- [ ] No performance regressions
- [ ] External dependencies verified
- [ ] Rate limiting respected

## 5. Documentation Updates

```bash
# Check if public changes need docs
git diff README.md
git diff CLAUDE.md
```

- [ ] README updated (if public API/CLI changed)
- [ ] CLAUDE.md updated (if dev workflow changed)
- [ ] Comments added for complex logic

## 6. Lessons Learned (Capture Now!)

### What Went Well
-

### What Could Improve
-

### Estimation Accuracy
- **Estimated**: [X hours from story]
- **Actual**: [Y hours actual]
- **Variance**: [If >50% off, explain why]

### Unexpected Discoveries
-

### Story Predictions vs Reality
- **Pre-flight verification**: [Accurate? Missing checks?]
- **Technical approach**: [Worked as planned? Pivots needed?]
- **Dependencies**: [Any surprises?]

## 7. Completion Steps

Once all checks pass:

```bash
# 1. Update story file with lessons learned
# (Add to bottom of story file)

# 2. Move story file
mv .claude/scruaim/user-stories/review/US-*.md \
   .claude/scruaim/user-stories/done/

# 3. Add to completed.md
echo "- US-XXX-YYY: [title] (completed $(date +%Y%m%d))" >> \
   .claude/scruaim/backlog/completed.md

# 4. Remove from backlog (if listed)
# Edit .claude/scruaim/backlog/backlog.md
```

- [ ] Story file updated with lessons learned
- [ ] Moved to `done/` folder
- [ ] Added to `completed.md`
- [ ] Removed from `backlog.md`

---

**Note**: This review happens AFTER implementation. For story creation quality, see `INSTRUCTIONS.md`.
