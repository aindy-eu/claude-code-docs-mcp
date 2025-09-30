# Project Overview - Claude Code Documentation MCP Server

## Purpose (Determined from Code Implementation)

Based on code analysis, this project implements a **Model Context Protocol (MCP) server** that provides vector-based search capabilities for Claude Code documentation. The application serves as a bridge between Claude AI and documentation stored in a Qdrant vector database.

## Application Type

**Type**: TypeScript/Node.js MCP Server
**Architecture**: Microservice providing AI-enhanced documentation search
**Protocol**: Model Context Protocol (MCP) for Claude AI integration

## Core Functionality Identified

1. **Vector Search Service**: Implements semantic search using embeddings (src/tools/search.ts)
2. **Claude Output Processing**: Processes structured AI-generated documentation (src/services/claude-output-processor.ts)
3. **Hybrid Embedding Support**: Supports both Ollama (local) and OpenAI embedding providers (src/services/hybrid-embeddings.ts)
4. **Ingestion Tracking**: Manages document ingestion state with TTL tracking (src/services/ingestion-tracker.ts)

## Target Users (Inferred from Features)

- **Primary**: Developers using Claude Code who need documentation search
- **Secondary**: Systems integrating with Claude AI for documentation retrieval
- **Use Case**: Real-time documentation search within AI-assisted coding sessions

## Project Metrics

### Codebase Statistics
- **Total Files**: 43 TypeScript/JavaScript files (excluding node_modules)
- **Lines of Code**: 5,147 total
- **Primary Language**: TypeScript (3,539 files)
- **Secondary**: JavaScript (9,275 files in dependencies)
- **Build Artifacts**: 460 .mjs, 142 .cjs transpiled files

### Language Distribution
```
TypeScript: 82.1% (core implementation)
JavaScript: 17.9% (configuration and tests)
```

### Test Infrastructure
- **Test Framework**: Jest with ts-jest
- **Test Types**: Unit and Integration tests
- **Test Files**: 7 test suites identified
- **Coverage Tool**: Configured but metrics pending

## Problem Domain

This project solves the challenge of **making Claude Code documentation searchable and contextually accessible** during AI-assisted development. Instead of traditional keyword search, it uses:

1. **Semantic Understanding**: Vector embeddings for meaning-based search
2. **AI-Driven Ingestion**: Claude processes documentation naturally
3. **Hybrid Approach**: Local (Ollama) and cloud (OpenAI) embedding options
4. **Rich Metadata**: Preserves code examples, concepts, and relationships

## Key Innovation (From Code Analysis)

The codebase reveals a shift from traditional web scraping to **AI-driven documentation understanding**:
- Removed legacy scraping code (per git history)
- Claude reads and understands docs naturally (src/services/claude-output-processor.ts)
- Processes Claude's JSON output with markdown wrapper handling
- Maintains ingestion state to prevent redundant processing

## Recent Development Activity

- **Latest Commit**: "refactor: Remove legacy web scraping code and make production ready" (2025-07-26)
- **Active Development**: Transitioned from scraping to AI-driven approach
- **Current Focus**: Production readiness and Claude-driven ingestion