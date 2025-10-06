# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-04

### 🎉 Initial Release

First stable release of Claude Code Documentation MCP Server - a semantic search system that uses Claude to understand documentation like a human.

### ✨ Features

#### Core Functionality
- **Claude-Driven Extraction**: Uses Claude Code to read and understand documentation, extracting implicit knowledge that traditional scrapers miss
- **Hybrid Embeddings**: Support for both Ollama (local, free) and OpenAI (cloud) embedding providers
- **Vector Search**: Semantic search powered by Qdrant vector database
- **MCP Integration**: First-class Model Context Protocol support for Claude Desktop
- **Multi-Source Support**: Ingest and search across multiple documentation sources

#### CLI Commands
- `seed` - Bootstrap knowledge base with core or all documentation pages
- `sync` - Update stale documentation (7-day TTL)
- `search` - Semantic search across all ingested documentation
- `sources` - List all registered documentation sources
- `ingest` - Full pipeline for single URL ingestion
- `fetch`, `extract`, `embed` - Individual pipeline stages for advanced workflows
- `status`, `list` - Document inspection and debugging

#### Pipeline System
- **3-Stage Pipeline**: Fetch → Extract → Embed
- **Content Change Detection**: SHA-256 hash-based detection skips unchanged content
- **Resume on Failure**: Tracks pipeline progress, resumes from failure point
- **TTL-Based Staleness**: Automatic identification of outdated documentation

#### Manifest System
- **Two-Tier Architecture**: Master manifest + domain manifests
- **Multi-Domain Support**: Automatic domain discovery and registration
- **Status Tracking**: Complete lifecycle from fetch to embedded
- **7-Day Default TTL**: Configurable freshness tracking

#### Testing
- 375 tests across 32 test files
- 81.52% code coverage
- Unit and integration test suites
- Fast execution (~3.9s)

### 📚 Documentation

Complete documentation suite:
- Architecture overview and system design
- CLI command reference with examples
- Pipeline stage deep-dive
- Manifest system documentation
- MCP server integration guide
- Testing guide and patterns
- Qdrant setup and optimization guides

### 🛠️ Technical Stack

- **Runtime**: Node.js 18+ with TypeScript 5.6
- **Vector DB**: Qdrant (Docker)
- **Embeddings**: Ollama (nomic-embed-text) or OpenAI (ada-002)
- **MCP**: @modelcontextprotocol/sdk 1.0.0
- **Testing**: Vitest 3.2.4
- **CLI**: Commander 14.0.1

### 🏗️ Architecture Highlights

- Service-oriented design with dependency injection
- Clean separation: CLI → Pipeline → Services → External Services
- Type-safe with TypeScript strict mode
- Comprehensive error handling and logging
- Zero linting errors

### 📦 What's Included

- Fully functional MCP server
- Complete CLI tool with 11 commands
- Production-ready code quality
- Comprehensive test suite
- Detailed documentation
- Example configurations

---

## [Unreleased]

### Planned
- GitHub Actions CI/CD pipeline
- npm package publication
- Docker image for easier deployment
- Performance optimizations (parallel embedding generation)
- Additional documentation sources

---

## Version History

### Version Numbering

- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features, backwards compatible
- **Patch** (x.x.1): Bug fixes, backwards compatible

### Support

- Latest major version receives active development
- Previous major version receives security fixes for 6 months

---

**Legend**
- 🎉 Major milestone
- ✨ New features
- 🐛 Bug fixes
- 📚 Documentation
- 🔒 Security
- ⚡ Performance
- 💥 Breaking changes
- 🗑️ Deprecations
