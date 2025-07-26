import OpenAI from 'openai';
import ollama from 'ollama';
import { config } from 'dotenv';

config();

// Lazy-load OpenAI client only when needed
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for OpenAI provider');
    }
    openaiClient = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }
  return openaiClient;
}

export type EmbeddingProvider = 'openai' | 'ollama';

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  dimensions: number;
  model: string;
}

export const EMBEDDING_CONFIGS: Record<EmbeddingProvider, EmbeddingConfig> = {
  ollama: {
    provider: 'ollama',
    dimensions: 768,
    model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'
  },
  openai: {
    provider: 'openai', 
    dimensions: 1536,
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002'
  }
};

export async function generateEmbedding(
  text: string, 
  provider: EmbeddingProvider = (process.env.DEFAULT_EMBEDDING_PROVIDER as EmbeddingProvider) || 'ollama'
): Promise<number[]> {
  try {
    if (provider === 'ollama') {
      const response = await ollama.embeddings({
        model: EMBEDDING_CONFIGS.ollama.model,
        prompt: text
      });
      return response.embedding;
    } else {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for OpenAI embeddings');
      }
      
      const response = await getOpenAIClient().embeddings.create({
        model: EMBEDDING_CONFIGS.openai.model,
        input: text
      });
      return response.data[0].embedding;
    }
  } catch (error) {
    console.error(`Error generating embedding with ${provider}:`, error);
    throw error;
  }
}

export function getCollectionName(provider: EmbeddingProvider): string {
  return `claude_code_docs_${provider}`;
}

export function getEmbeddingConfig(provider: EmbeddingProvider): EmbeddingConfig {
  return EMBEDDING_CONFIGS[provider];
}