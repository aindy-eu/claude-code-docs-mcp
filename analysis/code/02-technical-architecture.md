# Technical Architecture

## Technology Stack (From Import Analysis)

### Core Framework
- **Runtime**: Node.js with ES Modules (`"type": "module"`)
- **Language**: TypeScript 5.6.3
- **Transpiler**: tsx 4.19.2
- **Build Tool**: TypeScript Compiler (tsc)

### Key Dependencies Identified

#### MCP Integration
- `@modelcontextprotocol/sdk`: Core MCP server implementation
- Server and StdioServerTransport for protocol communication

#### Vector Database
- `@qdrant/js-client-rest` v1.12.0: Vector storage and search
- REST-based client for Qdrant operations

#### Embedding Providers
- `ollama` v0.5.9: Local embedding generation
- `openai` v4.67.1: Cloud-based embeddings via OpenAI API

#### Utilities
- `dotenv` v16.4.5: Environment configuration
- `uuid` v10.0.0: Unique identifier generation
- `jsdom` v25.0.1: HTML/DOM parsing (legacy, being phased out)
- `node-fetch` v3.3.2: HTTP requests

### Architecture Patterns Discovered

#### 1. Microservice Pattern
```typescript
// Entry point creates standalone MCP server
const server = new Server({ name: 'claude-code-docs', version: '1.0.0' });
const transport = new StdioServerTransport();
await server.connect(transport);
```

#### 2. Service Layer Architecture
- **Services**: Business logic (claude-output-processor, hybrid-embeddings, ingestion-tracker)
- **Tools**: MCP tool implementations (search)
- **Types**: TypeScript interfaces and types
- **Utils**: Shared utilities (logger, setup)
- **Scripts**: Standalone executables

#### 3. Provider Pattern
```typescript
// Hybrid embedding support with provider abstraction
type EmbeddingProvider = 'ollama' | 'openai';
// Dynamic provider selection at runtime
```

#### 4. Repository Pattern
- QdrantClient acts as repository for vector data
- Abstracted through service classes

## Database Architecture

### Vector Storage
- **Primary Store**: Qdrant vector database
- **Collections**: Separate collections per embedding provider
  - `claude_code_docs_ollama`
  - `claude_code_docs_openai`
- **Embedding Dimensions**: Provider-specific (detected in code)

### Data Persistence
- **Ingestion Tracking**: JSON manifest file system
- **TTL Management**: 7-day retention for processed documents
- **Document IDs**: UUID v4 for unique identification

## API Architecture

### Internal APIs
1. **MCP Tools API**
   - `search_claude_code_docs`: Primary search interface
   - Registered via `registerTools()` function

2. **Embedding Service API**
   - `generateEmbedding(text, provider)`
   - `getCollectionName(provider)`

3. **Processing Pipeline API**
   - `processClaudeOutput(output, provider)`
   - Returns `IngestionResult` with statistics

### External Service Integration

#### Qdrant Integration
- RESTful API via `@qdrant/js-client-rest`
- Operations: query, upsert, create_collection, delete
- Health checks and collection management

#### Ollama Integration
- Local LLM for embeddings
- Model: nomic-embed-text (found in configs)

#### OpenAI Integration
- Cloud embeddings via OpenAI API
- Model: text-embedding-3-small
- Requires API key authentication

## Infrastructure Configuration

### Environment Variables (From Code)
```typescript
QDRANT_HOST: process.env.QDRANT_HOST || 'localhost'
QDRANT_PORT: process.env.QDRANT_PORT || '6333'
DEFAULT_EMBEDDING_PROVIDER: process.env.DEFAULT_EMBEDDING_PROVIDER || 'ollama'
OPENAI_API_KEY: For OpenAI provider
MANIFEST_FILE: Ingestion tracking location
```

### Service Discovery
- Qdrant: Configurable host/port
- Ollama: Assumed local installation
- OpenAI: Cloud service via API

## Processing Pipeline

From code analysis, the data flow is:

1. **Ingestion Phase**
   - Claude reads documentation
   - Outputs structured JSON (may have markdown wrapper)
   - Clean JSON if needed

2. **Processing Phase**
   - Parse Claude output (`ClaudeOutputProcessor`)
   - Extract documents and metadata
   - Generate embeddings per provider

3. **Storage Phase**
   - Store vectors in Qdrant
   - Update ingestion manifest
   - Track with TTL

4. **Search Phase**
   - Accept query via MCP tool
   - Generate query embedding
   - Vector similarity search
   - Format and return results

## Architectural Decisions (From Code)

1. **Hybrid Embeddings**: Support both local and cloud providers
2. **MCP Protocol**: Native integration with Claude
3. **TypeScript**: Type safety throughout
4. **ES Modules**: Modern JavaScript module system
5. **Service Separation**: Clear boundaries between concerns
6. **Stateless Design**: Server maintains no session state