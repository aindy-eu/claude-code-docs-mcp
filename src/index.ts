#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerTools } from './mcp-tools/index.js';

config();

// Read version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const server = new Server(
  {
    name: 'claude-code-docs',
    version: pkg.version
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
  console.info('\\n🛑 Shutting down MCP server...');
  await server.close();
  process.exit(0);
});

// Start server
async function startServer() {
  console.info('🚀 Starting Claude Code Documentation MCP Server...');
  console.info(
    `📡 Qdrant: ${process.env.QDRANT_HOST || 'localhost'}:${process.env.QDRANT_PORT || '6333'}`
  );
  console.info(`🧠 Default provider: ${process.env.DEFAULT_EMBEDDING_PROVIDER || 'ollama'}`);
  console.info('\\n📖 Available tools:');
  console.info('  - search_claude_code_docs: Search Claude Code documentation');
  console.info('\\n💡 Usage with Claude Code:');
  console.info(
    '  1. Add server: claude mcp add claude-docs node',
    process.cwd() + '/build/index.js'
  );
  console.info('  2. Use Claude: claude "How do I implement slash commands?"');
  console.info('\\n✅ Server ready for connections\\n');

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

startServer().catch(console.error);
