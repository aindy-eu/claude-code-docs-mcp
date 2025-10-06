# AI Handovers - The Hidden Gem

## The Problem

AI assistants forget everything between sessions. Code shows *what* was done, but not *why*.

## The Solution

**Handovers** = Structured documents that preserve reasoning across AI context resets.

Stored in `.claude/handovers/YYYYMMDD-topic.md`, they capture:
- **Decisions** and why alternatives were rejected
- **Discoveries** (patterns, gotchas, performance insights)
- **Failed attempts** (what didn't work and why)
- **Next steps** for whoever continues the work

## Real Example from This Project

**[Security Fix Handover (Oct 2)](../../.claude/handovers/20251002-security-code-quality-fixes.md)**

**What happened:** Fixed command injection vulnerability + cleaned up 198 console warnings

**What the handover captured:**
- Attack vector: `exec()` with string concatenation allows shell injection
- Solution: `spawn()` with array args prevents shell interpretation
- Rejected alternative: URL sanitization (too error-prone, doesn't solve root cause)
- Side benefit: Semantic console methods (`info`/`warn`/`error`) instead of generic `log`

**Why it matters:** Next AI session (or human) can understand the security reasoning, not just see "different code."

## Why This Works

**Traditional approach:**
1. AI analyzes code → makes changes
2. Context fills up, session ends
3. New AI starts fresh → has to re-discover everything

**With handovers:**
1. AI analyzes code → makes changes → writes handover
2. Context fills up, session ends
3. New AI reads handover → continues with full context

**Result:** Institutional knowledge persists across infinite AI sessions.

## The Philosophy

Inspired by:
- **Medical shift handovers** - Critical context transfer between doctors
- **Architecture Decision Records (ADRs)** - Why decisions were made
- **Retrospectives** - What worked, what didn't, what we learned

**Core belief:** The reasoning behind code is as valuable as the code itself.

## Try It On Your Projects

**Full template and guidelines:** [.claude/handovers/README.md](../../.claude/handovers/README.md)

**Quick start:**
1. Create `.claude/handovers/` directory
2. When context gets low or work pauses, create `YYYYMMDD-topic.md`
3. Document the "why" (code already shows the "what")
4. Focus on decisions, discoveries, and dead ends

**Privacy tip:** Gitignore the handovers (except README.md) - private documentation enables honest, frank insights.

## Real Impact on This Project

**What handovers preserved:**
- Why Claude-driven extraction beats traditional parsing (3 failed attempts documented)
- Ollama vs OpenAI embedding tradeoffs (performance data, cost analysis)
- Test infrastructure migration (Jest → Vitest, why and gotchas)
- Security vulnerabilities found and fixed (attack vectors, mitigation reasoning)

**Without handovers, all of this context would be lost.**

---

**Remember:** Code shows *what*. Handovers show *why*.

*See [.claude/handovers/](../../.claude/handovers/) for real examples from this project.*
