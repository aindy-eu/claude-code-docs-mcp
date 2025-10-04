# Qdrant Setup Guide

Quick setup guide to get Qdrant running for the Claude Code Documentation MCP Server.

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Pull and run Qdrant
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# Verify it's running
curl http://localhost:6333/health
```

### Option 2: Docker with Persistent Storage

```bash
# Create storage directory
mkdir -p qdrant_storage

# Run with volume mount
docker run -p 6333:6333 -p 6334:6334 \
  -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \
  qdrant/qdrant
```

## 🐳 Docker Compose Setup

For production or development with other services:

```yaml
# docker-compose.yml
version: "3.8"

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"  # REST API
      - "6334:6334"  # gRPC (optional)
    volumes:
      - ./qdrant_storage:/qdrant/storage:z
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

volumes:
  qdrant_storage:
```

Start with:
```bash
docker-compose up -d
```

## ⚙️ Production Configuration

For production deployments, create a configuration file:

```yaml
# config/qdrant.yaml
service:
  http_port: 6333
  grpc_port: 6334
  max_request_size_mb: 32
  max_workers: 0  # Auto-detect CPU cores

storage:
  # Performance optimization
  hnsw_config:
    m: 16                    # Number of bi-directional links
    ef_construct: 100        # Size of dynamic candidate list
    max_indexing_threads: 0  # Auto-detect

  # Memory optimization
  optimizers:
    memmap_threshold: 200000
    indexing_threshold: 20000

# Disable telemetry if needed
telemetry_disabled: false
```

Mount the config:
```bash
docker run -p 6333:6333 \
  -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \
  -v "$(pwd)/config/qdrant.yaml:/qdrant/config/production.yaml" \
  qdrant/qdrant
```

## 🔍 Verify Installation

### Check Health
```bash
curl http://localhost:6333/health
# Should return: {"title":"qdrant - vector search engine","version":"..."}
```

### Check Collections
```bash
curl http://localhost:6333/collections
# Should return: {"result":{"collections":[]},"status":"ok","time":0.0}
```

### View Qdrant Dashboard
Open in browser: http://localhost:6333/dashboard

## 🔧 Environment Variables

Set these in your `.env` file:

```bash
# Qdrant connection
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Optional: For cloud/remote Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_api_key_here  # If using Qdrant Cloud
```

## 📊 Resource Requirements

### Minimum (Development)
- **RAM**: 512MB
- **CPU**: 1 core
- **Disk**: 1GB

### Recommended (Production)
- **RAM**: 2-4GB
- **CPU**: 2-4 cores
- **Disk**: 10GB+ (depends on document count)

### Scaling Considerations
- ~1MB per 1000 vectors (768-dimensional)
- Performance stable up to millions of vectors
- Consider clustering for >10M vectors

## 🚨 Common Issues

### Port Already in Use
```bash
# Check what's using port 6333
lsof -i :6333

# Or use different port
docker run -p 6335:6333 qdrant/qdrant
# Update QDRANT_PORT=6335 in .env
```

### Permission Denied (Linux)
```bash
# Fix storage permissions
chmod -R 777 qdrant_storage
# Or use :z flag in volume mount
```

### Container Exits Immediately
```bash
# Check logs
docker logs qdrant_container_name

# Usually means corrupt storage - reset:
rm -rf qdrant_storage/*
```

## 📚 Next Steps

1. **Initialize Collections**: The MCP server creates collections automatically on first use
2. **Ingest Documentation**: Run `npm run seed` to populate with Claude docs
3. **Test Search**: Run `npm run search "test query"`

## 🔗 Related Guides

- [Client Integration](./client-integration.md) - TypeScript client setup and usage
- [Embeddings](./embeddings.md) - Configure Ollama/OpenAI providers
- [Performance](./performance.md) - Optimization and scaling
- [Monitoring](./monitoring.md) - Health checks and observability
- [Operations](./operations.md) - Managing documents and collections

## 📖 Learn More

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Qdrant Cloud](https://cloud.qdrant.io/) - Managed hosting option
- [Qdrant GitHub](https://github.com/qdrant/qdrant)