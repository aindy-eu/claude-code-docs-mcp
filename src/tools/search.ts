import { QdrantClient } from '@qdrant/js-client-rest';
import { generateEmbedding, getCollectionName, EmbeddingProvider } from '../services/hybrid-embeddings.js';
import { SearchResult, SearchParams } from '../types/index.js';

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant Claude Code documentation found for your query.';
  }

  let formatted = `## Claude Code Documentation Search Results\\n\\n`;
  
  results.forEach((result, index) => {
    formatted += `### ${index + 1}. ${result.title}\\n`;
    formatted += `**Section:** ${result.section}\\n`;
    formatted += `**Source:** [${result.url}](${result.url})\\n`;
    formatted += `**Relevance Score:** ${(result.score * 100).toFixed(1)}%\\n`;
    formatted += `**Provider:** ${result.provider}\\n\\n`;
    
    // Add content (truncated if too long)
    const maxContentLength = 800;
    let content = result.content;
    if (content.length > maxContentLength) {
      content = content.substring(0, maxContentLength) + '...';
    }
    formatted += `${content}\\n\\n`;
    
    // Add code examples if available
    if (result.codeExamples && result.codeExamples.length > 0) {
      formatted += `**Code Examples:**\\n`;
      result.codeExamples.slice(0, 2).forEach((example, i) => {
        formatted += `\`\`\`\\n${example}\\n\`\`\`\\n`;
      });
      formatted += `\\n`;
    }
    
    formatted += `---\\n\\n`;
  });
  
  return formatted;
}

export async function searchDocumentation(
  qdrant: QdrantClient, 
  params: SearchParams
): Promise<SearchResult[]> {
  const { query, provider = 'ollama', limit = 3 } = params;
  
  const results: SearchResult[] = [];
  
  const providersToSearch: EmbeddingProvider[] = 
    provider === 'both' ? ['ollama', 'openai'] : [provider as EmbeddingProvider];
  
  for (const searchProvider of providersToSearch) {
    try {
      // Generate query embedding
      const queryEmbedding = await generateEmbedding(query, searchProvider);
      const collectionName = getCollectionName(searchProvider);
      
      // Search in Qdrant
      const searchResults = await qdrant.query(collectionName, {
        query: queryEmbedding,
        limit: Math.ceil(limit / providersToSearch.length),
        with_payload: true,
        score_threshold: 0.7 // Only return reasonably relevant results
      });
      
      // Format results
      const providerResults: SearchResult[] = searchResults.points.map(point => ({
        content: point.payload?.content as string || '',
        title: point.payload?.title as string || '',
        section: point.payload?.section as string || '',
        url: point.payload?.url as string || '',
        score: point.score || 0,
        codeExamples: point.payload?.codeExamples as string[] || [],
        provider: searchProvider
      }));
      
      results.push(...providerResults);
      
    } catch (error: any) {
      console.error(`Error searching with ${searchProvider}:`, error.message);
      
      // If one provider fails, try to continue with others
      if (providersToSearch.length === 1) {
        throw error;
      }
    }
  }
  
  // Sort by score and limit results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}