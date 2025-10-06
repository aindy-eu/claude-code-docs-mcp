---
token_estimate: 582
updated_at: '2025-10-06 08:59:43'
---
# Backlog Management for Claude Code Documentation MCP

## Workflow Overview

Stories flow through a clear pipeline:
```
backlog.md (prioritized list) → user-stories/draft/ → todo/ → ready/ → in-progress/ → review/ → done/ → completed.md (archive)
```

## File Structure

### backlog.md
- **Purpose**: Master list of all stories, prioritized
- **Format**: Simple numbered list with story IDs
- **Updates**: When stories are created or reprioritized

### completed.md
- **Purpose**: Archive of completed stories with lessons learned
- **Format**: Story ID, completion date, key learnings
- **Value**: Builds institutional knowledge

## How to Use This System

### Adding a New Story Idea
1. Add to `backlog.md` with a brief description
2. Create detailed story in `user-stories/draft/` when ready to explore
3. Move to `user-stories/todo/` when scope is clear

### Working on a Story
1. Pick top priority from `backlog.md`
2. Move story file from `todo/` to `ready/` when Definition of Ready is met
3. Move to `in-progress/` when starting work (max 3 stories)
4. Move to `review/` when implementation complete
5. Move to `done/` after review and acceptance

### Completing a Story
1. Move story file to `done/`
2. Add entry to `completed.md` with lessons learned
3. Remove from `backlog.md`

## Story States Explained

### draft/
- Exploration and ideation
- No commitment to implement
- May have incomplete details

### todo/
- Committed to scope
- Needs refinement before starting
- Part of active backlog

### ready/
- Definition of Ready met:
  - Clear acceptance criteria
  - No blocking dependencies
  - Estimated effort
  - Technical approach defined

### in-progress/
- Currently being implemented
- **WIP Limit**: Maximum 3 stories
- Should have an assignee (even if it's "AI")

### review/
- Implementation complete
- Needs code review or testing
- May need documentation updates

### done/
- Fully complete and accepted
- Lessons learned captured
- Ready for archive

## Priority Guidelines for Claude Code Docs MCP

### High Priority
- Bugs in ingestion pipeline
- Search accuracy improvements
- MCP protocol compatibility issues
- Performance bottlenecks

### Medium Priority
- New documentation source support
- Enhanced metadata extraction
- Additional embedding providers
- Developer experience improvements

### Low Priority
- UI enhancements (this is a backend service)
- Nice-to-have features
- Experimental capabilities

## MCP Server Specific Considerations

### Story Categories (use in story IDs)
- **INGEST**: Documentation ingestion
- **EMBED**: Embedding generation
- **SEARCH**: Vector search
- **MCP**: Protocol and tools
- **TRACK**: Ingestion tracking
- **CLEAN**: Data processing
- **MULTI**: Multi-source features
- **VERSION**: Version tracking
- **PERF**: Performance optimizations
- **CONFIG**: Configuration
- **TEST**: Testing
- **DEBUG**: Developer debugging tools
- **DOC**: Project documentation

### Technical Debt Tracking
Track technical debt as stories with category **TECH**:
- Parallelizing batch operations
- Upgrading dependencies
- Refactoring for better patterns
- Extracting large files into modules

## Review Triggers

Reassess priorities when:
- New urgent bug discovered
- User feedback received
- Dependencies updated
- Project direction changes

## Success Metrics

Track these in completed.md:
- Time from ready to done
- Bugs found post-implementation
- Performance impact
- User feedback

## Anti-patterns to Avoid

- ❌ Starting stories without Definition of Ready
- ❌ Exceeding WIP limit of 3 stories
- ❌ Skipping the review phase
- ❌ Not capturing lessons learned
- ❌ Ignoring technical debt

## Quick Commands

```bash
# See current backlog
cat .claude/scruaim/backlog/backlog.md

# Check WIP
ls .claude/scruaim/user-stories/in-progress/

# Find story by ID
find .claude/scruaim -name "US-*.md"

# See completed stories
cat .claude/scruaim/backlog/completed.md
```