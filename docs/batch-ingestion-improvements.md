# Batch Ingestion Improvements

## Remaining Features to Implement

### 1. Parallel Processing 🚀
**Priority: High** - Would significantly speed up batch ingestion

```typescript
// Add --parallel flag to batch command
npm run cli -- batch --parallel 3  // Process 3 URLs concurrently
```

**Implementation needed:**
- Add `--parallel <n>` option to batch command (default: 2)
- Modify `BatchCommand.run()` to process URLs in chunks
- Use `Promise.all()` or `p-map` for concurrent execution
- Respect rate limits even with parallelism

### 2. Rate Limiting ⏱️
**Priority: High** - Prevent API throttling, especially important with parallelism

```typescript
import pThrottle from 'p-throttle';

// Anthropic API: 50 requests/minute for paid, 5 for free
const throttle = pThrottle({
  limit: 5,    // 5 requests
  interval: 60000, // per 60 seconds
});

const throttledIngest = throttle((url: string) =>
  this.orchestrator.ingest(url, options)
);
```

**Implementation needed:**
- Add rate limiting to orchestrator
- Make configurable via environment variable or flag
- Auto-detect tier from API response if possible
- Default to conservative (5/min) for safety

### 3. Time Estimates ⏰
**Priority: Medium** - Better UX during long batch operations

**Implementation needed:**
- Track average processing time per URL
- Calculate and display ETA based on remaining URLs
- Update estimates dynamically as processing continues
- Show in progress UI (e.g., "3 of 10, ~2 minutes remaining")

### 4. Interrupt Handling (Ctrl+C) 🛑
**Priority: Medium** - Graceful shutdown and state preservation

```typescript
process.on('SIGINT', async () => {
  console.log('\n⚠️  Batch interrupted. Saving progress...');

  // Save current state
  await this.saveProgress(ctx);

  // Show what was completed
  this.showSummary(ctx);

  console.log('Run with --resume to continue from where you left off');
  process.exit(0);
});
```

**Implementation needed:**
- Trap SIGINT signal
- Save progress to manifest before exit
- Show summary of completed/pending work
- Clean shutdown of any running promises

### 5. Resume Capability 🔄
**Priority: Medium** - Continue interrupted batch operations

```typescript
npm run cli -- batch --resume  // Continue from last interruption
```

**Implementation needed:**
- Add `--resume` flag to batch command
- Store batch state in manifest or separate file
- On resume, skip already-completed URLs
- Maintain original batch configuration

### 6. Advanced Progress UI 📊
**Priority: Low** - Enhanced visual feedback

```typescript
// Multi-bar progress for parallel processing
Fetch    |████████████████████| 100% | 3/3 | hooks.json
Extract  |████████░░░░░░░░░░░░|  50% | 2/3 | quickstart...
Embed    |████░░░░░░░░░░░░░░░░|  20% | 1/3 | overview
```

**Implementation needed:**
- Use `cli-progress` MultiBar for parallel operations
- Show individual progress for each stage (fetch/extract/embed)
- Display current file being processed
- Add spinner for active operations

### 7. Batch Configuration Profiles 📋
**Priority: Low** - Predefined batch configurations

```typescript
npm run cli -- batch --profile daily    // Run daily update profile
npm run cli -- batch --profile full     // Complete re-ingestion
```

**Implementation needed:**
- Define profiles in config file
- Each profile specifies: pages, force, parallel, provider, etc.
- Allow custom user-defined profiles
- Make profiles configurable via JSON/YAML

## Implementation Priority

### Quick Wins (1-2 hours each)
1. **Parallel Processing** - Big performance gain, relatively simple
2. **Rate Limiting** - Critical for reliability

### Medium Effort (2-4 hours each)
3. **Time Estimates** - Improves UX significantly
4. **Interrupt Handling** - Important for long-running batches
5. **Resume Capability** - Pairs well with interrupt handling

### Nice to Have (4+ hours)
6. **Advanced Progress UI** - Visual polish
7. **Batch Profiles** - Power user feature

## Testing Approach

### Unit Tests
- Mock orchestrator for batch command tests
- Test filtering logic with various manifest states
- Verify retry logic with simulated failures

### Integration Tests
- Test with 1-2 real URLs
- Verify manifest updates
- Test interrupt/resume with small batch

### Performance Tests
- Measure improvement with parallel processing
- Verify rate limiting prevents 429 errors
- Compare batch times: sequential vs parallel

## Open Questions

1. **Parallel Default**: Should we default to parallel=2 or sequential?
   - Recommendation: Sequential by default, let users opt into parallelism

2. **Rate Limit Detection**: Can we auto-detect API tier?
   - Check response headers for rate limit info
   - Fall back to conservative defaults

3. **Resume Storage**: Where to store resume state?
   - Option A: In manifest (simple, centralized)
   - Option B: Separate .batch-state.json file (cleaner)

4. **Progress UI Library**: Stick with listr2 or upgrade?
   - listr2 works well for current needs
   - Consider cli-progress only if adding multi-bar

## Success Metrics

When complete, the batch command should:
- ⏱️ Process 10 pages in < 2 minutes with parallel=3
- 🔄 Resume gracefully after interruption
- 📊 Show accurate time estimates
- 🚦 Never exceed API rate limits
- 💾 Save state on Ctrl+C