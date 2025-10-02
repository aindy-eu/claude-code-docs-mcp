import { QdrantClient } from '@qdrant/js-client-rest';
import { generateEmbedding, getCollectionName, EmbeddingProvider } from '@/utils/embeddings.js';
import { SearchResult, SearchParams } from './search.types.js';

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
    formatted += `**Provider:** ${result.provider}\\n`;

    // Add enhanced metadata if available
    if (result.keyConcepts && result.keyConcepts.length > 0) {
      formatted += `**Key Concepts:** ${result.keyConcepts.join(', ')}\\n`;
    }

    if (result.extractionMethod) {
      formatted += `**Extraction Method:** ${result.extractionMethod}\\n`;
    }

    formatted += `\\n`;

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
      result.codeExamples.slice(0, 2).forEach(example => {
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
        score_threshold: 0.5 // Lowered threshold to capture more results (was 0.7)
      });

      // Format results
      const providerResults: SearchResult[] = searchResults.points.map(point => ({
        content: (point.payload?.content as string) || '',
        title: (point.payload?.title as string) || '',
        section: (point.payload?.section as string) || '',
        url: (point.payload?.url as string) || '',
        score: point.score || 0,
        codeExamples: (point.payload?.codeExamples as string[]) || [],
        provider: searchProvider,
        // Enhanced metadata from Claude-driven ingestion
        keyConcepts: (point.payload?.keyConcepts as string[]) || undefined,
        extractionMethod: (point.payload?.extractionMethod as string) || undefined,
        pageTitle: (point.payload?.pageTitle as string) || undefined,
        summary: (point.payload?.summary as string) || undefined,
        lastUpdated: (point.payload?.lastUpdated as string) || undefined
      }));

      results.push(...providerResults);
    } catch (error: unknown) {
      // If one provider fails, try to continue with others
      if (providersToSearch.length === 1) {
        throw error;
      }
      // Otherwise silently continue with remaining providers
    }
  }

  // Sort by score and limit results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// Export alias for convenience
export { searchDocumentation as search };
