# Claude Code Documentation MCP Server

A Model Context Protocol (MCP) server that provides intelligent search capabilities for Claude Code documentation. This project solves the knowledge gap where Claude Code was released after Claude's knowledge cutoff date.

## 🌟 What Makes This Special

This project introduces a **Claude-driven documentation ingestion** approach - instead of traditional web scraping, we use Claude Code itself to read and understand documentation naturally. This results in:

- 🧠 **Deeper Understanding**: Claude extracts implicit knowledge, relationships, and patterns
- 🎯 **Better Search Results**: Includes key concepts, best practices, and contextual information
- ⚖️ **Ethical & Legal**: Uses Claude Code for its intended purpose (reading documentation)
- 🔍 **Enhanced Metadata**: Search results show extraction method, key concepts, and more

## 🚀 Quick Start for New Users

Just forked this project? Here's exactly what to do:

### Prerequisites

1. **Docker** - For running Qdrant (vector database)
2. **Node.js 18+** - For running the MCP server
3. **Ollama** - For local embeddings (recommended)
4. **Claude Code** - For reading documentation

### Step 1: Start Required Services

```bash
# Start Qdrant vector database
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# Install and start Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull nomic-embed-text
```

### Step 2: Set Up the Project

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Initialize the vector database
npm run setup
```

### Step 3: Ingest Documentation (Claude-Driven Approach)

This is where the magic happens! We'll use Claude Code to read and understand documentation:

```bash
# Make scripts executable
chmod +x examples/ingest-single.sh examples/ingest-batch.sh

# Option 1: Ingest a single documentation page
./examples/ingest-single.sh https://docs.anthropic.com/en/docs/claude-code/overview

# Option 2: Batch ingest multiple pages (recommended for first-time setup)
./examples/ingest-batch.sh
```

The batch script will:
- Use Claude to read each documentation page
- Extract structured information with context
- Save outputs to `claude-outputs/` directory
- Generate embeddings for semantic search
- Log progress to help you track what's happening

### Step 4: Test Your Setup

```bash
# Search your knowledge base
npm run search "how do slash commands work"

# You should see results with enhanced metadata like:
# - Key concepts
# - Extraction method (claude-driven)
# - Code examples
```

### Step 5: Use with Claude Code

```bash
# Build the MCP server
npm run build

# Use it with Claude Code
claude "search my docs for hooks and their execution order" --mcp-server ./build/index.js
```

## 📖 Understanding the Workflow

### Evolution of Documentation Ingestion

**Traditional Approach** (where we started):
```
Web Scraper → HTML Parser → Basic Text → Embeddings → Limited Search
```

**Claude-Driven Approach** (our innovation):
```
Claude Reads Docs → Understands Context → Structured Output → Rich Embeddings → Intelligent Search
```

This project evolved from traditional web scraping to pioneering the use of Claude's natural language understanding for documentation processing.

## 🛠️ Available Commands

### Ingestion Commands
- `./examples/ingest-single.sh <url>` - Ingest a single documentation page
- `./examples/ingest-batch.sh` - Process multiple pages automatically
- `npm run process-claude <file>` - Process Claude's JSON output

### Search Commands
- `npm run search "query"` - Search from command line
- Use with Claude Code via MCP for integrated search

### Setup Commands
- `npm run setup` - Initialize vector database collections
- `npm test` - Verify everything is working

## 📁 Project Structure

```
claude-code-docs-mcp/
├── examples/               # Example scripts and templates
│   ├── ingest-single.sh   # Single page ingestion
│   ├── ingest-batch.sh    # Batch ingestion
│   └── prompts/           # Claude prompt templates
├── claude-outputs/        # Where Claude's outputs are saved (git-ignored)
├── src/
│   ├── services/          # Core services
│   │   ├── claude-output-processor.ts  # Processes Claude's output
│   │   └── hybrid-embeddings.ts        # Embedding generation
│   ├── scripts/           # CLI scripts
│   └── types/             # TypeScript definitions
└── docs/                  # Additional documentation
```

## 🎯 Common Use Cases

### First-Time Setup
```bash
# Run the batch ingestion to populate your knowledge base
./examples/ingest-batch.sh
```

### Adding New Documentation
```bash
# When new Claude Code features are released
./examples/ingest-single.sh https://docs.anthropic.com/en/docs/claude-code/new-feature
```

### Searching for Specific Features
```bash
# Command line search
npm run search "MCP server configuration"

# With Claude Code
claude "find examples of slash commands with parameters" --mcp-server ./build/index.js
```

## 🔧 Configuration

### Environment Variables (`.env`)
```bash
# Ollama (default, no config needed if running locally)
OLLAMA_HOST=localhost
OLLAMA_PORT=11434

# OpenAI (optional alternative)
OPENAI_API_KEY=sk-your-key-here

# Qdrant
QDRANT_URL=http://localhost:6333

# Default embedding provider
DEFAULT_EMBEDDING_PROVIDER=ollama
```

## 🐛 Troubleshooting

### "Qdrant not running"
```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

### "Ollama not found"
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull embedding model
ollama pull nomic-embed-text
```

### "No search results"
```bash
# Check if you've ingested any documentation
ls -la claude-outputs/

# If empty, run ingestion
./examples/ingest-batch.sh
```

### "Invalid JSON from Claude"
- Make sure to ask Claude for "JSON only" output
- Check `claude-outputs/ingestion-log.txt` for errors
- Try with a simpler page first

## 📚 Learn More

- [Claude-Driven Ingestion Guide](docs/claude-driven-ingestion-guide.md) - Detailed guide on the ingestion process
- [Implementation Summary](docs/ai/doc-ingestion-think/implementation-summary.md) - Technical details of the implementation
- [Examples README](examples/README.md) - More examples and customization options

## 🤝 Contributing

We welcome contributions! The Claude-driven approach opens up many possibilities:
- Custom prompt templates for different documentation types
- Automated quality validation
- Integration with other documentation sources
- Enhanced search capabilities

## 📄 License

MIT

---

**Note**: This project demonstrates an innovative approach to documentation ingestion using Claude Code for its intended purpose - reading and understanding documentation. No automated scraping or unauthorized access is performed.