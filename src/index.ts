#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from 'dotenv';
import { registerTools } from './tools/index.js';

config();

const server = new Server(
  { 
    name: 'claude-code-docs', 
    version: '1.0.0' 
  },
  { 
    capabilities: { 
      tools: {} 
    } 
  }
);

const qdrant = new QdrantClient({ 
  host: process.env.QDRANT_HOST || 'localhost', 
  port: parseInt(process.env.QDRANT_PORT || '6333')
});

// Register tools
registerTools(server, qdrant);

// Handle server lifecycle
process.on('SIGINT', async () => {
  console.log('\\n🛑 Shutting down MCP server...');
  await server.close();
  process.exit(0);
});

// Start server
async function startServer() {
  console.log('🚀 Starting Claude Code Documentation MCP Server...');
  console.log(`📡 Qdrant: ${process.env.QDRANT_HOST || 'localhost'}:${process.env.QDRANT_PORT || '6333'}`);
  console.log(`🧠 Default provider: ${process.env.DEFAULT_EMBEDDING_PROVIDER || 'ollama'}`);
  console.log('\\n📖 Available tools:');
  console.log('  - search_claude_code_docs: Search Claude Code documentation');
  console.log('\\n💡 Usage with Claude Code:');
  console.log('  claude "How do I implement slash commands?" --mcp-server ./build/index.js');
  console.log('\\n✅ Server ready for connections\\n');

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

startServer().catch(console.error);