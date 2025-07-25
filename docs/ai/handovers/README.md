# AI Handover System - Universal Template

## Overview

This system preserves **institutional knowledge** across AI context resets, team transitions, and project pauses. Rather than losing valuable reasoning and discoveries when context windows fill or work pauses, create focused handovers that capture essential knowledge for seamless continuation.

## Core Philosophy

**Institutional Memory**: Preserve the **why** behind decisions, not just the **what**. Code shows implementation; handovers preserve reasoning, discoveries, and context that shaped those implementations.

## When to Create Handovers

### Create a handover when:
- **Context is scarce** (< 15% remaining) but work should continue
- **Significant discoveries** were made that aren't obvious from files alone  
- **Complex decisions** were made with important reasoning
- **Session will pause** and resume later (hours/days/weeks)
- **Knowledge would be lost** that saves future re-discovery time
- **Team member transitions** off or onto the project
- **Architecture decisions** need historical context preserved

### Skip handovers when:
- **Work completed naturally** within context limits
- **Simple, straightforward changes** without discovery
- **Pure execution** of clear, existing plans
- **Information is obvious** from reading the changed files

## Handover Creation Process

### 1. AI Proposes Handover Content
When context is getting low or significant work has been done, AI should analyze the session and propose:

**"I notice we're at X% context remaining. This session has involved [summary of work]. Should I draft a handover capturing:**
- **Key decisions made**: [List major choices and reasoning]
- **Patterns discovered**: [Important insights found]
- **Context not obvious from files**: [Background reasoning]
- **Prioritized next steps**: [What should continue next]

**Would you like me to draft a handover with this content, or should we focus on completing [specific task] instead?"**

### 2. User Decides & Prioritizes  
User reviews AI's proposal and decides:
- What knowledge is actually important to preserve
- What level of detail is useful vs. obvious from files
- What can be skipped (clear from codebase, not critical)
- Priority order for next AI instance or team member

### 3. Collaborative Refinement
Together create focused handover that saves time and preserves essential reasoning.

## Setup Instructions

### Project Integration
1. **Create handover directory**: `docs/ai/handovers/` (or `docs/handovers/`)
2. **Add to gitignore if needed**: For sensitive project context
3. **Reference in project README**: Link to this system for team awareness
4. **Integrate with onboarding**: Include handover review in new team member process

### Naming Convention
- **Format**: `YYYYMMDD-topic.md` 
- **Examples**: `20250725-auth-refactor.md`, `20250730-database-migration.md`

## Handover Template

```markdown
# Handover: [Topic/Feature] - [Date]

## Context & Goals
- **What we were working on**: [Main task/objective]
- **Why this work**: [Business motivation, technical debt, user needs]
- **Key constraints**: [Technical limitations, requirements, team preferences]
- **Success criteria**: [How to know this work is complete]

## Key Decisions Made
- **Decision 1**: [What was decided and why alternatives were rejected]
- **Decision 2**: [Important architectural/implementation choice with reasoning]
- **Trade-offs accepted**: [What we gave up and why it was worth it]
- **User/team preferences discovered**: [Working style, priorities revealed during work]

## Knowledge Discovered  
- **Patterns found**: [Code patterns, architecture insights, performance discoveries]
- **Important relationships**: [Connections between components/systems/files]
- **Gotchas identified**: [Edge cases, quirks, things that will surprise future developers]
- **Efficiency opportunities**: [Improvements identified but not yet implemented]

## Current State
- **Completed**: [What was finished and verified working]
- **In progress**: [Current state of unfinished work, including partial implementations]
- **Files changed**: [Major modifications and their purpose/impact]
- **Dependencies**: [What this work depends on or what depends on this work]

## Next Steps (Priority Order)
1. **High priority**: [Most important next task - what should happen first]
2. **Medium priority**: [Secondary tasks that can wait but shouldn't be forgotten]
3. **Future consideration**: [Ideas for later, technical debt to address eventually]
4. **Blocked on**: [External dependencies, decisions needed, resources required]

## Context Files Don't Show
- **Why decisions were made this way**: [Reasoning not obvious from code]
- **Background context**: [Business context, historical context, user research that shaped approach]
- **Dead ends explored**: [What was tried but didn't work - saves future investigation time]
- **Performance considerations**: [Benchmarks, load testing results, optimization reasoning]
- **Security considerations**: [Threat model, security decisions, vulnerability assessments]

## For Next AI Instance / Team Member
- **Start by reading**: [Specific files to understand current state]
- **Key things to know**: [Essential context for effective continuation]
- **Avoid**: [Approaches already tried that didn't work, known pitfalls]
- **Best resources**: [Documentation, team members, external references most helpful]
- **Environment setup**: [Special configuration, tools, or setup needed]
```

## Quality Guidelines

### Include:
- **Decision reasoning** - why choices were made over alternatives
- **Discovery insights** - patterns found during exploration that aren't obvious
- **User/team preferences** - working style preferences revealed during collaboration
- **Time-saving context** - information that prevents re-discovery or repeated research
- **Non-obvious connections** - relationships between parts of the system
- **Performance/security insights** - benchmarks, trade-offs, security decisions

### Exclude:
- **Conversation transcripts** - focus on knowledge, not dialogue
- **Obvious information** - what's clear from reading files or standard documentation
- **Implementation details** - code speaks for itself
- **Temporary debugging** - unless it reveals important patterns or gotchas
- **Personal opinions** - focus on objective decisions and discovered facts

## Recovery Integration

### Manual Recovery Process
When starting work after a handover:

1. **Read relevant handover** before diving into code
2. **Verify current state** matches handover expectations
3. **Review "Next Steps"** for immediate priorities
4. **Check "Avoid" section** to skip known dead ends
5. **Start with "Start by reading"** files for context

### Automated Recovery (Claude Code)
If using Claude Code, create a slash command for seamless handover integration:

```markdown
# /handover-recovery
Load project context with handover integration for seamless work continuation.

Usage: /handover-recovery [handover-file]
- Loads core project context
- Analyzes git status and recent commits
- Integrates handover content if provided
- Provides structured next steps

Example: /handover-recovery 20250725-auth-refactor.md
```

## Beyond AI: Human Applications

This handover system creates value beyond AI context limits:

### Team Collaboration
- **Developer transitions** when team members change projects
- **Knowledge transfer** to new hires or contractors  
- **Project pauses** when work resumes after vacation/leave
- **Cross-team handoffs** when work moves between teams

### Project Management
- **Decision documentation** for future architectural review
- **Context preservation** during project pivots or scope changes
- **Onboarding acceleration** for new team members
- **Preventing repeated exploration** of known dead ends

### Technical Debt Management
- **Refactoring context** - why certain technical debt exists
- **Migration reasoning** - decisions made during system transitions  
- **Performance optimization** - what was tried, what worked, what didn't
- **Security hardening** - threat models and mitigation strategies

## Advanced Patterns

### Handover Chains
For long-running projects, reference previous handovers:
```markdown
## Related Handovers
- **Previous**: [20250120-database-schema.md] - Initial database design decisions
- **Dependencies**: [20250115-auth-system.md] - Authentication system this builds on
```

### Cross-Reference System
Link handovers to relevant documentation:
```markdown
## Documentation Updates Needed
- [ ] Update API docs with new authentication flow
- [ ] Add security considerations to deployment guide
- [ ] Create runbook for new monitoring alerts
```

### Handover Categories
Develop categories based on your project needs:
- **Architecture**: System design decisions and trade-offs
- **Features**: New functionality development and user experience decisions
- **Refactoring**: Code improvement reasoning and migration strategies
- **Debugging**: Complex bug investigations and root cause analysis
- **Performance**: Optimization work and benchmarking results
- **Security**: Threat modeling and security hardening decisions

## Measuring Success

### Handover Quality Metrics
- **Continuation speed**: How quickly new developers/AI can resume productive work
- **Re-discovery prevention**: Reduced time spent exploring known dead ends
- **Decision clarity**: How well the reasoning behind choices is preserved
- **Context accuracy**: How well handovers match actual project state

### Project Benefits
- **Reduced onboarding time** for new team members
- **Faster project resumption** after breaks
- **Better architectural consistency** through preserved reasoning
- **Reduced technical debt** through documented trade-offs

## Getting Started

### Initial Implementation
1. **Choose handover location**: Create `docs/handovers/` directory
2. **Customize template**: Adapt the template for your project's needs
3. **Team training**: Share this system with your development team
4. **Start small**: Try with your next context-heavy work session

### Iteration and Improvement
1. **Track effectiveness**: Note when handovers save time vs. when they don't
2. **Refine template**: Remove sections that aren't useful, add ones you need
3. **Develop team patterns**: Create project-specific handover categories
4. **Automate recovery**: Build tools/scripts for handover-assisted project resumption

### Success Indicators
- **Team members reference handovers** when resuming work
- **New developers use handovers** during onboarding
- **Architectural decisions are preserved** and referenced in future work
- **Time-to-productivity decreases** when starting complex tasks

## Evolution and Maintenance

This system should evolve with your project:

### Regular Review
- **Monthly**: Review existing handovers for accuracy and relevance
- **Quarterly**: Update template based on what's working vs. what isn't
- **Project milestones**: Archive or update handovers after major releases

### Template Customization
Adapt the template for your domain:
- **Web development**: Add sections for browser compatibility, responsive design decisions
- **Backend systems**: Include sections for scalability, data consistency decisions
- **Mobile apps**: Add sections for platform-specific decisions, performance considerations
- **DevOps**: Include sections for infrastructure decisions, deployment strategies

### Integration Opportunities
- **Code review process**: Reference relevant handovers during complex reviews
- **Sprint planning**: Use handovers to inform story estimation and planning
- **Architecture review**: Handovers provide historical context for architectural decisions
- **Post-mortem process**: Create handovers after incident resolution to preserve learnings

The goal is creating **institutional memory** that preserves reasoning and context, making all future work more efficient and informed, whether done by AI or human team members.