import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from 'dotenv';
import { 
  generateEmbedding, 
  getCollectionName, 
  EmbeddingProvider,
  EMBEDDING_CONFIGS 
} from './hybrid-embeddings.js';

config();

const qdrant = new QdrantClient({ 
  host: process.env.QDRANT_HOST || 'localhost', 
  port: parseInt(process.env.QDRANT_PORT || '6333')
});

interface DocumentChunk {
  title: string;
  content: string;
  section: string;
  codeExamples?: string[];
}

const CLAUDE_CODE_DOCS_URLS = [
  'https://docs.anthropic.com/en/docs/claude-code/overview',
  'https://docs.anthropic.com/en/docs/claude-code/quickstart',
  'https://docs.anthropic.com/en/docs/claude-code/slash-commands',
  'https://docs.anthropic.com/en/docs/claude-code/settings',
  'https://docs.anthropic.com/en/docs/claude-code/hooks',
  'https://docs.anthropic.com/en/docs/claude-code/mcp',
  'https://docs.anthropic.com/en/docs/claude-code/memory',
  'https://docs.anthropic.com/en/docs/claude-code/common-workflows',
  'https://docs.anthropic.com/en/docs/claude-code/interactive-mode',
  'https://docs.anthropic.com/en/docs/claude-code/cli-reference'
];

function parseDocPage(document: Document, url: string): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  // Get all relevant elements
  const elements = document.querySelectorAll('h1, h2, h3, h4, p, pre, ul, ol, li');
  
  let currentSection = '';
  let currentContent = '';
  let currentTitle = '';
  let codeExamples: string[] = [];
  
  elements.forEach((element) => {
    const text = element.textContent?.trim() || '';
    
    if (element.tagName.match(/^H[1-4]$/)) {
      // New section - save previous chunk if substantial
      if (currentContent.length > 100) {
        chunks.push({
          title: currentTitle,
          content: currentContent.trim(),
          section: currentSection,
          codeExamples: [...codeExamples]
        });
      }
      
      currentTitle = text;
      currentSection = text;
      currentContent = text + '\\n\\n';
      codeExamples = [];
      
    } else if (element.tagName === 'PRE') {
      // Code block
      const codeText = text;
      codeExamples.push(codeText);
      currentContent += `\`\`\`\\n${codeText}\\n\`\`\`\\n\\n`;
      
    } else if (element.tagName === 'P' || element.tagName === 'LI') {
      // Regular text content
      if (text.length > 10) {
        currentContent += text + '\\n\\n';
      }
    }
  });
  
  // Add final chunk
  if (currentContent.length > 100) {
    chunks.push({
      title: currentTitle,
      content: currentContent.trim(),
      section: currentSection,
      codeExamples: [...codeExamples]
    });
  }
  
  return chunks.filter(chunk => chunk.content.length > 100);
}

async function fetchAndIndexUrl(url: string, provider: EmbeddingProvider) {
  console.log(`📥 Fetching: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    
    // Parse documentation into chunks
    const chunks = parseDocPage(dom.window.document, url);
    console.log(`   Found ${chunks.length} chunks`);
    
    const collectionName = getCollectionName(provider);
    
    // Generate embeddings and store in Qdrant
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const embedding = await generateEmbedding(chunk.content, provider);
        
        await qdrant.upsert(collectionName, {
          points: [{
            id: `${url.split('/').pop()}_${provider}_${i}`,
            vector: embedding,
            payload: {
              content: chunk.content,
              title: chunk.title,
              section: chunk.section,
              url: url,
              codeExamples: chunk.codeExamples || [],
              provider: provider,
              lastUpdated: new Date().toISOString()
            }
          }]
        });
        
        console.log(`   ✅ Indexed chunk ${i + 1}/${chunks.length} (${provider})`);
        
      } catch (error: any) {
        console.error(`   ❌ Error indexing chunk ${i + 1}: ${error.message}`);
      }
    }
    
  } catch (error: any) {
    console.error(`❌ Error fetching ${url}: ${error.message}`);
  }
}

async function indexDocumentation(providers: EmbeddingProvider[] = ['ollama']) {
  console.log('🚀 Starting Claude Code documentation indexing...');
  console.log(`📊 Indexing with providers: ${providers.join(', ')}\\n`);
  
  const startTime = Date.now();
  let totalIndexed = 0;
  
  for (const provider of providers) {
    console.log(`\\n🔄 Indexing with ${provider} (${EMBEDDING_CONFIGS[provider].model})...`);
    
    for (const url of CLAUDE_CODE_DOCS_URLS) {
      await fetchAndIndexUrl(url, provider);
      totalIndexed++;
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\\n🎉 Indexing complete!`);
  console.log(`📊 Processed ${CLAUDE_CODE_DOCS_URLS.length} URLs across ${providers.length} provider(s)`);
  console.log(`⏱️  Total time: ${duration.toFixed(1)}s`);
  console.log(`\\n💡 Now run "npm start" to start the MCP server`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const providers = process.argv.slice(2) as EmbeddingProvider[];
  
  if (providers.length === 0) {
    console.log('Usage: tsx fetch-docs.ts [ollama] [openai]');
    console.log('Example: tsx fetch-docs.ts ollama openai');
    console.log('\\nDefaulting to ollama only...');
    indexDocumentation(['ollama']);
  } else {
    indexDocumentation(providers);
  }
}